import { app } from '../firebaseConfig';

import {
  CompatibilityResult,
  HairProduct,
  HairProfileForMatching,
} from '../types/product.types';

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';

const ENABLE_GEMINI_EXPLANATIONS =
  process.env.EXPO_PUBLIC_ENABLE_GEMINI_EXPLANATIONS === 'true';

const AI_TIMEOUT_MS = 6000;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function formatOptionalValue(
  value?: string
) {
  return value?.trim() || 'Not provided';
}

function formatRoutineSteps(
  profile: HairProfileForMatching
) {
  const steps =
    profile.routineSteps ?? [];

  if (!steps.length) {
    return 'No routine steps provided';
  }

  return steps
    .map((step) => {
      const parts = [
        step.title,
        step.productType,
        step.frequency,
        step.note,
      ].filter(Boolean);

      return parts.join(' — ');
    })
    .join('\n');
}

/* -------------------------------------------------------
   Deterministic fallback

   Used whenever Gemini is disabled, times out,
   or fails.
------------------------------------------------------- */

function buildFallbackExplanation(
  product: HairProduct,
  profile: HairProfileForMatching,
  compatibility: CompatibilityResult
) {
  const mainReason =
    compatibility.reasons[0] ??
    compatibility.summary ??
    'it has some overlap with your hair profile and goals';

  const mainCaution =
    compatibility.cautions[0];

  const scalpContext =
    profile.scalp
      ? ` Your scalp profile is ${profile.scalp.toLowerCase()}.`
      : '';

  return `${product.name} is a ${compatibility.label.toLowerCase()} for your ${profile.hairType} hair. ${mainReason}.${scalpContext}${
    mainCaution
      ? ` One thing to watch: ${mainCaution}`
      : ''
  }`
    .replace(/\.\./g, '.')
    .trim();
}

/* -------------------------------------------------------
   Timeout fallback
------------------------------------------------------- */

function timeoutFallback(
  ms: number,
  fallback: string
) {
  return new Promise<string>(
    (resolve) => {
      setTimeout(
        () => resolve(fallback),
        ms
      );
    }
  );
}

/* -------------------------------------------------------
   Gemini explanation
------------------------------------------------------- */

export async function generateProductExplanation(
  args: {
    product: HairProduct;
    profile: HairProfileForMatching;
    compatibility: CompatibilityResult;
  }
) {
  const {
    product,
    profile,
    compatibility,
  } = args;

  const fallback =
    buildFallbackExplanation(
      product,
      profile,
      compatibility
    );

  if (!ENABLE_GEMINI_EXPLANATIONS) {
    return fallback;
  }

  try {
    const ai =
      getAI(app, {
        backend:
          new GoogleAIBackend(),
      });

    const model =
      getGenerativeModel(
        ai,
        {
          model:
            'gemini-3.1-flash-lite',
        }
      );

    const prompt = `
You are ManeLine, a personalized consumer hair-care app.

Your job is to explain a compatibility analysis that ManeLine has ALREADY calculated.

You are NOT responsible for deciding the score, changing the score, ranking the product, diagnosing the user, or creating new product claims.

STRICT GROUNDING RULES:

- Use only the information provided below.
- Treat ManeLine's Compatibility Analysis as the source of truth.
- Do not recalculate or change the compatibility score.
- Do not contradict the compatibility label.
- Treat Reasons, Cautions, Ingredient Highlights, Routine Fit, and Score Breakdown as the primary evidence.
- Do not invent ingredients.
- Do not invent benefits, risks, product claims, or user characteristics.
- Do not infer that an ingredient treats a medical condition.
- Do not promise hair growth, regrowth, repair, or medical improvement.
- Do not say a product cures, prevents, manages, or treats eczema, psoriasis, seborrheic dermatitis, CCCA, scalp acne, dandruff, hair loss, or another medical condition.
- If the user has listed a condition-related scalp concern, discuss only the cosmetic compatibility evidence ManeLine provides.
- Do not assume an ingredient is beneficial simply because it is commonly marketed for a particular concern.
- Do not make medical or diagnostic claims.

PERSONALIZATION RULES:

- Consider the complete user profile below.
- Prioritize the profile characteristics that are actually relevant to ManeLine's Reasons, Cautions, Routine Fit, and Score Breakdown.
- Do not force every profile characteristic into the explanation.
- Hair type, porosity, strand thickness, scalp profile, goals, chemical history, current style, head covering, sensitivities, and routine may all be relevant.
- Pay special attention to scalp sensitivity when ManeLine has identified fragrance or stronger cleansing ingredients.
- Chemical history may provide context, but do not create additional chemical-treatment recommendations that are not already supported by ManeLine's analysis.
- Current hairstyle and head covering should be discussed as routine considerations, not biological hair characteristics.
- Allergies and sensitivities should only be mentioned when ManeLine has already identified a relevant caution.
- If evidence is limited, use cautious language such as "may," "could," or "worth considering."

WRITING STYLE:

- Keep the explanation under 70 words.
- Use clear, friendly language suitable for a mobile app.
- Explain the most important match reason first.
- Mention one meaningful caution when one exists.
- Make the explanation feel personalized without overstating certainty.
- Do not list the numerical score breakdown unless it is necessary to explain the result.
- Do not mention Gemini, AI, prompts, algorithms, or internal scoring rules.

USER PROFILE

Hair type:
${profile.hairType}

Porosity:
${profile.porosity}

Strand thickness:
${profile.density}

Scalp profile:
${profile.scalp}

Chemical history:
${formatOptionalValue(
  profile.chemicalHistory
)}

Current hairstyle:
${formatOptionalValue(
  profile.style
)}

Head covering:
${formatOptionalValue(
  profile.headCovering
)}

Hair goals:
${
  profile.goals.length
    ? profile.goals.join(', ')
    : 'None provided'
}

Allergies or sensitivities:
${formatOptionalValue(
  profile.allergies
)}

Routine focus:
${formatOptionalValue(
  profile.routineFocus
)}

CURRENT ROUTINE

${formatRoutineSteps(profile)}

PRODUCT

Name:
${product.name}

Brand:
${product.brand}

Category:
${product.category}

Ingredients provided to ManeLine:
${
  product.ingredients.length
    ? product.ingredients.join(', ')
    : 'No ingredient list available'
}

MANELINE COMPATIBILITY ANALYSIS

Score:
${compatibility.score}

Label:
${compatibility.label}

Confidence:
${compatibility.confidence}

Confidence reason:
${compatibility.confidenceReason}

Summary:
${compatibility.summary}

Reasons:
${
  compatibility.reasons.length
    ? compatibility.reasons.join('; ')
    : 'No specific positive reasons provided'
}

Cautions:
${
  compatibility.cautions.length
    ? compatibility.cautions.join('; ')
    : 'No specific cautions provided'
}

Ingredient highlights:
${
  compatibility.ingredientHighlights.length
    ? compatibility.ingredientHighlights.join('; ')
    : 'No specific ingredient highlights provided'
}

Routine fit:
${compatibility.routineFit}

Score breakdown:
- Ingredient fit: ${compatibility.scoreBreakdown.ingredientFit}
- Goal fit: ${compatibility.scoreBreakdown.goalFit}
- Profile fit: ${compatibility.scoreBreakdown.profileFit}
- Routine fit: ${compatibility.scoreBreakdown.routineFit}
- Caution penalty: ${compatibility.scoreBreakdown.cautionPenalty}

Write one concise personalized explanation based only on the evidence above.
`;

    const aiRequest =
      model
        .generateContent(prompt)
        .then((result) => {
          const text =
            result.response
              .text()
              .trim();

          return text || fallback;
        })
        .catch((error) => {
          console.warn(
            'Gemini explanation failed:',
            error
          );

          return fallback;
        });

    return await Promise.race([
      aiRequest,
      timeoutFallback(
        AI_TIMEOUT_MS,
        fallback
      ),
    ]);
  } catch (error) {
    console.warn(
      'Gemini setup failed. Using fallback:',
      error
    );

    return fallback;
  }
}
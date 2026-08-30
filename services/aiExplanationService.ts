import { app } from '../firebaseConfig';
import {
  CompatibilityResult,
  HairProduct,
  HairProfileForMatching,
} from '../types/product.types';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

const ENABLE_GEMINI_EXPLANATIONS = process.env.EXPO_PUBLIC_ENABLE_GEMINI_EXPLANATIONS === 'true';
const AI_TIMEOUT_MS = 6000;

function buildFallbackExplanation(
  product: HairProduct,
  profile: HairProfileForMatching,
  compatibility: CompatibilityResult
) {
  const mainReason =
    compatibility.reasons[0] ??
    'it has some overlap with your hair profile and goals';

  const mainCaution = compatibility.cautions[0];

  return `${product.name} is a ${compatibility.label.toLowerCase()} for your ${profile.hairType} hair. ${mainReason} ${
    mainCaution ? `One thing to watch: ${mainCaution}` : ''
  }`.trim();
}

function timeoutFallback(ms: number, fallback: string) {
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve(fallback), ms);
  });
}

export async function generateProductExplanation(args: {
  product: HairProduct;
  profile: HairProfileForMatching;
  compatibility: CompatibilityResult;
}) {
  const { product, profile, compatibility } = args;

  const fallback = buildFallbackExplanation(product, profile, compatibility);

  if (!ENABLE_GEMINI_EXPLANATIONS) {
    return fallback;
  }

  try {
    const ai = getAI(app, {
      backend: new GoogleAIBackend(),
    });

    const model = getGenerativeModel(ai, {
      model: 'gemini-3.1-flash-lite',
    });

    const prompt = `
You are ManeLine, a consumer hair-care app.

Write a short, friendly explanation for why this product is or is not a good match.

Rules:
- Do not make medical claims.
- Do not promise hair growth.
- Do not mention stylists, salons, or professional clients.
- Keep it under 55 words.
- Sound like a helpful product insight inside a mobile app.

User profile:
Hair type: ${profile.hairType}
Porosity: ${profile.porosity}
Density: ${profile.density}
Scalp: ${profile.scalp}
Goals: ${profile.goals.join(', ')}
Allergies/sensitivities: ${profile.allergies || 'None listed'}

Product:
Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Ingredients: ${product.ingredients.join(', ')}

Compatibility:
Score: ${compatibility.score}
Label: ${compatibility.label}
Reasons: ${compatibility.reasons.join('; ')}
Cautions: ${compatibility.cautions.join('; ') || 'None'}
Routine fit: ${compatibility.routineFit}
`;

    const aiRequest = model
      .generateContent(prompt)
      .then((result) => {
        const text = result.response.text().trim();
        return text || fallback;
      })
      .catch((error) => {
        console.warn('Gemini explanation failed:', error);
        return fallback;
      });

    return await Promise.race([
      aiRequest,
      timeoutFallback(AI_TIMEOUT_MS, fallback),
    ]);
  } catch (error) {
    console.warn('Gemini setup failed. Using fallback:', error);
    return fallback;
  }
}
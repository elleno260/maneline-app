import {
  CompatibilityResult,
  HairProduct,
  HairProfileForMatching,
} from '../types/product.types';

/* -------------------------------------------------------
   Ingredient groups
------------------------------------------------------- */

const HUMECTANTS = [
  'glycerin',
  'glycerine',
  'propanediol',
  'propylene glycol',
  'panthenol',
  'sodium pca',
  'aloe',
  'hyaluronic acid',
];

const FATTY_ALCOHOLS = [
  'cetyl alcohol',
  'stearyl alcohol',
  'cetearyl alcohol',
  'behenyl alcohol',
];

const CONDITIONERS = [
  'behentrimonium chloride',
  'behentrimonium methosulfate',
  'cetrimonium chloride',
  'stearamidopropyl dimethylamine',
  'guar hydroxypropyltrimonium chloride',
  'polyquaternium',
];

const EMOLLIENTS = [
  'shea butter',
  'butyrospermum parkii',
  'coconut oil',
  'cocos nucifera',
  'jojoba',
  'argan',
  'avocado oil',
  'castor oil',
  'ricinus communis',
  'sunflower seed oil',
  'helianthus annuus',
];

const HEAVY_EMOLLIENTS = [
  'shea butter',
  'butyrospermum parkii',
  'castor oil',
  'ricinus communis',
  'coconut oil',
  'cocos nucifera',
];

const PROTEINS = [
  'hydrolyzed keratin',
  'hydrolyzed wheat protein',
  'hydrolyzed rice protein',
  'hydrolyzed soy protein',
  'hydrolyzed corn protein',
  'amino acids',
  'silk protein',
  'keratin',
];

const SILICONES = [
  'dimethicone',
  'amodimethicone',
  'bis-aminopropyl dimethicone',
  'dimethiconol',
];

const FILM_FORMERS = [
  'pvp',
  'vp/va copolymer',
  'polyquaternium',
  'acrylates copolymer',
  'carbomer',
];

const STRONG_CLEANSERS = [
  'sodium lauryl sulfate',
  'ammonium lauryl sulfate',
  'sodium c14-16 olefin sulfonate',
];

const GENTLE_CLEANSERS = [
  'cocamidopropyl betaine',
  'coco-betaine',
  'decyl glucoside',
  'sodium cocoyl isethionate',
  'sodium lauroyl methyl isethionate',
  'disodium laureth sulfosuccinate',
];

const FRAGRANCE_TERMS = [
  'fragrance',
  'parfum',
  'limonene',
  'linalool',
  'citronellol',
  'geraniol',
];

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase();
}

function clampScore(value: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

function ingredientMatches(
  ingredients: string[],
  terms: string[]
) {
  return ingredients.filter((ingredient) => {
    const normalizedIngredient =
      normalize(ingredient);

    return terms.some((term) =>
      normalizedIngredient.includes(
        normalize(term)
      )
    );
  });
}

function hasIngredientGroup(
  ingredients: string[],
  terms: string[]
) {
  return (
    ingredientMatches(
      ingredients,
      terms
    ).length > 0
  );
}

function getScoreLabel(
  score: number
): CompatibilityResult['label'] {
  if (score >= 85) {
    return 'Strong Match';
  }

  if (score >= 70) {
    return 'Good Match';
  }

  if (score >= 50) {
    return 'Possible Match';
  }

  return 'Low Match';
}

function normalizedEquals(
  left?: string,
  right?: string
) {
  if (!left || !right) {
    return false;
  }

  return (
    normalize(left) ===
    normalize(right)
  );
}

/* -------------------------------------------------------
   Compatibility
------------------------------------------------------- */

export function calculateCompatibility(
  product: HairProduct,
  profile: HairProfileForMatching
): CompatibilityResult {
  const ingredients =
    product.ingredients ?? [];

  const reasons: string[] = [];
  const cautions: string[] = [];
  const ingredientHighlights: string[] = [];
const style =
  profile.style?.toLowerCase() ?? 'none';

const headCovering =
  profile.headCovering?.toLowerCase() ?? 'none';

const chemicalHistory =
  profile.chemicalHistory?.toLowerCase() ?? 'virgin';

const ingredientText =
  product.ingredients
    .join(' ')
    .toLowerCase();
  /*
   * Unlike the old system, we do NOT
   * automatically start the product at 45.
   */

  let ingredientFit = 50;
  let goalFit = 50;
  let profileFit = 50;
  let routineFitScore = 50;
  let cautionPenalty = 0;

  const humectants =
    ingredientMatches(
      ingredients,
      HUMECTANTS
    );

  const fattyAlcohols =
    ingredientMatches(
      ingredients,
      FATTY_ALCOHOLS
    );

  const conditioners =
    ingredientMatches(
      ingredients,
      CONDITIONERS
    );

  const emollients =
    ingredientMatches(
      ingredients,
      EMOLLIENTS
    );

  const heavyEmollients =
    ingredientMatches(
      ingredients.slice(0, 10),
      HEAVY_EMOLLIENTS
    );

  const proteins =
    ingredientMatches(
      ingredients,
      PROTEINS
    );

  const silicones =
    ingredientMatches(
      ingredients,
      SILICONES
    );

  const filmFormers =
    ingredientMatches(
      ingredients,
      FILM_FORMERS
    );

  const strongCleansers =
    ingredientMatches(
      ingredients,
      STRONG_CLEANSERS
    );

  const gentleCleansers =
    ingredientMatches(
      ingredients,
      GENTLE_CLEANSERS
    );

  const fragrance =
    ingredientMatches(
      ingredients,
      FRAGRANCE_TERMS
    );

  /* -----------------------------------------------------
     Ingredient fit
  ----------------------------------------------------- */

  if (
    conditioners.length ||
    fattyAlcohols.length
  ) {
    ingredientFit += 12;

    reasons.push(
      'The formula contains conditioning ingredients that may support softness and manageability.'
    );
  }

  if (humectants.length) {
    ingredientFit += 6;

    ingredientHighlights.push(
      `Humectant support: ${humectants
        .slice(0, 3)
        .join(', ')}.`
    );
  }

  if (emollients.length) {
    ingredientFit += 6;

    ingredientHighlights.push(
      `Emollient ingredients: ${emollients
        .slice(0, 3)
        .join(', ')}.`
    );
  }

  if (proteins.length) {
    ingredientHighlights.push(
      `Protein/film-forming support: ${proteins
        .slice(0, 3)
        .join(', ')}.`
    );
  }

  /* -----------------------------------------------------
     Goal fit
  ----------------------------------------------------- */

  const goals =
    (profile.goals ?? []).map(normalize);

  let matchedGoals = 0;
  let evaluatedGoals = 0;

  if (goals.includes('moisture')) {
    evaluatedGoals++;

    if (
      humectants.length ||
      conditioners.length ||
      fattyAlcohols.length ||
      emollients.length
    ) {
      matchedGoals++;

      reasons.push(
        'The ingredient profile supports your moisture goal.'
      );
    }
  }

  if (
    goals.includes(
      'length retention'
    )
  ) {
    evaluatedGoals++;

    if (
      conditioners.length ||
      fattyAlcohols.length ||
      silicones.length ||
      proteins.length
    ) {
      matchedGoals++;

      reasons.push(
        'Conditioning and film-forming ingredients may help reduce friction and support length retention.'
      );
    }
  }

  if (goals.includes('definition')) {
    evaluatedGoals++;

    if (
      filmFormers.length ||
      conditioners.length ||
      product.category === 'Gel' ||
      product.category === 'Cream' ||
      product.category === 'Styler'
    ) {
      matchedGoals++;

      reasons.push(
        'The formula and product type may support definition and styling.'
      );
    }
  }

  if (goals.includes('repair')) {
    evaluatedGoals++;

    if (
      proteins.length ||
      conditioners.length ||
      silicones.length
    ) {
      matchedGoals++;

      reasons.push(
        'The formula includes conditioning or film-forming ingredients that may improve the feel of damaged hair.'
      );
    }
  }

  if (
    goals.includes(
      'heat protection'
    )
  ) {
    evaluatedGoals++;

    /*
     * Do not claim heat protection solely
     * from an ingredient list.
     */
    if (
      product.recommendedForGoals
        ?.some(
          (goal) =>
            normalize(goal) ===
            'heat protection'
        )
    ) {
      matchedGoals++;

      reasons.push(
        'This product is identified as supporting heat protection.'
      );
    }
  }

  if (goals.includes('growth')) {
    evaluatedGoals++;

    /*
     * Cosmetic ingredient lists alone are
     * not enough to promise hair growth.
     */
    cautions.push(
      'ManeLine does not treat cosmetic ingredient presence alone as evidence that a product will increase hair growth.'
    );
  }

  if (goals.includes('thickness')) {
    evaluatedGoals++;

    if (
      proteins.length ||
      filmFormers.length
    ) {
      matchedGoals++;

      reasons.push(
        'Film-forming ingredients may temporarily give hair a fuller or more substantial feel.'
      );
    }
  }

  if (evaluatedGoals > 0) {
    goalFit =
      40 +
      (matchedGoals /
        evaluatedGoals) *
        60;
  }

  /* -----------------------------------------------------
     Density / weight fit
  ----------------------------------------------------- */

  if (
    normalize(profile.density) ===
      'fine' &&
    heavyEmollients.length >= 2
  ) {
    profileFit -= 15;

    cautions.push(
      'This formula appears rich and may feel heavy on some fine-strand routines.'
    );
  }

  if (
  (
    normalize(profile.density) === 'coarse' ||
    normalize(profile.density) === 'thick'
  ) &&
  emollients.length
) {
  profileFit += 8;

  reasons.push(
    'The richer conditioning profile may suit coarser strands.'
  );
}

  /* -----------------------------------------------------
   Scalp fit

   General scalp characteristics can influence
   compatibility directly.

   Condition-related selections are handled more
   conservatively so ManeLine does not imply that a
   cosmetic product treats a medical scalp condition.
----------------------------------------------------- */

const scalpType =
  normalize(profile.scalp);

/* Sensitive scalp */

if (scalpType === 'sensitive') {
  if (fragrance.length) {
    profileFit -= 12;

    cautions.push(
      'This formula contains fragrance-related ingredients, which may be worth noting for a sensitive scalp.'
    );
  }

  if (strongCleansers.length) {
    profileFit -= 10;

    cautions.push(
      'This product contains a stronger cleansing surfactant and may not suit every sensitive-scalp routine.'
    );
  }
}

/* Dry scalp */

if (scalpType === 'dry') {
  if (strongCleansers.length) {
    profileFit -= 8;

    cautions.push(
      'The cleansing system may feel stronger than ideal for some dry-scalp routines.'
    );
  }

  if (emollients.length) {
    profileFit += 5;

    reasons.push(
      'The conditioning profile may fit a routine focused on scalp and hair dryness.'
    );
  }
}

/* Oily scalp */

if (scalpType === 'oily') {
  if (
    gentleCleansers.length ||
    strongCleansers.length
  ) {
    profileFit += 6;

    reasons.push(
      'The cleansing system may fit a routine focused on removing excess oil and buildup.'
    );
  }

  if (heavyEmollients.length >= 2) {
    profileFit -= 5;

    cautions.push(
      'This formula appears relatively rich, which may feel heavy for some oily-scalp routines.'
    );
  }
}

/* Flaky scalp */

if (scalpType === 'flaky') {
  if (gentleCleansers.length) {
    profileFit += 4;

    reasons.push(
      'The cleansing profile may fit a routine that includes regular scalp cleansing.'
    );
  }

  if (fragrance.length) {
    profileFit -= 6;

    cautions.push(
      'Fragrance-related ingredients may be worth noting when your scalp is already prone to flaking or irritation.'
    );
  }
}

/* -----------------------------------------------------
   Condition-related scalp selections

   These selections should NOT create treatment claims
   or automatic positive compatibility bonuses.
----------------------------------------------------- */

const conditionRelatedScalpTypes = [
  'dandruff-prone',
  'seborrheic dermatitis',
  'psoriasis',
  'eczema',
  'scalp acne',
];

if (
  conditionRelatedScalpTypes.includes(
    scalpType
  )
) {
  if (fragrance.length) {
    profileFit -= 5;

    cautions.push(
      'Because you noted a scalp condition or concern, fragrance-related ingredients may be worth reviewing carefully.'
    );
  }

  if (strongCleansers.length) {
    cautions.push(
      'This formula contains a stronger cleansing system. ManeLine is evaluating cosmetic compatibility only and is not assessing treatment suitability for your scalp condition.'
    );
  }
}

/* -----------------------------------------------------
   Hair-loss / edge-related scalp concerns

   Do not award compatibility points based on ingredients
   that are commonly marketed for growth.
----------------------------------------------------- */

if (
  scalpType === 'thinning edges' ||
  scalpType === 'ccca'
) {
  cautions.push(
    'ManeLine can evaluate ingredient and routine compatibility, but this score does not indicate that the product treats thinning or hair-loss-related scalp concerns.'
  );
}
/* -----------------------------------------------------
   Chemical history fit

   Chemical history changes how we interpret
   cleansing strength, conditioning support, and
   product role. These are modest adjustments rather
   than absolute rules.
----------------------------------------------------- */

if (chemicalHistory === 'colored') {
  if (strongCleansers.length) {
    profileFit -= 7;

    cautions.push(
      'A stronger cleansing system may be worth considering for color-treated hair, especially if preserving color is a priority.'
    );
  }

  if (emollients.length) {
    profileFit += 5;

    reasons.push(
      'The conditioning ingredients may support the moisture needs of color-treated hair.'
    );
  }

  if (
    product.category
      ?.toLowerCase()
      .includes('color')
  ) {
    profileFit += 7;

    reasons.push(
      'This product is positioned for color-care routines, which aligns with your chemical history.'
    );
  }
}

if (chemicalHistory === 'relaxed') {
  if (emollients.length) {
    profileFit += 6;

    reasons.push(
      'The conditioning profile may be useful in a routine for chemically relaxed hair.'
    );
  }

  if (strongCleansers.length) {
    profileFit -= 6;

    cautions.push(
      'The stronger cleansing system may be worth balancing with conditioning steps in a relaxed-hair routine.'
    );
  }
}

if (chemicalHistory === 'transitioning') {
  if (emollients.length) {
    profileFit += 6;

    reasons.push(
      'The conditioning profile may help support a routine managing multiple hair textures while transitioning.'
    );
  }

  if (
    product.category === 'Deep Conditioner' ||
    product.category === 'Conditioner'
  ) {
    profileFit += 5;

    reasons.push(
      'Conditioning products can fit well into a transitioning-hair routine where moisture and manageability are important.'
    );
  }
}

if (chemicalHistory === 'heat damaged') {
  if (emollients.length) {
    profileFit += 7;

    reasons.push(
      'The conditioning ingredients may support a routine focused on hair affected by frequent heat exposure.'
    );
  }

  if (
    product.category
      ?.toLowerCase()
      .includes('heat')
  ) {
    profileFit += 8;

    reasons.push(
      'This product type aligns with a routine focused on reducing additional heat-related stress.'
    );
  }

  if (strongCleansers.length) {
    profileFit -= 5;

    cautions.push(
      'A stronger cleansing system may need to be balanced with conditioning in a heat-damage-focused routine.'
    );
  }
}
  /* -----------------------------------------------------
     Existing curated metadata

     Keep this as SECONDARY evidence.
  ----------------------------------------------------- */

  if (
    product.recommendedForHairTypes
      ?.some((type) =>
        normalizedEquals(
          type,
          profile.hairType
        )
      )
  ) {
    profileFit += 6;
  }

  if (
    product.recommendedForPorosity
      ?.some((porosity) =>
        normalizedEquals(
          porosity,
          profile.porosity
        )
      )
  ) {
    profileFit += 5;
  }

  if (
    product.recommendedForDensity
      ?.some((density) =>
        normalizedEquals(
          density,
          profile.density
        )
      )
  ) {
    profileFit += 5;
  }

  /* -----------------------------------------------------
     Routine fit
  ----------------------------------------------------- */
const routineText = (
  profile.routineSteps ?? []
)
  .map((step) =>
    [
      step.title,
      step.productType,
      step.note,
    ].join(' ')
  )
  .join(' ');

  const categoryTerms: Record<
    string,
    string[]
  > = {
    Shampoo: [
      'shampoo',
      'cleanse',
      'cleansing',
    ],

    Conditioner: [
      'conditioner',
      'condition',
    ],

    'Deep Conditioner': [
      'deep conditioner',
      'mask',
      'treatment',
    ],

    'Leave-In': [
      'leave-in',
      'leave in',
    ],

    Gel: [
      'gel',
      'definition',
      'style',
    ],

    Cream: [
      'cream',
      'moisturize',
      'style',
    ],

    Oil: [
      'oil',
      'seal',
      'scalp',
    ],

    'Scalp Care': [
      'scalp',
    ],

    Treatment: [
      'treatment',
      'repair',
    ],

    Styler: [
      'style',
      'styling',
    ],
  };

  const expectedTerms =
    categoryTerms[
      product.category
    ] ?? [];

  if (
    expectedTerms.some((term) =>
      routineText.includes(term)
    )
  ) {
    routineFitScore = 85;

    reasons.push(
      'This product type fits a step already present in your routine.'
    );
  }

  /* -----------------------------------------------------
     Allergy/sensitivity text

     This is only a SCREENING warning.
  ----------------------------------------------------- */

  const allergyTerms =
    (profile.allergies ?? '')
      .split(/[,;]/)
      .map(normalize)
      .filter(
        (value) =>
          value.length >= 3
      );

  // const ingredientText =
  //   ingredients
  //     .map(normalize)
  //     .join(' ');

  const allergyMatches =
    allergyTerms.filter(
      (allergy) =>
        ingredientText.includes(
          allergy
        )
    );

  if (allergyMatches.length) {
    cautionPenalty += 35;

    cautions.unshift(
      `Possible sensitivity match detected: ${allergyMatches.join(
        ', '
      )}. Verify the package label before use.`
    );
  }
if (style === 'braids') {
  if (
    product.category === 'Scalp Care' ||
    product.category === 'Oil'
  ) {
    routineFitScore += 6;

    reasons.push(
      'This product can fit a braid-focused scalp routine.'
    );
  }

  if (
    ingredientText.includes('petrolatum') ||
    ingredientText.includes('mineral oil')
  ) {
    routineFitScore -= 5;

    cautions.push(
      'This formula may feel heavier in a braid routine where buildup is harder to remove frequently.'
    );
  }
}
if (style === 'locs') {
  if (
    product.category === 'Scalp Care' ||
    product.category === 'Shampoo'
  ) {
    routineFitScore += 7;

    reasons.push(
      'This product type aligns with scalp care and cleansing needs in a loc routine.'
    );
  }

  if (
    product.category === 'Cream' ||
    product.category === 'Deep Conditioner'
  ) {
    routineFitScore -= 4;

    cautions.push(
      'Rich formulas may require extra attention to residue and buildup in a loc routine.'
    );
  }
}

if (style === 'sew-in / wig') {
  if (
    product.category === 'Scalp Care' ||
    product.category === 'Shampoo'
  ) {
    routineFitScore += 8;

    reasons.push(
      'Scalp-focused products are especially relevant while much of the hair is less accessible.'
    );
  }

  if (
    product.category === 'Cream' ||
    product.category === 'Styler'
  ) {
    routineFitScore -= 3;

    cautions.push(
      'A length-focused styling product may be less useful while your hair is under a sew-in or wig.'
    );
  }
}

if (headCovering !== 'none') {
  if (
    product.category === 'Scalp Care' ||
    product.category === 'Shampoo'
  ) {
    routineFitScore += 5;

    reasons.push(
      'This product supports a scalp-focused routine when your hair is covered regularly.'
    );
  }

  if (
    ingredientText.includes('petrolatum') ||
    ingredientText.includes('mineral oil')
  ) {
    routineFitScore -= 4;

    cautions.push(
      'A heavier formula may contribute to a coated feel when wash cycles are longer.'
    );
  }
}
  /* -----------------------------------------------------
     Final score
  ----------------------------------------------------- */

  ingredientFit =
    clampScore(ingredientFit);

  goalFit =
    clampScore(goalFit);

  profileFit =
    clampScore(profileFit);

  routineFitScore =
    clampScore(
      routineFitScore
    );

  const weightedScore =
    ingredientFit * 0.35 +
    goalFit * 0.30 +
    profileFit * 0.20 +
    routineFitScore * 0.15 -
    cautionPenalty;

  const finalScore =
    clampScore(weightedScore);

  const label =
    getScoreLabel(finalScore);

  /* -----------------------------------------------------
     Confidence
  ----------------------------------------------------- */

  let confidence:
    CompatibilityResult['confidence'];

  let confidenceReason: string;

  const profileEvidenceCount = [
    profile.hairType,
    profile.porosity,
    profile.density,
    profile.scalp,
    ...(profile.goals ?? []),
  ].filter(Boolean).length;

  if (
    ingredients.length >= 10 &&
    profileEvidenceCount >= 6
  ) {
    confidence = 'High';

    confidenceReason =
      'Based on a full ingredient list and a detailed hair profile.';
  } else if (
    ingredients.length >= 5
  ) {
    confidence = 'Medium';

    confidenceReason =
      'Based on ingredient data and the available profile information.';
  } else {
    confidence = 'Low';

    confidenceReason =
      'Limited ingredient or profile information was available for this analysis.';
  }

  /* -----------------------------------------------------
     Customer-facing wording
  ----------------------------------------------------- */

  const summary =
    finalScore >= 85
      ? 'This formula appears well aligned with your current hair goals and routine.'
      : finalScore >= 70
        ? 'This formula appears to be a good fit overall, with a few factors worth considering.'
        : finalScore >= 50
          ? 'This product may work for you, but the formula has a mixed fit with your current profile.'
          : 'This formula has several factors that may make it a weaker fit for your current profile.';

  const routineFit =
    routineFitScore >= 80
      ? `Best use: this ${product.category.toLowerCase()} fits a step already represented in your routine.`
      : `This ${product.category.toLowerCase()} may require a different place or purpose in your current routine.`;

  if (
    ingredientHighlights.length <
      3 &&
    ingredients.length
  ) {
    ingredientHighlights.unshift(
      `Leading ingredients: ${ingredients
        .slice(0, 4)
        .join(', ')}.`
    );
  }

  return {
    productId: product.id,

    score: finalScore,

    label,

    confidence,

    confidenceReason,

    summary,

    reasons:
      reasons.length
        ? [...new Set(reasons)]
        : [
            'ManeLine found limited profile-specific evidence for this formula.',
          ],

    cautions:
      [...new Set(cautions)],

    routineFit,

    ingredientHighlights:
      [...new Set(
        ingredientHighlights
      )],

    scoreBreakdown: {
      ingredientFit:
        Math.round(
          ingredientFit
        ),

      goalFit:
        Math.round(goalFit),

      profileFit:
        Math.round(
          profileFit
        ),

      routineFit:
        Math.round(
          routineFitScore
        ),

      cautionPenalty,
    },
  };
}
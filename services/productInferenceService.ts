import { HairGoal, ProductCategory } from '../types/product.types';

type ProductInferenceInput = {
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  ingredients?: string[];
};

export type ProductInferenceResult = {
  category: ProductCategory;
  description: string;
  bestFor: string[];
  tags: string[];
  recommendedForGoals: HairGoal[];
  routineStepMatch: string[];
  cautions: string[];
  avoidIf: string[];
  ingredientHighlights: string[];
};

function normalizeText(value?: string) {
  return value?.toLowerCase().trim() ?? '';
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function ingredientText(ingredients: string[]) {
  return ingredients.join(' ').toLowerCase();
}

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function inferProductCategory(input: ProductInferenceInput): ProductCategory {
  const name = normalizeText(input.name);
  const category = normalizeText(input.category);
  const description = normalizeText(input.description);
  const combined = `${name} ${category} ${description}`;

  if (
    includesAny(combined, [
      'shampoo',
      'cleanser',
      'cleansing shampoo',
      'clarifying',
      'co-wash',
      'cowash',
    ])
  ) {
    return 'Shampoo';
  }

  if (
    includesAny(combined, [
      'deep conditioner',
      'deep conditioning',
      'hair masque',
      'hair mask',
      'treatment masque',
      'repair mask',
      'moisture mask',
    ])
  ) {
    return 'Deep Conditioner';
  }

  if (
    includesAny(combined, [
      'conditioner',
      'conditioning',
      'rinse out',
    ])
  ) {
    return 'Conditioner';
  }

  if (
    includesAny(combined, [
      'leave-in',
      'leave in',
      'detangler',
      'detangling',
      'milk',
    ])
  ) {
    return 'Leave-In';
  }

  if (
    includesAny(combined, [
      'curl cream',
      'styling cream',
      'butter',
      'smoothie',
      'curl enhancing',
      'curl activator',
      'cream',
    ])
  ) {
    return 'Cream';
  }

  if (
    includesAny(combined, [
      'gel',
      'custard',
      'jelly',
      'edge control',
      'mousse',
      'foam',
    ])
  ) {
    return 'Gel';
  }

  if (
    includesAny(combined, [
      'oil',
      'serum',
      'scalp oil',
      'hair oil',
      'growth oil',
    ])
  ) {
    return 'Oil';
  }

  if (
    includesAny(combined, [
      'scalp',
      'dandruff',
      'itch',
      'itchy',
      'flakes',
      'flaky',
      'clarifying treatment',
    ])
  ) {
    return 'Scalp Care';
  }

  if (
    includesAny(combined, [
      'treatment',
      'bond repair',
      'protein treatment',
      'heat protectant',
      'heat protection',
      'repair',
    ])
  ) {
    return 'Treatment';
  }

  return 'Styler';
}

function inferGoals(category: ProductCategory, ingredients: string[]): HairGoal[] {
  const goals = new Set<HairGoal>();
  const text = ingredientText(ingredients);

  if (
    category === 'Conditioner' ||
    category === 'Deep Conditioner' ||
    category === 'Leave-In' ||
    category === 'Cream'
  ) {
    goals.add('Moisture');
  }

  if (category === 'Gel' || category === 'Cream' || category === 'Styler') {
    goals.add('Definition');
  }

  if (category === 'Scalp Care' || category === 'Oil' || category === 'Shampoo') {
    goals.add('Scalp health');
  }

  if (category === 'Treatment' || category === 'Deep Conditioner') {
    goals.add('Repair');
  }

  if (
    includesAny(text, [
      'glycerin',
      'aloe',
      'aloe barbadensis',
      'panthenol',
      'honey',
      'sodium pca',
      'propylene glycol',
      'butylene glycol',
    ])
  ) {
    goals.add('Moisture');
  }

  if (
    includesAny(text, [
      'hydrolyzed',
      'keratin',
      'amino acids',
      'silk protein',
      'wheat protein',
      'rice protein',
      'collagen',
    ])
  ) {
    goals.add('Repair');
  }

  if (
    includesAny(text, [
      'peppermint',
      'tea tree',
      'menthol',
      'salicylic acid',
      'zinc pyrithione',
      'witch hazel',
    ])
  ) {
    goals.add('Scalp health');
  }

  if (
    includesAny(text, [
      'castor oil',
      'ricinus communis',
      'rosemary',
      'biotin',
      'niacinamide',
    ])
  ) {
    goals.add('Growth');
    goals.add('Thickness');
  }

  if (
    includesAny(text, [
      'heat protect',
      'dimethicone',
      'amodimethicone',
      'phenyl trimethicone',
    ])
  ) {
    goals.add('Heat protection');
  }

  return Array.from(goals);
}

function inferBestFor(category: ProductCategory, ingredients: string[]) {
  const bestFor = new Set<string>();
  const text = ingredientText(ingredients);

  if (category === 'Shampoo') {
    bestFor.add('Cleansing buildup from the scalp and hair');
  }

  if (category === 'Conditioner') {
    bestFor.add('Softening hair after shampooing');
    bestFor.add('Improving slip for detangling');
  }

  if (category === 'Deep Conditioner') {
    bestFor.add('Moisture-focused wash days');
    bestFor.add('Dryness, softness, and manageability');
  }

  if (category === 'Leave-In') {
    bestFor.add('Layering moisture before styling');
    bestFor.add('Detangling and daily manageability');
  }

  if (category === 'Cream') {
    bestFor.add('Moisture retention before sealing or styling');
    bestFor.add('Twist-outs, braid-outs, and curl definition');
  }

  if (category === 'Gel') {
    bestFor.add('Hold, definition, and frizz control');
  }

  if (category === 'Oil') {
    bestFor.add('Sealing moisture and adding shine');
    bestFor.add('Scalp or end-focused use');
  }

  if (category === 'Scalp Care') {
    bestFor.add('Scalp comfort, flakes, itch, or buildup support');
  }

  if (category === 'Treatment') {
    bestFor.add('Targeted repair or strengthening');
  }

  if (includesAny(text, ['shea butter', 'butyrospermum parkii', 'mango butter'])) {
    bestFor.add('Thicker textures that need richer moisture sealing');
  }

  if (includesAny(text, ['aloe', 'glycerin', 'panthenol'])) {
    bestFor.add('Hair that needs hydration and softness');
  }

  if (includesAny(text, ['hydrolyzed', 'keratin', 'protein'])) {
    bestFor.add('Hair that needs strengthening or repair');
  }

  return Array.from(bestFor);
}

function inferCautions(ingredients: string[]) {
  const cautions = new Set<string>();
  const avoidIf = new Set<string>();
  const text = ingredientText(ingredients);

  if (
    includesAny(text, [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'ammonium lauryl sulfate',
    ])
  ) {
    cautions.add('Contains a stronger cleanser that may feel drying for some hair types.');
    avoidIf.add('Your hair or scalp gets dry easily from strong cleansers.');
  }

  if (
    includesAny(text, [
      'isopropyl alcohol',
      'sd alcohol',
      'alcohol denat',
      'denatured alcohol',
    ])
  ) {
    cautions.add('Contains a drying alcohol that may not work well for dryness-prone hair.');
    avoidIf.add('You are avoiding drying alcohols.');
  }

  if (
    includesAny(text, [
      'coconut oil',
      'cocos nucifera',
      'shea butter',
      'butyrospermum parkii',
      'castor oil',
      'ricinus communis',
      'petrolatum',
      'mineral oil',
    ])
  ) {
    cautions.add('Contains richer oils or butters that may feel heavy on fine or low-porosity hair.');
    avoidIf.add('Your hair gets weighed down easily.');
  }

  if (
    includesAny(text, [
      'hydrolyzed',
      'keratin',
      'wheat protein',
      'rice protein',
      'silk protein',
      'collagen',
    ])
  ) {
    cautions.add('Contains protein or strengthening ingredients; balance with moisture if your hair is protein-sensitive.');
    avoidIf.add('Your hair is protein-sensitive.');
  }

  if (
    includesAny(text, [
      'fragrance',
      'parfum',
      'limonene',
      'linalool',
      'citral',
      'geraniol',
    ])
  ) {
    cautions.add('Contains fragrance components that may bother sensitive scalps.');
    avoidIf.add('You are sensitive to fragrance.');
  }

  return {
    cautions: Array.from(cautions),
    avoidIf: Array.from(avoidIf),
  };
}

function inferIngredientHighlights(ingredients: string[]) {
  const highlights: string[] = [];
  const text = ingredientText(ingredients);

  const ingredientRules = [
    {
      terms: ['glycerin'],
      label: 'Glycerin: humectant that helps attract moisture.',
    },
    {
      terms: ['aloe', 'aloe barbadensis'],
      label: 'Aloe: soothing hydration and softness support.',
    },
    {
      terms: ['panthenol'],
      label: 'Panthenol: helps with softness, shine, and manageability.',
    },
    {
      terms: ['shea butter', 'butyrospermum parkii'],
      label: 'Shea butter: rich emollient that helps seal moisture.',
    },
    {
      terms: ['coconut oil', 'cocos nucifera'],
      label: 'Coconut oil: rich oil that may help reduce moisture loss but can feel heavy for some.',
    },
    {
      terms: ['castor oil', 'ricinus communis'],
      label: 'Castor oil: thick sealing oil often used for shine and scalp routines.',
    },
    {
      terms: ['hydrolyzed', 'keratin', 'protein'],
      label: 'Protein/strengthening ingredients: can support repair but may need moisture balance.',
    },
    {
      terms: ['dimethicone', 'amodimethicone'],
      label: 'Silicone: adds slip, shine, and heat/frizz protection, but may need thorough cleansing.',
    },
    {
      terms: ['tea tree', 'peppermint', 'menthol'],
      label: 'Scalp-stimulating ingredients: may feel cooling or refreshing on the scalp.',
    },
  ];

  ingredientRules.forEach((rule) => {
    if (includesAny(text, rule.terms)) {
      highlights.push(rule.label);
    }
  });

  return highlights.slice(0, 5);
}

function routineTermsForCategory(category: ProductCategory) {
  switch (category) {
    case 'Shampoo':
      return ['cleanse', 'shampoo', 'wash'];
    case 'Conditioner':
      return ['condition', 'detangle', 'rinse'];
    case 'Deep Conditioner':
      return ['deep condition', 'mask', 'treatment'];
    case 'Leave-In':
      return ['leave-in', 'leave in', 'moisturize', 'prep'];
    case 'Cream':
      return ['cream', 'moisturize', 'style', 'twist out', 'braid out'];
    case 'Gel':
      return ['gel', 'hold', 'define', 'style'];
    case 'Oil':
      return ['oil', 'seal', 'scalp', 'shine'];
    case 'Scalp Care':
      return ['scalp', 'flakes', 'itch', 'buildup'];
    case 'Treatment':
      return ['repair', 'strengthen', 'treatment'];
    default:
      return ['style', 'routine'];
  }
}

export function inferProductAttributes(
  input: ProductInferenceInput
): ProductInferenceResult {
  const ingredients = input.ingredients ?? [];
  const category = inferProductCategory(input);

  const recommendedForGoals = inferGoals(category, ingredients);
  const bestFor = inferBestFor(category, ingredients);
  const { cautions, avoidIf } = inferCautions(ingredients);
  const ingredientHighlights = inferIngredientHighlights(ingredients);

  const brand = input.brand && input.brand !== 'Unknown brand' ? input.brand : 'This product';
  const name = input.name && input.name !== 'Unknown product' ? input.name : 'this product';

  const description =
    input.description && !input.description.toLowerCase().includes('imported from')
      ? input.description
      : `${brand} ${name} appears to be a ${category.toLowerCase()} product. ManeLine uses its product type and ingredient list to estimate routine fit.`;

  const tags = [
    category.toLowerCase(),
    ...recommendedForGoals.map((goal) => goal.toLowerCase()),
    ...routineTermsForCategory(category),
  ].map(titleCase);

  return {
    category,
    description,
    bestFor,
    tags,
    recommendedForGoals,
    routineStepMatch: routineTermsForCategory(category),
    cautions,
    avoidIf,
    ingredientHighlights,
  };
}
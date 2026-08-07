import { inferProductAttributes } from '../services/productInferenceService';
import { ExternalProductLookupResult } from '../types/externalProduct.types';
import {
  Density,
  HairProduct,
  Porosity,
  ScalpType,
} from '../types/product.types';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}

function recommendedPorosityFromIngredients(
  ingredients: string[]
): Porosity[] {
  const text = ingredients.join(' ').toLowerCase();

  const heavyIngredients = [
    'shea butter',
    'butyrospermum parkii',
    'castor oil',
    'ricinus communis',
    'petrolatum',
    'mineral oil',
    'beeswax',
  ];

  const lightweightHydrators = [
    'aloe',
    'glycerin',
    'panthenol',
    'sodium pca',
    'honey',
  ];

  const hasHeavyIngredient = heavyIngredients.some((ingredient) =>
    text.includes(ingredient)
  );

  const hasLightweightHydrator = lightweightHydrators.some((ingredient) =>
    text.includes(ingredient)
  );

  if (hasHeavyIngredient && !hasLightweightHydrator) {
    return ['Medium', 'High', 'Unsure'];
  }

  if (hasLightweightHydrator && !hasHeavyIngredient) {
    return ['Low', 'Medium', 'High', 'Unsure'];
  }

  return ['Low', 'Medium', 'High', 'Unsure'];
}

function recommendedDensityFromIngredients(
  ingredients: string[]
): Density[] {
  const text = ingredients.join(' ').toLowerCase();

  const heavyIngredients = [
    'shea butter',
    'butyrospermum parkii',
    'castor oil',
    'ricinus communis',
    'petrolatum',
    'mineral oil',
    'beeswax',
  ];

  const hasHeavyIngredient = heavyIngredients.some((ingredient) =>
    text.includes(ingredient)
  );

  if (hasHeavyIngredient) {
    return ['Medium', 'Thick', 'Unsure'];
  }

  return ['Fine', 'Medium', 'Thick', 'Unsure'];
}

function recommendedScalpFromCategory(category: string): ScalpType[] {
  if (category === 'Scalp Care') {
    return ['Dry', 'Oily', 'Sensitive', 'Flaky', 'Balanced'];
  }

  if (category === 'Shampoo') {
    return ['Balanced', 'Oily', 'Flaky', 'Dry', 'Sensitive'];
  }

  return ['Balanced', 'Dry', 'Oily', 'Sensitive', 'Flaky'];
}

export function normalizeExternalProductToHairProduct(
  result: ExternalProductLookupResult
): HairProduct {
  const ingredients = result.ingredients ?? [];

  const inferred = inferProductAttributes({
    name: result.name,
    brand: result.brand,
    category: result.category,
    description: result.description,
    ingredients,
  });

  const brand = result.brand ?? 'Unknown brand';
  const name = result.name ?? 'Unknown product';

  return {
    id: result.barcode,
    name,
    brand,
    category: inferred.category,
    imageEmoji: '🧴',
    barcodes: [result.barcode],
    description: inferred.description,
    ingredients,
    bestFor: inferred.bestFor,
    tags: uniqueValues([
      'Imported',
      result.source,
      inferred.category,
      slugify(brand),
      ...inferred.tags,
    ]),
    recommendedForHairTypes: [],
    recommendedForPorosity: recommendedPorosityFromIngredients(ingredients),
    recommendedForDensity: recommendedDensityFromIngredients(ingredients),
    recommendedForScalp: recommendedScalpFromCategory(inferred.category),
    recommendedForGoals: inferred.recommendedForGoals,
    avoidIf: inferred.avoidIf,
    cautions: inferred.cautions,
    routineStepMatch: inferred.routineStepMatch,
  };
}
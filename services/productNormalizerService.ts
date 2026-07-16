import { ExternalProductLookupResult } from '../types/externalProduct.types';
import { HairProduct, ProductCategory } from '../types/product.types';

const fallbackCategory: ProductCategory = 'Styler';

function toProductCategory(value?: string): ProductCategory {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('shampoo')) return 'Shampoo';
  if (normalized.includes('conditioner') && normalized.includes('deep')) {
    return 'Deep Conditioner';
  }
  if (normalized.includes('conditioner')) return 'Conditioner';
  if (normalized.includes('leave')) return 'Leave-In';
  if (normalized.includes('cream')) return 'Cream';
  if (normalized.includes('gel')) return 'Gel';
  if (normalized.includes('oil')) return 'Oil';
  if (normalized.includes('scalp')) return 'Scalp Care';
  if (normalized.includes('treatment') || normalized.includes('mask')) {
    return 'Treatment';
  }

  return fallbackCategory;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function normalizeExternalProductToHairProduct(
  result: ExternalProductLookupResult
): HairProduct {
  const category = toProductCategory(result.category);

  return {
    id: result.barcode,
    name: result.name ?? 'Unknown product',
    brand: result.brand ?? 'Unknown brand',
    category,
    imageEmoji: '🧴',
    barcodes: [result.barcode],
    description:
      result.description ??
      `Product imported from ${result.source}. ManeLine has ingredient data, but recommendations may improve as the product is reviewed.`,
    ingredients: result.ingredients ?? [],
    bestFor: [],
    tags: [
      'imported',
      result.source,
      category.toLowerCase(),
      slugify(result.brand ?? 'unknown-brand'),
    ],
    recommendedForHairTypes: [],
    recommendedForPorosity: ['Low', 'Medium', 'High', 'Unsure'],
    recommendedForDensity: ['Fine', 'Medium', 'Thick', 'Unsure'],
    recommendedForScalp: ['Balanced', 'Dry', 'Oily', 'Sensitive', 'Flaky'],
    recommendedForGoals: [],
    avoidIf: [],
    cautions: [
      'This product was imported from an external ingredient source and may need review.',
    ],
    routineStepMatch: [category.toLowerCase()],
  };
}
import { getBarcodeVariants } from '../services/barcodeUtils';
import { parseIngredientString } from '../services/ingredientParserService';
import { ExternalProductLookupResult } from '../types/externalProduct.types';

type OpenFactsProduct = {
  code?: string;
  product_type?: string;
  product_name?: string;
  product_name_en?: string;
  abbreviated_product_name?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_text_with_allergens?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
};

type OpenFactsV3Response = {
  status?: string | number;
  product?: OpenFactsProduct;
  result?: unknown;
  errors?: unknown[];
};

function getFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function getCategory(product: OpenFactsProduct) {
  const firstCategoryTag = product.categories_tags?.[0];

  if (firstCategoryTag) {
    return firstCategoryTag.replace(/^en:/, '');
  }

  return product.categories ?? product.product_type ?? 'Styler';
}

function normalizeOpenFactsProduct(
  barcode: string,
  product: OpenFactsProduct,
  raw: OpenFactsV3Response
): ExternalProductLookupResult {
  const ingredientText =
    product.ingredients_text_en ??
    product.ingredients_text ??
    product.ingredients_text_with_allergens ??
    '';

  const ingredients = parseIngredientString(ingredientText);

  return {
    found: true,
    source: 'open-beauty-facts',
    barcode,
    name:
      getFirstString(
        product.product_name_en,
        product.product_name,
        product.abbreviated_product_name,
        product.generic_name
      ) ?? 'Unknown product',
    brand: getFirstString(product.brands) ?? 'Unknown brand',
    category: getCategory(product),
    description: `Product data imported from Open Facts${
      product.product_type ? ` (${product.product_type})` : ''
    }.`,
    ingredients,
    imageUrl:
      product.image_front_url ??
      product.image_front_small_url ??
      product.image_url,
    raw,
  };
}

async function lookupSingleOpenFactsBarcode(
  barcode: string
): Promise<ExternalProductLookupResult> {
  const fields = [
    'code',
    'product_type',
    'product_name',
    'product_name_en',
    'abbreviated_product_name',
    'generic_name',
    'brands',
    'categories',
    'categories_tags',
    'ingredients_text',
    'ingredients_text_en',
    'ingredients_text_with_allergens',
    'image_url',
    'image_front_url',
    'image_front_small_url',
  ].join(',');

  const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(
    barcode
  )}?product_type=all&cc=us&lc=en&fields=${encodeURIComponent(fields)}`;

  console.log('[Open Facts] Trying barcode:', barcode);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      /**
       * Open Facts recommends an identifying User-Agent so they can contact
       * app owners if there are API issues.
       */
      'User-Agent': 'ManeLine/1.0 support@maneline.app',
    },
  });

  if (response.status === 404) {
    console.log('[Open Facts] Not found:', barcode);

    return {
      found: false,
      source: 'open-beauty-facts',
      barcode,
      ingredients: [],
    };
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');

    console.warn('[Open Facts] Request failed:', {
      barcode,
      status: response.status,
      body: errorText,
    });

    return {
      found: false,
      source: 'open-beauty-facts',
      barcode,
      ingredients: [],
      raw: {
        status: response.status,
        body: errorText,
      },
    };
  }

  const data = (await response.json()) as OpenFactsV3Response;
  const product = data.product;

  if (!product) {
    console.log('[Open Facts] No product object:', barcode, data);

    return {
      found: false,
      source: 'open-beauty-facts',
      barcode,
      ingredients: [],
      raw: data,
    };
  }

  const normalizedProduct = normalizeOpenFactsProduct(barcode, product, data);

  console.log('[Open Facts] Product found:', {
    barcode,
    name: normalizedProduct.name,
    brand: normalizedProduct.brand,
    ingredientCount: normalizedProduct.ingredients.length,
  });

  return normalizedProduct;
}

export async function lookupOpenBeautyFactsProduct(
  barcode: string
): Promise<ExternalProductLookupResult> {
  const barcodeVariants = getBarcodeVariants(barcode);

  for (const barcodeVariant of barcodeVariants) {
    const result = await lookupSingleOpenFactsBarcode(barcodeVariant);

    if (result.found) {
      return result;
    }
  }

  return {
    found: false,
    source: 'open-beauty-facts',
    barcode,
    ingredients: [],
  };
}
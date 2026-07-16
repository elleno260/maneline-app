import { ExternalProductLookupResult } from '../types/externalProduct.types';
import { parseIngredientString } from '../services/ingredientParserService';

type OpenBeautyFactsResponse = {
  status?: number;
  status_verbose?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    categories?: string;
    categories_tags?: string[];
    ingredients_text?: string;
    ingredients_text_en?: string;
    image_url?: string;
    image_front_url?: string;
  };
};

export async function lookupOpenBeautyFactsProduct(
  barcode: string
): Promise<ExternalProductLookupResult> {
  const cleanedBarcode = barcode.trim();

  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(
    cleanedBarcode
  )}.json`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ManeLine/1.0 contact: support@maneline.app',
    },
  });

  if (!response.ok) {
    throw new Error(`Open Beauty Facts request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenBeautyFactsResponse;

  if (data.status !== 1 || !data.product) {
    return {
      found: false,
      source: 'open-beauty-facts',
      barcode: cleanedBarcode,
      ingredients: [],
      raw: data,
    };
  }

  const product = data.product;

  const ingredientText =
    product.ingredients_text_en ?? product.ingredients_text ?? '';

  return {
    found: true,
    source: 'open-beauty-facts',
    barcode: cleanedBarcode,
    name: product.product_name_en ?? product.product_name ?? 'Unknown product',
    brand: product.brands ?? 'Unknown brand',
    category: product.categories_tags?.[0] ?? product.categories ?? 'Styler',
    description: 'Product data imported from Open Beauty Facts.',
    ingredients: parseIngredientString(ingredientText),
    imageUrl: product.image_front_url ?? product.image_url,
    raw: data,
  };
}
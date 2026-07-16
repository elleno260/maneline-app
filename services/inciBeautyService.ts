import { ExternalProductLookupResult } from '../types/externalProduct.types';
import { parseIngredientString } from '../services/ingredientParserService';

const INCI_API_BASE_URL = process.env.EXPO_PUBLIC_INCI_API_BASE_URL;
const INCI_API_KEY = process.env.EXPO_PUBLIC_INCI_API_KEY;

type InciBeautyFlexibleResponse = {
  product?: {
    name?: string;
    product_name?: string;
    brand?: string;
    brands?: string;
    category?: string;
    categories?: string;
    composition?: string | string[];
    ingredients?: string | string[];
    inci?: string | string[];
    image?: string;
    image_url?: string;
  };
  name?: string;
  product_name?: string;
  brand?: string;
  brands?: string;
  category?: string;
  categories?: string;
  composition?: string | string[];
  ingredients?: string | string[];
  inci?: string | string[];
  image?: string;
  image_url?: string;
};

function extractIngredients(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return parseIngredientString(value);
  }

  return [];
}

export async function lookupInciBeautyProduct(
  barcode: string
): Promise<ExternalProductLookupResult> {
  const cleanedBarcode = barcode.trim();

  if (!INCI_API_BASE_URL || !INCI_API_KEY) {
    return {
      found: false,
      source: 'inci-beauty',
      barcode: cleanedBarcode,
      ingredients: [],
    };
  }

  const url = `${INCI_API_BASE_URL.replace(/\/$/, '')}/products/${encodeURIComponent(
    cleanedBarcode
  )}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${INCI_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`INCI Beauty request failed: ${response.status}`);
  }

  const data = (await response.json()) as InciBeautyFlexibleResponse;
  const product = data.product ?? data;

  const ingredients =
    extractIngredients(product.ingredients) ||
    extractIngredients(product.composition) ||
    extractIngredients(product.inci);

  if (!product || ingredients.length === 0) {
    return {
      found: false,
      source: 'inci-beauty',
      barcode: cleanedBarcode,
      ingredients: [],
      raw: data,
    };
  }

  return {
    found: true,
    source: 'inci-beauty',
    barcode: cleanedBarcode,
    name: product.name ?? product.product_name ?? 'Unknown product',
    brand: product.brand ?? product.brands ?? 'Unknown brand',
    category: product.category ?? product.categories ?? 'Styler',
    description: 'Product data imported from INCI Beauty.',
    ingredients,
    imageUrl: product.image_url ?? product.image,
    raw: data,
  };
}
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const INCI_API_KEY = defineSecret('INCI_API_KEY');

type ExternalProductLookupResult = {
  found: boolean;
  source: 'inci-beauty';
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  ingredients: string[];
  imageUrl?: string;
  raw?: unknown;
};

function parseIngredientString(ingredientText?: string | null): string[] {
  if (!ingredientText) return [];

  return ingredientText
    .replace(/\n/g, ',')
    .split(',')
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .map((ingredient) =>
      ingredient.replace(/\.$/, '').replace(/\s+/g, ' ').trim()
    );
}

function extractIngredients(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return parseIngredientString(value);
  }

  return [];
}

function getFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function getFirstArrayValue(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;

  const firstValue = value.find(
    (item) => typeof item === 'string' && item.trim().length > 0
  );

  return typeof firstValue === 'string' ? firstValue.trim() : undefined;
}

export const lookupInciProduct = onCall(
  {
    secrets: [INCI_API_KEY],
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<ExternalProductLookupResult> => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to look up products.'
      );
    }

    const barcode = String(request.data?.barcode ?? '').trim();

    if (!barcode) {
      throw new HttpsError('invalid-argument', 'Barcode is required.');
    }

    const baseUrl = process.env.INCI_API_BASE_URL ?? 'https://inciapi.com/v1';
    const apiKey = INCI_API_KEY.value();

    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'INCI API key is not configured.'
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(
      barcode
    )}`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
      });
    } catch (error) {
      console.error('INCI API network error:', error);

      throw new HttpsError(
        'unavailable',
        'Could not connect to the INCI API.'
      );
    }

    if (response.status === 404) {
      return {
        found: false,
        source: 'inci-beauty',
        barcode,
        ingredients: [],
      };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      console.error('INCI API request failed:', {
        status: response.status,
        body: errorText,
      });

      throw new HttpsError(
        'internal',
        `INCI API request failed with status ${response.status}.`
      );
    }

    const data = await response.json();

    const product = data?.product ?? data;

    if (!product) {
      return {
        found: false,
        source: 'inci-beauty',
        barcode,
        ingredients: [],
        raw: data,
      };
    }

    const detailsIngredients = extractIngredients(product.details?.inci);
    const productIngredients = extractIngredients(product.ingredients);
    const compositionIngredients = extractIngredients(product.composition);
    const inciIngredients = extractIngredients(product.inci);

    const ingredients =
      detailsIngredients.length > 0
        ? detailsIngredients
        : productIngredients.length > 0
          ? productIngredients
          : compositionIngredients.length > 0
            ? compositionIngredients
            : inciIngredients;

    if (ingredients.length === 0) {
      return {
        found: false,
        source: 'inci-beauty',
        barcode,
        ingredients: [],
        raw: data,
      };
    }

    const category =
      getFirstArrayValue(product.category) ??
      getFirstString(product.category, product.categories) ??
      'Styler';

    const imageUrl =
      getFirstArrayValue(product.imageUrls) ??
      getFirstString(product.image_url, product.image, data.image_url);

    return {
      found: true,
      source: 'inci-beauty',
      barcode,
      name:
        getFirstString(product.name, product.product_name, data.name) ??
        'Unknown product',
      brand:
        getFirstString(product.brand, product.brands, data.brand) ??
        'Unknown brand',
      category,
      description: 'Product data imported from INCI API.',
      ingredients,
      imageUrl,
      raw: data,
    };
  }
);
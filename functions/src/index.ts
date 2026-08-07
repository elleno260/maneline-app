import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import {getApps, initializeApp} from "firebase-admin/app"; 
import { FieldValue, getFirestore,} from "firebase-admin/firestore";
import { GoogleGenAI } from '@google/genai';

const app = getApps().length === 0 ? initializeApp() : getApps()[0];
const db = getFirestore(app);

const INCI_API_KEY = defineSecret('INCI_API_KEY');
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');


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

interface UpcItemDbItem {
  ean?: string;
  upc?: string;
  gtin?: string;
  title?: string;
  brand?: string;
  description?: string;
  category?: string;
  model?: string;
  images?: string[];
}

interface UpcItemDbResponse {
  code?: string;
  total?: number;
  offset?: number;
  items?: UpcItemDbItem[];
}

interface ManeLineProductMetadata {
  barcode: string;
  matchedBarcode: string;
  name: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  model: string | null;
  imageUrl: string | null;
  ingredientsText: null;
  source: "upcitemdb";
}

function getBarcodeCandidates(value: unknown): string[] {
  const barcode = String(value ?? "").replace(/\D/g, "");

  if (![8, 12, 13, 14].includes(barcode.length)) {
    throw new HttpsError(
      "invalid-argument",
      "Barcode must contain 8, 12, 13, or 14 digits."
    );
  }

  const candidates = new Set<string>([barcode]);

  // UPC-A can also appear as an EAN-13 with a leading zero.
  if (barcode.length === 12) {
    candidates.add(`0${barcode}`);
  }

  if (barcode.length === 13 && barcode.startsWith("0")) {
    candidates.add(barcode.slice(1));
  }

  // The free UPCitemdb plan supports up to two codes per request.
  return Array.from(candidates).slice(0, 2);
}

export const lookupUpcItemProduct = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 15,
    memory: "256MiB",
  },
  async (request) => {
    const candidates = getBarcodeCandidates(request.data?.barcode);
    const requestedBarcode = candidates[0];

    /*
     * Check Firestore first so repeated scans do not consume
     * additional UPCitemdb requests.
     */
    const cachedDocument = await db
      .collection("productMetadata")
      .doc(requestedBarcode)
      .get();

    if (cachedDocument.exists) {
      return {
        found: true,
        cached: true,
        source: "firestore",
        product: cachedDocument.data(),
      };
    }

    const query = encodeURIComponent(candidates.join(","));
    const endpoint =
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${query}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new HttpsError(
          "deadline-exceeded",
          "UPCitemdb took too long to respond."
        );
      }

      console.error("UPCitemdb network error:", error);

      throw new HttpsError(
        "unavailable",
        "Unable to connect to UPCitemdb."
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      return {
        found: false,
        cached: false,
        source: "upcitemdb",
        reason: "not-found",
      };
    }

    if (response.status === 429) {
  const responseText = await response
    .text()
    .catch(() => '');

  console.warn('UPCitemdb rate limited:', {
    barcode: requestedBarcode,
    body: responseText,
  });
return {
    found: false,
    cached: false,
    source: 'upcitemdb',
    reason: 'rate-limited',
    rateLimited: true,
  };
  let rateLimitReason:
    | 'burst-limit'
    | 'daily-limit'
    | 'rate-limited' = 'rate-limited';

  try {
    const rateLimitData = JSON.parse(responseText);

    if (rateLimitData?.code === 'TOO_FAST') {
      rateLimitReason = 'burst-limit';
    }

    if (rateLimitData?.code === 'EXCEED_LIMIT') {
      rateLimitReason = 'daily-limit';
    }
  } catch {
    // Keep the generic rate-limited reason.
  }

  return {
    found: false,
    cached: false,
    source: 'upcitemdb',
    reason: rateLimitReason,
    rateLimited: true,
  };
}

    if (!response.ok) {
      const responseText = await response.text();

      console.error("UPCitemdb error:", {
        status: response.status,
        body: responseText,
      });

      throw new HttpsError(
        "internal",
        `UPCitemdb returned status ${response.status}.`
      );
    }

    let data: UpcItemDbResponse;

    try {
      data = (await response.json()) as UpcItemDbResponse;
    } catch (error) {
      console.error("Invalid UPCitemdb JSON:", error);

      throw new HttpsError(
        "data-loss",
        "UPCitemdb returned an invalid response."
      );
    }

    const item = data.items?.[0];

    if (!item) {
      return {
        found: false,
        cached: false,
        source: "upcitemdb",
        reason: "not-found",
      };
    }

    const product: ManeLineProductMetadata = {
      barcode: requestedBarcode,
      matchedBarcode:
        item.upc ??
        item.ean ??
        item.gtin ??
        requestedBarcode,
      name: item.title?.trim() || null,
      brand: item.brand?.trim() || null,
      description: item.description?.trim() || null,
      category: item.category?.trim() || null,
      model: item.model?.trim() || null,
      imageUrl:
        item.images?.find(
          (image): image is string =>
            typeof image === "string" &&
            image.startsWith("http")
        ) ?? null,

      // UPCitemdb is not your ingredient source.
      ingredientsText: null,
      source: "upcitemdb",
    };

    await db
      .collection("productMetadata")
      .doc(requestedBarcode)
      .set(
        {
          ...product,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return {
      found: true,
      cached: false,
      source: "upcitemdb",
      product,
    };
  }
);


type IngredientConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'none';

type GeminiIngredientSearchResult = {
  found: boolean;
  matchedProductName: string;
  matchedBrand: string;
  ingredientsText: string;
  confidence: IngredientConfidence;
  matchReason: string;
};

function extractGeminiSourceUrls(
  interaction: unknown
): string[] {
  const urls = new Set<string>();

  const typedInteraction = interaction as {
    steps?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        annotations?: Array<{
          type?: string;
          url?: string;
        }>;
      }>;
    }>;
  };

  for (const step of typedInteraction.steps ?? []) {
    if (step.type !== 'model_output') continue;

    for (const contentBlock of step.content ?? []) {
      for (const annotation of contentBlock.annotations ?? []) {
        if (
          annotation.type === 'url_citation' &&
          typeof annotation.url === 'string'
        ) {
          urls.add(annotation.url);
        }
      }
    }
  }

  return [...urls];
}

export const findProductIngredients = onCall(
  {
    secrets: [GEMINI_API_KEY],
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    /*
     * This matches the authentication requirement currently used
     * by lookupInciProduct.
     */
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to search for product ingredients.'
      );
    }

    const barcode = String(
      request.data?.barcode ?? ''
    ).replace(/\D/g, '');

    const productName = String(
      request.data?.productName ?? ''
    ).trim();

    const brand = String(
      request.data?.brand ?? ''
    ).trim();

    const category = String(
      request.data?.category ?? ''
    ).trim();

    const description = String(
      request.data?.description ?? ''
    ).trim();

    if (!barcode || !productName || !brand) {
      throw new HttpsError(
        'invalid-argument',
        'Barcode, product name, and brand are required.'
      );
    }

    const apiKey = GEMINI_API_KEY.value();

    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'Gemini API key is not configured.'
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    /*
     * This is where the prompt belongs.
     * UPCitemdb has already identified the product before
     * the app calls this function.
     */
    const prompt = `
Find the published ingredient list for this exact hair product.

Product identity:
- Barcode/UPC/EAN: ${barcode}
- Brand: ${brand}
- Product name: ${productName}
- Category: ${category || 'Unknown'}
- Description: ${description || 'Unavailable'}

Search requirements:
1. Search the public web for this exact product.
2. Prefer the official manufacturer's website.
3. A reputable retailer may be used only when the exact product clearly matches.
4. Do not infer, reconstruct, predict, or invent ingredients.
5. Do not use ingredients from a similarly named product.
6. Check that the brand and full product name match.
7. Check the barcode when a webpage displays one.
8. Preserve the ingredient order shown by the source.
9. If sources contain conflicting ingredient lists, return found=false.
10. If the exact ingredient list cannot be verified, return found=false.

Confidence rules:
- high: official manufacturer source or exact barcode match
- medium: reputable retailer and exact product variation match
- low: incomplete, conflicting, or uncertain match
- none: no ingredient list was verified

The ingredientsText field must contain only the published ingredient
list in its original order. Use an empty string when no list is found.
`;

    const ingredientSearchSchema = {
      type: 'object',
      properties: {
        found: {
          type: 'boolean',
          description:
            'True only when a published ingredient list was verified.',
        },
        matchedProductName: {
          type: 'string',
          description:
            'The full product name shown by the source.',
        },
        matchedBrand: {
          type: 'string',
          description:
            'The product brand shown by the source.',
        },
        ingredientsText: {
          type: 'string',
          description:
            'The complete ingredient list in its published order, or an empty string.',
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low', 'none'],
        },
        matchReason: {
          type: 'string',
          description:
            'Why the web result does or does not match the exact product.',
        },
      },
      required: [
        'found',
        'matchedProductName',
        'matchedBrand',
        'ingredientsText',
        'confidence',
        'matchReason',
      ],
    };

    let interaction;

    try {
      interaction = await ai.interactions.create({
        model: 'gemini-3.6-flash',
        input: prompt,

        // Gives Gemini access to current public web results.
        tools: [
          {
            type: 'google_search',
          },
        ],

        // Makes Gemini return predictable JSON.
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: ingredientSearchSchema,
        },
      });
    } catch (error) {
      console.error('Gemini ingredient search failed:', error);

      throw new HttpsError(
        'unavailable',
        'Gemini could not complete the ingredient search.'
      );
    }

    const outputText = interaction.output_text ?? '';

    let result: GeminiIngredientSearchResult;

    try {
      result = JSON.parse(
        outputText
      ) as GeminiIngredientSearchResult;
    } catch (error) {
      console.error('Invalid Gemini JSON response:', {
        error,
        outputText,
      });

      throw new HttpsError(
        'data-loss',
        'Gemini returned an invalid ingredient-search response.'
      );
    }

    const sourceUrls =
      extractGeminiSourceUrls(interaction);

    /*
     * Never accept ingredients without supporting web citations.
     */
    const verified =
      result.found === true &&
      result.ingredientsText.trim().length > 0 &&
      sourceUrls.length > 0 &&
      (
        result.confidence === 'high' ||
        result.confidence === 'medium'
      );

    if (!verified) {
      return {
        found: false,
        barcode,
        productName,
        brand,
        ingredients: [],
        ingredientsText: null,
        confidence: result.confidence,
        matchReason:
          result.matchReason ||
          'No verifiable ingredient list was found.',
        sourceUrls,
        requiresLabelScan: true,
      };
    }

    const ingredients = parseIngredientString(
      result.ingredientsText
    );

    return {
      found: true,
      barcode,
      productName:
        result.matchedProductName || productName,
      brand:
        result.matchedBrand || brand,
      ingredients,
      ingredientsText: result.ingredientsText,
      confidence: result.confidence,
      matchReason: result.matchReason,
      sourceUrls,
      requiresLabelScan: false,
    };
  }
);
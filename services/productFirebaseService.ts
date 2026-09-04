import { db, firebaseApp} from '../firebaseConfig';
import { productCatalog } from '../data/productCatalog';
import type {HairProduct,ProductCategory,} from '../types/product.types';
import {collection,doc,getDoc,getDocs,limit,orderBy, query,serverTimestamp,setDoc,where,} from 'firebase/firestore';
import { resolveRetailerIngredients } from './retailerIngredientService';
import { lookupInciBeautyProduct } from './inciBeautyService';
import { lookupOpenBeautyFactsProduct } from './openBeautyFactsService';
import { normalizeExternalProductToHairProduct } from './productNormalizerService';
import {lookupUPCItemdb, type UpcItemProduct,} from './upcItemDbService';
import { httpsCallable,} from 'firebase/functions';
import {getOrCreateGuestUser,} from './authService';
import {getProtectedFunctions,} from './protectedFunctionsService';
const PRODUCTS_COLLECTION = 'products';

type SaveReviewedOcrProductRequest = {
  barcode: string;

  product: HairProduct;

  ingredients: string[];

  ingredientsText: string;
};

type SaveReviewedOcrProductResponse = {
  saved: boolean;

  cached: boolean;

  product: HairProduct;
};


const ENABLE_INCI_LOOKUP = false;

function cleanBarcode(value: string) {
  return value.trim();
}

function hasIngredients(product: HairProduct) {
  return (
    Array.isArray(product.ingredients) &&
    product.ingredients.length > 0
  );
}

function hasUsableIdentity(product: HairProduct) {
  const name = product.name.trim().toLowerCase();
  const brand = product.brand.trim().toLowerCase();

  return (
    name.length > 0 &&
    brand.length > 0 &&
    name !== 'unknown product' &&
    brand !== 'unknown brand'
  );
}

function normalizeUpcCategory(
  value: string | null | undefined
): ProductCategory {
  const category = value?.trim().toLowerCase() ?? '';

  if (
    category.includes('deep conditioner') ||
    category.includes('hair mask') ||
    category.includes('conditioning mask')
  ) {
    return 'Deep Conditioner';
  }

  if (category.includes('leave-in')) {
    return 'Leave-In';
  }

  if (category.includes('shampoo')) {
    return 'Shampoo';
  }

  if (category.includes('conditioner')) {
    return 'Conditioner';
  }

  if (category.includes('scalp')) {
    return 'Scalp Care';
  }

  if (category.includes('gel')) {
    return 'Gel';
  }

  if (category.includes('oil')) {
    return 'Oil';
  }

  if (category.includes('cream')) {
    return 'Cream';
  }

  if (
    category.includes('treatment') ||
    category.includes('serum') ||
    category.includes('repair')
  ) {
    return 'Treatment';
  }

  return 'Styler';
}

async function enrichProductWithRetailerIngredients(
  product: HairProduct,
  barcode: string
): Promise<HairProduct> {
  if (!product.name || !product.brand) {
    return product;
  }

  const retailerResult =
    await resolveRetailerIngredients({
      barcode,
      productName: product.name,
      brand: product.brand,
    }).catch((error) => {
      console.warn(
        '[ManeLine lookup] Retailer ingredient lookup failed:',
        error
      );

      return null;
    });

  if (
    !retailerResult?.found ||
    !Array.isArray(retailerResult.ingredients) ||
    retailerResult.ingredients.length === 0
  ) {
    console.log(
      '[ManeLine lookup] Retailer did not verify ingredients:',
      barcode
    );

    return product;
  }

  console.log(
    '[ManeLine lookup] Retailer verified ingredients:',
    {
      barcode,
      ingredientCount: retailerResult.ingredients.length,
      confidence: retailerResult.confidence,
      source: retailerResult.sourceDomain,
    }
  );

  return {
    ...product,
    ingredients: retailerResult.ingredients,
  };
}
function buildUpcHairProduct(args: {
  barcode: string;
  product: UpcItemProduct;
  ingredients: string[];
}): HairProduct {
  const { barcode, product, ingredients } = args;

  const barcodes = Array.from(
    new Set(
      [barcode, product.matchedBarcode]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const category = normalizeUpcCategory(product.category);

  return {
    id: barcode,
    name: product.name?.trim() || 'Unknown product',
    brand: product.brand?.trim() || 'Unknown brand',
    category,
    imageEmoji: '🧴',
    barcodes,
    description:
      product.description?.trim() ||
      'Product identified through UPCitemdb.',
    ingredients,
    bestFor: [],
    tags: ['UPCitemdb import', category],
    recommendedForHairTypes: [],
    recommendedForPorosity: [],
    recommendedForGoals: [],
  };
}

export async function getProductsFromFirestore(): Promise<HairProduct[]> {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const productsQuery = query(productsRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((productDoc) => ({
    id: productDoc.id,
    ...productDoc.data(),
  })) as HairProduct[];
}

export async function getProductFromFirestore(
  productId: string
): Promise<HairProduct | null> {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as HairProduct;
}

export async function getProductByBarcode(
  barcode: string
): Promise<HairProduct | null> {
  const cleanedBarcode = cleanBarcode(barcode);

  if (!cleanedBarcode) {
    return null;
  }

  const directProductRef = doc(
    db,
    PRODUCTS_COLLECTION,
    cleanedBarcode
  );
  const directProductSnapshot = await getDoc(directProductRef);

  if (directProductSnapshot.exists()) {
    return {
      id: directProductSnapshot.id,
      ...directProductSnapshot.data(),
    } as HairProduct;
  }

  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const barcodeQuery = query(
    productsRef,
    where('barcodes', 'array-contains', cleanedBarcode),
    limit(1)
  );

  const snapshot = await getDocs(barcodeQuery);

  if (snapshot.empty) {
    return null;
  }

  const productDoc = snapshot.docs[0];

  if (!productDoc) {
    return null;
  }

  return {
    id: productDoc.id,
    ...productDoc.data(),
  } as HairProduct;
}

export async function getProductsWithFallback(): Promise<HairProduct[]> {
  try {
    const firestoreProducts = await getProductsFromFirestore();

    if (firestoreProducts.length > 0) {
      return firestoreProducts;
    }

    return productCatalog;
  } catch (error) {
    console.warn('Using local product catalog fallback:', error);
    return productCatalog;
  }
}

export async function saveProductToFirestore(product: HairProduct) {
  const productRef = doc(db, PRODUCTS_COLLECTION, product.id);

  await setDoc(
    productRef,
    {
      ...product,
      updatedAt: serverTimestamp(),
      importedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return product;
}
export async function saveReviewedOcrProduct(
  args: {
    barcode: string;
    product: HairProduct;
    ingredients: string[];
    ingredientsText: string;
  }
): Promise<HairProduct> {
  await getOrCreateGuestUser();

  const cleanedBarcode =
    cleanBarcode(args.barcode);

  if (!cleanedBarcode) {
    throw new Error(
      'A barcode is required to cache an OCR product.'
    );
  }

  if (args.ingredients.length === 0) {
    throw new Error(
      'Cannot save an OCR product without ingredients.'
    );
  }

  console.log(
    '[ManeLine OCR cache] Sending reviewed product to backend:',
    {
      barcode: cleanedBarcode,
      productName: args.product.name,
      ingredientCount:
        args.ingredients.length,
    }
  );
  const functions =
  await getProtectedFunctions();

const saveReviewedOcrProductCallable =
  httpsCallable<
    SaveReviewedOcrProductRequest,
    SaveReviewedOcrProductResponse
  >(
    functions,
    'saveReviewedOcrProduct'
  );
  
  const response =
    await saveReviewedOcrProductCallable({
      barcode: cleanedBarcode,
      product: args.product,
      ingredients: args.ingredients,
      ingredientsText:
        args.ingredientsText,
    });

  console.log(
    '[ManeLine OCR cache] Backend result:',
    {
      saved: response.data.saved,
      cached: response.data.cached,
      barcode: cleanedBarcode,
      ingredientCount:
        response.data.product
          .ingredients?.length ?? 0,
    }
  );

  return response.data.product;
}

export async function getOrImportProductByBarcode(
  barcode: string
): Promise<HairProduct | null> {
  const cleanedBarcode =
  cleanBarcode(barcode);

  if (!cleanedBarcode) {
    return null;
  }

  console.log('[ManeLine lookup] Starting lookup:', cleanedBarcode);

  // 1. Check ManeLine's own Firestore product database.
  const existingProduct = await getProductByBarcode(cleanedBarcode);

  if (existingProduct) {
    const normalizedExistingProduct: HairProduct = {
      ...existingProduct,
      ingredients: existingProduct.ingredients ?? [],
    };

    console.log('[ManeLine lookup] Found in Firestore:', {
      id: normalizedExistingProduct.id,
      name: normalizedExistingProduct.name,
      ingredientCount: normalizedExistingProduct.ingredients.length,
    });

    return enrichProductWithRetailerIngredients(
      normalizedExistingProduct,
      cleanedBarcode
    );
  }

  // 2. Optionally try INCI through the secure Cloud Function.
  if (ENABLE_INCI_LOOKUP) {
    console.log('[ManeLine lookup] Trying INCI:', cleanedBarcode);

    const inciResult = await lookupInciBeautyProduct(
      cleanedBarcode
    ).catch((error) => {
      console.warn('[ManeLine lookup] INCI lookup failed:', error);
      return null;
    });

    if (inciResult?.found) {
      const inciProduct = normalizeExternalProductToHairProduct({
        ...inciResult,
        ingredients: inciResult.ingredients ?? [],
      });

      console.log('[ManeLine lookup] Found through INCI:', {
        name: inciProduct.name,
        brand: inciProduct.brand,
        ingredientCount: inciProduct.ingredients.length,
      });

      return enrichProductWithRetailerIngredients(inciProduct, cleanedBarcode);
    }

    console.log(
      '[ManeLine lookup] INCI did not find product:',
      cleanedBarcode
    );
  }

 /**
 * 3. Try Open Facts / Open Beauty Facts.
 *
 * Rules:
 * - Real identity + ingredients = done.
 * - Real identity + no ingredients = try retailer resolver.
 * - Placeholder identity = treat as a miss and continue to UPCitemdb.
 */
console.log(
  '[ManeLine lookup] Trying Open Facts:',
  cleanedBarcode
);

const openFactsResult =
  await lookupOpenBeautyFactsProduct(
    cleanedBarcode
  ).catch((error) => {
    console.warn(
      '[ManeLine lookup] Open Facts lookup failed:',
      error
    );

    return null;
  });

if (openFactsResult?.found) {
  const openFactsIngredients =
    openFactsResult.ingredients ?? [];

  const openFactsProduct =
    normalizeExternalProductToHairProduct({
      ...openFactsResult,
      ingredients: openFactsIngredients,
    });

  console.log(
    '[ManeLine lookup] Found through Open Facts:',
    {
      name: openFactsProduct.name,
      brand: openFactsProduct.brand,
      ingredientCount:
        openFactsProduct.ingredients.length,
    }
  );

  /*
   * CASE 1:
   * Open Facts technically returned a result,
   * but it is only placeholder information.
   *
   * Example:
   * name: "Unknown product"
   * brand: "Unknown brand"
   *
   * Do NOT send that to Tavily.
   * Continue down to UPCitemdb instead.
   */
  if (!hasUsableIdentity(openFactsProduct)) {
    console.log(
      '[ManeLine lookup] Open Facts identity was incomplete; continuing to UPCitemdb:',
      cleanedBarcode
    );
  }

  /*
   * CASE 2:
   * Open Facts gave us a valid product
   * AND an ingredient list.
   *
   * This product is already resolved.
   * Do NOT call Tavily.
   */
  else if (hasIngredients(openFactsProduct)) {
    console.log(
      '[ManeLine lookup] Open Facts fully resolved product; skipping retailer lookup:',
      {
        name: openFactsProduct.name,
        ingredientCount:
          openFactsProduct.ingredients.length,
      }
    );

    return openFactsProduct;
  }

  /*
   * CASE 3:
   * Open Facts gave us a valid product identity,
   * but there are no ingredients.
   *
   * Now Tavily + grounded Gemini extraction
   * should try approved retailer pages.
   */
  else {
    console.log(
      '[ManeLine lookup] Open Facts identified product but ingredients are missing; trying retailer resolver:',
      {
        name: openFactsProduct.name,
        brand: openFactsProduct.brand,
      }
    );

    const retailerProduct =
      await enrichProductWithRetailerIngredients(
        openFactsProduct,
        cleanedBarcode
      );

    /*
     * Retailer successfully supplied ingredients.
     */
    if (hasIngredients(retailerProduct)) {
      console.log(
        '[ManeLine lookup] Retailer resolved Open Facts product:',
        {
          name: retailerProduct.name,
          ingredientCount:
            retailerProduct.ingredients.length,
        }
      );

      return retailerProduct;
    }

    /*
     * We still know which product this is,
     * so keep that identity.
     *
     * Your scan screen can now recognize that
     * the product exists but needs an ingredient
     * label/OCR scan.
     */
    console.log(
      '[ManeLine lookup] Product identified, but ingredients remain unresolved; OCR fallback needed:',
      {
        name: openFactsProduct.name,
        brand: openFactsProduct.brand,
      }
    );

    return openFactsProduct;
  }
}

/*
 * Open Facts completely missed OR returned
 * unusable placeholder data.
 *
 * Execution continues into your existing
 * UPCitemdb section below.
 */
console.log(
  '[ManeLine lookup] Open Facts did not fully identify product; continuing fallback:',
  cleanedBarcode
);

  // 4. Open Beauty Facts failed, so identify the product with UPCitemdb.
  console.log(
  '[ManeLine lookup] Trying UPCitemdb:',
  cleanedBarcode
);

const upcResult = await lookupUPCItemdb(
  cleanedBarcode
).catch((error) => {
  console.warn(
    '[ManeLine lookup] UPCitemdb lookup failed:',
    error
  );

  return null;
});

/*
 * First narrow null.
 */
if (!upcResult) {
  console.log(
    '[ManeLine lookup] UPCitemdb unavailable'
  );

  return null;
}

/*
 * Handle a rate limit without crashing the scan.
 */
if (upcResult.rateLimited) {
  console.warn(
    '[ManeLine lookup] UPCitemdb temporarily unavailable:',
    upcResult.reason
  );

  // Continue to the label-scan fallback below.
} 


/*
 * Now narrow product from undefined.
 */
if (!upcResult.found || !upcResult.product) {
  console.log(
    '[ManeLine lookup] UPCitemdb did not identify product:',
    cleanedBarcode
  );

  return null;
}

/*
 * After the guard above, TypeScript knows this is
 * definitely an UpcItemProduct.
 */
const upcProduct = upcResult.product;

console.log(
  '[ManeLine lookup] UPCitemdb identified:',
  {
    name: upcProduct.name,
    brand: upcProduct.brand,
    barcode: upcProduct.barcode,
  }
);
if (!upcProduct.name || !upcProduct.brand) {
  console.log(
    '[ManeLine lookup] UPCitemdb result was incomplete'
  );

  return null;
}

console.log(
  '[ManeLine lookup] Trying retailer ingredient resolver:',
  {
    productName: upcProduct.name,
    brand: upcProduct.brand,
  }
);

const retailerResult =
  await resolveRetailerIngredients({
    barcode: cleanedBarcode,
    productName: upcProduct.name,
    brand: upcProduct.brand,
  }).catch((error) => {
    console.warn(
      '[ManeLine lookup] Retailer ingredient lookup failed:',
      error
    );

    return null;
  });

if (
  !retailerResult?.found ||
  retailerResult.ingredients.length === 0
) {
  console.log(
    '[ManeLine lookup] Product identified, but retailer ingredients were not verified:',
    retailerResult?.reason
  );

  return null;
}

console.log(
  '[ManeLine lookup] Retailer ingredients verified:',
  {
    source: retailerResult.sourceDomain,
    confidence: retailerResult.confidence,
    ingredientCount:
      retailerResult.ingredients.length,
  }
);

  const baseUpcHairProduct = buildUpcHairProduct({
    barcode: cleanedBarcode,
    product: upcProduct,
    ingredients: [],
  });

  return enrichProductWithRetailerIngredients(
    baseUpcHairProduct,
    cleanedBarcode
  );
}
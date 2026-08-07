import { db } from '../firebaseConfig';
import { productCatalog } from '../data/productCatalog';
import type {
  HairProduct,
  ProductCategory,
} from '../types/product.types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { findIngredientsWithGemini } from './geminiIngredientService';
import { lookupInciBeautyProduct } from './inciBeautyService';
import { lookupOpenBeautyFactsProduct } from './openBeautyFactsService';
import { normalizeExternalProductToHairProduct } from './productNormalizerService';
import {
  lookupUPCItemdb,
  type UpcItemProduct,
} from './upcItemDbService';

const PRODUCTS_COLLECTION = 'products';
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

async function addGeminiIngredients(
  product: HairProduct,
  barcode: string
): Promise<HairProduct> {
  if (hasIngredients(product) || !hasUsableIdentity(product)) {
    return product;
  }

  console.log(
    '[ManeLine lookup] Product identified without ingredients. Trying Gemini:',
    {
      barcode,
      name: product.name,
      brand: product.brand,
    }
  );

  const geminiResult = await findIngredientsWithGemini({
    barcode,
    productName: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }).catch((error) => {
    console.warn(
      '[ManeLine lookup] Gemini ingredient lookup failed:',
      error
    );
    return null;
  });

  if (
    !geminiResult?.found ||
    !Array.isArray(geminiResult.ingredients) ||
    geminiResult.ingredients.length === 0
  ) {
    console.log(
      '[ManeLine lookup] Gemini did not verify ingredients:',
      barcode
    );
    return product;
  }

  console.log('[ManeLine lookup] Gemini verified ingredients:', {
    barcode,
    ingredientCount: geminiResult.ingredients.length,
    confidence: geminiResult.confidence,
  });

  return {
    ...product,
    ingredients: geminiResult.ingredients,
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

export async function getOrImportProductByBarcode(
  barcode: string
): Promise<HairProduct | null> {
  const cleanedBarcode = cleanBarcode(barcode);

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

    return addGeminiIngredients(
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

      return addGeminiIngredients(inciProduct, cleanedBarcode);
    }

    console.log(
      '[ManeLine lookup] INCI did not find product:',
      cleanedBarcode
    );
  }

  // 3. Try Open Beauty Facts.
  const openFactsResult = await lookupOpenBeautyFactsProduct(
    cleanedBarcode
  ).catch((error) => {
    console.warn('[ManeLine lookup] Open Facts lookup failed:', error);
    return null;
  });

  if (openFactsResult?.found) {
    const openFactsProduct = normalizeExternalProductToHairProduct({
      ...openFactsResult,
      ingredients: openFactsResult.ingredients ?? [],
    });

    console.log('[ManeLine lookup] Found through Open Facts:', {
      name: openFactsProduct.name,
      brand: openFactsProduct.brand,
      ingredientCount: openFactsProduct.ingredients.length,
    });

    return addGeminiIngredients(
      openFactsProduct,
      cleanedBarcode
    );
  }

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
} else if (upcResult.found && upcResult.product) {
  const upcProduct = upcResult.product;

  // Continue with Gemini/product normalization here.
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

const geminiResult =
  await findIngredientsWithGemini({
    barcode: cleanedBarcode,
    productName: upcProduct.name,
    brand: upcProduct.brand,
    category: upcProduct.category,
    description: upcProduct.description,
  }).catch((error) => {
    console.warn(
      '[ManeLine lookup] Gemini ingredient search failed:',
      error
    );

    return null;
  });

if (
  !geminiResult?.found ||
  geminiResult.ingredients.length === 0
) {
  console.log(
    '[ManeLine lookup] Product identified, but ingredients were not verified'
  );

  return null;
}

  const baseUpcHairProduct = buildUpcHairProduct({
    barcode: cleanedBarcode,
    product: upcProduct,
    ingredients: [],
  });

  return addGeminiIngredients(
    baseUpcHairProduct,
    cleanedBarcode
  );
}
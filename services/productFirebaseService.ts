import { db } from '../firebaseConfig';
import { productCatalog } from '../data/productCatalog';
import { HairProduct } from '../types/product.types';
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

import { lookupInciBeautyProduct } from '../services/inciBeautyService';
import { lookupOpenBeautyFactsProduct } from '../services/openBeautyFactsService';
import { normalizeExternalProductToHairProduct } from '../services/productNormalizerService';

const PRODUCTS_COLLECTION = 'products';

function cleanBarcode(value: string) {
  return value.trim();
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

  /**
   * First check if the barcode itself is the Firestore document ID.
   */
  const directProductRef = doc(db, PRODUCTS_COLLECTION, cleanedBarcode);
  const directProductSnapshot = await getDoc(directProductRef);

  if (directProductSnapshot.exists()) {
    return {
      id: directProductSnapshot.id,
      ...directProductSnapshot.data(),
    } as HairProduct;
  }

  /**
   * Then check products that have this barcode inside their barcodes array.
   */
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

/**
 * Keep this for later/admin use, but do NOT call it during regular mobile scans yet.
 * Product writes should eventually happen server-side through a Cloud Function.
 */
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

  /**
   * 1. Check Firestore first.
   */
  const existingProduct = await getProductByBarcode(cleanedBarcode);

  if (existingProduct) {
    return existingProduct;
  }

  /**
   * 2. If not in Firestore, call your secure INCI Cloud Function.
   * We protect against ingredients being undefined by forcing it into an array.
   */
  const inciResult = await lookupInciBeautyProduct(cleanedBarcode).catch(
    (error) => {
      console.warn('INCI lookup failed:', error);
      return null;
    }
  );

  const inciIngredients = inciResult?.ingredients ?? [];

  if (inciResult?.found && inciIngredients.length > 0) {
    return normalizeExternalProductToHairProduct({
      ...inciResult,
      ingredients: inciIngredients,
    });
  }

  /**
   * 3. If INCI does not find it, try Open Beauty Facts.
   */
  const openBeautyFactsResult = await lookupOpenBeautyFactsProduct(
    cleanedBarcode
  ).catch((error) => {
    console.warn('Open Beauty Facts lookup failed:', error);
    return null;
  });

  const openBeautyFactsIngredients = openBeautyFactsResult?.ingredients ?? [];

  if (
    openBeautyFactsResult?.found &&
    openBeautyFactsIngredients.length > 0
  ) {
    return normalizeExternalProductToHairProduct({
      ...openBeautyFactsResult,
      ingredients: openBeautyFactsIngredients,
    });
  }

  return null;
}
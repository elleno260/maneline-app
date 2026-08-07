import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firebaseApp } from '../firebaseConfig';
import { getOrCreateGuestUser } from './authService';

export interface GeminiIngredientRequest {
  barcode: string;
  productName: string;
  brand: string;
  category?: string | null;
  description?: string | null;
}

export interface GeminiIngredientResult {
  found: boolean;
  barcode: string;
  productName: string;
  brand: string;
  ingredients: string[];
  ingredientsText: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  matchReason: string;
  sourceUrls: string[];
  requiresLabelScan: boolean;
}

const functions = getFunctions(
  firebaseApp,
  'us-central1'
);

const findProductIngredientsCallable = httpsCallable<
  GeminiIngredientRequest,
  GeminiIngredientResult
>(
  functions,
  'findProductIngredients'
);

export async function findIngredientsWithGemini(
  product: GeminiIngredientRequest
): Promise<GeminiIngredientResult> {
  await getOrCreateGuestUser();

  const response =
    await findProductIngredientsCallable({
      barcode: product.barcode,
      productName: product.productName,
      brand: product.brand,
      category: product.category ?? '',
      description: product.description ?? '',
    });

  return response.data;
}
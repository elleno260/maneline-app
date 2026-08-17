import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firebaseApp } from '../firebaseConfig';
import { getOrCreateGuestUser } from './authService';
export interface RetailerIngredientRequest {
  barcode: string;
  productName: string;
  brand: string;
}

export interface RetailerIngredientResult {
  found: boolean;
  ingredients: string[];
  ingredientsText: string | null;
  sourceUrl: string | null;
  sourceDomain: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  reason?: string;
}

const functions = getFunctions(
  firebaseApp,
  'us-central1'
);

const resolveRetailerIngredientsCallable =
  httpsCallable<
    RetailerIngredientRequest,
    RetailerIngredientResult
  >(
    functions,
    'resolveRetailerIngredients'
  );

export async function resolveRetailerIngredients(
  request: RetailerIngredientRequest
): Promise<RetailerIngredientResult> {
  await getOrCreateGuestUser();

  console.log(
    '[Retailer lookup] Starting:',
    request
  );

  const response =
    await resolveRetailerIngredientsCallable(
      request
    );

  console.log(
    '[Retailer lookup] Result:',
    JSON.stringify(response.data, null, 2)
  );

  return response.data;
}

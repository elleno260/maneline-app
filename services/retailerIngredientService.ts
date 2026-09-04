import {
  httpsCallable,
} from 'firebase/functions';

import {
  getOrCreateGuestUser,
} from './authService';

import {
  getProtectedFunctions,
} from './protectedFunctionsService';

export interface RetailerIngredientRequest {
  barcode: string;
  productName: string;
  brand: string;
}

export interface RetailerIngredientResult {
  found: boolean;
  ingredients: string[];
  ingredientsText:
    string | null;
  sourceUrl:
    string | null;
  sourceDomain:
    string | null;

  confidence:
    | 'high'
    | 'medium'
    | 'low'
    | 'none';

  reason?: string;
}

export async function resolveRetailerIngredients(
  request:
    RetailerIngredientRequest
): Promise<RetailerIngredientResult> {
  await getOrCreateGuestUser();

  /*
   * Do not instantiate Firebase
   * Functions until App Check
   * initialization is complete.
   */
  const functions =
    await getProtectedFunctions();

  const resolveRetailerIngredientsCallable =
    httpsCallable<
      RetailerIngredientRequest,
      RetailerIngredientResult
    >(
      functions,
      'resolveRetailerIngredients'
    );

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
    JSON.stringify(
      response.data,
      null,
      2
    )
  );

  return response.data;
}
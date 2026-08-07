import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firebaseApp } from '../firebaseConfig';
import { getOrCreateGuestUser } from './authService';

export interface UpcItemProduct {
  barcode: string;
  matchedBarcode: string;
  name: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  model: string | null;
  imageUrl: string | null;
  ingredientsText: null;
  source: 'upcitemdb';
}

interface UpcLookupResponse {
  found: boolean;
  cached?: boolean;
  source: string;
  reason?: string;
  rateLimited?: boolean;
  product?: UpcItemProduct;
}

const functions = getFunctions(
  firebaseApp,
  'us-central1'
);

const lookupUpcCallable = httpsCallable<
  { barcode: string },
  UpcLookupResponse
>(
  functions,
  'lookupUpcItemProduct'
);

export async function lookupUPCItemdb(
  barcode: string
): Promise<UpcLookupResponse> {
  await getOrCreateGuestUser();

  const cleanBarcode = barcode.replace(/\D/g, '');

  console.log('[UPCitemdb] Calling function:', {
    barcode: cleanBarcode,
    projectId: firebaseApp.options.projectId,
  });

  try {
    const response = await lookupUpcCallable({
      barcode: cleanBarcode,
    });

    console.log(
      '[UPCitemdb] Function response:',
      JSON.stringify(response.data, null, 2)
    );

    return response.data;
  } catch (error) {
    console.error(
      '[UPCitemdb] Callable error:',
      error
    );

    throw error;
  }
}
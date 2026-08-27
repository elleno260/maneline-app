import AsyncStorage from '@react-native-async-storage/async-storage';

const OCR_DRAFT_STORAGE_KEY =
  'MANELINE_OCR_DRAFT_V1';

export type OcrIngredientDraft = {
  barcode?: string;

  productId?: string;

  productName?: string;

  brand?: string;

  category?: string;

  extractedText: string;

  ingredientSource:
    'user_photo_ocr';

  capturedAt: string;
};

export async function saveOcrDraft(
  draft: OcrIngredientDraft
) {
  await AsyncStorage.setItem(
    OCR_DRAFT_STORAGE_KEY,
    JSON.stringify(draft)
  );
}

export async function loadOcrDraft():
  Promise<OcrIngredientDraft | null> {
  const raw =
    await AsyncStorage.getItem(
      OCR_DRAFT_STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    ) as OcrIngredientDraft;
  } catch {
    return null;
  }
}

export async function clearOcrDraft() {
  await AsyncStorage.removeItem(
    OCR_DRAFT_STORAGE_KEY
  );
}
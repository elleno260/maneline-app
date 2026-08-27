import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  ScanHistoryItem,
} from './scanHistoryFirebaseService';

import type {
  HairProduct,
} from '../types/product.types';

const STORAGE_KEY =
  'MANELINE_PENDING_SCAN_RESULT_V1';

export type PendingScanResult = {
  item: ScanHistoryItem;
  product: HairProduct;
};

export async function savePendingScanResult(
  result: PendingScanResult
) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(result)
  );
}

export async function takePendingScanResult():
  Promise<PendingScanResult | null> {
  const raw =
    await AsyncStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  await AsyncStorage.removeItem(
    STORAGE_KEY
  );

  try {
    return JSON.parse(
      raw
    ) as PendingScanResult;
  } catch {
    return null;
  }
}
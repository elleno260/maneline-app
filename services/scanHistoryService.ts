import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScanHistoryItem = {
  id: string;
  productName: string;
  brand?: string;
  barcode?: string;
  scannedAt: string;
  compatibilityScore?: number;
  summary: string;
  ingredients: string[];
  flags: {
    label: string;
    type: 'good' | 'caution' | 'avoid' | 'neutral';
  }[];
};

const STORAGE_KEY = 'MANELINE_SCAN_HISTORY';

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ScanHistoryItem[];
  } catch {
    return [];
  }
}

export async function saveScanToHistory(item: ScanHistoryItem) {
  const current = await getScanHistory();

  const updated = [
    item,
    ...current.filter((existing) => existing.id !== item.id),
  ];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearScanHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
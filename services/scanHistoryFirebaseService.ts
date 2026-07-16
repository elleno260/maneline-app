import { db } from '../firebaseConfig';
import { getCurrentUserIdOrThrow } from '../services/authService';
import { CompatibilityResult } from '../types/product.types';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

export type ScanHistoryItem = {
  id: string;
  productId?: string | null;
  productName: string;
  brand?: string | null;
  barcode?: string | null;
  scannedAt: string;
  compatibilityScore?: number | null;
  compatibilityLabel?: string | null;
  summary: string;
  aiExplanation?: string | null;
  ingredients: string[];
  matchReasons?: string[];
  cautions?: string[];
  routineFit?: string | null;
  ingredientHighlights?: string[];
};

function getScanHistoryCollection(userId: string) {
  return collection(db, 'users', userId, 'scanHistory');
}

export function buildScanHistoryItem(args: {
  productId?: string;
  productName: string;
  brand?: string;
  barcode?: string;
  ingredients: string[];
  compatibility?: CompatibilityResult;
  aiExplanation?: string;
}): ScanHistoryItem {
  return {
    id: `${Date.now()}`,
    productId: args.productId ?? null,
    productName: args.productName,
    brand: args.brand ?? null,
    barcode: args.barcode ?? null,
    scannedAt: new Date().toISOString(),
    compatibilityScore: args.compatibility?.score ?? null,
    compatibilityLabel: args.compatibility?.label ?? null,
    summary:
      args.aiExplanation ??
      args.compatibility?.summary ??
      'This product has been scanned and saved to your history.',
    aiExplanation: args.aiExplanation ?? null,
    ingredients: args.ingredients,
    matchReasons: args.compatibility?.reasons ?? [],
    cautions: args.compatibility?.cautions ?? [],
    routineFit: args.compatibility?.routineFit ?? null,
    ingredientHighlights: args.compatibility?.ingredientHighlights ?? [],
  };
}

export async function saveScanToFirebaseHistory(item: ScanHistoryItem) {
  const userId = await getCurrentUserIdOrThrow();

  const scanRef = doc(db, 'users', userId, 'scanHistory', item.id);

  await setDoc(
    scanRef,
    {
      ...item,
      scannedAtTimestamp: serverTimestamp(),
    },
    { merge: true }
  );

  return item;
}

export async function getScanHistoryFromFirebase(): Promise<ScanHistoryItem[]> {
  const userId = await getCurrentUserIdOrThrow();

  const scansQuery = query(
    getScanHistoryCollection(userId),
    orderBy('scannedAtTimestamp', 'desc')
  );

  const snapshot = await getDocs(scansQuery);

  return snapshot.docs.map((scanDoc) => {
    const data = scanDoc.data();

    return {
      id: scanDoc.id,
      productId: data.productId ?? null,
      productName: data.productName ?? 'Unknown product',
      brand: data.brand ?? null,
      barcode: data.barcode ?? null,
      scannedAt:
        typeof data.scannedAt === 'string'
          ? data.scannedAt
          : data.scannedAtTimestamp instanceof Timestamp
            ? data.scannedAtTimestamp.toDate().toISOString()
            : new Date().toISOString(),
      compatibilityScore: data.compatibilityScore ?? null,
      compatibilityLabel: data.compatibilityLabel ?? null,
      summary:
        data.summary ??
        'This product has been scanned and saved to your history.',
      aiExplanation: data.aiExplanation ?? null,
      ingredients: data.ingredients ?? [],
      matchReasons: data.matchReasons ?? [],
      cautions: data.cautions ?? [],
      routineFit: data.routineFit ?? null,
      ingredientHighlights: data.ingredientHighlights ?? [],
    } as ScanHistoryItem;
  });
}
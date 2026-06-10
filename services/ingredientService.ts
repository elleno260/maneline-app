import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type CompatibilityRating = "good" | "okay" | "caution" | "avoid";

export type IngredientRecord = {
  name: string;
  normalizedName: string;
  aliases?: string[];

  function: string;
  category: string;
  description: string;

  safetyRating: CompatibilityRating;
  safetyScore: 1 | 2 | 3 | 4 | 5;

  porosityCompatibility: {
    low: CompatibilityRating;
    medium: CompatibilityRating;
    high: CompatibilityRating;
  };

  hairTypeFlags: {
    straight: CompatibilityRating;
    wavy: CompatibilityRating;
    curly: CompatibilityRating;
    coily: CompatibilityRating;
  };

  concerns: string[];
  benefits: string[];
  avoidIf: string[];
  goodFor: string[];

  sourceType: "curated" | "imported" | "ai-assisted";
  updatedAt: string;
};

export type EnrichedIngredient = {
  originalName: string;
  normalizedName: string;
  found: boolean;
  data?: IngredientRecord;
};

function slugifyIngredientName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeIngredientName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function parseRawIngredients(rawIngredientsText: string): string[] {
  if (!rawIngredientsText) return [];

  return rawIngredientsText
    .replace(/ingredients:/i, "")
    .split(/,|;|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function lookupIngredient(
  ingredientName: string
): Promise<EnrichedIngredient> {
  const normalizedName = normalizeIngredientName(ingredientName);
  const ingredientId = slugifyIngredientName(ingredientName);

  const ingredientRef = doc(db, "ingredients", ingredientId);
  const snapshot = await getDoc(ingredientRef);

  if (!snapshot.exists()) {
    return {
      originalName: ingredientName,
      normalizedName,
      found: false,
    };
  }

  return {
    originalName: ingredientName,
    normalizedName,
    found: true,
    data: snapshot.data() as IngredientRecord,
  };
}

export async function enrichIngredientsFromText(rawIngredientsText: string) {
  const parsedIngredients = parseRawIngredients(rawIngredientsText);

  const enrichedIngredients = await Promise.all(
    parsedIngredients.map((ingredient) => lookupIngredient(ingredient))
  );

  return enrichedIngredients;
}
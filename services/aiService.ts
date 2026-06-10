import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db, geminiModel } from "../firebaseConfig";
import type { EnrichedIngredient } from "./ingredientService";

export type AIRecommendation = {
  summary: string;
  compatibilityScore: number;
  recommendation:
    | "use"
    | "use_with_caution"
    | "avoid"
    | "not_enough_information";
  why: string[];
  ingredientHighlights: {
    ingredient: string;
    rating: "good" | "okay" | "caution" | "avoid" | "unknown";
    explanation: string;
  }[];
  bestFor: string[];
  watchOutFor: string[];
  routineTip: string;
};

export type AnalyzeScanInput = {
  barcode?: string;
  productName?: string;
  brand?: string;
  rawIngredientsText: string;
  enrichedIngredients: EnrichedIngredient[];
  scanSource: "barcode" | "ocr" | "manual";
};

function buildPrompt(input: AnalyzeScanInput) {
  return `
You are ManeLine's hair product ingredient analysis assistant.

Analyze a hair product using:
1. The raw ingredient list
2. ManeLine's enriched ingredient database results

Give a clear, plain-language recommendation.
Do not diagnose medical conditions.
Do not make medical claims.
Do not exaggerate risk.
If data is missing, say that clearly.

Product:
${JSON.stringify(
  {
    productName: input.productName ?? "Unknown product",
    brand: input.brand ?? "",
    barcode: input.barcode ?? "",
    scanSource: input.scanSource,
  },
  null,
  2
)}

Raw ingredients text:
${input.rawIngredientsText}

ManeLine enriched ingredient database results:
${JSON.stringify(input.enrichedIngredients, null, 2)}

Return ONLY valid JSON in this exact shape:
{
  "summary": "short overall plain-language summary",
  "compatibilityScore": 0,
  "recommendation": "use",
  "why": ["reason 1", "reason 2", "reason 3"],
  "ingredientHighlights": [
    {
      "ingredient": "ingredient name",
      "rating": "good",
      "explanation": "plain-language explanation"
    }
  ],
  "bestFor": ["hair profile or goal this product may support"],
  "watchOutFor": ["concerns or cautions"],
  "routineTip": "one practical usage tip"
}

Rules:
- compatibilityScore must be a number from 0 to 100.
- recommendation must be one of: "use", "use_with_caution", "avoid", "not_enough_information".
- ingredient rating must be one of: "good", "okay", "caution", "avoid", "unknown".
`;
}

function cleanGeminiJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function analyzeScanWithAI(input: AnalyzeScanInput) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to analyze a scan.");
  }

  const prompt = buildPrompt(input);

  const result = await geminiModel.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const cleanedText = cleanGeminiJson(text);
  const aiResult = JSON.parse(cleanedText) as AIRecommendation;

  const scanHistoryRef = await addDoc(
    collection(db, "users", user.uid, "scanHistory"),
    {
      barcode: input.barcode ?? null,
      productName: input.productName ?? null,
      brand: input.brand ?? null,
      scanSource: input.scanSource,
      rawIngredientsText: input.rawIngredientsText,
      enrichedIngredients: input.enrichedIngredients,
      aiResult,
      createdAt: serverTimestamp(),
    }
  );

  return {
    scanHistoryId: scanHistoryRef.id,
    aiResult,
  };
}
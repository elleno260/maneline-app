import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";

admin.initializeApp();

type EnrichedIngredient = {
  originalName: string;
  normalizedName: string;
  found: boolean;
  data?: {
    name: string;
    function: string;
    category: string;
    description: string;
    safetyRating: string;
    safetyScore: number;
    porosityCompatibility?: {
      low?: string;
      medium?: string;
      high?: string;
    };
    hairTypeFlags?: {
      straight?: string;
      wavy?: string;
      curly?: string;
      coily?: string;
    };
    concerns?: string[];
    benefits?: string[];
    avoidIf?: string[];
    goodFor?: string[];
  };
};

type AnalyzeScanPayload = {
  barcode?: string;
  productName?: string;
  brand?: string;
  rawIngredientsText: string;
  enrichedIngredients: EnrichedIngredient[];
  scanSource: "barcode" | "ocr" | "manual";
};

function buildPrompt(params: {
  hairProfile: FirebaseFirestore.DocumentData | null;
  payload: AnalyzeScanPayload;
}) {
  const { hairProfile, payload } = params;

  return `
You are ManeLine's hair product ingredient analysis assistant.

Your job:
Analyze a hair product's ingredients using the user's hair profile and ManeLine's ingredient database.
Give a clear, plain-language explanation.
Do not diagnose medical conditions.
Do not make medical claims.
Do not exaggerate risk.
If data is missing, say that clearly.

User hair profile:
${JSON.stringify(
  {
    hairType: hairProfile?.hairType ?? "unknown",
    porosity: hairProfile?.porosity ?? "unknown",
    density: hairProfile?.density ?? "unknown",
    goals: hairProfile?.goals ?? [],
  },
  null,
  2
)}

Product:
${JSON.stringify(
  {
    productName: payload.productName ?? "Unknown product",
    brand: payload.brand ?? "",
    barcode: payload.barcode ?? "",
    scanSource: payload.scanSource,
  },
  null,
  2
)}

Raw ingredients text:
${payload.rawIngredientsText}

ManeLine enriched ingredient database results:
${JSON.stringify(payload.enrichedIngredients, null, 2)}

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

export const analyzeScanWithAI = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const uid = request.auth.uid;
    const payload = request.data as AnalyzeScanPayload;

    if (!payload.rawIngredientsText) {
      throw new HttpsError(
        "invalid-argument",
        "Missing rawIngredientsText."
      );
    }

    if (!payload.enrichedIngredients) {
      throw new HttpsError(
        "invalid-argument",
        "Missing enrichedIngredients."
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "Missing ANTHROPIC_API_KEY in functions environment."
      );
    }

    const userProfileSnap = await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .get();

    const hairProfile = userProfileSnap.exists
      ? userProfileSnap.data() ?? null
      : null;

    const anthropic = new Anthropic({
      apiKey,
    });

    const prompt = buildPrompt({
      hairProfile,
      payload,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      throw new HttpsError("internal", "Claude did not return text.");
    }

    let aiResult;

    try {
      aiResult = JSON.parse(textBlock.text);
    } catch (error) {
      console.error("Claude JSON parse error:", textBlock.text);

      throw new HttpsError(
        "internal",
        "Claude returned a response that was not valid JSON."
      );
    }

    const scanHistoryRef = await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .collection("scanHistory")
      .add({
        barcode: payload.barcode ?? null,
        productName: payload.productName ?? null,
        brand: payload.brand ?? null,
        scanSource: payload.scanSource,
        rawIngredientsText: payload.rawIngredientsText,
        enrichedIngredients: payload.enrichedIngredients,
        aiResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      scanHistoryId: scanHistoryRef.id,
      aiResult,
    };
  }
);
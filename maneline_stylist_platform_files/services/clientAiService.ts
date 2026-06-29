import { geminiModel } from '@/firebaseConfig';
import type { ClientAiRecommendation, ClientProfile, ClientVisit } from '@/types/client.types';
import { getClient, listVisits, saveAiRecommendation } from './clientService';

type AiJson = Omit<ClientAiRecommendation, 'id' | 'clientId' | 'stylistId' | 'stylistGoal' | 'createdAt'>;

function safeJsonParse(text: string): AiJson {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as AiJson;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as AiJson;
    }
    throw new Error('AI response was not valid JSON. Try again with a simpler stylist goal.');
  }
}

function buildClientContext(client: ClientProfile, visits: ClientVisit[]) {
  return {
    client: {
      name: `${client.firstName} ${client.lastName}`,
      hairProfile: client.hairProfile,
      goals: client.goals,
      chemicalHistory: client.chemicalHistory,
      allergies: client.allergies,
      lastVisitAt: client.lastVisitAt,
      lastFormulaUsed: client.lastFormulaUsed,
    },
    recentVisits: visits.slice(0, 5).map((visit) => ({
      date: visit.date,
      services: visit.services,
      resultNotes: visit.resultNotes,
      conditionNotes: visit.conditionNotes,
      clientVisibleSummary: visit.clientVisibleSummary,
    })),
  };
}

function buildPrompt(client: ClientProfile, visits: ClientVisit[], stylistGoal: string) {
  const context = buildClientContext(client, visits);

  return `
You are ManeLine's stylist assistant. You support licensed or experienced hair professionals.
You are NOT replacing the stylist. You help organize recommendations based on client history.
Do not make medical diagnoses. Use cautious language when discussing scalp irritation, allergies, breakage, or chemical services.

Stylist goal for today's recommendation:
${stylistGoal}

Client context:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON. No markdown. No commentary.
Use this exact schema:
{
  "summary": "2-4 sentence practical summary for the stylist",
  "recommendedProducts": [
    {
      "type": "product category, not necessarily a brand",
      "name": "optional product name if obvious",
      "brand": "optional brand",
      "reason": "why this fits the client",
      "caution": "optional caution"
    }
  ],
  "formulaSuggestion": "optional stylist-facing formula or service suggestion; say consult professional judgment if unsure",
  "regimenSteps": [
    {
      "title": "step title",
      "instructions": "client-friendly instructions",
      "frequency": "how often",
      "productType": "optional product type"
    }
  ],
  "cautions": ["specific cautions from allergies, chemical history, scalp sensitivity, product buildup, or conflicting goals"],
  "nextVisitTip": "what the stylist should check or ask next appointment",
  "rawResponse": "brief note explaining the reasoning in plain language"
}
`;
}

export async function generateClientRecommendation(clientId: string, stylistGoal: string) {
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found.');

  const visits = await listVisits(clientId, undefined, 5);
  const prompt = buildPrompt(client, visits, stylistGoal);
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  const parsed = safeJsonParse(text);

  const recommendationId = await saveAiRecommendation(clientId, {
    stylistGoal,
    summary: parsed.summary,
    recommendedProducts: parsed.recommendedProducts ?? [],
    formulaSuggestion: parsed.formulaSuggestion,
    regimenSteps: parsed.regimenSteps ?? [],
    cautions: parsed.cautions ?? [],
    nextVisitTip: parsed.nextVisitTip,
    rawResponse: parsed.rawResponse ?? text,
  });

  return {
    id: recommendationId,
    clientId,
    stylistId: client.stylistId,
    stylistGoal,
    ...parsed,
  };
}

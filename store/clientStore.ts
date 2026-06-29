import { create } from 'zustand';
import type { ClientAiRecommendation, ClientProfile, ClientVisit, CreateClientInput, CreateVisitInput } from '@/types/client.types';
import { addVisit, createClient, getClient, listClients, listVisits, shareRegimenWithClient } from '@/services/clientService';
import { generateClientRecommendation } from '@/services/clientAiService';

type LoadingState = 'idle' | 'loading' | 'saving' | 'ai' | 'error';

interface ClientStore {
  clients: ClientProfile[];
  selectedClient: ClientProfile | null;
  visits: ClientVisit[];
  latestRecommendation: ClientAiRecommendation | null;
  status: LoadingState;
  error: string | null;
  loadClients: () => Promise<void>;
  loadClientDetail: (clientId: string) => Promise<void>;
  createNewClient: (input: CreateClientInput) => Promise<string>;
  createVisit: (clientId: string, input: CreateVisitInput) => Promise<string>;
  getAiRecommendation: (clientId: string, stylistGoal: string) => Promise<ClientAiRecommendation>;
  shareLatestRegimen: (clientId: string) => Promise<void>;
  clearError: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  selectedClient: null,
  visits: [],
  latestRecommendation: null,
  status: 'idle',
  error: null,

  clearError: () => set({ error: null, status: 'idle' }),

  loadClients: async () => {
    try {
      set({ status: 'loading', error: null });
      const clients = await listClients();
      set({ clients, status: 'idle' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to load clients.' });
    }
  },

  loadClientDetail: async (clientId: string) => {
    try {
      set({ status: 'loading', error: null });
      const [client, visits] = await Promise.all([getClient(clientId), listVisits(clientId)]);
      set({ selectedClient: client, visits, status: 'idle' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to load client detail.' });
    }
  },

  createNewClient: async (input: CreateClientInput) => {
    try {
      set({ status: 'saving', error: null });
      const id = await createClient(input);
      await get().loadClients();
      set({ status: 'idle' });
      return id;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to create client.' });
      throw error;
    }
  },

  createVisit: async (clientId: string, input: CreateVisitInput) => {
    try {
      set({ status: 'saving', error: null });
      const id = await addVisit(clientId, input);
      await get().loadClientDetail(clientId);
      set({ status: 'idle' });
      return id;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to save visit.' });
      throw error;
    }
  },

  getAiRecommendation: async (clientId: string, stylistGoal: string) => {
    try {
      set({ status: 'ai', error: null });
      const recommendation = await generateClientRecommendation(clientId, stylistGoal);
      set({ latestRecommendation: recommendation, status: 'idle' });
      return recommendation;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Unable to generate recommendation.' });
      throw error;
    }
  },

  shareLatestRegimen: async (clientId: string) => {
    const recommendation = get().latestRecommendation;
    if (!recommendation) throw new Error('No recommendation to share yet.');

    await shareRegimenWithClient(clientId, {
      summary: recommendation.summary,
      steps: recommendation.regimenSteps,
      recommendedProducts: recommendation.recommendedProducts,
      cautions: recommendation.cautions,
      nextVisitTip: recommendation.nextVisitTip,
    });
    await get().loadClientDetail(clientId);
  },
}));

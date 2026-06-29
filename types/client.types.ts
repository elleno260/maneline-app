export type HairType = 'straight' | 'wavy' | 'curly' | 'coily' | 'locs' | 'protective_style' | 'unknown';
export type Porosity = 'low' | 'medium' | 'high' | 'unknown';
export type Density = 'low' | 'medium' | 'high' | 'unknown';
export type ScalpCondition = 'normal' | 'dry' | 'oily' | 'itchy' | 'flaky' | 'sensitive' | 'unknown';

export type FirestoreDate = Date | string | { seconds: number; nanoseconds: number } | null;

export interface HairProfile {
  hairType: HairType;
  curlPattern?: string;
  porosity: Porosity;
  density: Density;
  scalp: ScalpCondition;
  naturalColor?: string;
  currentColor?: string;
}

export interface ProductUsed {
  name: string;
  brand?: string;
  category?: string;
  notes?: string;
}

export interface ServicePerformed {
  name: string;
  formulaUsed?: string;
  productsUsed?: ProductUsed[];
}

export interface RegimenStep {
  title: string;
  instructions: string;
  frequency?: string;
  productType?: string;
}

export interface RecommendedProduct {
  name?: string;
  brand?: string;
  type: string;
  reason: string;
  caution?: string;
}

export interface SharedRegimen {
  summary: string;
  steps: RegimenStep[];
  recommendedProducts: RecommendedProduct[];
  cautions: string[];
  nextVisitTip?: string;
  updatedAt?: FirestoreDate;
}

export interface ClientProfile {
  id?: string;
  stylistId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  hairProfile: HairProfile;
  goals: string[];
  chemicalHistory: string[];
  allergies: string[];
  privateNotes?: string;
  sharedRegimen?: SharedRegimen;
  clientUserId?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  lastVisitAt?: FirestoreDate;
  lastFormulaUsed?: string;
}

export interface ClientVisit {
  id?: string;
  clientId: string;
  stylistId: string;
  date: FirestoreDate;
  services: ServicePerformed[];
  resultNotes: string;
  conditionNotes?: string;
  privateNotes?: string;
  clientVisibleSummary?: string;
  photoUrls?: string[];
  aiRecommendationId?: string;
  isSharedWithClient?: boolean;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface ClientAiRecommendation {
  id?: string;
  clientId: string;
  stylistId: string;
  stylistGoal: string;
  summary: string;
  recommendedProducts: RecommendedProduct[];
  formulaSuggestion?: string;
  regimenSteps: RegimenStep[];
  cautions: string[];
  nextVisitTip?: string;
  rawResponse?: string;
  createdAt?: FirestoreDate;
}

export type CreateClientInput = Omit<ClientProfile, 'id' | 'stylistId' | 'createdAt' | 'updatedAt' | 'lastVisitAt' | 'lastFormulaUsed'>;
export type UpdateClientInput = Partial<CreateClientInput>;
export type CreateVisitInput = Omit<ClientVisit, 'id' | 'stylistId' | 'clientId' | 'createdAt' | 'updatedAt'>;

export type ProductCategory =
  | 'Shampoo'
  | 'Conditioner'
  | 'Deep Conditioner'
  | 'Leave-In'
  | 'Cream'
  | 'Gel'
  | 'Oil'
  | 'Scalp Care'
  | 'Treatment'
  | 'Styler';

export type HairGoal =
  | 'Moisture'
  | 'Length retention'
  | 'Growth'
  | 'Thickness'
  | 'Scalp health'
  | 'Definition'
  | 'Repair'
  | 'Heat protection'
  | 'Color care';

export type Porosity = 'Low' | 'Medium' | 'High' | 'Unsure';

export type Density = 'Fine' | 'Medium' | 'Thick' | 'Unsure';

export type ScalpType = 'Balanced' | 'Dry' | 'Oily' | 'Sensitive' | 'Flaky';

export type HairProduct = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price?: string;
  imageEmoji?: string;
  barcodes?: string[];
  description: string;
  ingredients: string[];

  bestFor: string[];
  tags: string[];

  recommendedForHairTypes: string[];
  recommendedForPorosity: Porosity[];
  recommendedForDensity?: Density[];
  recommendedForScalp?: ScalpType[];
  recommendedForGoals: HairGoal[];

  avoidIf?: string[];
  cautions?: string[];

  routineStepMatch?: string[];
  buyUrl?: string;
};

export type HairProfileForMatching = {
  hairType: string;
  porosity: Porosity | string;
  density: Density | string;
  scalp: ScalpType | string;
  goals: string[];
  allergies?: string;
  routineFocus?: string;
  routineSteps?: {
    id: string;
    title: string;
    frequency: string;
    productType: string;
    note: string;
  }[];
};

export type CompatibilityResult = {
  productId: string;
  score: number;
  label: 'Strong Match' | 'Good Match' | 'Possible Match' | 'Low Match';
  summary: string;
  reasons: string[];
  cautions: string[];
  routineFit: string;
  ingredientHighlights: string[];
};
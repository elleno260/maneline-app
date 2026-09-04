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
export type ScalpType =
  | 'Balanced'
  | 'Dry'
  | 'Oily'
  | 'Sensitive'
  | 'Flaky'
  | 'Dandruff-prone'
  | 'Seborrheic dermatitis'
  | 'Psoriasis'
  | 'Eczema'
  | 'Scalp acne'
  | 'Thinning edges'
  | 'CCCA'
  | 'Other';

export type ChemicalHistory =
  | 'Virgin'
  | 'Colored'
  | 'Relaxed'
  | 'Transitioning'
  | 'Heat damaged';

export type HairStyle =
  | 'Braids'
  | 'Locs'
  | 'Sew-in / Wig'
  | 'Twist-out'
  | 'None';

export type HeadCovering =
  | 'Hijab'
  | 'Durag'
  | 'Bonnet-only'
  | 'None';

export type Porosity = 'Low' | 'Medium' | 'High' | 'Unsure';

export type Density = 'Fine' | 'Medium' | 'Coarse' | 'Unsure';

//export type ScalpType = 'Balanced' | 'Dry' | 'Oily' | 'Sensitive' | 'Flaky';

export type IngredientProvenance =
  | 'verified_off'
  | 'retailer_extracted'
  | 'user_photo_ocr';

export type ProductIdentitySource =
  | 'firestore'
  | 'open_facts'
  | 'upcitemdb';

export type ProductSourceInfo = {
  provenance: IngredientProvenance;
  identitySource: ProductIdentitySource;
  ingredientSourceUrl?: string;
  retailerDomain?: string;
  confidence?: 'high' | 'medium' | 'low';
  resolvedAt: string;
};

export type ProductIdentity = {
  barcode: string;
  name: string;
  brand: string;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  source: ProductIdentitySource;
};

export type ProductLookupResult =
  | {
      status: 'resolved';
      product: HairProduct;
    }
  | {
      status: 'needs_ocr';
      barcode: string;
      identity?: ProductIdentity;
      reason:
        | 'identity-not-found'
        | 'ingredients-not-found'
        | 'identity-service-unavailable';
    };

export type HairProduct = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price?: string;
  imageEmoji?: string;
  imageUrl?: string;
  barcodes?: string[];
  description: string;
  ingredients: string[];
  ingredientsText?: string;

  ingredientSource?:
    | 'verified_off'
    | 'retailer_extracted'
    | 'user_photo_ocr'
    | 'manual_entry';

  ingredientVerification?:
    | 'verified_source'
    | 'user_reviewed'
    | 'unverified';
  sourceInfo?: ProductSourceInfo;


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

  chemicalHistory?: ChemicalHistory;
  style?: HairStyle;
  headCovering?: HeadCovering;

  styleInstallDate?: string;
  styleRemovalDate?: string;

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

  label:
    | 'Strong Match'
    | 'Good Match'
    | 'Possible Match'
    | 'Low Match';

  confidence:
    | 'High'
    | 'Medium'
    | 'Low';

  confidenceReason: string;

  summary: string;

  reasons: string[];

  cautions: string[];

  routineFit: string;

  ingredientHighlights: string[];

  scoreBreakdown: {
    ingredientFit: number;
    goalFit: number;
    profileFit: number;
    routineFit: number;
    cautionPenalty: number;
  };
};
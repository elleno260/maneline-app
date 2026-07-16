export type ExternalProductLookupResult = { 
    found: boolean; 
    source: 'inci-beauty' | 'open-beauty-facts' | 'firestore' | 'unknown';
    barcode:string; 
    name?: string; 
    brand?: string;
    category?: string;
    description?: string;
    ingredients: string[];
    imageUrl?: string;
    raw?: unknown;
};
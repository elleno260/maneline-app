export type BarcodeLookupResult = {
  barcode: string;
  found: boolean;
  productName?: string;
  brand?: string;
  ingredientsText?: string;
  ingredientsList?: string[];
  imageUrl?: string;
  rawProduct?: any;
};

function splitIngredients(ingredientsText: string): string[] {
  return ingredientsText
    .split(/,|;|\n/)
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
}

export async function fetchProductByBarcode(
  barcode: string
): Promise<BarcodeLookupResult> {
  if (!barcode || barcode.trim().length === 0) {
    throw new Error("No barcode was provided.");
  }

  const cleanBarcode = barcode.trim();

  const url = `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch product information.");
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    return {
      barcode: cleanBarcode,
      found: false,
      ingredientsList: [],
    };
  }

  const product = data.product;

  const ingredientsText =
    product.ingredients_text_en ||
    product.ingredients_text ||
    product.ingredients_text_with_allergens ||
    "";

  return {
    barcode: cleanBarcode,
    found: true,
    productName: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "",
    ingredientsText,
    ingredientsList: ingredientsText ? splitIngredients(ingredientsText) : [],
    imageUrl: product.image_front_url || product.image_url || "",
    rawProduct: product,
  };
}
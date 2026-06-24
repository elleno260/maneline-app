export type BarcodeLookupResult = {
  barcode: string;
  found: boolean;
  source?: "openbeautyfacts" | "openfoodfacts";
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

async function fetchFromOpenProductDatabase(
  barcode: string,
  source: "openbeautyfacts" | "openfoodfacts"
): Promise<BarcodeLookupResult> {
  const baseUrl =
    source === "openbeautyfacts"
      ? "https://world.openbeautyfacts.org"
      : "https://world.openfoodfacts.org";

  const url = `${baseUrl}/api/v0/product/${barcode}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to fetch product from ${source}.`);
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    return {
      barcode,
      found: false,
      source,
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
    barcode,
    found: true,
    source,
    productName:
      product.product_name ||
      product.product_name_en ||
      product.generic_name ||
      "Unknown Product",
    brand: product.brands || "",
    ingredientsText,
    ingredientsList: ingredientsText ? splitIngredients(ingredientsText) : [],
    imageUrl: product.image_front_url || product.image_url || "",
    rawProduct: product,
  };
}

export async function fetchProductByBarcode(
  barcode: string
): Promise<BarcodeLookupResult> {
  if (!barcode || barcode.trim().length === 0) {
    throw new Error("No barcode was provided.");
  }

  const cleanBarcode = barcode.trim();

  const beautyResult = await fetchFromOpenProductDatabase(
    cleanBarcode,
    "openbeautyfacts"
  );

  if (beautyResult.found && beautyResult.ingredientsText) {
    return beautyResult;
  }

  const foodResult = await fetchFromOpenProductDatabase(
    cleanBarcode,
    "openfoodfacts"
  );

  if (foodResult.found && foodResult.ingredientsText) {
    return foodResult;
  }

  return {
    barcode: cleanBarcode,
    found: false,
    ingredientsList: [],
  };
}
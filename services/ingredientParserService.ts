export function parseIngredientString(ingredientText?: string | null): string[] {
  if (!ingredientText) return [];

  return ingredientText
    .replace(/\n/g, ',')
    .split(',')
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .map((ingredient) =>
      ingredient
        .replace(/\.$/, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
}

export function normalizeIngredientName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '');
}
import { calculateCompatibility } from '../services/compatibilityService';
import { getProductsWithFallback } from '../services/productFirebaseService';
import {
  CompatibilityResult,
  HairProduct,
  HairProfileForMatching,
} from '../types/product.types';

export type ProductRecommendation = {
  product: HairProduct;
  compatibility: CompatibilityResult;
};

export async function getProductRecommendations(
  profile: HairProfileForMatching,
  options?: {
    category?: string;
    query?: string;
    limit?: number;
  }
): Promise<ProductRecommendation[]> {
  const products = await getProductsWithFallback();

  const normalizedQuery = options?.query?.trim().toLowerCase() ?? '';
  const selectedCategory = options?.category ?? 'All';

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' || product.category === selectedCategory;

    const matchesQuery =
      normalizedQuery.length === 0 ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
      product.bestFor.some((item) =>
        item.toLowerCase().includes(normalizedQuery)
      ) ||
      product.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(normalizedQuery)
      );

    return matchesCategory && matchesQuery;
  });

  const recommendations = filteredProducts
    .map((product) => ({
      product,
      compatibility: calculateCompatibility(product, profile),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);

  if (options?.limit) {
    return recommendations.slice(0, options.limit);
  }

  return recommendations;
}

export async function getTopProductMatch(profile: HairProfileForMatching) {
  const recommendations = await getProductRecommendations(profile, {
    limit: 1,
  });

  return recommendations[0] ?? null;
}
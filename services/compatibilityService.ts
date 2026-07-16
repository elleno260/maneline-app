import {
  CompatibilityResult,
  HairProduct,
  HairProfileForMatching,
} from '../types/product.types';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesNormalized(list: string[] | undefined, value: string) {
  if (!list || !value) return false;
  return list.map(normalize).includes(normalize(value));
}

function hasOverlap(listA: string[] | undefined, listB: string[] | undefined) {
  if (!listA || !listB) return false;

  const normalizedA = listA.map(normalize);
  return listB.some((item) => normalizedA.includes(normalize(item)));
}

function containsAnyText(source: string | undefined, terms: string[]) {
  if (!source) return false;
  const normalizedSource = normalize(source);

  return terms.some((term) => normalizedSource.includes(normalize(term)));
}

function getScoreLabel(score: number): CompatibilityResult['label'] {
  if (score >= 85) return 'Strong Match';
  if (score >= 70) return 'Good Match';
  if (score >= 50) return 'Possible Match';
  return 'Low Match';
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCompatibility(
  product: HairProduct,
  profile: HairProfileForMatching
): CompatibilityResult {
  let score = 45;

  const reasons: string[] = [];
  const cautions: string[] = [];
  const ingredientHighlights: string[] = [];

  const profileGoals = profile.goals ?? [];
  const allergies = profile.allergies ?? '';
  const routineFocus = profile.routineFocus ?? '';

  if (includesNormalized(product.recommendedForHairTypes, profile.hairType)) {
    score += 15;
    reasons.push(`Matches your ${profile.hairType} hair type.`);
  }

  if (includesNormalized(product.recommendedForPorosity, profile.porosity)) {
    score += 15;
    reasons.push(`Works well for ${profile.porosity.toLowerCase()} porosity hair.`);
  }

  if (product.recommendedForDensity?.length) {
    if (includesNormalized(product.recommendedForDensity, profile.density)) {
      score += 8;
      reasons.push(`Fits your ${profile.density.toLowerCase()} density profile.`);
    }
  }

  if (product.recommendedForScalp?.length) {
    if (includesNormalized(product.recommendedForScalp, profile.scalp)) {
      score += 8;
      reasons.push(`Supports your ${profile.scalp.toLowerCase()} scalp needs.`);
    }
  }

  if (hasOverlap(product.recommendedForGoals, profileGoals)) {
    const matchingGoals = product.recommendedForGoals.filter((goal) =>
      profileGoals.map(normalize).includes(normalize(goal))
    );

    score += Math.min(20, matchingGoals.length * 7);

    reasons.push(
      `Supports your goals: ${matchingGoals.slice(0, 3).join(', ')}.`
    );
  }

  const routineText = [
    routineFocus,
    ...(profile.routineSteps ?? []).map((step) =>
      [step.title, step.productType, step.note].join(' ')
    ),
  ].join(' ');

  if (product.routineStepMatch?.some((term) => containsAnyText(routineText, [term]))) {
    score += 10;
    reasons.push('Fits into your current routine steps.');
  }

  const cautionMatches = product.avoidIf?.filter((avoidTerm) =>
    containsAnyText(allergies, [avoidTerm])
  );

  if (cautionMatches?.length) {
    score -= 35;
    cautions.push(
      `Potential conflict with your allergies or sensitivities: ${cautionMatches.join(
        ', '
      )}.`
    );
  }

  if (product.cautions?.length) {
    cautions.push(...product.cautions);
  }

  const highlightIngredients = product.ingredients.slice(0, 4);

  if (highlightIngredients.length) {
    ingredientHighlights.push(
      `Key ingredients: ${highlightIngredients.join(', ')}.`
    );
  }

  if (product.ingredients.some((ingredient) => normalize(ingredient).includes('aloe'))) {
    ingredientHighlights.push('Aloe-based ingredients may support hydration and slip.');
  }

  if (
    product.ingredients.some((ingredient) =>
      ['cetyl alcohol', 'stearyl alcohol', 'cetearyl alcohol'].includes(
        normalize(ingredient)
      )
    )
  ) {
    ingredientHighlights.push(
      'Fatty alcohols may support softness and conditioning.'
    );
  }

  if (
    product.ingredients.some((ingredient) =>
      normalize(ingredient).includes('protein')
    )
  ) {
    ingredientHighlights.push(
      'Contains protein-supporting ingredients, which may help repair but can be too much for some routines.'
    );
  }

  const finalScore = clampScore(score);
  const label = getScoreLabel(finalScore);

  const routineFit =
    product.routineStepMatch?.length && reasons.includes('Fits into your current routine steps.')
      ? `Best fit: ${product.routineStepMatch.slice(0, 2).join(' or ')} step.`
      : 'This may fit your routine, but the best step depends on how you use it.';

  const summary =
    finalScore >= 85
      ? 'This product looks like a strong match for your hair profile and routine.'
      : finalScore >= 70
      ? 'This product looks like a good match, with a few things to pay attention to.'
      : finalScore >= 50
      ? 'This product could work, but it may not be the strongest fit for your current routine.'
      : 'This product may not be the best match based on your profile, goals, or sensitivities.';

  return {
    productId: product.id,
    score: finalScore,
    label,
    summary,
    reasons:
      reasons.length > 0
        ? reasons
        : ['This product has some general compatibility, but it needs more profile data to score accurately.'],
    cautions,
    routineFit,
    ingredientHighlights,
  };
}
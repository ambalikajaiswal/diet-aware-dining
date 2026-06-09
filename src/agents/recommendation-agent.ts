import {
  Restaurant,
  Evidence,
  ConfidenceScore,
  ParsedIntent,
  Recommendation,
} from "@/types";

/**
 * Recommendation Agent
 * Final agent in the pipeline. Compiles verified restaurants with their
 * confidence scores into ranked recommendations with match reasons and warnings.
 */
export class RecommendationAgent {
  async process(
    restaurants: Restaurant[],
    evidence: Evidence[],
    scores: ConfidenceScore[],
    intent: ParsedIntent
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = restaurants.map((restaurant) => {
      const restaurantEvidence = evidence.filter(
        (e) => e.restaurantId === restaurant.id
      );
      const confidence = scores.find(
        (s) => s.restaurantId === restaurant.id
      ) || {
        restaurantId: restaurant.id,
        overall: 0,
        evidenceScore: 0,
        reviewConsistency: 0,
        menuVerification: 0,
        recency: 0,
      };

      return {
        restaurant,
        confidence,
        evidence: restaurantEvidence,
        matchReasons: this.generateMatchReasons(restaurant, intent),
        warnings: this.generateWarnings(restaurant, restaurantEvidence, confidence),
      };
    });

    // Sort by overall confidence score descending
    return recommendations.sort(
      (a, b) => b.confidence.overall - a.confidence.overall
    );
  }

  private generateMatchReasons(
    restaurant: Restaurant,
    intent: ParsedIntent
  ): string[] {
    const reasons: string[] = [];

    // Check dietary match
    const matchedDietary = intent.dietaryNeeds.filter((need) =>
      restaurant.dietaryOptions.includes(need.toLowerCase())
    );
    if (matchedDietary.length > 0) {
      reasons.push(`Offers ${matchedDietary.join(", ")} options`);
    }

    // Check cuisine match
    if (
      intent.cuisineType &&
      restaurant.cuisine.includes(intent.cuisineType.toLowerCase())
    ) {
      reasons.push(`Matches your ${intent.cuisineType} cuisine preference`);
    }

    // Check price range
    if (intent.priceRange && intent.priceRange !== "any") {
      const priceMatch = this.matchesPriceRange(
        restaurant.priceLevel,
        intent.priceRange
      );
      if (priceMatch) {
        reasons.push(`Within your ${intent.priceRange} price range`);
      }
    }

    // Rating-based reason
    if (restaurant.rating >= 4.5) {
      reasons.push(`Highly rated (${restaurant.rating}/5)`);
    }

    // Review count
    if (restaurant.reviewCount > 200) {
      reasons.push(`Well-reviewed (${restaurant.reviewCount}+ reviews)`);
    }

    return reasons;
  }

  private generateWarnings(
    restaurant: Restaurant,
    evidence: Evidence[],
    confidence: ConfidenceScore
  ): string[] {
    const warnings: string[] = [];

    if (confidence.menuVerification < 0.5) {
      warnings.push("Menu not independently verified");
    }

    if (confidence.overall < 0.6) {
      warnings.push("Limited evidence available - verify before visiting");
    }

    const unverifiedClaims = evidence.filter((e) => !e.verified);
    if (unverifiedClaims.length > evidence.length * 0.5) {
      warnings.push("Some dietary claims could not be verified");
    }

    if (restaurant.reviewCount < 50) {
      warnings.push("Limited reviews available");
    }

    return warnings;
  }

  private matchesPriceRange(
    priceLevel: number,
    range: "budget" | "moderate" | "premium" | "any"
  ): boolean {
    switch (range) {
      case "budget":
        return priceLevel <= 1;
      case "moderate":
        return priceLevel === 2;
      case "premium":
        return priceLevel >= 3;
      default:
        return true;
    }
  }
}

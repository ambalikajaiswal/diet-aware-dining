import { Restaurant, Evidence } from "@/types";

/**
 * Evidence Verification Agent
 * Verifies dietary claims about restaurants by cross-referencing
 * multiple review sources and menu APIs. Checks whether restaurants
 * actually offer the dietary options they claim.
 */
export class EvidenceVerificationAgent {
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  async process(restaurants: Restaurant[]): Promise<Evidence[]> {
    const allEvidence: Evidence[] = [];

    for (const restaurant of restaurants) {
      const evidence = await this.verifyRestaurant(restaurant);
      allEvidence.push(...evidence);
    }

    return allEvidence;
  }

  hasEnoughEvidence(evidence: Evidence[], restaurantId: string): boolean {
    const restaurantEvidence = evidence.filter(
      (e) => e.restaurantId === restaurantId
    );
    if (restaurantEvidence.length === 0) return false;

    const avgConfidence =
      restaurantEvidence.reduce((sum, e) => sum + e.confidence, 0) /
      restaurantEvidence.length;

    return avgConfidence >= this.CONFIDENCE_THRESHOLD;
  }

  private async verifyRestaurant(restaurant: Restaurant): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // Verify each dietary option claimed by the restaurant
    for (const option of restaurant.dietaryOptions) {
      const verificationResult = await this.verifyDietaryClaim(
        restaurant,
        option
      );
      evidence.push(verificationResult);
    }

    // Verify via menu API
    const menuEvidence = await this.verifyViaMenuAPI(restaurant);
    if (menuEvidence) {
      evidence.push(menuEvidence);
    }

    return evidence;
  }

  private async verifyDietaryClaim(
    restaurant: Restaurant,
    dietaryOption: string
  ): Promise<Evidence> {
    // Simulate verification by checking review consistency
    // In production: cross-reference Yelp reviews, Google reviews, Reddit posts
    const reviewMentions = this.simulateReviewSearch(
      restaurant,
      dietaryOption
    );
    const confidence = this.calculateClaimConfidence(reviewMentions);

    return {
      restaurantId: restaurant.id,
      source: restaurant.source,
      claim: `Offers ${dietaryOption} options`,
      verified: confidence >= this.CONFIDENCE_THRESHOLD,
      confidence,
      menuConfirmed: false,
    };
  }

  private async verifyViaMenuAPI(
    restaurant: Restaurant
  ): Promise<Evidence | null> {
    // Simulate menu API check
    // In production: call restaurant menu APIs or scrape menu pages
    const hasMenu = Math.random() > 0.3; // 70% chance menu is available

    if (!hasMenu) return null;

    return {
      restaurantId: restaurant.id,
      source: restaurant.source,
      claim: "Menu verified via API",
      verified: true,
      confidence: 0.9,
      menuConfirmed: true,
    };
  }

  private simulateReviewSearch(
    restaurant: Restaurant,
    _dietaryOption: string
  ): number {
    // Simulate finding N reviews mentioning the dietary option
    // Higher-rated restaurants with more reviews tend to have more mentions
    const base = Math.floor(restaurant.reviewCount * 0.1);
    return base + Math.floor(Math.random() * 10);
  }

  private calculateClaimConfidence(reviewMentions: number): number {
    // More mentions = higher confidence, with diminishing returns
    if (reviewMentions <= 0) return 0.1;
    if (reviewMentions <= 2) return 0.4;
    if (reviewMentions <= 5) return 0.6;
    if (reviewMentions <= 10) return 0.75;
    if (reviewMentions <= 20) return 0.85;
    return 0.95;
  }
}

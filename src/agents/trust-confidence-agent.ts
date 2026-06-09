import { Restaurant, Evidence, ConfidenceScore } from "@/types";

/**
 * Trust & Confidence Agent
 * Builds confidence scores for each restaurant based on evidence quality,
 * review consistency, menu verification, and data recency.
 * Low-confidence restaurants are flagged or removed from results.
 */
export class TrustConfidenceAgent {
  private readonly MIN_CONFIDENCE = 0.5;

  async process(
    restaurants: Restaurant[],
    evidence: Evidence[]
  ): Promise<ConfidenceScore[]> {
    return restaurants.map((restaurant) => {
      const restaurantEvidence = evidence.filter(
        (e) => e.restaurantId === restaurant.id
      );
      return this.calculateScore(restaurant, restaurantEvidence);
    });
  }

  filterByConfidence(
    restaurants: Restaurant[],
    scores: ConfidenceScore[]
  ): Restaurant[] {
    const highConfidenceIds = new Set(
      scores
        .filter((s) => s.overall >= this.MIN_CONFIDENCE)
        .map((s) => s.restaurantId)
    );

    return restaurants.filter((r) => highConfidenceIds.has(r.id));
  }

  private calculateScore(
    restaurant: Restaurant,
    evidence: Evidence[]
  ): ConfidenceScore {
    const evidenceScore = this.calculateEvidenceScore(evidence);
    const reviewConsistency = this.calculateReviewConsistency(restaurant);
    const menuVerification = this.calculateMenuVerification(evidence);
    const recency = this.calculateRecencyScore(restaurant);

    // Weighted average
    const overall =
      evidenceScore * 0.35 +
      reviewConsistency * 0.25 +
      menuVerification * 0.25 +
      recency * 0.15;

    return {
      restaurantId: restaurant.id,
      overall: Math.round(overall * 100) / 100,
      evidenceScore: Math.round(evidenceScore * 100) / 100,
      reviewConsistency: Math.round(reviewConsistency * 100) / 100,
      menuVerification: Math.round(menuVerification * 100) / 100,
      recency: Math.round(recency * 100) / 100,
    };
  }

  private calculateEvidenceScore(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;

    const verifiedCount = evidence.filter((e) => e.verified).length;
    const avgConfidence =
      evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;

    return (verifiedCount / evidence.length) * 0.5 + avgConfidence * 0.5;
  }

  private calculateReviewConsistency(restaurant: Restaurant): number {
    // Higher review count and rating suggests consistency
    const reviewFactor = Math.min(restaurant.reviewCount / 500, 1);
    const ratingFactor = restaurant.rating / 5;

    return reviewFactor * 0.4 + ratingFactor * 0.6;
  }

  private calculateMenuVerification(evidence: Evidence[]): number {
    const menuEvidence = evidence.filter((e) => e.menuConfirmed);
    if (menuEvidence.length === 0) return 0.3; // Partial credit for no menu
    return menuEvidence.length > 0 ? 0.9 : 0.3;
  }

  private calculateRecencyScore(_restaurant: Restaurant): number {
    // In production: check when reviews were last posted
    // Simulated: most restaurants have recent activity
    return 0.7 + Math.random() * 0.3;
  }
}

import { DietaryRequest, PipelineState, Recommendation } from "@/types";
import { DietaryIntentAgent } from "./dietary-intent-agent";
import { ClarificationAgent } from "./clarification-agent";
import { RestaurantDiscoveryAgent } from "./restaurant-discovery-agent";
import { EvidenceVerificationAgent } from "./evidence-verification-agent";
import { TrustConfidenceAgent } from "./trust-confidence-agent";
import { MapGenerationAgent, MapData } from "./map-generation-agent";
import { ExportAgent, ExportResult, ExportFormat } from "./export-agent";
import { RecommendationAgent } from "./recommendation-agent";

/**
 * Agent Pipeline Orchestrator
 * Coordinates the full workflow from user request to recommendations,
 * following the exact flow defined in the Trojans board:
 *
 * Start → Mobile UI → Dietary Intent Agent → [Clarification?] →
 * Restaurant Discovery → Evidence Verification → Trust & Confidence →
 * [Too few results? → Relax constraints] → Recommendation → End
 */
export class AgentPipeline {
  private dietaryIntentAgent = new DietaryIntentAgent();
  private clarificationAgent = new ClarificationAgent();
  private discoveryAgent = new RestaurantDiscoveryAgent();
  private evidenceAgent = new EvidenceVerificationAgent();
  private trustAgent = new TrustConfidenceAgent();
  private mapAgent = new MapGenerationAgent();
  private exportAgent = new ExportAgent();
  private recommendationAgent = new RecommendationAgent();

  private state: PipelineState = {
    status: "idle",
    currentAgent: null,
    request: null,
    parsedIntent: null,
    clarificationNeeded: null,
    restaurants: [],
    evidence: [],
    confidenceScores: [],
    recommendations: [],
    mapData: null,
    exportResult: null,
    error: null,
  };

  private onStateChange?: (state: PipelineState) => void;

  constructor(onStateChange?: (state: PipelineState) => void) {
    this.onStateChange = onStateChange;
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  /**
   * Start the pipeline with a user request
   */
  async run(request: DietaryRequest): Promise<Recommendation[]> {
    try {
      this.updateState({ status: "processing", request, error: null });

      // Step 1: Parse dietary intent
      this.updateState({ currentAgent: "dietary_intent" });
      const parsedIntent = await this.dietaryIntentAgent.process(request);
      this.updateState({ parsedIntent });

      // Step 2: Check if clarification is needed
      if (parsedIntent.isLocationAmbiguous) {
        this.updateState({ currentAgent: "clarification" });
        const questions =
          await this.clarificationAgent.process(parsedIntent);

        if (questions.length > 0) {
          this.updateState({
            status: "awaiting_clarification",
            clarificationNeeded: questions,
          });
          return []; // Wait for user response
        }
      }

      // Step 3-6: Continue with discovery and verification
      return await this.continueAfterClarification();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Pipeline error";
      this.updateState({ status: "error", error: message });
      return [];
    }
  }

  /**
   * Resume pipeline after user provides clarification
   */
  async resumeWithClarification(
    answers: Record<string, string>
  ): Promise<Recommendation[]> {
    if (!this.state.parsedIntent) {
      throw new Error("No pending intent to clarify");
    }

    let intent = this.state.parsedIntent;

    // Apply clarification answers
    if (answers.location) {
      intent = this.clarificationAgent.resolveLocation(
        intent,
        answers.location
      );
    }

    if (answers.dietaryNeeds) {
      intent = {
        ...intent,
        dietaryNeeds: [...intent.dietaryNeeds, answers.dietaryNeeds],
      };
    }

    if (answers.mealType) {
      intent = { ...intent, mealType: answers.mealType };
    }

    this.updateState({
      parsedIntent: intent,
      clarificationNeeded: null,
      status: "processing",
    });

    return await this.continueAfterClarification();
  }

  private async continueAfterClarification(): Promise<Recommendation[]> {
    const intent = this.state.parsedIntent!;

    // Step 3: Restaurant Discovery
    this.updateState({ currentAgent: "restaurant_discovery" });
    const restaurants = await this.discoveryAgent.process(intent);
    this.updateState({ restaurants });

    // Step 4: Evidence Verification
    this.updateState({ currentAgent: "evidence_verification" });
    const evidence = await this.evidenceAgent.process(restaurants);
    this.updateState({ evidence });

    // Step 5: Trust & Confidence Scoring
    this.updateState({ currentAgent: "trust_confidence" });
    const scores = await this.trustAgent.process(restaurants, evidence);
    this.updateState({ confidenceScores: scores });

    // Filter by confidence
    const trustedRestaurants = this.trustAgent.filterByConfidence(
      restaurants,
      scores
    );

    // Step 5b: Check if we have enough results
    if (this.discoveryAgent.needsMoreResults(trustedRestaurants)) {
      // Relax constraints and retry (already handled in discovery agent)
      // This is the "Too few results?" decision point from the diagram
    }

    // Step 6: Map Generation
    this.updateState({ currentAgent: "map_generation" });
    const confidenceMap = new Map(scores.map((s) => [s.restaurantId, s.overall]));
    const mapData = await this.mapAgent.process(trustedRestaurants, intent, confidenceMap);
    this.updateState({ mapData });

    // Step 7: Export
    this.updateState({ currentAgent: "export" });

    // Step 8: Generate Recommendations
    this.updateState({ currentAgent: "recommendation" });
    const recommendations = await this.recommendationAgent.process(
      trustedRestaurants,
      evidence,
      scores,
      intent
    );

    // Run export after recommendations are ready
    const exportResult = await this.exportAgent.process(recommendations, "json");
    this.updateState({
      recommendations,
      exportResult,
      status: "complete",
      currentAgent: null,
    });

    return recommendations;
  }

  /**
   * Export recommendations in a specific format
   */
  async export(format: ExportFormat): Promise<ExportResult> {
    return this.exportAgent.process(this.state.recommendations, format);
  }

  /**
   * Get map data from the pipeline state
   */
  getMapData(): MapData | null {
    return this.state.mapData;
  }

  private updateState(partial: Partial<PipelineState>): void {
    this.state = { ...this.state, ...partial };
    this.onStateChange?.(this.getState());
  }
}

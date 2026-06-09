// Core domain types based on the Trojans board workflow

export interface DietaryRequest {
  query: string;
  location?: string;
  dietaryPreferences: string[];
  allergies: string[];
  cuisinePreferences: string[];
}

export interface ParsedIntent {
  dietaryNeeds: string[];
  restrictions: string[];
  location: string;
  isLocationAmbiguous: boolean;
  cuisineType?: string;
  mealType?: string;
  priceRange?: "budget" | "moderate" | "premium" | "any";
}

export interface ClarificationQuestion {
  field: string;
  question: string;
  options?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string[];
  rating: number;
  priceLevel: number;
  dietaryOptions: string[];
  location: {
    lat: number;
    lng: number;
  };
  source: DataSource;
  reviewCount: number;
  distance?: number;
}

export type DataSource = "yelp" | "google_reviews" | "reddit";

export interface Evidence {
  restaurantId: string;
  source: DataSource;
  claim: string;
  verified: boolean;
  confidence: number;
  menuConfirmed: boolean;
}

export interface ConfidenceScore {
  restaurantId: string;
  overall: number;
  evidenceScore: number;
  reviewConsistency: number;
  menuVerification: number;
  recency: number;
}

export interface Recommendation {
  restaurant: Restaurant;
  confidence: ConfidenceScore;
  evidence: Evidence[];
  matchReasons: string[];
  warnings: string[];
}

export interface MapMarkerData {
  restaurantId: string;
  name: string;
  lat: number;
  lng: number;
  confidence: number;
  dietaryOptions: string[];
  googleMapsUrl: string;
}

export interface MapData {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarkerData[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface ExportResultData {
  format: "json" | "text" | "csv";
  content: string;
  filename: string;
}

export interface PipelineState {
  status: AgentStatus;
  currentAgent: AgentName | null;
  request: DietaryRequest | null;
  parsedIntent: ParsedIntent | null;
  clarificationNeeded: ClarificationQuestion[] | null;
  restaurants: Restaurant[];
  evidence: Evidence[];
  confidenceScores: ConfidenceScore[];
  recommendations: Recommendation[];
  mapData: MapData | null;
  exportResult: ExportResultData | null;
  error: string | null;
}

export type AgentStatus =
  | "idle"
  | "processing"
  | "awaiting_clarification"
  | "complete"
  | "error";

export type AgentName =
  | "dietary_intent"
  | "clarification"
  | "restaurant_discovery"
  | "evidence_verification"
  | "trust_confidence"
  | "map_generation"
  | "export"
  | "recommendation";

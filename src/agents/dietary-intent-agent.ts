import { DietaryRequest, ParsedIntent } from "@/types";

/**
 * Dietary Intent Agent
 * First agent in the pipeline. Parses user's free-text dietary request
 * into structured intent, identifying dietary needs, restrictions,
 * location, cuisine preferences, and meal type.
 */
export class DietaryIntentAgent {
  private readonly DIETARY_KEYWORDS: Record<string, string[]> = {
    vegan: ["vegan", "plant-based", "no animal"],
    vegetarian: ["vegetarian", "veggie", "no meat"],
    "gluten-free": ["gluten-free", "gluten free", "celiac", "no gluten"],
    "dairy-free": ["dairy-free", "dairy free", "lactose", "no dairy"],
    keto: ["keto", "ketogenic", "low-carb", "low carb"],
    halal: ["halal"],
    kosher: ["kosher"],
    paleo: ["paleo", "paleolithic"],
    "nut-free": ["nut-free", "nut free", "no nuts", "peanut-free"],
  };

  private readonly CUISINE_KEYWORDS = [
    "italian",
    "mexican",
    "chinese",
    "japanese",
    "indian",
    "thai",
    "korean",
    "mediterranean",
    "american",
    "french",
    "vietnamese",
    "greek",
    "middle eastern",
    "ethiopian",
    "caribbean",
  ];

  private readonly MEAL_TYPES = [
    "breakfast",
    "brunch",
    "lunch",
    "dinner",
    "late-night",
    "snack",
  ];

  async process(request: DietaryRequest): Promise<ParsedIntent> {
    const query = request.query.toLowerCase();

    const dietaryNeeds = this.extractDietaryNeeds(query, request);
    const restrictions = this.extractRestrictions(request);
    const location = this.extractLocation(query, request);
    const cuisineType = this.extractCuisine(query);
    const mealType = this.extractMealType(query);
    const priceRange = this.extractPriceRange(query);

    return {
      dietaryNeeds,
      restrictions,
      location: location.value,
      isLocationAmbiguous: location.isAmbiguous,
      cuisineType,
      mealType,
      priceRange,
    };
  }

  private extractDietaryNeeds(
    query: string,
    request: DietaryRequest
  ): string[] {
    const needs = new Set<string>(request.dietaryPreferences);

    for (const [need, keywords] of Object.entries(this.DIETARY_KEYWORDS)) {
      if (keywords.some((kw) => query.includes(kw))) {
        needs.add(need);
      }
    }

    return Array.from(needs);
  }

  private extractRestrictions(request: DietaryRequest): string[] {
    return [...request.allergies];
  }

  private extractLocation(
    query: string,
    request: DietaryRequest
  ): { value: string; isAmbiguous: boolean } {
    if (request.location) {
      return {
        value: request.location,
        isAmbiguous: this.isLocationAmbiguous(request.location),
      };
    }

    // Try to extract location from query
    const locationPatterns = [
      /(?:in|near|around|close to)\s+(.+?)(?:\s+that|\s+with|\s+for|$)/i,
      /(?:restaurants?\s+in)\s+(.+?)(?:\s+that|\s+with|\s+for|$)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        const loc = match[1].trim();
        return { value: loc, isAmbiguous: this.isLocationAmbiguous(loc) };
      }
    }

    return { value: "", isAmbiguous: true };
  }

  private isLocationAmbiguous(location: string): boolean {
    // A location is ambiguous if it's too vague or could refer to multiple places
    const ambiguousTerms = [
      "downtown",
      "near me",
      "nearby",
      "around here",
      "close",
    ];
    const lowered = location.toLowerCase();

    if (ambiguousTerms.some((term) => lowered.includes(term))) return true;
    if (location.split(" ").length < 2 && !location.includes(",")) return true;

    return false;
  }

  private extractCuisine(query: string): string | undefined {
    return this.CUISINE_KEYWORDS.find((c) => query.includes(c));
  }

  private extractMealType(query: string): string | undefined {
    return this.MEAL_TYPES.find((m) => query.includes(m));
  }

  private extractPriceRange(
    query: string
  ): "budget" | "moderate" | "premium" | "any" {
    if (query.match(/cheap|budget|affordable|inexpensive/)) return "budget";
    if (query.match(/moderate|mid-range|reasonable/)) return "moderate";
    if (query.match(/upscale|fine dining|expensive|premium|fancy/))
      return "premium";
    return "any";
  }
}

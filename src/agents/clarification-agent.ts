import { ParsedIntent, ClarificationQuestion } from "@/types";

/**
 * Clarification Agent
 * Handles ambiguous inputs by generating clarification questions.
 * Activated when the Dietary Intent Agent flags location ambiguity
 * or missing critical information.
 */
export class ClarificationAgent {
  async process(intent: ParsedIntent): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];

    if (intent.isLocationAmbiguous) {
      questions.push(this.buildLocationClarification(intent.location));
    }

    if (intent.dietaryNeeds.length === 0) {
      questions.push(this.buildDietaryClarification());
    }

    if (!intent.mealType) {
      questions.push(this.buildMealTypeClarification());
    }

    return questions;
  }

  resolveLocation(
    intent: ParsedIntent,
    clarifiedLocation: string
  ): ParsedIntent {
    return {
      ...intent,
      location: clarifiedLocation,
      isLocationAmbiguous: false,
    };
  }

  private buildLocationClarification(
    currentLocation: string
  ): ClarificationQuestion {
    if (!currentLocation) {
      return {
        field: "location",
        question: "What area or neighborhood are you looking for restaurants in?",
        options: undefined,
      };
    }

    return {
      field: "location",
      question: `"${currentLocation}" could refer to multiple areas. Could you be more specific? (e.g., include city, state, or zip code)`,
      options: undefined,
    };
  }

  private buildDietaryClarification(): ClarificationQuestion {
    return {
      field: "dietaryNeeds",
      question: "Do you have any specific dietary requirements?",
      options: [
        "Vegan",
        "Vegetarian",
        "Gluten-free",
        "Dairy-free",
        "Keto",
        "Halal",
        "Kosher",
        "No specific requirements",
      ],
    };
  }

  private buildMealTypeClarification(): ClarificationQuestion {
    return {
      field: "mealType",
      question: "What meal are you looking for?",
      options: [
        "Breakfast",
        "Brunch",
        "Lunch",
        "Dinner",
        "Late-night",
        "Any",
      ],
    };
  }
}

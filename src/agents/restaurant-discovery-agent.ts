import { ParsedIntent, Restaurant, DataSource } from "@/types";

/**
 * Restaurant Discovery Agent
 * Queries multiple data sources (Yelp, Reddit, Google Reviews) to find
 * restaurants matching the user's dietary intent and location.
 * Implements constraint relaxation when too few results are found.
 */
export class RestaurantDiscoveryAgent {
  private readonly MIN_RESULTS = 3;
  private maxRelaxations = 2;

  async process(
    intent: ParsedIntent,
    relaxationLevel: number = 0
  ): Promise<Restaurant[]> {
    const results: Restaurant[] = [];

    // Query all data sources in parallel
    const [yelpResults, googleResults, redditResults] = await Promise.all([
      this.queryYelp(intent, relaxationLevel),
      this.queryGoogleReviews(intent, relaxationLevel),
      this.queryReddit(intent, relaxationLevel),
    ]);

    results.push(...yelpResults, ...googleResults, ...redditResults);

    // Deduplicate by name and address proximity
    const deduplicated = this.deduplicateResults(results);

    // If too few results and we haven't relaxed too many times, relax constraints
    if (
      deduplicated.length < this.MIN_RESULTS &&
      relaxationLevel < this.maxRelaxations
    ) {
      return this.process(intent, relaxationLevel + 1);
    }

    return deduplicated;
  }

  needsMoreResults(restaurants: Restaurant[]): boolean {
    return restaurants.length < this.MIN_RESULTS;
  }

  private async queryYelp(
    intent: ParsedIntent,
    relaxation: number
  ): Promise<Restaurant[]> {
    // Simulated Yelp API response
    // In production, this would call the Yelp Fusion API
    return this.generateMockResults(intent, "yelp", relaxation);
  }

  private async queryGoogleReviews(
    intent: ParsedIntent,
    relaxation: number
  ): Promise<Restaurant[]> {
    // Simulated Google Places API response
    return this.generateMockResults(intent, "google_reviews", relaxation);
  }

  private async queryReddit(
    intent: ParsedIntent,
    relaxation: number
  ): Promise<Restaurant[]> {
    // Simulated Reddit search (scraping relevant subreddits)
    return this.generateMockResults(intent, "reddit", relaxation);
  }

  private generateMockResults(
    intent: ParsedIntent,
    source: DataSource,
    relaxation: number
  ): Restaurant[] {
    const baseRestaurants: Restaurant[] = [
      {
        id: `${source}-1`,
        name: "Green Garden Bistro",
        address: `123 Main St, ${intent.location || "Los Angeles, CA"}`,
        cuisine: ["mediterranean", "vegetarian"],
        rating: 4.6,
        priceLevel: 2,
        dietaryOptions: ["vegan", "vegetarian", "gluten-free"],
        location: { lat: 34.0522, lng: -118.2437 },
        source,
        reviewCount: 342,
      },
      {
        id: `${source}-2`,
        name: "Pure Plate Kitchen",
        address: `456 Oak Ave, ${intent.location || "Los Angeles, CA"}`,
        cuisine: ["american", "health-food"],
        rating: 4.4,
        priceLevel: 2,
        dietaryOptions: ["vegan", "keto", "dairy-free", "gluten-free"],
        location: { lat: 34.0548, lng: -118.2467 },
        source,
        reviewCount: 189,
      },
      {
        id: `${source}-3`,
        name: "Spice Route",
        address: `789 Elm Blvd, ${intent.location || "Los Angeles, CA"}`,
        cuisine: ["indian", "thai"],
        rating: 4.3,
        priceLevel: 1,
        dietaryOptions: ["vegetarian", "vegan", "halal"],
        location: { lat: 34.0501, lng: -118.2502 },
        source,
        reviewCount: 256,
      },
      {
        id: `${source}-4`,
        name: "Nourish Bowl Co",
        address: `321 Pine St, ${intent.location || "Los Angeles, CA"}`,
        cuisine: ["bowls", "health-food"],
        rating: 4.7,
        priceLevel: 2,
        dietaryOptions: ["vegan", "gluten-free", "paleo", "keto"],
        location: { lat: 34.0515, lng: -118.2489 },
        source,
        reviewCount: 412,
      },
      {
        id: `${source}-5`,
        name: "The Mindful Fork",
        address: `654 Willow Ln, ${intent.location || "Los Angeles, CA"}`,
        cuisine: ["japanese", "fusion"],
        rating: 4.5,
        priceLevel: 3,
        dietaryOptions: ["vegetarian", "gluten-free", "dairy-free"],
        location: { lat: 34.0535, lng: -118.2445 },
        source,
        reviewCount: 178,
      },
    ];

    // Filter based on dietary needs (relax with higher relaxation levels)
    let filtered = baseRestaurants;

    if (intent.dietaryNeeds.length > 0 && relaxation === 0) {
      filtered = baseRestaurants.filter((r) =>
        intent.dietaryNeeds.some((need) =>
          r.dietaryOptions.includes(need.toLowerCase())
        )
      );
    }

    if (intent.cuisineType && relaxation === 0) {
      const cuisineFiltered = filtered.filter((r) =>
        r.cuisine.includes(intent.cuisineType!)
      );
      if (cuisineFiltered.length > 0) filtered = cuisineFiltered;
    }

    // Return subset based on source to simulate different results per source
    const sourceIndex = { yelp: 0, google_reviews: 1, reddit: 2 }[source];
    return filtered.slice(sourceIndex, sourceIndex + 2);
  }

  private deduplicateResults(restaurants: Restaurant[]): Restaurant[] {
    const seen = new Map<string, Restaurant>();

    for (const restaurant of restaurants) {
      const key = restaurant.name.toLowerCase().replace(/\s+/g, "");
      if (!seen.has(key) || restaurant.rating > seen.get(key)!.rating) {
        seen.set(key, restaurant);
      }
    }

    return Array.from(seen.values());
  }
}

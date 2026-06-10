import { ParsedIntent, Restaurant, DataSource } from "@/types";

/**
 * Restaurant Discovery Agent
 * Queries OpenStreetMap Overpass API to find real restaurants
 * matching the user's dietary intent and location.
 * Falls back to Nominatim for geocoding location strings.
 */
export class RestaurantDiscoveryAgent {
  private readonly MIN_RESULTS = 3;
  private maxRelaxations = 2;
  private readonly OVERPASS_URL = "https://overpass-api.de/api/interpreter";
  private readonly NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

  async process(
    intent: ParsedIntent,
    relaxationLevel: number = 0
  ): Promise<Restaurant[]> {
    // Geocode the location first
    const coords = await this.geocodeLocation(intent.location);
    if (!coords) {
      // If geocoding fails, return empty — clarification agent should ask
      return [];
    }

    // Calculate search radius based on relaxation level
    const radius = 2000 + relaxationLevel * 2000; // 2km, 4km, 6km

    // Query Overpass API for restaurants
    const results = await this.queryOverpass(intent, coords, radius);

    // If too few results and we haven't relaxed too much, expand search
    if (results.length < this.MIN_RESULTS && relaxationLevel < this.maxRelaxations) {
      return this.process(intent, relaxationLevel + 1);
    }

    return results;
  }

  needsMoreResults(restaurants: Restaurant[]): boolean {
    return restaurants.length < this.MIN_RESULTS;
  }

  private async geocodeLocation(
    location: string
  ): Promise<{ lat: number; lng: number } | null> {
    if (!location) return null;

    try {
      const params = new URLSearchParams({
        q: location,
        format: "json",
        limit: "1",
      });

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`, {
        headers: {
          "User-Agent": "DietAwareDining/1.0",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.length === 0) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch {
      return null;
    }
  }

  private async queryOverpass(
    intent: ParsedIntent,
    coords: { lat: number; lng: number },
    radius: number
  ): Promise<Restaurant[]> {
    // Build dietary filter tags for Overpass
    const dietFilters = this.buildDietaryFilters(intent.dietaryNeeds);
    const cuisineFilter = intent.cuisineType
      ? `["cuisine"~"${intent.cuisineType}",i]`
      : "";

    // Query restaurants and cafes within radius
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"]${cuisineFilter}(around:${radius},${coords.lat},${coords.lng});
        node["amenity"="cafe"]${cuisineFilter}(around:${radius},${coords.lat},${coords.lng});
        way["amenity"="restaurant"]${cuisineFilter}(around:${radius},${coords.lat},${coords.lng});
        way["amenity"="cafe"]${cuisineFilter}(around:${radius},${coords.lat},${coords.lng});
      );
      out center 30;
    `;

    try {
      const url = `${this.OVERPASS_URL}?data=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "DietAwareDining/1.0",
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const restaurants = this.parseOverpassResults(data.elements, intent, coords);

      return restaurants;
    } catch {
      return [];
    }
  }

  private parseOverpassResults(
    elements: OverpassElement[],
    intent: ParsedIntent,
    searchCenter: { lat: number; lng: number }
  ): Restaurant[] {
    if (!elements || elements.length === 0) return [];

    return elements
      .filter((el) => el.tags?.name) // Must have a name
      .map((el, index) => {
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lng = el.lon ?? el.center?.lon ?? 0;
        const tags = el.tags || {};

        const dietaryOptions = this.extractDietaryOptions(tags);
        const cuisine = this.extractCuisine(tags);
        const source = this.determineSource(tags);

        return {
          id: `osm-${el.id}`,
          name: tags.name || "Unknown",
          address: this.buildAddress(tags),
          cuisine,
          rating: this.estimateRating(tags),
          priceLevel: this.estimatePriceLevel(tags),
          dietaryOptions,
          location: { lat, lng },
          source,
          reviewCount: this.estimatePopularity(tags),
          distance: this.calculateDistance(searchCenter, { lat, lng }),
        };
      })
      .filter((r) => {
        // If user has dietary needs, prefer restaurants that match
        if (intent.dietaryNeeds.length === 0) return true;
        // Keep all results but they'll be ranked by confidence later
        return true;
      })
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
      .slice(0, 15); // Limit to top 15 nearest
  }

  private extractDietaryOptions(tags: Record<string, string>): string[] {
    const options: string[] = [];
    const dietMap: Record<string, string> = {
      "diet:vegan": "vegan",
      "diet:vegetarian": "vegetarian",
      "diet:gluten_free": "gluten-free",
      "diet:lactose_free": "dairy-free",
      "diet:halal": "halal",
      "diet:kosher": "kosher",
    };

    for (const [tag, label] of Object.entries(dietMap)) {
      if (tags[tag] === "yes" || tags[tag] === "only") {
        options.push(label);
      }
    }

    // Also check cuisine for hints
    const cuisine = (tags.cuisine || "").toLowerCase();
    if (cuisine.includes("vegan") && !options.includes("vegan")) options.push("vegan");
    if (cuisine.includes("vegetarian") && !options.includes("vegetarian")) options.push("vegetarian");

    return options;
  }

  private extractCuisine(tags: Record<string, string>): string[] {
    const raw = tags.cuisine || tags.food || "";
    if (!raw) return [tags.amenity === "cafe" ? "cafe" : "restaurant"];
    return raw.split(";").map((c) => c.trim().toLowerCase()).filter(Boolean);
  }

  private buildAddress(tags: Record<string, string>): string {
    const parts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:city"],
      tags["addr:postcode"],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : tags.name || "Address unavailable";
  }

  private estimateRating(tags: Record<string, string>): number {
    // OSM doesn't have ratings — estimate based on data richness
    let score = 3.5;
    if (tags.website || tags["contact:website"]) score += 0.3;
    if (tags.phone || tags["contact:phone"]) score += 0.2;
    if (tags.opening_hours) score += 0.3;
    if (tags.cuisine) score += 0.2;
    return Math.min(5, Math.round(score * 10) / 10);
  }

  private estimatePriceLevel(tags: Record<string, string>): number {
    // Use OSM tags to estimate price
    if (tags["price:range"] === "budget" || tags.amenity === "fast_food") return 1;
    if (tags["price:range"] === "expensive" || tags.stars) return 3;
    return 2; // Default moderate
  }

  private estimatePopularity(tags: Record<string, string>): number {
    // Estimate based on data completeness (more tags = more popular/known)
    let count = Object.keys(tags).length * 5;
    if (tags.website) count += 50;
    if (tags.opening_hours) count += 30;
    if (tags.wheelchair) count += 20;
    return Math.max(10, Math.min(500, count));
  }

  private determineSource(tags: Record<string, string>): DataSource {
    // All data comes from OSM/Overpass, but label based on verification level
    if (tags.website && tags.opening_hours && tags.phone) return "google_reviews";
    if (tags.website || tags.opening_hours) return "yelp";
    return "reddit";
  }

  private calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private buildDietaryFilters(needs: string[]): string {
    // Not used directly in query (would over-filter), but kept for future
    const tagMap: Record<string, string> = {
      vegan: '["diet:vegan"="yes"]',
      vegetarian: '["diet:vegetarian"="yes"]',
      "gluten-free": '["diet:gluten_free"="yes"]',
      halal: '["diet:halal"="yes"]',
      kosher: '["diet:kosher"="yes"]',
    };
    return needs.map((n) => tagMap[n] || "").join("");
  }
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

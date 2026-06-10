"use client";

import { useState } from "react";

interface SearchFormProps {
  onSubmit: (data: {
    query: string;
    location: string;
    dietaryPreferences: string[];
    allergies: string[];
    cuisinePreferences: string[];
  }) => void;
  isLoading: boolean;
}

const QUICK_FILTERS = [
  { label: "🥬 Vegan", value: "vegan" },
  { label: "☪️ Halal", value: "halal" },
  { label: "🚫 Gluten-Free", value: "gluten-free" },
  { label: "🥜 Nut-Free", value: "nut-free" },
  { label: "💪 High-Protein", value: "high-protein" },
  { label: "🍜 Asian Cuisine", value: "asian" },
  { label: "🙏 Jain-Friendly", value: "jain" },
  { label: "🕐 Open Now", value: "open-now" },
];

const EXAMPLE_PROMPTS = [
  "Vegan sushi spot with high-protein options near Downtown",
  "Late-night halal burgers, gluten-free buns available",
  "Jain-friendly Indian restaurant open on Sundays",
];

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (value: string) => {
    setSelectedFilters((prev) =>
      prev.includes(value)
        ? prev.filter((f) => f !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit({
      query,
      location,
      dietaryPreferences: selectedFilters,
      allergies: [],
      cuisinePreferences: [],
    });
  };

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Input + Location - side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={"e.g. \"Halal Thai food that's also nut-free, open after 9 PM near me\""}
            className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none h-28 bg-white shadow-sm"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors shadow-md"
            aria-label="Search"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {/* Location */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-primary-500 text-sm">📍</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city or address"
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
            />
            {location && (
              <button type="button" onClick={() => setLocation("")} className="text-xs text-primary-500 font-semibold">
                Clear
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-semibold rounded-full transition-colors text-sm"
          >
            {isLoading ? "Searching..." : "Search with AI"}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Quick Filters
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => toggleFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                selectedFilters.includes(filter.value)
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:shadow-sm"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Example Prompts */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Try These Prompts
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
            >
              {`"${prompt}"`}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

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

const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Gluten-free",
  "Dairy-free",
  "Keto",
  "Halal",
  "Kosher",
  "Paleo",
  "Nut-free",
];

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleDietary = (option: string) => {
    setSelectedDietary((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      query,
      location,
      dietaryPreferences: selectedDietary,
      allergies: [],
      cuisinePreferences: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        {/* Main search input */}
        <div>
          <label
            htmlFor="search-query"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            What are you looking for?
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Vegan thai food for dinner..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
            required
          />
        </div>

        {/* Location input */}
        <div>
          <label
            htmlFor="location-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <input
            id="location-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Los Angeles, CA"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showAdvanced ? "Hide" : "Show"} dietary preferences
        </button>

        {/* Dietary preferences */}
        {showAdvanced && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select dietary needs:</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedDietary.includes(option.toLowerCase())
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Finding restaurants...
            </span>
          ) : (
            "Find Restaurants"
          )}
        </button>
      </div>
    </form>
  );
}

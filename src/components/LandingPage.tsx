"use client";

import { useAppStore } from "@/store";

export function LandingPage() {
  const setPage = useAppStore((s) => s.setPage);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6">
          <span className="text-6xl">🥗</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Dietary Maps AI
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-8">
          Find restaurants that truly match your dietary needs. AI-powered
          verification across Yelp, Google Reviews, and Reddit with confidence
          scoring and direct Google Maps navigation.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setPage("search")}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Search Now
          </button>
          <button
            onClick={() => setPage("saved")}
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors text-lg"
          >
            Recent &amp; Saved
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔍"
              title="Describe Your Needs"
              description="Type naturally. Our AI parses dietary restrictions, allergies, cuisine preferences, and location."
            />
            <FeatureCard
              icon="✅"
              title="Evidence-Based Verification"
              description="Cross-references menus, reviews, and community data to verify dietary claims with confidence scores."
            />
            <FeatureCard
              icon="🗺️"
              title="Navigate with Confidence"
              description="View results on a map with confidence ratings and get direct Google Maps directions."
            />
          </div>
        </div>
      </section>

      {/* Example Searches */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Try searching for
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Vegan Thai near DTLA",
              "Gluten-free Italian in Santa Monica",
              "Halal Indian food for dinner",
              "Nut-free bakery near me",
              "Keto-friendly Korean BBQ",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setPage("search")}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-xl bg-gray-50">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

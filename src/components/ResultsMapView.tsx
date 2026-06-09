"use client";

import { useAppStore } from "@/store";
import { Recommendation } from "@/types";

export function ResultsMapView() {
  const recommendations = useAppStore((s) => s.recommendations);
  const mapData = useAppStore((s) => s.mapData);
  const metadata = useAppStore((s) => s.metadata);
  const setSelectedRestaurant = useAppStore((s) => s.setSelectedRestaurant);
  const setPage = useAppStore((s) => s.setPage);

  const handleViewDetails = (rec: Recommendation) => {
    setSelectedRestaurant(rec);
    setPage("details");
  };

  const handleViewEvidence = (rec: Recommendation) => {
    setSelectedRestaurant(rec);
    setPage("evidence");
  };

  if (recommendations.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">
          No restaurants found. Try broadening your search.
        </p>
        <button
          onClick={() => setPage("search")}
          className="mt-4 px-6 py-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Modify Search
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Results ({recommendations.length})
          </h2>
          {metadata && (
            <p className="text-sm text-gray-500">
              {metadata.totalFound} searched • {metadata.verified} verified •{" "}
              {Math.round(metadata.avgConfidence * 100)}% avg confidence
            </p>
          )}
        </div>
        <button
          onClick={() => setPage("search")}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Modify Search
        </button>
      </div>

      {/* Map Embed */}
      {mapData && mapData.markers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-64 bg-gray-200 relative">
            {/* Static map image using markers */}
            <iframe
              title="Restaurant locations map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={buildStaticMapUrl(mapData)}
            />
          </div>
        </div>
      )}

      {/* Restaurant List */}
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <ResultCard
            key={rec.restaurant.id}
            recommendation={rec}
            rank={index + 1}
            onViewDetails={() => handleViewDetails(rec)}
            onViewEvidence={() => handleViewEvidence(rec)}
          />
        ))}
      </div>
    </div>
  );
}

function buildStaticMapUrl(mapData: NonNullable<ReturnType<typeof useAppStore.getState>["mapData"]>): string {
  const { center } = mapData;
  // Use OpenStreetMap embed as a free alternative
  return `https://www.openstreetmap.org/export/embed.html?bbox=${mapData.bounds.west},${mapData.bounds.south},${mapData.bounds.east},${mapData.bounds.north}&layer=mapnik&marker=${center.lat},${center.lng}`;
}

function ResultCard({
  recommendation,
  rank,
  onViewDetails,
  onViewEvidence,
}: {
  recommendation: Recommendation;
  rank: number;
  onViewDetails: () => void;
  onViewEvidence: () => void;
}) {
  const { restaurant, confidence } = recommendation;

  const confidenceColor =
    confidence.overall >= 0.8
      ? "text-green-600 bg-green-50"
      : confidence.overall >= 0.6
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
            <p className="text-sm text-gray-500">{restaurant.address}</p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${confidenceColor}`}
        >
          {Math.round(confidence.overall * 100)}% match
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
        <span>⭐ {restaurant.rating}</span>
        <span>{"$".repeat(restaurant.priceLevel)}</span>
        <span className="capitalize">{restaurant.cuisine.join(", ")}</span>
        {restaurant.distance && <span>{restaurant.distance} mi</span>}
      </div>

      {/* Dietary tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {restaurant.dietaryOptions.map((option) => (
          <span
            key={option}
            className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full font-medium"
          >
            {option}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={onViewDetails}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View Details
        </button>
        <button
          onClick={onViewEvidence}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          View Evidence
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Directions
        </a>
      </div>
    </div>
  );
}

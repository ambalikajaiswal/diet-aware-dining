"use client";

import { Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
}

export function RecommendationCard({
  recommendation,
  rank,
}: RecommendationCardProps) {
  const { restaurant, confidence, matchReasons, warnings } = recommendation;

  const confidenceColor =
    confidence.overall >= 0.8
      ? "text-green-600 bg-green-50"
      : confidence.overall >= 0.6
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  const priceDisplay = "$".repeat(restaurant.priceLevel);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-500">{restaurant.address}</p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${confidenceColor}`}
        >
          {Math.round(confidence.overall * 100)}% match
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {restaurant.rating}
        </span>
        <span>{priceDisplay}</span>
        <span>{restaurant.reviewCount} reviews</span>
        <span className="capitalize">
          {restaurant.cuisine.join(", ")}
        </span>
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

      {/* Match reasons */}
      {matchReasons.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1">
            {matchReasons.map((reason, i) => (
              <li
                key={i}
                className="text-sm text-gray-600 flex items-start gap-1.5"
              >
                <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          {warnings.map((warning, i) => (
            <p
              key={i}
              className="text-xs text-amber-600 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Confidence breakdown */}
      <details className="mt-3 pt-3 border-t border-gray-100">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Confidence breakdown
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Evidence:</span>{" "}
            <span className="font-medium">
              {Math.round(confidence.evidenceScore * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Reviews:</span>{" "}
            <span className="font-medium">
              {Math.round(confidence.reviewConsistency * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Menu verified:</span>{" "}
            <span className="font-medium">
              {Math.round(confidence.menuVerification * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Recency:</span>{" "}
            <span className="font-medium">
              {Math.round(confidence.recency * 100)}%
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}

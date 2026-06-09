"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ClarificationDialog } from "@/components/ClarificationDialog";
import { AgentStatus } from "@/components/AgentStatus";
import { ResultsList } from "@/components/ResultsList";
import {
  AgentName,
  ClarificationQuestion,
  DietaryRequest,
  Recommendation,
} from "@/types";

type AppState =
  | { phase: "search" }
  | { phase: "processing"; currentAgent: AgentName }
  | {
      phase: "clarification";
      questions: ClarificationQuestion[];
      originalRequest: DietaryRequest;
    }
  | {
      phase: "results";
      recommendations: Recommendation[];
      metadata: { totalFound: number; verified: number; avgConfidence: number };
    }
  | { phase: "error"; message: string };

export default function Home() {
  const [appState, setAppState] = useState<AppState>({ phase: "search" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (data: {
    query: string;
    location: string;
    dietaryPreferences: string[];
    allergies: string[];
    cuisinePreferences: string[];
  }) => {
    setIsLoading(true);
    setAppState({ phase: "processing", currentAgent: "dietary_intent" });

    try {
      // Simulate agent progression for UI feedback
      const agents: AgentName[] = [
        "dietary_intent",
        "restaurant_discovery",
        "evidence_verification",
        "trust_confidence",
        "recommendation",
      ];

      const request: DietaryRequest = {
        query: data.query,
        location: data.location,
        dietaryPreferences: data.dietaryPreferences,
        allergies: data.allergies,
        cuisinePreferences: data.cuisinePreferences,
      };

      // Animate through agents
      for (const agent of agents.slice(0, 2)) {
        setAppState({ phase: "processing", currentAgent: agent });
        await delay(600);
      }

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.status === "awaiting_clarification") {
        setAppState({
          phase: "clarification",
          questions: result.clarificationNeeded,
          originalRequest: request,
        });
      } else if (result.status === "complete") {
        // Show remaining agents animating
        for (const agent of agents.slice(2)) {
          setAppState({ phase: "processing", currentAgent: agent });
          await delay(400);
        }

        setAppState({
          phase: "results",
          recommendations: result.recommendations,
          metadata: result.metadata,
        });
      } else {
        setAppState({
          phase: "error",
          message: result.error || "Something went wrong",
        });
      }
    } catch {
      setAppState({
        phase: "error",
        message: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarification = async (answers: Record<string, string>) => {
    if (appState.phase !== "clarification") return;

    setIsLoading(true);
    setAppState({ phase: "processing", currentAgent: "restaurant_discovery" });

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalRequest: appState.originalRequest,
          answers,
        }),
      });

      const result = await response.json();

      // Animate through remaining agents
      const remainingAgents: AgentName[] = [
        "evidence_verification",
        "trust_confidence",
        "recommendation",
      ];
      for (const agent of remainingAgents) {
        setAppState({ phase: "processing", currentAgent: agent });
        await delay(400);
      }

      setAppState({
        phase: "results",
        recommendations: result.recommendations,
        metadata: result.metadata,
      });
    } catch {
      setAppState({
        phase: "error",
        message: "Failed to process clarification",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAppState({ phase: "search" });
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🥗 DietaryAI
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          AI-powered restaurant recommendations based on your dietary needs.
          Verified across Yelp, Google Reviews, and Reddit.
        </p>
      </div>

      <div className="space-y-6">
        {/* Search form (always visible on search/error phase) */}
        {(appState.phase === "search" || appState.phase === "error") && (
          <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
        )}

        {/* Error message */}
        {appState.phase === "error" && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {appState.message}
            </div>
          </div>
        )}

        {/* Agent processing status */}
        {appState.phase === "processing" && (
          <AgentStatus
            currentAgent={appState.currentAgent}
            status="processing"
          />
        )}

        {/* Clarification dialog */}
        {appState.phase === "clarification" && (
          <ClarificationDialog
            questions={appState.questions}
            onSubmit={handleClarification}
          />
        )}

        {/* Results */}
        {appState.phase === "results" && (
          <>
            <ResultsList
              recommendations={appState.recommendations}
              metadata={appState.metadata}
            />
            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                ← New Search
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

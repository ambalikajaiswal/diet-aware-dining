"use client";

import { useState } from "react";
import { useAppStore } from "@/store";
import { LandingPage } from "@/components/LandingPage";
import { SearchForm } from "@/components/SearchForm";
import { ClarificationDialog } from "@/components/ClarificationDialog";
import { InterpretationView } from "@/components/InterpretationView";
import { ResultsMapView } from "@/components/ResultsMapView";
import { RestaurantDetails } from "@/components/RestaurantDetails";
import { EvidenceView } from "@/components/EvidenceView";
import { SavedRecentView } from "@/components/SavedRecentView";
import { Navigation } from "@/components/Navigation";
import {
  AgentName,
  ClarificationQuestion,
  DietaryRequest,
} from "@/types";

type ProcessingState =
  | { phase: "idle" }
  | { phase: "processing"; currentAgent: AgentName }
  | {
      phase: "clarification";
      questions: ClarificationQuestion[];
      originalRequest: DietaryRequest;
    }
  | { phase: "error"; message: string };

export default function Home() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);
  const setResults = useAppStore((s) => s.setResults);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    phase: "idle",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (data: {
    query: string;
    location: string;
    dietaryPreferences: string[];
    allergies: string[];
    cuisinePreferences: string[];
  }) => {
    setIsLoading(true);
    setPage("interpretation");
    setProcessingState({ phase: "processing", currentAgent: "dietary_intent" });

    try {
      const request: DietaryRequest = {
        query: data.query,
        location: data.location,
        dietaryPreferences: data.dietaryPreferences,
        allergies: data.allergies,
        cuisinePreferences: data.cuisinePreferences,
      };

      // Animate through early agents
      const earlyAgents: AgentName[] = ["dietary_intent", "restaurant_discovery"];
      for (const agent of earlyAgents) {
        setProcessingState({ phase: "processing", currentAgent: agent });
        await delay(600);
      }

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.status === "awaiting_clarification") {
        setProcessingState({
          phase: "clarification",
          questions: result.clarificationNeeded,
          originalRequest: request,
        });
        setPage("search");
      } else if (result.status === "complete") {
        // Animate remaining agents
        const lateAgents: AgentName[] = [
          "evidence_verification",
          "trust_confidence",
          "map_generation",
          "export",
          "recommendation",
        ];
        for (const agent of lateAgents) {
          setProcessingState({ phase: "processing", currentAgent: agent });
          await delay(300);
        }

        setResults(
          result.recommendations,
          result.mapData || null,
          result.parsedIntent || null,
          result.metadata
        );
        addRecentSearch(request, result.recommendations.length);
        setProcessingState({ phase: "idle" });
        setPage("results");
      } else {
        setProcessingState({
          phase: "error",
          message: result.error || "Something went wrong",
        });
      }
    } catch {
      setProcessingState({
        phase: "error",
        message: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarification = async (answers: Record<string, string>) => {
    if (processingState.phase !== "clarification") return;

    setIsLoading(true);
    setPage("interpretation");
    setProcessingState({ phase: "processing", currentAgent: "restaurant_discovery" });

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalRequest: processingState.originalRequest,
          answers,
        }),
      });

      const result = await response.json();

      const remainingAgents: AgentName[] = [
        "evidence_verification",
        "trust_confidence",
        "map_generation",
        "export",
        "recommendation",
      ];
      for (const agent of remainingAgents) {
        setProcessingState({ phase: "processing", currentAgent: agent });
        await delay(300);
      }

      setResults(
        result.recommendations,
        result.mapData || null,
        result.parsedIntent || null,
        result.metadata
      );
      addRecentSearch(processingState.originalRequest, result.recommendations.length);
      setProcessingState({ phase: "idle" });
      setPage("results");
    } catch {
      setProcessingState({
        phase: "error",
        message: "Failed to process clarification",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Page Content */}
      <main className="py-6 px-4">
        {currentPage === "landing" && <LandingPage />}

        {currentPage === "search" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                🥗 Dietary Maps AI
              </h1>
              <p className="text-gray-600 text-sm">
                Describe what you need in natural language
              </p>
            </div>

            {processingState.phase === "clarification" ? (
              <ClarificationDialog
                questions={processingState.questions}
                onSubmit={handleClarification}
              />
            ) : (
              <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
            )}

            {processingState.phase === "error" && (
              <div className="w-full max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {processingState.message}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === "interpretation" &&
          processingState.phase === "processing" && (
            <InterpretationView currentAgent={processingState.currentAgent} />
          )}

        {currentPage === "results" && <ResultsMapView />}

        {currentPage === "details" && <RestaurantDetails />}

        {currentPage === "evidence" && <EvidenceView />}

        {currentPage === "saved" && <SavedRecentView />}
      </main>

      {/* Global Navigation */}
      <Navigation />
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

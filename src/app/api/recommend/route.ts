import { NextRequest, NextResponse } from "next/server";
import { AgentPipeline } from "@/agents/pipeline";
import { DietaryRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: DietaryRequest = await request.json();

    if (!body.query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const dietaryRequest: DietaryRequest = {
      query: body.query,
      location: body.location || "",
      dietaryPreferences: body.dietaryPreferences || [],
      allergies: body.allergies || [],
      cuisinePreferences: body.cuisinePreferences || [],
    };

    const pipeline = new AgentPipeline();
    const recommendations = await pipeline.run(dietaryRequest);
    const state = pipeline.getState();

    // If clarification is needed, return the questions
    if (state.status === "awaiting_clarification") {
      return NextResponse.json({
        status: "awaiting_clarification",
        clarificationNeeded: state.clarificationNeeded,
        parsedIntent: state.parsedIntent,
      });
    }

    return NextResponse.json({
      status: "complete",
      recommendations,
      parsedIntent: state.parsedIntent,
      mapData: state.mapData,
      metadata: {
        totalFound: state.restaurants.length,
        verified: state.evidence.filter((e) => e.verified).length,
        avgConfidence:
          state.confidenceScores.length > 0
            ? Math.round(
                (state.confidenceScores.reduce((sum, s) => sum + s.overall, 0) /
                  state.confidenceScores.length) *
                  100
              ) / 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

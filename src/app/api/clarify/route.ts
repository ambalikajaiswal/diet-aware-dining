import { NextRequest, NextResponse } from "next/server";
import { AgentPipeline } from "@/agents/pipeline";
import { DietaryRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalRequest, answers } = body as {
      originalRequest: DietaryRequest;
      answers: Record<string, string>;
    };

    if (!originalRequest || !answers) {
      return NextResponse.json(
        { error: "originalRequest and answers are required" },
        { status: 400 }
      );
    }

    // Rebuild the request with clarified information
    const clarifiedRequest: DietaryRequest = {
      ...originalRequest,
      location: answers.location || originalRequest.location,
    };

    // Re-run the pipeline with clarified info
    const pipeline = new AgentPipeline();
    const recommendations = await pipeline.run(clarifiedRequest);
    const state = pipeline.getState();

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
    console.error("Clarification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

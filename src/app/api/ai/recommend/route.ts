/**
 * AI Recommend API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/recommend - AI Recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let result;

    if (request.url.includes("/salary")) {
      result = await aiService.recommendSalary(body);
    } else if (request.url.includes("/training")) {
      result = await aiService.recommendTraining(body);
    } else if (request.url.includes("/candidate")) {
      result = await aiService.recommendCandidates(body);
    } else if (request.url.includes("/onboarding-buddy")) {
      result = await aiService.recommendOnboardingBuddy(body);
    } else {
      return NextResponse.json(
        { success: false, error: "Unknown recommendation type" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Recommend error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "AI recommendation failed" },
      { status: 500 }
    );
  }
}

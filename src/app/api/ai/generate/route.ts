/**
 * AI Generate API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/generate - Content generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generation_type, ...params } = body;

    let result;

    switch (generation_type) {
      case "contract":
        result = await aiService.generateContract(params.prompt, params.context);
        break;

      case "interview_questions":
        result = await aiService.generateInterviewQuestions(params);
        break;

      case "onboarding":
        result = await aiService.generateOnboardingPlan(params);
        break;

      case "leave_response":
        result = await aiService.generateLeaveResponse(params);
        break;

      case "job_description":
        result = await aiService.generateJobDescription(params);
        break;

      case "welcome_email":
        result = await aiService.generateWelcomeEmail(params);
        break;

      case "performance_review":
        result = await aiService.generatePerformanceReview(params);
        break;

      default:
        // Try to determine from URL
        if (request.url.includes("/contract")) {
          result = await aiService.generateContract(params.prompt, params.context);
        } else if (request.url.includes("/interview-questions")) {
          result = await aiService.generateInterviewQuestions(params);
        } else if (request.url.includes("/onboarding")) {
          result = await aiService.generateOnboardingPlan(params);
        } else if (request.url.includes("/leave-response")) {
          result = await aiService.generateLeaveResponse(params);
        } else {
          return NextResponse.json(
            { success: false, error: "Unknown generation type" },
            { status: 400 }
          );
        }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Generate error:", error);
    const message = error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * AI Service Health Check
 */

import { NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

export async function GET() {
  try {
    const health = await aiService.healthCheck();
    return NextResponse.json(health);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI service unavailable";
    return NextResponse.json(
      {
        status: "degraded",
        service: "digital-hrm-ai",
        error: message,
      },
      { status: 503 }
    );
  }
}

/**
 * AI Service Health Check
 */

import { NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

export async function GET() {
  try {
    const health = await aiService.healthCheck();
    return NextResponse.json(health);
  } catch (error: any) {
    // If AI service is down, return degraded status
    return NextResponse.json(
      {
        status: "degraded",
        service: "digital-hrm-ai",
        error: error.message || "AI service unavailable",
      },
      { status: 503 }
    );
  }
}

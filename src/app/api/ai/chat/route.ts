/**
 * AI Chat API Route
 */
import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, model, temperature, session_id } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Invalid messages array" },
        { status: 400 }
      );
    }

    const result = await aiService.chat(messages, { provider, model, temperature });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Chat error:", error);
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

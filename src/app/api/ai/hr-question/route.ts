/**
 * AI HR Question Route - Specific HR policy questions
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, language } = body;

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    const result = await aiService.hrQuestion(question, context, language);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("HR Question error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "AI request failed" },
      { status: 500 }
    );
  }
}

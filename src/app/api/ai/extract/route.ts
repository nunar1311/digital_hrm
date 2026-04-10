/**
 * AI Extract API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/extract - Document extraction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraction_type, text, front_text, back_text, resume_text, schema } = body;

    if (extraction_type === "employee_id" || request.url.includes("/id-card")) {
      const result = await aiService.extractIdCard(front_text || text, back_text);
      return NextResponse.json(result);
    }

    if (extraction_type === "resume" || request.url.includes("/resume")) {
      const result = await aiService.extractResume(resume_text || text, body.include_sections);
      return NextResponse.json(result);
    }

    if (
      extraction_type === "contract" ||
      extraction_type === "certificate" ||
      request.url.includes("/document")
    ) {
      const result = await aiService.extractDocument(text, extraction_type, schema);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "Unknown extraction type" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("AI Extract error:", error);
    const message = error instanceof Error ? error.message : "AI extraction failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * AI Summarize API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/summarize - Content summarization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary_type, content, report_type, report_data, period, feedbacks, candidate_name, notifications } = body;

    let result;

    if (request.url.includes("/feedback")) {
      result = await aiService.summarizeFeedback(feedbacks, candidate_name);
    } else if (request.url.includes("/report")) {
      result = await aiService.summarizeReport(report_type, report_data, period);
    } else if (request.url.includes("/notifications")) {
      result = await aiService.summarizeNotifications(notifications, period);
    } else {
      // Generic content summarization
      result = await aiService.summarizeContent(content, summary_type, body.max_length, body.focus);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Summarize error:", error);
    const message = error instanceof Error ? error.message : "AI summarization failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

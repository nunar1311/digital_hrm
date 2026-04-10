/**
 * AI Analyze API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/analyze/resume - Analyze candidate resume/CV
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, resume_text, job_requirements, job_description, candidate_name } = body;

    if (type === "resume" || request.url.includes("/resume")) {
      const result = await aiService.analyzeResume(
        resume_text,
        job_requirements,
        job_description,
        candidate_name
      );
      return NextResponse.json(result);
    }

    if (type === "attendance" || request.url.includes("/attendance")) {
      const result = await aiService.analyzeAttendance(
        body.attendance_data,
        body.employee_id,
        body.analysis_type
      );
      return NextResponse.json(result);
    }

    if (type === "payroll" || request.url.includes("/payroll")) {
      const result = await aiService.analyzePayroll(
        body.payroll_data,
        body.employee_id,
        body.analysis_type
      );
      return NextResponse.json(result);
    }

    if (type === "turnover" || request.url.includes("/turnover")) {
      const result = await aiService.analyzeTurnover(
        body.employee_data,
        body.employee_id
      );
      return NextResponse.json(result);
    }

    if (type === "sentiment" || request.url.includes("/sentiment")) {
      const result = await aiService.analyzeSentiment(body.text, body.context);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "Unknown analysis type" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("AI Analyze error:", error);
    const message = error instanceof Error ? error.message : "AI analysis failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

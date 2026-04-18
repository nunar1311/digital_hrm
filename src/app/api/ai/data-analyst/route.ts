/**
 * AI Data Analyst API Route
 * Xử lý câu hỏi ngôn ngữ tự nhiên về dữ liệu HR
 * Phân tích intent và trả về câu trả lời kèm gợi ý biểu đồ
 */
import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";
import { getServerSession } from "@/lib/auth-session";

/**
 * Transform snake_case from Python backend to camelCase for frontend
 */
function transformResponse(raw: any) {
  if (!raw) return raw;
  return {
    success: raw.success,
    answer: raw.answer,
    chartType: raw.chart_type,
    chartData: raw.chart_data,
    chartTitle: raw.chart_title,
    xAxis: raw.x_axis,
    yAxis: raw.y_axis,
    metrics: raw.metrics,
    insights: raw.insights,
    intent: raw.intent,
    confidence: raw.confidence,
    dataSources: raw.data_sources,
    error: raw.error,
  };
}

/**
 * POST /api/ai/data-analyst
 * Natural Language Query - Trả lời câu hỏi về dữ liệu HR
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login to use Data Analyst" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, language, include_chart, intent_only } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { success: false, error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    const userContext = {
      userId: session.user.id,
      userRole: (session.user as Record<string, unknown>).hrmRole as string ?? "EMPLOYEE",
    };

    // Intent-only mode: lightweight classification without full query execution
    if (intent_only === true) {
      const intentResult = await aiService.dataAnalystQuery(
        question,
        { language, includeChart: false, intentOnly: true },
        userContext
      );
      return NextResponse.json(transformResponse(intentResult));
    }

    // Full data analyst query with optional chart generation
    const rawResult = await aiService.dataAnalystQuery(
      question,
      { language, includeChart: include_chart },
      userContext
    );

    const result = transformResponse(rawResult);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Data Analyst error:", error);
    const message = error instanceof Error ? error.message : "Data analyst request failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/data-analyst/recommend
 * Chart Recommendation - Gợi ý loại biểu đồ phù hợp
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const question = searchParams.get("question");

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question parameter is required" },
        { status: 400 }
      );
    }

    const result = await aiService.recommendChart(question);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Chart recommend error:", error);
    const message = error instanceof Error ? error.message : "Chart recommendation failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

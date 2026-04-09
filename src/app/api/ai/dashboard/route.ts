/**
 * AI Dashboard API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";

/**
 * POST /api/ai/dashboard - AI Dashboard Insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let result;

    if (request.url.includes("/insights")) {
      result = await aiService.getDashboardInsights(
        body.dashboard_data,
        body.period,
        body.focus_areas
      );
    } else if (request.url.includes("/summary")) {
      result = await aiService.generateDashboardSummary(body.metrics, body.period);
    } else if (request.url.includes("/query")) {
      result = await aiService.queryNaturalLanguage(body.query, body.dashboard_data);
    } else if (request.url.includes("/anomaly-alert")) {
      result = await aiService.detectAnomalies(body.metrics, body.historical_data);
    } else if (request.url.includes("/predictive")) {
      result = await aiService.getPredictiveAnalytics(
        body.historical_data,
        body.prediction_type,
        body.forecast_periods
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Unknown dashboard action" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "AI dashboard failed" },
      { status: 500 }
    );
  }
}

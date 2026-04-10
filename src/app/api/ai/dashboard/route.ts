/**
 * AI Dashboard API Routes
 * Phân quyền: admin-only endpoints yêu cầu role có full access
 * Forward user context tới Python AI Service
 */

import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";
import { getServerSession } from "@/lib/auth-session";
import { Role } from "@/lib/rbac/permissions";

// Các role được xem dashboard tổng quan
const DASHBOARD_ALLOWED_ROLES = new Set<string>([
  Role.SUPER_ADMIN,
  Role.DIRECTOR,
  Role.HR_MANAGER,
]);

// Các endpoint chỉ dành cho admin dashboard
const ADMIN_ONLY_PATHS = ["/auto-insights", "/auto-summary", "/workforce-analysis"];

/**
 * POST /api/ai/dashboard/[subpath] - AI Dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // Lấy session để biết user hiện tại
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const userRole = ((session.user as Record<string, unknown>).hrmRole as string) ?? Role.EMPLOYEE;
    const userContext = {
      userId: session.user.id,
      userRole,
    };

    // Kiểm tra quyền cho các endpoint admin-only
    const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => request.url.includes(p));
    if (isAdminOnlyPath && !DASHBOARD_ALLOWED_ROLES.has(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Dashboard tổng quan chỉ dành cho Ban Giám đốc và bộ phận HR.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    let result;

    if (request.url.includes("/auto-insights")) {
      result = await aiService.getAutoInsights(
        body.focus_areas,
        body.month,
        body.year,
        userContext
      );
    } else if (request.url.includes("/auto-summary")) {
      result = await aiService.getAutoSummary(body.language, body.detail_level, userContext);
    } else if (request.url.includes("/workforce-analysis")) {
      result = await aiService.getWorkforceAnalysis(userContext);
    } else if (request.url.includes("/insights")) {
      result = await aiService.getDashboardInsights(
        body.dashboard_data,
        body.period,
        body.focus_areas,
        userContext
      );
    } else if (request.url.includes("/summary")) {
      result = await aiService.generateDashboardSummary(body.metrics, body.period, userContext);
    } else if (request.url.includes("/query")) {
      result = await aiService.queryNaturalLanguage(body.query, body.dashboard_data, userContext);
    } else if (request.url.includes("/anomaly-alert")) {
      result = await aiService.detectAnomalies(body.metrics, body.historical_data, userContext);
    } else if (request.url.includes("/predictive")) {
      result = await aiService.getPredictiveAnalytics(
        body.historical_data,
        body.prediction_type,
        body.forecast_periods,
        userContext
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Unknown dashboard action" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Dashboard error:", error);
    const message = error instanceof Error ? error.message : "AI dashboard failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

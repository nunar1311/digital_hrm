"use server";

/**
 * Dashboard AI Server Actions
 * AI-powered insights, summarization, and analytics for the HR Dashboard
 */

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type AIServicePayload = Record<string, unknown>;

/** Lấy user context từ session hiện tại */
async function getUserContext(): Promise<{ "X-User-Id"?: string; "X-User-Role"?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return {};
    return {
      "X-User-Id": session.user.id,
      "X-User-Role":
        ((session.user as Record<string, unknown>).hrmRole as string) ?? "EMPLOYEE",
    };
  } catch {
    return {};
  }
}

async function callAIService(
  endpoint: string,
  data: AIServicePayload,
  userCtx?: Record<string, string>
): Promise<Record<string, unknown>> {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
      // Forward user context để Python service phân quyền DB access
      ...(userCtx ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as Record<string, Record<string,string>>)?.detail?.message ||
      `AI Service error: ${response.status}`
    );
  }

  return response.json();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

interface EmployeeDashboardRecord {
  id?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
}

interface AttendanceDashboardRecord {
  date?: string;
  status?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  [key: string]: unknown;
}

interface PayrollDashboardRecord {
  period?: string;
  grossSalary?: number;
  netSalary?: number;
  [key: string]: unknown;
}

interface RecruitmentDashboardRecord {
  status?: string;
  position?: string;
  [key: string]: unknown;
}

interface DashboardMetrics {
  totalEmployees?: number;
  attendanceRate?: number;
  turnoverRate?: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface MetricsTrend {
  [key: string]: string[] | number[] | boolean[] | null | undefined;
}

/**
 * Get AI-powered insights from dashboard data
 * Analyzes HR metrics and provides intelligent insights
 */
export async function getDashboardAIInsights(data: {
  employees: EmployeeDashboardRecord[];
  attendance: AttendanceDashboardRecord[];
  payroll: PayrollDashboardRecord[];
  recruitment: RecruitmentDashboardRecord[];
  period?: string;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/insights", {
      dashboard_data: {
        total_employees: data.employees?.length || 0,
        attendance_summary: data.attendance,
        payroll_summary: data.payroll,
        recruitment_summary: data.recruitment,
      },
      period: data.period || "this_month",
    });

    return {
      success: true,
      insights: result.insights || [],
      summary: result.summary,
      recommendations: result.recommendations || [],
    };
  } catch (error: unknown) {
    console.error("Dashboard AI Insights error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
      insights: [],
      recommendations: [],
    };
  }
}

/**
 * Generate AI-powered executive summary for dashboard
 */
export async function generateDashboardSummary(data: {
  metrics: DashboardMetrics;
  period: string;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/summary", {
      metrics: data.metrics,
      period: data.period,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Dashboard Summary error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Ask dashboard questions using natural language
 */
export async function askDashboardNaturalLanguage(
  query: string,
  dashboardData?: Record<string, unknown>
) {
  try {
    const result = await callAIService("/api/ai/dashboard/query", {
      query,
      dashboard_data: dashboardData,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Natural Language Query error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get predictive analytics for HR metrics
 */
export async function getPredictiveAnalytics(data: {
  historicalData: Record<string, unknown>;
  predictionType: "headcount" | "turnover" | "payroll" | "attendance";
  forecastPeriods?: number;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/predictive", {
      historical_data: data.historicalData,
      prediction_type: data.predictionType,
      forecast_periods: data.forecastPeriods || 3,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Predictive Analytics error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Detect anomalies in HR metrics
 */
export async function detectDashboardAnomalies(data: {
  currentMetrics: Record<string, unknown>;
  historicalData?: Record<string, unknown>;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/anomaly-alert", {
      metrics: data.currentMetrics,
      historical_data: data.historicalData,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Anomaly Detection error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Generate HR report with AI insights
 */
export async function generateHRReportAI(data: {
  reportType: "attendance" | "payroll" | "recruitment" | "turnover";
  reportData: Record<string, unknown>;
  period: string;
}) {
  try {
    const result = await callAIService("/api/ai/summarize/report", {
      report_type: data.reportType,
      report_data: data.reportData,
      period: data.period,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("HR Report AI error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get trend analysis from historical data
 */
export async function getTrendAnalysis(data: {
  metrics: MetricsTrend;
  metricName: string;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/summary", {
      metrics: {
        trend_data: data.metrics,
        metric_name: data.metricName,
        analysis_type: "trend",
      },
      period: "trend_analysis",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Trend Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Compare current metrics with targets/goals
 */
export async function compareMetricsWithTargets(data: {
  currentMetrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}) {
  try {
    const result = await callAIService("/api/ai/dashboard/summary", {
      metrics: {
        current: data.currentMetrics,
        targets: data.targetMetrics,
        analysis_type: "comparison",
      },
      period: "comparison",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Metrics Comparison error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// =============================================
// AUTO AI ACTIONS - Tự động lấy data từ Database
// =============================================

/**
 * Auto AI Insights - Tự động lấy dữ liệu từ DB và phân tích
 * KHÔNG cần gửi data từ frontend
 */
export async function getAutoAIInsights(focusAreas?: string[]) {
  try {
    const userCtx = await getUserContext();
    const result = await callAIService("/api/ai/dashboard/auto-insights", {
      focus_areas: focusAreas,
    }, userCtx);

    return {
      success: true,
      insights: result.insights || [],
      summary: result.summary,
      recommendations: result.recommendations || [],
      health_score: result.health_score,
      data_snapshot: result.data_snapshot,
    };
  } catch (error: unknown) {
    console.error("Auto AI Insights error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
      insights: [],
      recommendations: [],
    };
  }
}

/**
 * Auto Executive Summary - Tạo tóm tắt điều hành tự động từ DB
 * KHÔNG cần gửi data từ frontend
 */
export async function getAutoAISummary(
  detailLevel: "brief" | "standard" | "detailed" = "standard",
  forceRefresh: boolean = false
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!forceRefresh) {
      const existingSummary = await prisma.aIDashboardSummary.findFirst({
        where: {
          date: today,
          detailLevel: detailLevel,
        },
      });

      if (existingSummary) {
        return {
          success: true,
          content: existingSummary.content,
        };
      }
    }

    // Lấy user context để forward role SUPERADMIN/DIRECTOR/HR_MANAGER
    const userCtx = await getUserContext();
    const result = await callAIService("/api/ai/dashboard/auto-summary", {
      language: "vi",
      detail_level: detailLevel,
    }, userCtx);

    if (result.content) {
      const content = String(result.content);
      await prisma.aIDashboardSummary.upsert({
        where: {
          date_detailLevel: {
            date: today,
            detailLevel: detailLevel,
          },
        },
        update: {
          content: content,
        },
        create: {
          date: today,
          detailLevel: detailLevel,
          content: content,
        },
      });
    }

    return {
      success: true,
      content: result.content ? String(result.content) : "",
    };
  } catch (error: unknown) {
    console.error("Auto AI Summary error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Workforce Analysis - Phân tích lực lượng lao động tự động từ DB
 */
export async function getWorkforceAnalysis() {
  try {
    const userCtx = await getUserContext();
    const result = await callAIService(
      "/api/ai/dashboard/workforce-analysis",
      {},
      userCtx
    );

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Workforce Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Smart Chat - Chat AI kết hợp dữ liệu thực từ Database
 */
export async function smartChatWithAI(
  message: string,
  history?: Array<{ role: string; content: string }>
) {
  try {
    const userCtx = await getUserContext();
    const result = await callAIService("/api/ai/smart-chat", {
      message,
      history,
      language: "vi",
    }, userCtx);

    return {
      success: true,
      content: result.content,
      data_sources: result.data_sources,
    };
  } catch (error: unknown) {
    console.error("Smart Chat error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Department Analysis - Phân tích phòng ban từ DB
 */
export async function analyzeDepartmentAI(departmentId: string) {
  try {
    const result = await callAIService(
      `/api/ai/analyze/department/${departmentId}`,
      {}
    );

    return {
      success: true,
      content: result.content,
      metadata: result.metadata,
    };
  } catch (error: unknown) {
    console.error("Department Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Employee 360° Analysis - Phân tích nhân viên toàn diện từ DB
 */
export async function analyzeEmployee360AI(userId: string) {
  try {
    const result = await callAIService(
      `/api/ai/analyze/employee/${userId}`,
      {}
    );

    return {
      success: true,
      content: result.content,
      metadata: result.metadata,
    };
  } catch (error: unknown) {
    console.error("Employee 360 Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

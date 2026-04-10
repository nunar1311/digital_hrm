"use server";

/**
 * Offboarding AI Server Actions
 */

import { prisma } from "@/lib/prisma";

type AIServicePayload = Record<string, unknown>;

async function callAIService(endpoint: string, data: AIServicePayload): Promise<Record<string, unknown>> {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`AI Service error: ${response.status}`);
  return response.json();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

/**
 * Analyze exit interview
 */
export async function analyzeExitInterview(data: {
  offboardingId: string;
}) {
  try {
    const offboarding = await prisma.offboarding.findUnique({
      where: { id: data.offboardingId },
      include: {
        user: { include: { position: true, department: true } },
        assets: true,
        checklist: true,
      },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const exitInterviewText = offboarding.exitInterview || "";

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân tích phỏng vấn nghỉ việc.",
        },
        {
          role: "user",
          content: `Phân tích phỏng vấn nghỉ việc của ${offboarding.user.name}:\n${exitInterviewText}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Exit Interview Analysis error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Detect resignation risk
 */
export async function detectResignationRisk(data: {
  employeeId: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        position: true,
        attendances: { orderBy: { date: "desc" }, take: 90 },
        leaveRequests: { where: { createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      },
    });

    if (!employee) return { success: false, error: "Employee not found" };

    const result = await callAIService("/api/ai/analyze/turnover", {
      employee_data: {
        name: employee.name,
        position: employee.position?.name,
        tenure_years: employee.hireDate
          ? Math.floor((new Date().getTime() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
        attendance_pattern: employee.attendances.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        leave_requests_recent: employee.leaveRequests.length,
      },
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Resignation Risk error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Generate knowledge transfer plan
 */
export async function generateKnowledgeTransfer(data: {
  offboardingId: string;
}) {
  try {
    const offboarding = await prisma.offboarding.findUnique({
      where: { id: data.offboardingId },
      include: {
        user: { include: { position: true } },
        assets: true,
      },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về quản lý kiến thức và chuyển giao.",
        },
        {
          role: "user",
          content: `Tạo kế hoạch chuyển giao kiến thức cho nhân viên ${offboarding.user.name} - ${offboarding.user.position?.name}\nTài sản cần bàn giao: ${offboarding.assets.length}\nNgày nghỉ cuối: ${offboarding.lastWorkDate?.toISOString()}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Knowledge Transfer error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Classify resignation reason
 */
export async function classifyResignationReason(data: {
  offboardingId: string;
}) {
  try {
    const offboarding = await prisma.offboarding.findUnique({
      where: { id: data.offboardingId },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const exitInterviewText = offboarding.exitInterview || offboarding.reason || "";

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Phân loại lý do nghỉ việc: Compensation, Management, Career Growth, Work-Life Balance, Company Culture, Personal Reasons, Team Issues.",
        },
        {
          role: "user",
          content: `Phân loại lý do nghỉ: ${exitInterviewText}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Resignation Classification error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Generate offboarding report
 */
export async function generateOffboardingReport(data: {
  offboardingId: string;
}) {
  try {
    const offboarding = await prisma.offboarding.findUnique({
      where: { id: data.offboardingId },
      include: {
        user: { include: { position: true } },
        checklist: true,
        assets: true,
      },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const completedCount = offboarding.checklist.filter((c: { isCompleted: boolean }) => c.isCompleted).length;
    const returnedCount = offboarding.assets.filter((a: { returnDate: Date | null }) => a.returnDate).length;

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "offboarding",
      report_data: {
        employee: offboarding.user.name,
        position: offboarding.user.position?.name,
        resignation_date: offboarding.resignDate?.toISOString(),
        last_working_date: offboarding.lastWorkDate?.toISOString(),
        checklist_completion: `${completedCount}/${offboarding.checklist.length}`,
        assets_returned: returnedCount,
      },
      period: "offboarding",
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Offboarding Report error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Suggest retention actions
 */
export async function suggestRetentionActions(data: {
  employeeId: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: { position: true, department: true },
    });

    if (!employee) return { success: false, error: "Employee not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về giữ chân nhân viên.",
        },
        {
          role: "user",
          content: `Đề xuất hành động giữ chân cho nhân viên ${employee.name} - ${employee.position?.name} ở ${employee.department?.name}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Retention Actions error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

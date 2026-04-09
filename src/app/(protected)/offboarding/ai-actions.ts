"use server";

/**
 * Offboarding AI Server Actions
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function callAIService(endpoint: string, data: any) {
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
        employee: { include: { position: true, department: true } },
        exitInterviewResponses: true,
      },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const interviewText = offboarding.exitInterviewResponses
      .map((r) => `Q: ${r.question}\nA: ${r.response}`)
      .join("\n\n");

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân tích phỏng vấn nghỉ việc.",
        },
        {
          role: "user",
          content: `Phân tích phỏng vấn nghỉ việc của ${offboarding.employee.name}:\n${interviewText}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Exit Interview Analysis error:", error);
    return { success: false, error: error.message };
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
        position: employee.position?.title,
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
  } catch (error: any) {
    console.error("Resignation Risk error:", error);
    return { success: false, error: error.message };
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
        employee: { include: { position: true } },
        assetReturns: true,
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
          content: `Tạo kế hoạch chuyển giao kiến thức cho nhân viên ${offboarding.employee.name} - ${offboarding.employee.position?.title}\nTài sản cần bàn giao: ${offboarding.assetReturns.length}\nNgày nghỉ cuối: ${offboarding.lastWorkingDate?.toISOString()}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Knowledge Transfer error:", error);
    return { success: false, error: error.message };
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
      include: { exitInterviewResponses: true },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const reasons = offboarding.exitInterviewResponses
      .filter((r) => r.question.toLowerCase().includes("tại sao"))
      .map((r) => r.response)
      .join(" ");

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Phân loại lý do nghỉ việc: Compensation, Management, Career Growth, Work-Life Balance, Company Culture, Personal Reasons, Team Issues.",
        },
        {
          role: "user",
          content: `Phân loại lý do nghỉ: ${reasons}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Resignation Classification error:", error);
    return { success: false, error: error.message };
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
        employee: { include: { position: true } },
        checklist: true,
        assetReturns: true,
      },
    });

    if (!offboarding) return { success: false, error: "Offboarding not found" };

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "offboarding",
      report_data: {
        employee: offboarding.employee.name,
        position: offboarding.employee.position?.title,
        resignation_date: offboarding.resignationDate?.toISOString(),
        last_working_date: offboarding.lastWorkingDate?.toISOString(),
        checklist_completion: `${offboarding.checklist.filter((c) => c.isCompleted).length}/${offboarding.checklist.length}`,
        assets_returned: offboarding.assetReturns.filter((a) => a.returnDate).length,
      },
      period: "offboarding",
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Offboarding Report error:", error);
    return { success: false, error: error.message };
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
          content: `Đề xuất hành động giữ chân cho nhân viên ${employee.name} - ${employee.position?.title} ở ${employee.department?.name}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Retention Actions error:", error);
    return { success: false, error: error.message };
  }
}

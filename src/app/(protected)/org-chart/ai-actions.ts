"use server";

/**
 * Org Chart AI Server Actions
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
 * Analyze organization health
 */
export async function analyzeOrgHealth() {
  try {
    const [departments, employees] = await Promise.all([
      prisma.department.findMany({ include: { positions: true } }),
      prisma.user.findMany({
        include: { department: true, position: true },
      }),
    ]);

    const deptData = departments.map((d) => ({
      name: d.name,
      employee_count: employees.filter((e) => e.departmentId === d.id).length,
      manager_count: d.managerId ? 1 : 0,
    }));

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân tích sức khỏe tổ chức.",
        },
        {
          role: "user",
          content: `Phân tích sức khỏe tổ chức:\nTổng nhân viên: ${employees.length}\nTổng phòng ban: ${departments.length}\nChi tiết phòng ban: ${JSON.stringify(deptData)}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Org Health Analysis error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Suggest successor for position
 */
export async function suggestSuccessor(data: { positionId: string }) {
  try {
    const position = await prisma.position.findUnique({
      where: { id: data.positionId },
      include: {
        department: true,
      },
    });

    if (!position) return { success: false, error: "Position not found" };

    const potentialCandidates = await prisma.user.findMany({
      where: {
        positionId: data.positionId,
        employeeStatus: "ACTIVE",
      },
      include: { position: true, department: true },
    });

    const result = await callAIService("/api/ai/recommend/candidate", {
      job_requirements: `Position: ${position.name}, Department: ${position.department?.name}`,
      candidates: potentialCandidates.map((c) => ({
        name: c.name,
        experience: `${new Date().getFullYear() - (c.hireDate?.getFullYear() || 0)} years`,
      })),
      top_n: 5,
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Successor Suggestion error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Optimize organization structure
 */
export async function optimizeOrgStructure() {
  try {
    const departments = await prisma.department.findMany({
      include: { positions: true, users: true },
    });

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tối ưu cấu trúc tổ chức.",
        },
        {
          role: "user",
          content: `Tối ưu cấu trúc tổ chức:\n${departments.map((d) => `${d.name}: ${d.users.length} NV, ${d.positions.length} vị trí`).join("\n")}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Org Structure Optimization error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Analyze span of control
 */
export async function analyzeSpanOfControl(data: { departmentId?: string }) {
  try {
    const managers = await prisma.user.findMany({
      where: data.departmentId
        ? { departmentId: data.departmentId, hrmRole: "MANAGER" }
        : { hrmRole: "MANAGER" },
      include: { department: true, position: true },
    });

    const controlData = await Promise.all(
      managers.map(async (m) => {
        const directReports = await prisma.user.count({
          where: { managerId: m.id },
        });
        return {
          manager: m.name,
          department: m.department?.name,
          direct_reports: directReports,
        };
      })
    );

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Phân tích span of control: Ideal ratio là 1:5 đến 1:15 tùy loại công việc.",
        },
        {
          role: "user",
          content: `Phân tích span of control:\n${controlData.map((d) => `${d.manager} (${d.department}): ${d.direct_reports} báo cáo trực tiếp`).join("\n")}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Span of Control error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Generate organization insights
 */
export async function generateOrgInsights() {
  try {
    const [departments, employees] = await Promise.all([
      prisma.department.findMany({ include: { users: true } }),
      prisma.user.findMany({ include: { department: true, position: true } }),
    ]);

    const result = await callAIService("/api/ai/dashboard/insights", {
      dashboard_data: {
        total_employees: employees.length,
        total_departments: departments.length,
        department_distribution: departments.map((d) => ({
          name: d.name,
          count: d.users.length,
        })),
        avg_employees_per_dept: Math.round(employees.length / departments.length),
      },
      period: "current",
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Org Insights error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

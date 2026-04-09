"use server";

/**
 * Org Chart AI Server Actions
 */

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
  } catch (error: any) {
    console.error("Org Health Analysis error:", error);
    return { success: false, error: error.message };
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
        role: true,
      },
    });

    if (!position) return { success: false, error: "Position not found" };

    const potentialCandidates = await prisma.user.findMany({
      where: {
        positionId: data.positionId,
        status: "ACTIVE",
      },
      include: { position: true },
    });

    const result = await callAIService("/api/ai/recommend/candidate", {
      job_requirements: `Position: ${position.title}, Department: ${position.department?.name}`,
      candidates: potentialCandidates.map((c) => ({
        name: c.name,
        skills: c.skills?.split(",") || [],
        experience: `${new Date().getFullYear() - (c.hireDate?.getFullYear() || 0)} years`,
      })),
      top_n: 5,
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Successor Suggestion error:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("Org Structure Optimization error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze span of control
 */
export async function analyzeSpanOfControl(data: { departmentId?: string }) {
  try {
    const where = data.departmentId ? { departmentId: data.departmentId } : {};
    const managers = await prisma.user.findMany({
      where: { ...where, isManager: true },
      include: { department: true },
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
  } catch (error: any) {
    console.error("Span of Control error:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("Org Insights error:", error);
    return { success: false, error: error.message };
  }
}

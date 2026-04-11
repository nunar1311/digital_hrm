"use server";

/**
 * Onboarding AI Server Actions
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
 * Generate personalized onboarding plan
 */
export async function generateOnboardingPlan(data: {
  onboardingId: string;
}) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: data.onboardingId },
      include: {
        user: { include: { position: true, department: true } },
        checklist: true,
      },
    });

    if (!onboarding) return { success: false, error: "Onboarding not found" };

    const result = await callAIService("/api/ai/generate/onboarding", {
      employee_name: onboarding.user.name,
      position: onboarding.user.position?.name || "",
      department: onboarding.user.department?.name || "",
      start_date: onboarding.startDate?.toISOString().split("T")[0],
      employment_type: onboarding.user.employmentType || "FULL_TIME",
      checklist_items: onboarding.checklist.map((c: { taskTitle: string; taskDescription: string | null; isCompleted: boolean }) => ({
        title: c.taskTitle,
        description: c.taskDescription,
        completed: c.isCompleted,
      })),
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Onboarding Plan error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Recommend onboarding buddy
 */
export async function recommendOnboardingBuddy(data: {
  newEmployeeId: string;
  departmentId: string;
}) {
  try {
    const [newEmployee, availableBuddies] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.newEmployeeId },
        include: { position: true },
      }),
      prisma.user.findMany({
        where: {
          departmentId: data.departmentId,
          id: { not: data.newEmployeeId },
        },
        include: { position: true },
      }),
    ]);

    if (!newEmployee) return { success: false, error: "Employee not found" };

    const result = await callAIService("/api/ai/recommend/onboarding-buddy", {
      new_employee_id: newEmployee.username,
      new_employee_skills: [],
      new_employee_interests: [],
      department_id: data.departmentId,
      available_buddies: availableBuddies.map((b) => ({
        id: b.id,
        name: b.name,
        position: b.position?.name,
        skills: [],
        interests: [],
        years_experience: b.hireDate
          ? Math.floor((new Date().getTime() - b.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
      })),
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Buddy Recommendation error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Generate welcome email content
 */
export async function generateWelcomeContent(data: {
  onboardingId: string;
}) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: data.onboardingId },
      include: {
        user: { include: { position: true, department: true } },
      },
    });

    if (!onboarding) return { success: false, error: "Onboarding not found" };

    const result = await callAIService("/api/ai/generate/welcome-email", {
      employee_name: onboarding.user.name,
      position: onboarding.user.position?.name || "",
      department: onboarding.user.department?.name || "",
      start_date: onboarding.startDate?.toISOString().split("T")[0],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Welcome Content error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Recommend training path
 */
export async function recommendTrainingPath(data: {
  onboardingId: string;
}) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: data.onboardingId },
      include: { user: { include: { position: true } } },
    });

    if (!onboarding) return { success: false, error: "Onboarding not found" };

    const result = await callAIService("/api/ai/recommend/training", {
      employee_id: onboarding.user.username,
      position: onboarding.user.position?.name || "",
      experience_years: 0,
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Training Path error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Generate onboarding report
 */
export async function generateOnboardingReport(data: {
  onboardingId: string;
}) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: data.onboardingId },
      include: {
        user: { include: { position: true } },
        checklist: true,
      },
    });

    if (!onboarding) return { success: false, error: "Onboarding not found" };

    const completedTasks = onboarding.checklist.filter((c: { isCompleted: boolean }) => c.isCompleted).length;
    const totalTasks = onboarding.checklist.length;

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "onboarding",
      report_data: {
        employee: onboarding.user.name,
        position: onboarding.user.position?.name,
        start_date: onboarding.startDate?.toISOString(),
        tasks_completed: completedTasks,
        total_tasks: totalTasks,
        completion_rate: Math.round((completedTasks / Math.max(totalTasks, 1)) * 100),
      },
      period: "onboarding",
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Onboarding Report error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

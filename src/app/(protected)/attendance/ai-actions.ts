"use server";

/**
 * Attendance AI Server Actions
 * AI-powered attendance analysis, anomaly detection, and insights
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AI Service integration
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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

/**
 * Detect attendance anomalies using AI
 */
export async function detectAttendanceAnomalies(data: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const where: any = {};

    if (data.employeeId) where.userId = data.employeeId;
    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }
    if (data.startDate || data.endDate) {
      where.date = {};
      if (data.startDate) where.date.gte = new Date(data.startDate);
      if (data.endDate) where.date.lte = new Date(data.endDate);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { user: { include: { department: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });

    const attendanceData = attendances.map((a) => ({
      employee_id: a.user.employeeCode,
      employee_name: a.user.name,
      department: a.user.department?.name,
      date: a.date.toISOString().split("T")[0],
      check_in: a.checkIn?.toISOString(),
      check_out: a.checkOut?.toISOString(),
      status: a.status,
      overtime_hours: a.overtimeHours,
      explanation: a.explanation,
    }));

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { attendances: attendanceData },
      analysis_type: "anomaly",
    });

    return {
      success: true,
      content: result.content,
      anomalies: result.anomalies || [],
    };
  } catch (error: any) {
    console.error("Attendance Anomaly Detection error:", error);
    return {
      success: false,
      error: error.message || "Failed to detect anomalies",
    };
  }
}

/**
 * Analyze check-in patterns using AI
 */
export async function analyzeCheckInPatterns(data: {
  employeeId?: string;
  departmentId?: string;
  period?: string;
}) {
  try {
    const where: any = {};

    if (data.employeeId) where.userId = data.employeeId;
    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (data.period === "quarter" ? 90 : 30));
    where.date = { gte: startDate };

    const attendances = await prisma.attendance.findMany({
      where,
      include: { user: true },
    });

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { attendances },
      analysis_type: "pattern",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Check-in Pattern Analysis error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze patterns",
    };
  }
}

/**
 * Predict overtime needs using AI
 */
export async function predictOvertimeNeeds(data: {
  departmentId?: string;
  projectData?: Record<string, any>;
}) {
  try {
    const where: any = {};
    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    where.date = { gte: startDate };

    const overtimeRequests = await prisma.attendance.findMany({
      where: {
        ...where,
        overtimeHours: { gt: 0 },
      },
      include: { user: { include: { department: true } } },
    });

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { overtime_history: overtimeRequests },
      analysis_type: "overtime",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Overtime Prediction error:", error);
    return {
      success: false,
      error: error.message || "Failed to predict overtime",
    };
  }
}

/**
 * Suggest optimal shift schedule
 */
export async function suggestOptimalShift(data: {
  departmentId: string;
  employeePreferences?: Record<string, any>;
}) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      include: {
        positions: {
          include: {
            position: true,
            users: { include: { user: true } },
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { department },
      analysis_type: "shift_optimization",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Shift Optimization error:", error);
    return {
      success: false,
      error: error.message || "Failed to optimize shifts",
    };
  }
}

/**
 * Auto-process leave request with AI recommendation
 */
export async function autoProcessLeaveRequest(data: {
  leaveRequestId: string;
}) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: data.leaveRequestId },
      include: {
        user: { include: { department: true } },
      },
    });

    if (!leaveRequest) {
      return { success: false, error: "Leave request not found" };
    }

    const result = await callAIService("/api/ai/generate/leave-response", {
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate.toISOString().split("T")[0],
      end_date: leaveRequest.endDate.toISOString().split("T")[0],
      reason: leaveRequest.reason,
      employee_name: leaveRequest.user.name,
    });

    return {
      success: true,
      content: result.content,
      recommendation: result.recommendation,
    };
  } catch (error: any) {
    console.error("Leave Request Auto-Process error:", error);
    return {
      success: false,
      error: error.message || "Failed to process request",
    };
  }
}

/**
 * Generate attendance report with AI insights
 */
export async function generateAttendanceReport(data: {
  departmentId?: string;
  startDate: string;
  endDate: string;
}) {
  try {
    const where: any = {
      date: {
        gte: new Date(data.startDate),
        lte: new Date(data.endDate),
      },
    };

    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { user: { include: { department: true } } },
    });

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "attendance",
      report_data: { attendances },
      period: `${data.startDate} - ${data.endDate}`,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Attendance Report Generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate report",
    };
  }
}

/**
 * Get attendance compliance analysis
 */
export async function getAttendanceComplianceAnalysis(data: {
  departmentId?: string;
  startDate: string;
  endDate: string;
}) {
  try {
    const where: any = {
      date: {
        gte: new Date(data.startDate),
        lte: new Date(data.endDate),
      },
    };

    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { department: true } },
        userShifts: { include: { shift: true } },
      },
    });

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { attendances },
      analysis_type: "compliance",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Compliance Analysis error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze compliance",
    };
  }
}

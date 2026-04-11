"use server";

/**
 * Attendance AI Server Actions
 * AI-powered attendance analysis, anomaly detection, and insights
 */

import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";

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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred";
}

function buildAttendanceWhere(data: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}): Prisma.AttendanceWhereInput {
  const where: Prisma.AttendanceWhereInput = {};

  if (data.employeeId) {
    where.userId = data.employeeId;
  }
  if (data.departmentId) {
    where.user = { departmentId: data.departmentId };
  }
  if (data.startDate || data.endDate) {
    where.date = {};
    if (data.startDate) where.date.gte = new Date(data.startDate);
    if (data.endDate) where.date.lte = new Date(data.endDate);
  }

  return where;
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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where = buildAttendanceWhere(data);

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { department: true } },
        explanation: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    const attendanceData = attendances.map((a) => ({
      employee_id: a.user.username,
      employee_name: a.user.name,
      department: a.user.department?.name,
      date: a.date.toISOString().split("T")[0],
      check_in: a.checkIn?.toISOString(),
      check_out: a.checkOut?.toISOString(),
      status: a.status,
      overtime_hours: a.overtimeHours,
      late_minutes: a.lateMinutes,
      early_minutes: a.earlyMinutes,
      explanation: a.explanation?.reason || null,
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
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Attendance Anomaly Detection error:", err);
    return { success: false, error: message };
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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: Prisma.AttendanceWhereInput = {};

    if (data.employeeId) where.userId = data.employeeId;
    if (data.departmentId) where.user = { departmentId: data.departmentId };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (data.period === "quarter" ? 90 : 30));
    where.date = { gte: startDate };

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { department: true } },
        explanation: true,
      },
    });

    const attendanceData = attendances.map((a) => ({
      employee_id: a.user.username,
      employee_name: a.user.name,
      department: a.user.department?.name,
      date: a.date.toISOString().split("T")[0],
      check_in: a.checkIn?.toISOString(),
      check_out: a.checkOut?.toISOString(),
      status: a.status,
      overtime_hours: a.overtimeHours,
      late_minutes: a.lateMinutes,
      early_minutes: a.earlyMinutes,
      explanation: a.explanation?.reason || null,
    }));

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { attendances: attendanceData },
      analysis_type: "pattern",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Check-in Pattern Analysis error:", err);
    return { success: false, error: message };
  }
}

interface ProjectData {
  projectName?: string;
  deadline?: string;
  requiredHours?: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface EmployeePreferences {
  shiftPreference?: string;
  workDays?: string[];
  [key: string]: string | string[] | boolean | null | undefined;
}

/**
 * Predict overtime needs using AI
 */
export async function predictOvertimeNeeds(data: {
  departmentId?: string;
  projectData?: ProjectData;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where: {
        user: data.departmentId
          ? { departmentId: data.departmentId }
          : undefined,
        date: { gte: startDate },
        status: { in: ["APPROVED", "CONFIRMED"] },
      },
      include: { user: { include: { department: true } } },
    });

    const overtimeData = overtimeRequests.map((r) => ({
      employee_id: r.user.username,
      employee_name: r.user.name,
      department: r.user.department?.name,
      date: r.date.toISOString().split("T")[0],
      requested_hours: r.hours,
      actual_hours: r.actualHours,
      day_type: r.dayType,
      status: r.status,
    }));

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { overtime_history: overtimeData },
      analysis_type: "overtime",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Overtime Prediction error:", err);
    return { success: false, error: message };
  }
}

/**
 * Suggest optimal shift schedule
 */
export async function suggestOptimalShift(data: {
  departmentId: string;
  employeePreferences?: EmployeePreferences;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      include: {
        positions: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    const departmentData = {
      id: department.id,
      name: department.name,
      code: department.code,
      positions: department.positions.map((pos) => ({
        id: pos.id,
        name: pos.name,
        authority: pos.authority,
        users: pos.users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          image: u.image,
        })),
      })),
      employee_preferences: data.employeePreferences,
    };

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { department: departmentData },
      analysis_type: "shift_optimization",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Shift Optimization error:", err);
    return { success: false, error: message };
  }
}

/**
 * Auto-process leave request with AI recommendation
 */
export async function autoProcessLeaveRequest(data: {
  leaveRequestId: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: data.leaveRequestId },
      include: {
        user: { include: { department: true } },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      return { success: false, error: "Leave request not found" };
    }

    const result = await callAIService("/api/ai/generate/leave-response", {
      leave_type: leaveRequest.leaveType.name,
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
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Leave Request Auto-Process error:", err);
    return { success: false, error: message };
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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: Prisma.AttendanceWhereInput = {
      date: {
        gte: new Date(data.startDate),
        lte: new Date(data.endDate),
      },
    };

    if (data.departmentId) {
      where.user = { departmentId: data.departmentId };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { department: true } },
        explanation: true,
      },
    });

    const attendanceData = attendances.map((a) => ({
      employee_id: a.user.username,
      employee_name: a.user.name,
      department: a.user.department?.name,
      date: a.date.toISOString().split("T")[0],
      check_in: a.checkIn?.toISOString(),
      check_out: a.checkOut?.toISOString(),
      status: a.status,
      overtime_hours: a.overtimeHours,
      late_minutes: a.lateMinutes,
      early_minutes: a.earlyMinutes,
      explanation: a.explanation?.reason || null,
    }));

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "attendance",
      report_data: { attendances: attendanceData },
      period: `${data.startDate} - ${data.endDate}`,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Attendance Report Generation error:", err);
    return { success: false, error: message };
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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: Prisma.AttendanceWhereInput = {
      date: {
        gte: new Date(data.startDate),
        lte: new Date(data.endDate),
      },
    };

    if (data.departmentId) {
      where.user = { departmentId: data.departmentId };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { include: { department: true } },
        shift: true,
      },
    });

    const attendanceData = attendances.map((a) => ({
      employee_id: a.user.username,
      employee_name: a.user.name,
      department: a.user.department?.name,
      date: a.date.toISOString().split("T")[0],
      check_in: a.checkIn?.toISOString(),
      check_out: a.checkOut?.toISOString(),
      status: a.status,
      overtime_hours: a.overtimeHours,
      late_minutes: a.lateMinutes,
      early_minutes: a.earlyMinutes,
      shift_name: a.shift?.name,
    }));

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: { attendances: attendanceData },
      analysis_type: "compliance",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Compliance Analysis error:", err);
    return { success: false, error: message };
  }
}

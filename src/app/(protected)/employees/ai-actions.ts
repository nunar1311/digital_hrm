"use server";

/**
 * Employee AI Server Actions
 * AI-powered employee management, skill analysis, and career path suggestions
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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

/**
 * Extract employee data from ID card using AI OCR
 */
export async function extractEmployeeFromID(data: {
  frontText: string;
  backText?: string;
}) {
  try {
    const result = await callAIService("/api/ai/extract/id-card", {
      front_text: data.frontText,
      back_text: data.backText,
    });

    return {
      success: true,
      data: result.data,
      confidence: result.confidence,
    };
  } catch (error: unknown) {
    console.error("ID Card Extraction error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Extract employee data from resume using AI
 */
export async function extractEmployeeFromResume(data: {
  resumeText: string;
}) {
  try {
    const result = await callAIService("/api/ai/extract/resume", {
      resume_text: data.resumeText,
    });

    return {
      success: true,
      data: result.data,
      confidence: result.confidence,
    };
  } catch (error: unknown) {
    console.error("Resume Extraction error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Predict turnover risk for employee
 */
export async function predictTurnoverRisk(data: {
  employeeId: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        department: true,
        position: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 90,
        },
        leaveRequests: {
          where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        },
        workHistories: {
          orderBy: { startDate: "desc" },
          take: 5,
        },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const attendancePattern = employee.attendances.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = await callAIService("/api/ai/analyze/turnover", {
      employee_data: {
        employee_id: employee.employeeCode,
        name: employee.name,
        department: employee.department?.name,
        position: employee.position?.name,
        hire_date: employee.hireDate?.toISOString(),
        tenure_years: employee.hireDate
          ? Math.floor((new Date().getTime() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
        attendance_pattern: attendancePattern,
        recent_leave_requests: employee.leaveRequests.length,
        work_history: employee.workHistories,
      },
      employee_id: employee.employeeCode,
    });

    return {
      success: true,
      content: result.content,
      riskLevel: result.risk_level,
    };
  } catch (error: unknown) {
    console.error("Turnover Risk Prediction error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Suggest career path for employee
 */
export async function suggestCareerPath(data: {
  employeeId: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        department: true,
        position: true,
        workHistories: {
          orderBy: { startDate: "desc" },
        },
        rewards: {
          orderBy: { decisionDate: "desc" },
        },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về phát triển sự nghiệp và quản lý nhân sự.",
        },
        {
          role: "user",
          content: `Đề xuất lộ trình sự nghiệp cho nhân viên:
- Tên: ${employee.name}
- Vị trí hiện tại: ${employee.position?.name || "N/A"}
- Phòng ban: ${employee.department?.name || "N/A"}
- Ngày vào làm: ${employee.hireDate?.toISOString().split("T")[0]}
- Kinh nghiệm làm việc: ${employee.workHistories.map((w) => `${w.position} tại ${w.company}`).join(", ") || "Không có"}
- Thành tích: ${employee.rewards.map((r) => r.type).join(", ") || "Không có"}

Đề xuất:
1. Lộ trình phát triển 2-3 năm tới
2. Các vị trí phù hợp tiếp theo
3. Kỹ năng cần phát triển
4. Đào tạo khuyến nghị`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Career Path Suggestion error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Analyze skill gap for employee
 */
export async function analyzeSkillGap(data: {
  employeeId: string;
  targetPositionId?: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: { position: true },
    });

    let targetPosition = null;
    if (data.targetPositionId) {
      targetPosition = await prisma.position.findUnique({
        where: { id: data.targetPositionId },
      });
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân tích kỹ năng và đào tạo nhân sự.",
        },
        {
          role: "user",
          content: `Phân tích khoảng trống kỹ năng:
- Nhân viên: ${employee?.name || "N/A"}
- Vị trí hiện tại: ${employee?.position?.name || "N/A"}
- Vị trí mục tiêu: ${targetPosition?.name || "Chưa xác định"}

Phân tích:
1. Kỹ năng hiện có
2. Kỹ năng cần thiết cho vị trí mục tiêu
3. Khoảng trống cần lấp đầy
4. Khuyến nghị đào tạo`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Skill Gap Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Generate employee profile summary
 */
export async function generateEmployeeProfileSummary(data: {
  employeeId: string;
}) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        department: true,
        position: true,
        workHistories: {
          orderBy: { startDate: "desc" },
          take: 3,
        },
        rewards: {
          orderBy: { decisionDate: "desc" },
          take: 5,
        },
        attendances: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về quản lý nhân sự. Tạo tóm tắt hồ sơ nhân viên.",
        },
        {
          role: "user",
          content: `Tạo tóm tắt hồ sơ nhân viên:
- Tên: ${employee.name}
- Mã NV: ${employee.employeeCode}
- Phòng ban: ${employee.department?.name}
- Vị trí: ${employee.position?.name}
- Ngày vào làm: ${employee.hireDate?.toISOString().split("T")[0]}
- Kinh nghiệm: ${employee.workHistories.map((w) => `${w.position}@${w.company}`).join(", ") || "Không có"}
- Thành tích: ${employee.rewards.map((r) => r.type).join(", ") || "Không có"}
- Tỷ lệ chuyên cần (30 ngày): ${Math.round(employee.attendances.filter((a) => a.status === "PRESENT").length / Math.max(employee.attendances.length, 1) * 100)}%

Tóm tắt ngắn gọn về điểm mạnh, tiềm năng và lưu ý.`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Profile Summary error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

interface EmployeeImportRecord {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Batch import validation with AI
 */
export async function validateEmployeeImport(data: {
  employees: EmployeeImportRecord[];
}) {
  try {
    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia kiểm tra và xác thực dữ liệu nhân viên.",
        },
        {
          role: "user",
          content: `Kiểm tra dữ liệu import nhân viên:
${JSON.stringify(data.employees, null, 2)}

Kiểm tra:
1. Format dữ liệu
2. Dữ liệu bắt buộc
3. Duplicate detection
4. Validation errors
5. Đề xuất sửa lỗi`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Import Validation error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

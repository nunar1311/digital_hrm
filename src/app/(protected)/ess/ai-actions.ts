"use server";

/**
 * ESS AI Server Actions
 * AI-powered HR chatbot and employee self-service features
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

interface ChatMessage {
  role: string;
  content: string;
}

interface HRContext {
  employee_name?: string;
  department?: string | null;
  position?: string | null;
  username?: string;
  [key: string]: string | null | undefined;
}

/**
 * Chat with HR Bot
 * Get instant answers to HR-related questions
 */
export async function chatWithHRBot(data: {
  messages: ChatMessage[];
  sessionId?: string;
  userId?: string;
}) {
  try {
    let contextMessages = data.messages;

    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          department: true,
          position: true,
        },
      });

      if (user) {
        contextMessages = [
          {
            role: "system",
            content: `User context: ${user.name}, Department: ${user.department?.name || "N/A"}, Position: ${user.position?.name || "N/A"}`,
          },
          ...data.messages,
        ];
      }
    }

    const result = await callAIService("/api/ai/chat", {
      messages: contextMessages,
      session_id: data.sessionId,
    });

    return {
      success: true,
      content: result.content,
      sessionId: result.session_id,
      provider: result.provider,
    };
  } catch (error: unknown) {
    console.error("HR Chat error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Ask a specific HR question
 */
export async function askHRQuestion(data: {
  question: string;
  userId?: string;
  language?: "vi" | "en";
}) {
  try {
    const context: HRContext = {};

    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          department: true,
          position: true,
        },
      });

      if (user) {
        context.employee_name = user.name;
        context.department = user.department?.name;
        context.position = user.position?.name;
        context.username = user.username ?? undefined;
      }
    }

    const result = await callAIService("/api/ai/hr-question", {
      question: data.question,
      context,
      language: data.language || "vi",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("HR Question error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get personalized dashboard data with AI insights
 */
export async function getPersonalizedDashboard(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        position: true,
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
          orderBy: { date: "desc" },
          take: 30,
        },
        leaveBalances: true,
        leaveRequests: {
          where: {
            status: "PENDING",
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý HR, giúp nhân viên xem thông tin cá nhân hóa về dashboard của họ.",
        },
        {
          role: "user",
          content: `Tạo dashboard cá nhân cho nhân viên:
- Tên: ${user.name}
- Phòng ban: ${user.department?.name || "N/A"}
- Vị trí: ${user.position?.name || "N/A"}
- Số ngày làm việc (30 ngày qua): ${user.attendances.filter((a) => a.status === "PRESENT").length}
- Ngày nghỉ còn lại: ${user.leaveBalances?.[0]?.totalDays || 0}
- Đơn nghỉ đang chờ: ${user.leaveRequests?.length || 0}

Tạo tóm tắt ngắn gọn, động viên nhân viên.`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
      metrics: {
        workDaysLast30: user.attendances.filter((a) => a.status === "PRESENT").length,
        leaveBalance: user.leaveBalances?.[0]?.totalDays || 0,
        pendingRequests: user.leaveRequests?.length || 0,
      },
    };
  } catch (error: unknown) {
    console.error("Personalized Dashboard error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Suggest optimal leave days
 */
export async function suggestLeaveDays(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leaveBalances: true,
        leaveRequests: {
          where: {
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 60,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const result = await callAIService("/api/ai/recommend/leave-suggestion", {
      employee_name: user.name,
      leave_balance: user.leaveBalances?.[0]?.totalDays || 0,
      pending_requests: user.leaveRequests?.length,
      recent_workload: user.attendances?.slice(0, 10).map((a) => ({
        date: a.date,
        status: a.status,
      })),
    });

    return {
      success: true,
      content: result.content,
      suggestions: result.suggestions,
    };
  } catch (error: unknown) {
    console.error("Leave Suggestion error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get personal development plan
 */
export async function getPersonalDevelopmentPlan(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        position: true,
        department: true,
        workHistories: {
          orderBy: { startDate: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const result = await callAIService("/api/ai/recommend/training", {
      employee_id: user.username,
      position: user.position?.name || "",
      experience_years: user.hireDate
        ? Math.floor(
            (new Date().getTime() - user.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          )
        : 0,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Development Plan error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Answer policy question
 */
export async function answerPolicyQuestion(data: {
  question: string;
  policyContext?: string;
}) {
  try {
    const result = await callAIService("/api/ai/hr-question", {
      question: data.question,
      context: {
        policy_reference: data.policyContext,
      },
      language: "vi",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Policy Answer error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get personalized benefits information
 */
export async function getPersonalizedBenefits(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        position: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tư vấn phúc lợi nhân viên. Cung cấp thông tin phúc lợi cá nhân hóa.",
        },
        {
          role: "user",
          content: `Cung cấp thông tin phúc lợi cho nhân viên:
- Tên: ${user.name}
- Phòng ban: ${user.department?.name || "N/A"}
- Vị trí: ${user.position?.name || "N/A"}
- Ngày vào làm: ${user.hireDate?.toISOString().split("T")[0]}

Liệt kê các phúc lợi mà nhân viên này có thể được hưởng và giải thích ngắn gọn.`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Benefits Info error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Analyze work-life balance
 */
export async function analyzeWorkLifeBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
        leaveRequests: {
          where: {
            startDate: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const overtimeDays = user.attendances.filter(
      (a) => a.overtimeHours && a.overtimeHours > 0
    ).length;
    const leaveTaken = user.leaveRequests.filter((l) => l.status === "APPROVED").length;

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân tích cân bằng công việc-cuộc sống. Đưa ra phân tích khách quan.",
        },
        {
          role: "user",
          content: `Phân tích cân bằng công việc-cuộc sống cho nhân viên ${user.name}:
- Số ngày OT (30 ngày qua): ${overtimeDays}
- Số ngày nghỉ đã sử dụng (3 tháng qua): ${leaveTaken}
- Tổng ngày làm việc (30 ngày): ${user.attendances.length}

Đưa ra đánh giá và khuyến nghị cân bằng.`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
      metrics: {
        overtimeDays,
        leaveTaken,
        totalWorkDays: user.attendances.length,
      },
    };
  } catch (error: unknown) {
    console.error("Work-Life Balance error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get personalized wellness tips
 */
export async function getPersonalizedWellness(userId: string) {
  try {
    void userId; // Reserved for future personalization using user data
    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về sức khỏe và wellness cho nhân viên văn phòng. Đưa ra lời khuyên hữu ích.",
        },
        {
          role: "user",
          content:
            "Đưa ra 5 tips sức khỏe và wellness cá nhân hóa cho nhân viên văn phòng làm việc 8 tiếng/ngày tại Việt Nam. Bao gồm: dinh dưỡng, vận động, tinh thần, giấc ngủ.",
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Wellness Tips error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get attendance summary with AI insights
 */
export async function getAttendanceSummaryAI(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const attendanceData = user.attendances.map((a) => ({
      date: a.date.toISOString().split("T")[0],
      checkIn: a.checkIn?.toISOString(),
      checkOut: a.checkOut?.toISOString(),
      status: a.status,
      overtimeHours: a.overtimeHours,
    }));

    const result = await callAIService("/api/ai/analyze/attendance", {
      attendance_data: attendanceData,
      employee_id: user.username,
      analysis_type: "pattern",
    });

    return {
      success: true,
      content: result.content,
      attendanceData,
    };
  } catch (error: unknown) {
    console.error("Attendance Summary AI error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * AI Smart Chat API Route
 * Smart Chat kết hợp dữ liệu thực từ Database với phân quyền theo role
 * Forward user context (userId + role) tới Python AI Service
 */
import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";
import { getServerSession } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    // Yêu cầu đăng nhập để dùng smart chat
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login to use AI chat" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, history, provider, model, language } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid message" },
        { status: 400 }
      );
    }

    // Extract user context từ session
    const userContext = {
      userId: session.user.id,
      userRole: (session.user as Record<string, unknown>).hrmRole as string ?? "EMPLOYEE",
    };

    const result = await aiService.smartChat(
      message,
      history,
      { provider, model, language },
      userContext
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Smart Chat error:", error);
    const message = error instanceof Error ? error.message : "Smart chat failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

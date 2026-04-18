/**
 * AI Smart Chat API Route
 * Smart Chat kết hợp dữ liệu thực từ Database với phân quyền theo role
 * Forward user context (userId + role) tới Python AI Service
 * Đồng thời theo dõi và trừ AI Credits của user
 */
import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

const CREDIT_COST_PER_MESSAGE = 1;

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login to use AI chat" },
        { status: 401 }
      );
    }

    userId = session.user.id;

    const body = await request.json();
    const { message, history, provider, model, language } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid message" },
        { status: 400 }
      );
    }

    // Check user credits before making AI request
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCredits: true, aiTotalTokensUsed: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.aiCredits < CREDIT_COST_PER_MESSAGE) {
      return NextResponse.json({
        success: false,
        error: "Insufficient credits",
        code: "INSUFFICIENT_CREDITS",
      });
    }

    // Extract user context từ session
    const userContext = {
      userId: userId,
      userRole: (session.user as Record<string, unknown>).hrmRole as string ?? "EMPLOYEE",
    };

    const result = await aiService.smartChat(
      message,
      history,
      { provider, model, language },
      userContext
    );

    // Deduct credits and update token usage after successful AI response
    if (result.success) {
      const totalTokens = result.usage?.total_tokens ?? 0;

      await prisma.user.update({
        where: { id: userId },
        data: {
          aiCredits: {
            decrement: CREDIT_COST_PER_MESSAGE,
          },
          aiTotalTokensUsed: {
            increment: totalTokens,
          },
        },
      });
    }

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

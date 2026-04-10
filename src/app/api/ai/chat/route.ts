/**
 * AI Chat API Route
 * Forward user context (userId + role) tới Python AI Service
 */
import { NextRequest, NextResponse } from "next/server";
import aiService from "@/lib/ai-service-client";
import { getServerSession } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, model, temperature, session_id } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Invalid messages array" },
        { status: 400 }
      );
    }

    // Lấy session để biết user hiện tại
    const session = await getServerSession();
    const userContext = session
      ? {
          userId: session.user.id,
          userRole: (session.user as Record<string, unknown>).hrmRole as string ?? "EMPLOYEE",
        }
      : undefined;

    const result = await aiService.chat(messages, { provider, model, temperature }, userContext);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Chat error:", error);
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

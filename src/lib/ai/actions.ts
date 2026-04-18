"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function chatWithAI(messages: { role: string; content: string }[]) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  try {
    // Lấy session để forward user context
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userHeaders: Record<string, string> = {};
    if (session?.user) {
      userHeaders["X-User-Id"] = session.user.id;
      userHeaders["X-User-Role"] =
        ((session.user as Record<string, unknown>).hrmRole as string) ?? "EMPLOYEE";
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
        ...userHeaders,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Chat AI Server Action Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function smartChatWithAI(
  message: string,
  history?: { role: string; content: string }[],
  language: string = "vi"
) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  try {
    // Lấy session để forward user context (bắt buộc với smart-chat)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized - Please login" };
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/smart-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
        "X-User-Id": session.user.id,
        "X-User-Role":
          ((session.user as Record<string, unknown>).hrmRole as string) ?? "EMPLOYEE",
      },
      body: JSON.stringify({ message, history, language }),
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Smart Chat Server Action Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function executeHRAction(
  actionId: string,
  tool: string,
  params: Record<string, unknown>,
  confirmed: boolean = true
) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized - Please login" };
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/execute-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
        "X-User-Id": session.user.id,
        "X-User-Role":
          ((session.user as Record<string, unknown>).hrmRole as string) ?? "EMPLOYEE",
      },
      body: JSON.stringify({
        action_id: actionId,
        tool,
        params,
        confirmed,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Execute HR Action Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

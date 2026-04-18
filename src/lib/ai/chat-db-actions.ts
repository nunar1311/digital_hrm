"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserId() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user?.id;
  } catch {
    return null;
  }
}

export async function getUserChatSessions() {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const sessions = await prisma.aIChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, sessions };
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return { success: false, error: error.message };
  }
}

export async function getChatSession(sessionId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const session = await prisma.aIChatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      return { success: false, error: "Session not found or forbidden" };
    }

    return { success: true, session };
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return { success: false, error: error.message };
  }
}

export async function getChatSessionMessages(sessionId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const session = await prisma.aIChatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      return { success: false, error: "Session not found or forbidden" };
    }

    const messages = await prisma.aIChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, messages };
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return { success: false, error: error.message };
  }
}

export async function createChatSession(id: string, title: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const session = await prisma.aIChatSession.create({
      data: {
        id,
        userId,
        title,
      },
    });
    return { success: true, session };
  } catch (error: any) {
    console.error("Error creating session:", error);
    return { success: false, error: error.message };
  }
}

export async function saveChatMessage(
  id: string,
  sessionId: string,
  role: string,
  content: string,
  metadata?: any
) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const message = await prisma.aIChatMessage.create({
      data: {
        id,
        sessionId,
        role,
        content,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { success: true, message };
  } catch (error: any) {
    console.error("Error saving message:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteChatSession(sessionId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await prisma.aIChatSession.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserActiveSessionId() {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiChatActiveSessionId: true },
    });
    return { success: true, activeSessionId: user?.aiChatActiveSessionId ?? null };
  } catch (error: any) {
    console.error("Error fetching active session:", error);
    return { success: false, error: error.message };
  }
}

export async function setUserActiveSessionId(sessionId: string | null) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { aiChatActiveSessionId: sessionId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error setting active session:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserCredits(): Promise<{
  success: boolean;
  data?: {
    credits: number;
    totalTokensUsed: number;
    lastResetAt: string | null;
  };
  error?: string;
}> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiCredits: true,
        aiTotalTokensUsed: true,
        aiLastResetAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        credits: user.aiCredits,
        totalTokensUsed: user.aiTotalTokensUsed,
        lastResetAt: user.aiLastResetAt?.toISOString() ?? null,
      },
    };
  } catch (error: any) {
    console.error("Error fetching user credits:", error);
    return { success: false, error: error.message };
  }
}

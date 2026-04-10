"use server";

/**
 * Notifications AI Server Actions
 */

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

  if (!response.ok) throw new Error(`AI Service error: ${response.status}`);
  return response.json();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

/**
 * Generate smart notification summary
 */
export async function generateNotificationSummary(data: {
  userId: string;
  period: "today" | "this_week" | "this_month";
}) {
  try {
    const now = new Date();
    const where: Prisma.NotificationWhereInput = { userId: data.userId };

    if (data.period === "today") {
      where.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (data.period === "this_week") {
      where.createdAt = { gte: new Date(now.setDate(now.getDate() - 7)) };
    } else {
      where.createdAt = { gte: new Date(now.setMonth(now.getMonth() - 1)) };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = await callAIService("/api/ai/summarize/notifications", {
      notifications: notifications.map((n) => ({
        title: n.title,
        message: n.content,
        type: n.type,
      })),
      period: data.period,
    });

    return { success: true, content: result.content, count: notifications.length };
  } catch (error: unknown) {
    console.error("Notification Summary error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Prioritize notifications
 */
export async function prioritizeNotifications(data: { userId: string }) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: data.userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia ưu tiên thông báo. Xếp hạng ưu tiên dựa trên urgency, importance, và relevance.",
        },
        {
          role: "user",
          content: `Ưu tiên thông báo:\n${notifications.map((n, i) => `${i + 1}. [${n.type}] ${n.title}: ${n.content}`).join("\n")}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Notification Prioritization error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Draft notification
 */
export async function draftNotification(data: {
  notificationType: string;
  context: string;
  targetAudience?: string;
}) {
  try {
    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia soạn thông báo nội bộ. Viết thông báo rõ ràng, súc tích, chuyên nghiệp.",
        },
        {
          role: "user",
          content: `Soạn thông báo:\n- Loại: ${data.notificationType}\n- Ngữ cảnh: ${data.context}\n- Đối tượng: ${data.targetAudience || "Tất cả nhân viên"}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Notification Drafting error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Analyze notification engagement
 */
export async function analyzeNotificationEngagement(data: {
  notificationId: string;
}) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: data.notificationId },
    });

    if (!notification) return { success: false, error: "Notification not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Phân tích engagement thông báo: open rate, action rate, sentiment.",
        },
        {
          role: "user",
          content: `Phân tích thông báo "${notification.title}":\nNội dung: ${notification.content}\nLoại: ${notification.type}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Notification Analysis error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Batch notification summary
 */
export async function batchNotificationSummary(data: {
  notificationIds: string[];
}) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { id: { in: data.notificationIds } },
    });

    const result = await callAIService("/api/ai/summarize/notifications", {
      notifications: notifications.map((n) => ({
        title: n.title,
        message: n.content,
        type: n.type,
      })),
      period: "batch",
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Batch Notification Summary error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Suggest escalation
 */
export async function suggestEscalation(data: { notificationId: string }) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: data.notificationId },
    });

    if (!notification) return { success: false, error: "Notification not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về escalation thông báo. Đề xuất mức độ escalation và path.",
        },
        {
          role: "user",
          content: `Đề xuất escalation cho: ${notification.title}\nNội dung: ${notification.content}\nLoại: ${notification.type}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Escalation Suggestion error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

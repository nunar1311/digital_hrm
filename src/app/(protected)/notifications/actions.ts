"use server";

import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationPreference,
    updateNotificationPreference,
} from "@/lib/notification";
import { NotificationType } from "@/lib/types/notification";

const preferenceSchema = z.object({
    emailEnabled: z.boolean().optional(),
    browserEnabled: z.boolean().optional(),
    notificationTypes: z.array(z.string()).optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
    // Email channel - new separate fields
    emailNotificationTypes: z.array(z.string()).optional(),
    emailQuietHoursEnabled: z.boolean().optional(),
    emailQuietHoursStart: z.string().optional(),
    emailQuietHoursEnd: z.string().optional(),
    // Inbox fields
    inboxNotificationTypes: z.array(z.string()).optional(),
    inboxQuietHoursEnabled: z.boolean().optional(),
    inboxQuietHoursStart: z.string().optional(),
    inboxQuietHoursEnd: z.string().optional(),
    // Browser channel - new separate fields
    browserSoundEnabled: z.boolean().optional(),
    browserNotificationTypes: z.array(z.string()).optional(),
    browserQuietHoursEnabled: z.boolean().optional(),
    browserQuietHoursStart: z.string().optional(),
    browserQuietHoursEnd: z.string().optional(),
});

export async function fetchNotifications(params: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
}) {
    const session = await requireAuth();
    return await getUserNotifications({
        userId: session.user.id,
        page: params.page,
        pageSize: params.pageSize,
        isRead: params.isRead,
        type: params.type as NotificationType,
    });
}

export async function fetchUnreadCount() {
    const session = await requireAuth();
    const result = await prisma.notification.count({
        where: {
            userId: session.user.id,
            isRead: false,
        },
    });
    return result;
}

export async function readNotification(notificationId: string) {
    const session = await requireAuth();
    await markNotificationAsRead(notificationId, session.user.id);
    revalidatePath("/");
    return { success: true };
}

export async function readAllNotifications() {
    const session = await requireAuth();
    await markAllNotificationsAsRead(session.user.id);
    revalidatePath("/");
    return { success: true };
}

export async function removeNotification(notificationId: string) {
    const session = await requireAuth();
    await deleteNotification(notificationId, session.user.id);
    revalidatePath("/");
    return { success: true };
}

export async function fetchPreferences() {
    const session = await requireAuth();
    return await getNotificationPreference(session.user.id);
}

export async function savePreferences(
    data: z.infer<typeof preferenceSchema>,
) {
    const session = await requireAuth();
    const validated = preferenceSchema.parse(data);
    console.log("[savePreferences] Received data:", JSON.stringify(validated));
    const result = await updateNotificationPreference(session.user.id, validated);
    console.log("[savePreferences] Result:", JSON.stringify(result));
    revalidatePath("/settings");
    return { success: true };
}

export async function getNotificationSettings() {
    const session = await requireAuth();
    const preference = await getNotificationPreference(
        session.user.id,
    );
    return preference;
}
export async function sendTestEmail(): Promise<{
    success: boolean;
    error?: string;
}> {
    const session = await requireAuth();

    // Lấy thông tin user hiện tại
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            email: true,
            name: true,
            fullName: true,
        },
    });

    if (!user?.email) {
        return { success: false, error: "Chưa có địa chỉ email trong hồ sơ" };
    }

    // Gửi email thử nghiệm
    const { sendEmail } = await import("@/lib/email");
    // fullName hoặc name sẽ được sử dụng làm tên người nhận
    const displayName = user.fullName || user.name || user.email;

    const result = await sendEmail({
        to: user.email,
        subject: "Digital HRM - Thông báo thử nghiệm",
        body: `Xin chào ${displayName},

Đây là thông báo thử nghiệm từ Digital HRM.
Bạn đã bật nhận thông báo qua email.

Nếu bạn nhận được email này, cài đặt thông báo email của bạn đang hoạt động tốt.

Trân trọng,
Ban Quản lý HR`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Xin chào ${displayName},</h2>
            <p>Đây là <strong>thông báo thử nghiệm</strong> từ <strong>Digital HRM</strong>.</p>
            <p>Bạn đã bật nhận thông báo qua email.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    Nếu bạn nhận được email này, cài đặt thông báo email của bạn đang hoạt động tốt.
                </p>
            </div>
            <p>Trân trọng,<br><strong>Ban Quản lý HR</strong></p>
        </div>`,
        templateCode: "TEST_NOTIFICATION",
        metadata: {
            userId: session.user.id,
            type: "test",
            sentAt: new Date().toISOString(),
        },
    });

    if (!result.success) {
        return {
            success: false,
            error: result.error || "Không thể gửi email thử nghiệm",
        };
    }

    return { success: true };
}

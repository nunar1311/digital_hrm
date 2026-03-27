/**
 * Attendance Approval Email Service
 * Handles email notifications for attendance adjustment requests
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

interface AttendanceEmailData {
    to: string;
    type: "NEW_REQUEST" | "APPROVED" | "REJECTED" | "REMINDER" | "CANCELLED";
    requesterName: string;
    requesterEmail: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    reason?: string;
    rejectionReason?: string;
    approverName?: string;
    appUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Build email subject and body for attendance adjustment
 */
function buildEmailContent(data: AttendanceEmailData): {
    subject: string;
    body: string;
    html: string;
} {
    const { type, requesterName, date, checkInTime, checkOutTime, reason, rejectionReason, approverName } = data;

    switch (type) {
        case "NEW_REQUEST":
            return {
                subject: `[Chấm công] Yêu cầu điều chỉnh từ ${requesterName} - ${date}`,
                body: `Yêu cầu điều chỉnh chấm công mới

Người yêu cầu: ${requesterName}
Ngày: ${date}
Giờ vào mới: ${checkInTime || "—"}
Giờ ra mới: ${checkOutTime || "—"}
Lý do: ${reason || "—"}

Vui lòng đăng nhập hệ thống để xem và xử lý yêu cầu.

Trân trọng,
Hệ thống Digital HRM`,
                html: `<h2>Yêu cầu điều chỉnh chấm công mới</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Người yêu cầu</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${requesterName}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ vào mới</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInTime || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ ra mới</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkOutTime || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Lý do</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reason || "—"}</td></tr>
</table>
<p>Vui lòng đăng nhập hệ thống để xem và xử lý yêu cầu.</p>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };

        case "APPROVED":
            return {
                subject: `[Chấm công] Yêu cầu điều chỉnh của bạn đã được duyệt - ${date}`,
                body: `Yêu cầu điều chỉnh chấm công đã được duyệt

Ngày: ${date}
Giờ vào: ${checkInTime || "—"}
Giờ ra: ${checkOutTime || "—"}
Người duyệt: ${approverName || "Hệ thống"}

Yêu cầu điều chỉnh của bạn đã được chấp nhận.

Trân trọng,
Hệ thống Digital HRM`,
                html: `<h2>Yêu cầu điều chỉnh chấm công đã được duyệt</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ vào</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInTime || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ ra</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkOutTime || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Người duyệt</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${approverName || "Hệ thống"}</td></tr>
</table>
<p>Yêu cầu điều chỉnh của bạn đã được chấp nhận.</p>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };

        case "REJECTED":
            return {
                subject: `[Chấm công] Yêu cầu điều chỉnh của bạn bị từ chối - ${date}`,
                body: `Yêu cầu điều chỉnh chấm công bị từ chối

Ngày: ${date}
Người duyệt: ${approverName || "—"}
Lý do từ chối: ${rejectionReason || "Không có"}

Yêu cầu điều chỉnh của bạn đã bị từ chối. Vui lòng liên hệ quản lý để biết thêm chi tiết.

Trân trọng,
Hệ thống Digital HRM`,
                html: `<h2>Yêu cầu điều chỉnh chấm công bị từ chối</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Người duyệt</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${approverName || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Lý do từ chối</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${rejectionReason || "Không có"}</td></tr>
</table>
<p>Vui lòng liên hệ quản lý để biết thêm chi tiết.</p>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };

        case "REMINDER":
            return {
                subject: `[Nhắc nhở] Yêu cầu điều chỉnh chấm công đang chờ bạn duyệt`,
                body: `Nhắc nhở: Có yêu cầu điều chỉnh chấm công đang chờ bạn phê duyệt

Người yêu cầu: ${requesterName}
Ngày: ${date}
Giờ vào mới: ${checkInTime || "—"}
Giờ ra mới: ${checkOutTime || "—"}

Vui lòng đăng nhập hệ thống để xử lý yêu cầu.

Trân trọng,
Hệ thống Digital HRM`,
                html: `<h2>Nhắc nhở: Yêu cầu điều chỉnh chấm công đang chờ bạn duyệt</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Người yêu cầu</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${requesterName}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ vào mới</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInTime || "—"}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ ra mới</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkOutTime || "—"}</td></tr>
</table>
<p>Vui lòng đăng nhập hệ thống để xử lý yêu cầu.</p>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };

        case "CANCELLED":
            return {
                subject: `[Chấm công] Yêu cầu điều chỉnh đã bị hủy - ${date}`,
                body: `Yêu cầu điều chỉnh chấm công đã bị hủy

Ngày: ${date}
Người hủy: ${requesterName}

Yêu cầu điều chỉnh này đã được người yêu cầu hủy bỏ.

Trân trọng,
Hệ thống Digital HRM`,
                html: `<h2>Yêu cầu điều chỉnh chấm công đã bị hủy</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Người hủy</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${requesterName}</td></tr>
</table>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };

        default:
            return {
                subject: `[Chấm công] Thông báo về yêu cầu điều chỉnh`,
                body: `Có cập nhật về yêu cầu điều chỉnh chấm công của bạn.`,
                html: `<h2>Thông báo về yêu cầu điều chỉnh chấm công</h2>
<p>Vui lòng đăng nhập hệ thống để xem chi tiết.</p>
<p>Trân trọng,<br>Hệ thống Digital HRM</p>`,
            };
    }
}

/**
 * Send email notification for attendance adjustment
 */
export async function sendAttendanceAdjustmentEmail(
    data: AttendanceEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, type } = data;

    const { subject, body, html } = buildEmailContent(data);

    return sendEmail({
        to,
        subject,
        body,
        html,
        templateCode: `ATTENDANCE_ADJUSTMENT_${type}`,
        metadata: data as unknown as Record<string, string>,
    });
}

/**
 * Notify approvers about a new adjustment request
 */
export async function notifyApproversOfNewRequest(
    requestId: string,
    approverEmails: string[],
    requesterName: string,
    date: string,
    checkInTime?: string,
    checkOutTime?: string,
    reason?: string
): Promise<void> {
    const results = await Promise.allSettled(
        approverEmails.map((email) =>
            sendAttendanceAdjustmentEmail({
                to: email,
                type: "NEW_REQUEST",
                requesterName,
                requesterEmail: email,
                date,
                checkInTime,
                checkOutTime,
                reason,
            })
        )
    );

    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));
    if (failed.length > 0) {
        console.warn(`[AttendanceEmail] Failed to notify ${failed.length}/${approverEmails.length} approvers for request ${requestId}`);
    }
}

/**
 * Notify requester about approval
 */
export async function notifyRequesterOfApproval(
    requesterEmail: string,
    requesterName: string,
    date: string,
    checkInTime?: string,
    checkOutTime?: string,
    approverName?: string
): Promise<void> {
    await sendAttendanceAdjustmentEmail({
        to: requesterEmail,
        type: "APPROVED",
        requesterName,
        requesterEmail,
        date,
        checkInTime,
        checkOutTime,
        approverName,
    });
}

/**
 * Notify requester about rejection
 */
export async function notifyRequesterOfRejection(
    requesterEmail: string,
    requesterName: string,
    date: string,
    rejectionReason: string,
    approverName?: string
): Promise<void> {
    await sendAttendanceAdjustmentEmail({
        to: requesterEmail,
        type: "REJECTED",
        requesterName,
        requesterEmail,
        date,
        rejectionReason,
        approverName,
    });
}

/**
 * Send reminder email to approvers with pending requests
 */
export async function sendApprovalReminders(
    pendingRequests: Array<{
        id: string;
        requesterName: string;
        date: string;
        checkInTime?: string | null;
        checkOutTime?: string | null;
        reason?: string | null;
        approverEmail: string;
        approverName: string;
    }>
): Promise<void> {
    await Promise.allSettled(
        pendingRequests.map((req) =>
            sendAttendanceAdjustmentEmail({
                to: req.approverEmail,
                type: "REMINDER",
                requesterName: req.requesterName,
                requesterEmail: req.approverEmail,
                date: req.date,
                checkInTime: req.checkInTime || undefined,
                checkOutTime: req.checkOutTime || undefined,
                reason: req.reason || undefined,
                approverName: req.approverName,
            })
        )
    );
}

/**
 * Default email templates for attendance adjustments (can be used with email template system)
 */
export const ATTENDANCE_ADJUSTMENT_EMAIL_TEMPLATES = [
    {
        code: "ATTENDANCE_ADJUSTMENT_NEW_REQUEST",
        name: "Yêu cầu điều chỉnh chấm công mới",
        subject: "[Chấm công] Yêu cầu điều chỉnh từ {{requesterName}} - {{date}}",
        body: `Yêu cầu điều chỉnh chấm công mới

Người yêu cầu: {{requesterName}}
Ngày: {{date}}
Giờ vào mới: {{checkInTime}}
Giờ ra mới: {{checkOutTime}}
Lý do: {{reason}}

Vui lòng đăng nhập hệ thống để xem và xử lý yêu cầu.

Trân trọng,
Hệ thống Digital HRM`,
        variables: ["requesterName", "date", "checkInTime", "checkOutTime", "reason"],
    },
    {
        code: "ATTENDANCE_ADJUSTMENT_APPROVED",
        name: "Yêu cầu điều chỉnh được duyệt",
        subject: "[Chấm công] Yêu cầu điều chỉnh của bạn đã được duyệt - {{date}}",
        body: `Yêu cầu điều chỉnh chấm công đã được duyệt

Ngày: {{date}}
Người duyệt: {{approverName}}

Trân trọng,
Hệ thống Digital HRM`,
        variables: ["date", "approverName"],
    },
    {
        code: "ATTENDANCE_ADJUSTMENT_REJECTED",
        name: "Yêu cầu điều chỉnh bị từ chối",
        subject: "[Chấm công] Yêu cầu điều chỉnh của bạn bị từ chối - {{date}}",
        body: `Yêu cầu điều chỉnh chấm công bị từ chối

Ngày: {{date}}
Lý do từ chối: {{rejectionReason}}

Vui lòng liên hệ quản lý để biết thêm chi tiết.

Trân trọng,
Hệ thống Digital HRM`,
        variables: ["date", "rejectionReason"],
    },
    {
        code: "ATTENDANCE_ADJUSTMENT_REMINDER",
        name: "Nhắc nhở duyệt yêu cầu điều chỉnh",
        subject: "[Nhắc nhở] Yêu cầu điều chỉnh chấm công đang chờ bạn duyệt",
        body: `Nhắc nhở: Có yêu cầu điều chỉnh chấm công đang chờ bạn phê duyệt

Người yêu cầu: {{requesterName}}
Ngày: {{date}}

Vui lòng đăng nhập hệ thống để xử lý yêu cầu.

Trân trọng,
Hệ thống Digital HRM`,
        variables: ["requesterName", "date"],
    },
];

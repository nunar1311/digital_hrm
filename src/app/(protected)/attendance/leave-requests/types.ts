

import { z } from "zod";

// ============================================================
// TYPES (inline for server actions — see ./types.ts for client types)
// ============================================================

export const leaveRequestQuerySchema = z.object({
    search: z.string().optional(),
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ALL"])
        .optional()
        .default("ALL"),
    leaveTypeId: z.string().optional(),
    departmentId: z.string().optional(),
    year: z.number().optional(),
    month: z.number().min(0).max(12).optional(), // 0 = tất cả, 1-12 = tháng cụ thể
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(20),
});

export type LeaveRequestQueryInput = z.infer<typeof leaveRequestQuerySchema>;

// ============================================================
// LEAVE REQUEST TYPES — Module duyệt đơn nghỉ phép
// ============================================================

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveTypeMinimal {
    id: string;
    name: string;
    isPaidLeave: boolean;
}

export interface LeaveRequestUser {
    id: string;
    fullName: string | null;
    name: string;
    email: string;
    avatar: string | null;
    employeeCode: string | null;
    department: { id: string; name: string; logo: string | null } | null;
    position: { id: string; name: string } | null;
}

export interface LeaveRequestItem {
    id: string;
    userId: string;
    user: LeaveRequestUser;
    leaveTypeId: string;
    leaveType: LeaveTypeMinimal | null;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string | null;
    status: LeaveRequestStatus;
    documentUrl: string | null;
    approvedBy: string | null;
    approvedByUser: { id: string; fullName: string | null; name: string } | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LeaveRequestPage {
    items: LeaveRequestItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface LeaveRequestStats {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    total: number;
}

// ============================================================
// CONSTANTS
// ============================================================

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
    PENDING: "Đang chờ",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
};

export const LEAVE_REQUEST_STATUS_COLORS: Record<LeaveRequestStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
};

export const LEAVE_REQUEST_STATUS_BORDER_COLORS: Record<LeaveRequestStatus, string> = {
    PENDING: "border-l-yellow-400",
    APPROVED: "border-l-green-400",
    REJECTED: "border-l-red-400",
    CANCELLED: "border-l-gray-400",
};

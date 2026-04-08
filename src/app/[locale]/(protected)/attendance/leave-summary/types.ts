// Types cho module Tổng hợp số dư ngày nghỉ

// ============================================================
// Base Types
// ============================================================
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveType {
    id: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isPaidLeave: boolean;
    defaultDays: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// LeaveBalance - Số dư ngày nghỉ
// ============================================================
export interface LeaveBalanceWithRelations {
    id: string;
    userId: string;
    leaveTypeId: string;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    policyYear: number;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        fullName: string | null;
        name: string;
        email: string;
        avatar: string | null;
        department: { id: string; name: string } | null;
        position: { id: string; name: string } | null;
        employmentType: string | null;
    };
    leaveType?: LeaveType;
}

export interface LeaveBalanceSummary {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    departmentName: string | null;
    leaveTypeName: string;
    leaveTypeId: string;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    availableDays: number;
    policyYear: number;
}

// ============================================================
// Form Data
// ============================================================
export interface UpdateLeaveBalanceData {
    totalDays?: number;
    usedDays?: number;
}

export interface ImportLeaveBalanceRow {
    userId: string;
    leaveTypeId: string;
    totalDays: number;
    usedDays: number;
}

export interface ImportLeaveBalancesData {
    year: number;
    balances: ImportLeaveBalanceRow[];
}

// ============================================================
// Query Params
// ============================================================
export interface LeaveBalanceQueryParams {
    year?: number;
    leaveTypeId?: string;
    departmentId?: string;
    employeeStatus?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface LeaveBalanceListResponse {
    data: LeaveBalanceWithRelations[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================
// Constants
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

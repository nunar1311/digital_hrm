// Admin Request Types - Dùng chung cho cả Admin và ESS

export type AdminRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type AdminRequestType =
    | "SALARY_CONFIRMATION"
    | "WORK_CERTIFICATE"
    | "TAX_CONFIRMATION"
    | "SOCIAL_INSURANCE"
    | "RESIGNATION_LETTER"
    | "RECOMMENDATION_LETTER"
    | "OTHER";

// ─── DATA TYPES ─────────────────────────────────────────────────────────────

export interface AdminRequestUser {
    id: string;
    name: string | null;
    email: string;
    employeeCode: string | null;
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
    image: string | null;
    manager: { id: string; name: string | null } | null;
}

export interface AdminRequestListItem {
    id: string;
    userId: string;
    type: AdminRequestType;
    description: string;
    status: AdminRequestStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
    responseAttachment: string | null;
    createdAt: string;
    updatedAt: string;
    user: AdminRequestUser;
}

export interface AdminRequestDetail extends AdminRequestListItem {
    reviewedByUser?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
}

// ─── FILTER TYPES ───────────────────────────────────────────────────────────

export interface AdminRequestFilters {
    status?: AdminRequestStatus | "ALL";
    type?: AdminRequestType | "ALL";
    departmentId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
}

// ─── STATS ─────────────────────────────────────────────────────────────────

export interface AdminRequestStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    thisMonth: number;
}

// ─── ACTIONS DATA ────────────────────────────────────────────────────────────

export interface ApproveAdminRequestData {
    responseAttachment?: string;
    notes?: string;
}

export interface RejectAdminRequestData {
    reason: string;
}

// ─── REQUEST TYPE CONFIG ─────────────────────────────────────────────────────

export const ADMIN_REQUEST_TYPE_LABELS: Record<AdminRequestType, string> = {
    SALARY_CONFIRMATION: "Xác nhận lương",
    WORK_CERTIFICATE: "Giấy xác nhận lao động",
    TAX_CONFIRMATION: "Xác nhận thuế",
    SOCIAL_INSURANCE: "Sổ BHXH/Sổ bảo hiểm",
    RESIGNATION_LETTER: "Đơn xin nghỉ việc",
    RECOMMENDATION_LETTER: "Thư giới thiệu",
    OTHER: "Khác",
};

export const ADMIN_REQUEST_STATUS_LABELS: Record<AdminRequestStatus, string> = {
    PENDING: "Đang chờ",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
};

export const ADMIN_REQUEST_STATUS_COLORS: Record<AdminRequestStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    APPROVED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-100",
    CANCELLED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

// Loại request nào cần tạo Offboarding khi duyệt
export const RESIGNATION_TYPES: AdminRequestType[] = ["RESIGNATION_LETTER"];

// Offboarding Module Types

export type OffboardingStatus = "PROCESSING" | "COMPLETED" | "CANCELLED";

export type ChecklistCategory = "GENERAL" | "ASSET" | "ACCOUNT" | "FINANCIAL" | "INTERVIEW";

export type AssetReturnStatus = "PENDING" | "RETURNED" | "DAMAGED" | "NOT_RETURNED";

export type AssetCondition = "GOOD" | "DAMAGED" | "LOST";

export interface OffboardingTemplateTask {
    id: string;
    title: string;
    description: string | null;
    category: ChecklistCategory;
    assigneeRole: string | null;
    dueDays: number;
    sortOrder: number;
    isRequired: boolean;
}

export interface OffboardingTemplate {
    id: string;
    name: string;
    description: string | null;
    tasks: OffboardingTemplateTask[];
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface UserBasicInfo {
    id: string;
    name: string;
    email: string;
    username: string | null;
    departmentId: string | null;
    position: string | null;
    image: string | null;
}

export interface OffboardingListItem {
    id: string;
    userId: string;
    templateId: string | null;
    resignDate: Date | string;
    lastWorkDate: Date | string;
    reason: string | null;
    status: OffboardingStatus;
    createdAt: Date | string;
    completedAt: Date | string | null;
    user: UserBasicInfo;
    template: {
        id: string;
        name: string;
    } | null;
    _count: {
        checklist: number;
        assets: number;
    };
}

export interface ChecklistItem {
    id: string;
    taskTitle: string;
    taskDescription: string | null;
    category: ChecklistCategory;
    assigneeRole: string | null;
    assigneeId: string | null;
    isCompleted: boolean;
    completedBy: string | null;
    completedAt: Date | string | null;
    dueDate: Date | string | null;
    notes: string | null;
}

export interface OffboardingAsset {
    id: string;
    assetId: string | null;
    assetName: string;
    assetCode: string | null;
    category: string | null;
    status: AssetReturnStatus;
    returnDate: Date | string | null;
    returnedTo: string | null;
    condition: AssetCondition | null;
    notes: string | null;
}

export interface OffboardingDetailData extends OffboardingListItem {
    reasonDetail: string | null;
    exitInterview: string | null;
    interviewDate: Date | string | null;
    interviewerId: string | null;
    finalSalary: number | null;
    unusedLeaveDays: number | null;
    unusedLeaveAmount: number | null;
    severancePay: number | null;
    otherAllowances: number | null;
    totalFinalPayment: number | null;
    createdBy: string | null;
    updatedAt: Date | string;
    checklist: ChecklistItem[];
    assets: OffboardingAsset[];
}

// Form Types
export interface CreateOffboardingFormData {
    userId: string;
    templateId?: string;
    resignDate: Date;
    lastWorkDate: Date;
    reason: string;
    reasonDetail?: string;
}

export interface UpdateSettlementFormData {
    finalSalary: number;
    unusedLeaveDays: number;
    unusedLeaveAmount: number;
    severancePay?: number;
    otherAllowances?: number;
}

// Constants
export const OFFBOARDING_STATUS_LABELS: Record<OffboardingStatus, string> = {
    PROCESSING: "Đang xử lý",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
};

export const OFFBOARDING_STATUS_COLORS: Record<OffboardingStatus, string> = {
    PROCESSING: "bg-yellow-500",
    COMPLETED: "bg-green-500",
    CANCELLED: "bg-gray-500",
};

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
    GENERAL: "Chung",
    ASSET: "Tài sản",
    ACCOUNT: "Tài khoản",
    FINANCIAL: "Tài chính",
    INTERVIEW: "Exit Interview",
};

export const CHECKLIST_CATEGORY_COLORS: Record<ChecklistCategory, string> = {
    GENERAL: "bg-blue-100 text-blue-800",
    ASSET: "bg-purple-100 text-purple-800",
    ACCOUNT: "bg-orange-100 text-orange-800",
    FINANCIAL: "bg-green-100 text-green-800",
    INTERVIEW: "bg-pink-100 text-pink-800",
};

export const ASSET_STATUS_LABELS: Record<AssetReturnStatus, string> = {
    PENDING: "Chờ trả",
    RETURNED: "Đã trả",
    DAMAGED: "Hư hỏng",
    NOT_RETURNED: "Không trả",
};

export const REASON_OPTIONS = [
    { value: "VOLUNTARY", label: "Nghỉ việc theo nguyện vọng" },
    { value: "RESIGNED", label: "Tự ý nghỉ" },
    { value: "END_CONTRACT", label: "Hết hạn hợp đồng" },
    { value: "TERMINATED", label: "Chấm dứt hợp đồng" },
    { value: "RETIREMENT", label: "Nghỉ hưu" },
    { value: "OTHER", label: "Lý do khác" },
];

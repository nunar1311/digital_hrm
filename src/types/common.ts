// =============================================================================
// Common / Shared Types
// Mirrors Prisma models: Reward, Asset, AssetAssignment, Onboarding,
//   Offboarding, TimelineEvent, Notification, AuditLog, SystemSetting
// Also includes shared utility types.
// =============================================================================

// ─── Khen thưởng & Kỷ luật ──────────────────────────────────────────────────

export interface Reward {
    id: string;
    employeeId: string;
    type: 'REWARD' | 'DISCIPLINE';
    title: string;
    description: string | null;
    amount: number | null;
    decisionDate: string;
    decisionNo: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy: string | null;
    createdAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
}

// ─── Tài sản ─────────────────────────────────────────────────────────────────

export interface Asset {
    id: string;
    name: string;
    code: string;
    category: 'LAPTOP' | 'PHONE' | 'DESK' | 'CHAIR' | 'MONITOR' | 'OTHER';
    status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'DISPOSED';
    purchaseDate: string | null;
    purchasePrice: number | null;
    serialNumber: string | null;
    description: string | null;
}

export interface AssetAssignment {
    id: string;
    assetId: string;
    employeeId: string;
    assignDate: string;
    returnDate: string | null;
    status: 'ASSIGNED' | 'RETURNED';
    notes: string | null;
    // Resolved
    assetName?: string;
    assetCode?: string;
    employeeName?: string;
    employeeCode?: string;
}

// ─── Onboarding / Offboarding ────────────────────────────────────────────────

export interface OnboardingTemplate {
    id: string;
    name: string;
    isActive: boolean;
    tasks: OnboardingTask[];
}

export interface OnboardingTask {
    id: string;
    templateId: string;
    title: string;
    description: string | null;
    assigneeRole: string | null;
    dueDay: number;
    sortOrder: number;
}

export interface Onboarding {
    id: string;
    employeeId: string;
    startDate: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    completedAt: string | null;
    checklist: OnboardingChecklist[];
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    progress?: number;
}

export interface OnboardingChecklist {
    id: string;
    onboardingId: string;
    taskTitle: string;
    isCompleted: boolean;
    completedBy: string | null;
    completedAt: string | null;
    notes: string | null;
}

export interface Offboarding {
    id: string;
    employeeId: string;
    resignDate: string;
    lastWorkDate: string;
    reason: string | null;
    status: 'PROCESSING' | 'COMPLETED';
    exitInterview: string | null;
    checklist: OffboardingChecklist[];
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    progress?: number;
}

export interface OffboardingChecklist {
    id: string;
    offboardingId: string;
    taskTitle: string;
    isCompleted: boolean;
    completedBy: string | null;
    completedAt: string | null;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export interface TimelineEvent {
    id: string;
    employeeId: string;
    date: string;
    type:
    | 'HIRED'
    | 'PROMOTED'
    | 'DEPARTMENT_CHANGE'
    | 'CONTRACT_RENEWED'
    | 'SALARY_CHANGE'
    | 'LEAVE'
    | 'REWARD'
    | 'DISCIPLINE'
    | 'TRAINING'
    | 'RESIGNED';
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
}

// ─── System ──────────────────────────────────────────────────────────────────

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'APPROVAL' | 'SYSTEM';
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
    entity: string;
    entityId: string | null;
    oldData: Record<string, unknown> | null;
    newData: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    // Resolved
    userName?: string;
}

export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    group: 'general' | 'attendance' | 'payroll' | 'leave' | null;
}

// ─── Shared Utility Types ────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export interface FilterParams {
    search?: string;
    departmentId?: string;
    status?: string;
    employmentType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Leave Types
// Mirrors Prisma models: LeaveType, LeaveBalance, LeaveRequest
// =============================================================================

export interface LeaveType {
    id: string;
    name: string;
    description: string | null;
    defaultDays: number;
    isPaidLeave: boolean;
    isActive: boolean;
}

export interface LeaveBalance {
    id: string;
    userId: string;
    leaveTypeId: string;
    policyYear: number;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    // Resolved
    leaveTypeName?: string;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    leaveTypeId: string;
    leaveBalanceId: string | null;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    documentUrl: string | null;
    createdAt: string;
    updatedAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    departmentName?: string;
    leaveTypeName?: string;
    approverName?: string;
}

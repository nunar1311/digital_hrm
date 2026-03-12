// =============================================================================
// Leave Types
// Mirrors Prisma models: LeaveType, LeaveBalance, LeaveRequest
// =============================================================================

export interface LeaveType {
    id: string;
    name: string;
    code: string;
    defaultDays: number;
    isPaid: boolean;
    isCarryOver: boolean;
    maxCarryOverDays: number | null;
    requireApproval: boolean;
    color: string | null;
    isActive: boolean;
}

export interface LeaveBalance {
    id: string;
    employeeId: string;
    leaveTypeId: string;
    year: number;
    totalDays: number;
    usedDays: number;
    remainDays: number;
    // Resolved
    leaveTypeName?: string;
    leaveTypeColor?: string;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy: string | null;
    approvedAt: string | null;
    rejectedReason: string | null;
    attachmentUrl: string | null;
    createdAt: string;
    updatedAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    departmentName?: string;
    leaveTypeName?: string;
    leaveTypeColor?: string;
    approverName?: string;
}

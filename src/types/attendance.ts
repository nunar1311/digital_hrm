// =============================================================================
// Attendance Types
// Mirrors Prisma models: Shift, Attendance, AttendanceExplanation, OvertimeRequest
// =============================================================================

export interface Shift {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    isDefault: boolean;
    isActive: boolean;
}

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    shiftId: string | null;
    checkIn: string | null;
    checkOut: string | null;
    checkInMethod: 'MANUAL' | 'QR' | 'FACE_ID' | 'GPS' | null;
    checkOutMethod: 'MANUAL' | 'QR' | 'FACE_ID' | 'GPS' | null;
    workHours: number | null;
    overtimeHours: number | null;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'HALF_DAY';
    note: string | null;
    isLocked: boolean;
    createdAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    shiftName?: string;
}

export interface AttendanceExplanation {
    id: string;
    attendanceId: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    // Resolved
    employeeName?: string;
    date?: string;
}

export interface OvertimeRequest {
    id: string;
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy: string | null;
    approvedAt: string | null;
    coefficient: number;
    createdAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
}

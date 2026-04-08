// ============================================================
// ESS Shared Types
// ============================================================

export interface ESSProfile {
    username: string;
    fullName?: string;
    name?: string;
    department?: { name: string };
    position?: { name: string };
    avatar?: string;
}

export interface ESSLeaveBalance {
    id: string;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    carriedForward: number;
    policyYear: number;
    leaveType: {
        id: string;
        name: string;
        description: string | null;
        isPaidLeave: boolean;
    };
}

export interface ESSAttendanceSummary {
    standardDays: number;
    totalWorkDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
    totalOtHours: number;
}

export interface ESSTodayShift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

export interface ESSTodayAttendance {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    shift: ESSTodayShift | null;
}

export interface ESSHoliday {
    id: string;
    name: string;
    date: string;
}

export interface ESSAnnouncement {
    id: string;
    title: string;
    content: string;
    date: string;
    type: string;
}

export interface ESSPendingRequests {
    leaveRequests: number;
    profileRequests: number;
    adminRequests: number;
    total: number;
}

export interface ESSDashboardData {
    profile: ESSProfile;
    leaveBalances: ESSLeaveBalance[];
    attendanceSummary: ESSAttendanceSummary;
    todayShift: ESSTodayShift | null;
    todayAttendance: ESSTodayAttendance | null;
    upcomingHolidays: ESSHoliday[];
    announcements: ESSAnnouncement[];
    pendingRequests: ESSPendingRequests;
}

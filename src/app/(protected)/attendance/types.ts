// ─── Shared Attendance Module Types ───
// Derived from Prisma schema + server action return shapes.
// No `any` — all fields are explicitly typed.

// ─── Base Entities ───

export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY_LEAVE"
    | "LATE_AND_EARLY"
    | "ABSENT"
    | "HALF_DAY"
    | "ON_LEAVE"
    | "HOLIDAY";

export type CheckInMethod =
    | "GPS"
    | "WIFI"
    | "FACE_ID"
    | "MANUAL"
    | "QR"
    | "VANTAY";

export type ExplanationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ExplanationType =
    | "LATE"
    | "EARLY_LEAVE"
    | "ABSENT"
    | "FORGOT_CHECKOUT"
    | "OTHER";

export type OvertimeStatus =
    | "PENDING"
    | "MANAGER_APPROVED"
    | "HR_APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";

export type OvertimeDayType = "WEEKDAY" | "WEEKEND" | "HOLIDAY";

// ─── Shift ───

export interface Shift {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    lateThreshold: number;
    earlyThreshold: number;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        attendances: number;
        shiftAssignments: number;
    };
}

/** Shift without _count, used as nested relation */
export interface ShiftBasic {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    lateThreshold: number;
    earlyThreshold: number;
    isDefault: boolean;
    isActive: boolean;
}

// ─── Shift Assignment ───

export interface ShiftAssignment {
    id: string;
    userId: string;
    shiftId: string | null;
    startDate: string;
    endDate: string | null;
    workCycleId: string | null;
    cycleStartDate: string | null;
    createdAt: string;
    user: UserBasic;
    shift: ShiftBasic | null;
    workCycle: WorkCycle | null;
}

// ─── User (partial, as returned by server actions) ───

export interface UserBasic {
    id: string;
    name: string;
    employeeCode: string | null;
    departmentId?: string | null;
    image?: string | null;
}

// ─── Attendance Explanation ───

export interface AttendanceExplanation {
    id: string;
    attendanceId: string;
    type: ExplanationType;
    reason: string;
    status: ExplanationStatus;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectedReason: string | null;
    attachment: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Explanation with nested attendance (for "my explanations") */
export interface ExplanationWithAttendance extends AttendanceExplanation {
    attendance: AttendanceRecord & {
        shift: ShiftBasic | null;
    };
}

/** Explanation with nested attendance + user (for pending/all) */
export interface ExplanationWithAttendanceAndUser extends AttendanceExplanation {
    attendance: AttendanceRecord & {
        user: UserBasic;
        shift: ShiftBasic | null;
    };
}

/** Attendance record eligible for explanation (abnormal status, no approved explanation) */
export interface ExplainableAttendance extends AttendanceRecord {
    shift: ShiftBasic | null;
    explanation: AttendanceExplanation | null;
}

// ─── Attendance Record ───

export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string;
    shiftId: string | null;
    checkIn: string | null;
    checkOut: string | null;
    checkInMethod: CheckInMethod | null;
    checkOutMethod: CheckInMethod | null;
    checkInLocation: string | null;
    checkOutLocation: string | null;
    checkInPhoto: string | null;
    checkOutPhoto: string | null;
    checkInDeviceId: string | null;
    checkOutDeviceId: string | null;
    checkInVerified: boolean;
    checkOutVerified: boolean;
    workHours: number | null;
    overtimeHours: number | null;
    lateMinutes: number;
    earlyMinutes: number;
    status: AttendanceStatus;
    note: string | null;
    isLocked: boolean;
    source: string;
    createdAt: string;
    updatedAt: string;
}

/** Attendance with shift + explanation (for getTodayAttendance) */
export interface AttendanceWithDetails extends AttendanceRecord {
    shift: ShiftBasic | null;
    explanation: AttendanceExplanation | null;
}

/** Return type of getTodayAttendance() */
export interface TodayAttendanceData {
    attendance: AttendanceWithDetails | null;
    assignedShift: ShiftBasic | null;
    todayShifts: ShiftBasic[];
    hasShiftToday: boolean;
}

// ─── Attendance Config ───

export interface WifiWhitelist {
    id: string;
    configId: string;
    ssid: string;
    bssid: string | null;
}

export interface AttendanceConfig {
    id: string;
    requireGps: boolean;
    requireWifi: boolean;
    requireSelfie: boolean;
    maxGpsDistanceMeters: number;
    officeLat: number | null;
    officeLng: number | null;
    standardWorkHours: number;
    standardWorkDays: number;
    otWeekdayCoeff: number;
    otWeekendCoeff: number;
    otHolidayCoeff: number;
    createdAt: string;
    updatedAt: string;
    wifiWhitelist: WifiWhitelist[];
}

// ─── Overtime Request ───

export interface OvertimeRequest {
    id: string;
    userId: string;
    requestedBy: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    reason: string;
    status: OvertimeStatus;
    // Manager approval
    managerApprovedBy: string | null;
    managerApprovedAt: string | null;
    managerNote: string | null;
    // HR approval
    hrApprovedBy: string | null;
    hrApprovedAt: string | null;
    hrNote: string | null;
    // Rejection
    rejectedBy: string | null;
    rejectedAt: string | null;
    rejectedReason: string | null;
    rejectedStep: string | null;
    // Actual hours confirmation
    actualStartTime: string | null;
    actualEndTime: string | null;
    actualHours: number | null;
    confirmedAt: string | null;
    coefficient: number;
    dayType: OvertimeDayType;
    createdAt: string;
    updatedAt: string;
    user: UserBasic;
}

export interface OvertimeRequestsPage {
    items: OvertimeRequest[];
    nextCursor: string | null;
}

// ─── Monthly Attendance Data ───

export interface Holiday {
    id: string;
    name: string;
    date: string;
    endDate: string | null;
    isRecurring: boolean;
    year: number | null;
    createdAt: string;
}

export interface MonthlyAttendanceData {
    users: UserBasic[];
    attendances: (AttendanceRecord & {
        shift: ShiftBasic | null;
        explanation: AttendanceExplanation | null;
    })[];
    overtimes: {
        id: string;
        userId: string;
        date: string;
        hours: number;
        dayType: OvertimeDayType;
    }[];
    holidays: Holiday[];
    daysInMonth: number;
    month: number;
    year: number;
    scheduledWorkDays: Record<string, number[]>;
}

// ─── Attendance Summary ───

export interface AttendanceSummary {
    id: string;
    userId: string;
    month: number;
    year: number;
    totalWorkDays: number;
    standardDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    absentDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
    holidayDays: number;
    otHoursWeekday: number;
    otHoursWeekend: number;
    otHoursHoliday: number;
    totalOtHours: number;
    totalWorkHours: number;
    isLocked: boolean;
    lockedBy: string | null;
    lockedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        employeeCode: string | null;
    };
}

// ─── Monthly Grid Row (computed on client) ───

export interface MonthlyGridRow {
    user: UserBasic;
    days: (AttendanceStatus | null)[];
    workDays: number;
    lateDays: number;
    absentDays: number;
}

// ─── Department (minimal, for filters) ───

export interface DepartmentBasic {
    id: string;
    name: string;
    code: string | null;
}

// ─── Timekeeper Device ───

export type TimekeeperDeviceType =
    | "FINGERPRINT"
    | "FACE_ID"
    | "CARD"
    | "QR";

export interface TimekeeperDevice {
    id: string;
    name: string;
    code: string;
    type: TimekeeperDeviceType;
    location: string | null;
    ipAddress: string | null;
    apiKey: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Work Cycle (Chu kỳ làm việc linh động) ───

export interface WorkCycleEntryShift {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
}

export interface WorkCycleEntry {
    id: string;
    workCycleId: string;
    dayIndex: number;
    shiftId: string | null;
    isDayOff: boolean;
    shift: WorkCycleEntryShift | null;
}

export interface WorkCycle {
    id: string;
    name: string;
    description: string | null;
    totalDays: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    entries: WorkCycleEntry[];
}

// ─── Attendance Record (admin detail view) ───

export interface AttendanceRecordWithUser extends AttendanceRecord {
    user: UserBasic;
    shift: ShiftBasic | null;
    explanation: AttendanceExplanation | null;
}

export interface AttendanceRecordsResult {
    records: AttendanceRecordWithUser[];
    total: number;
    page: number;
    pageSize: number;
}

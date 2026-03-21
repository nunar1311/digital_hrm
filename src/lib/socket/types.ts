// ─── SOCKET.IO EVENT TYPES ───
// Định nghĩa tất cả các event types cho WebSocket communication

// === Attendance Events ===

export interface AttendanceCheckInEvent {
    attendanceId: string;
    userId: string;
    userName: string;
    checkInTime: string; // ISO string
    status: string;
    lateMinutes: number;
    shiftName?: string;
}

export interface AttendanceCheckOutEvent {
    attendanceId: string;
    userId: string;
    userName: string;
    checkOutTime: string; // ISO string
    status: string;
    earlyMinutes: number;
    workHours: number;
    shiftName?: string;
}

export interface AttendanceUpdatedEvent {
    attendanceId: string;
    userId: string;
    changes: Record<string, unknown>;
}

// === Overtime Events ===

export interface OvertimeRequestEvent {
    requestId: string;
    userId: string;
    userName: string;
    date: string;
    hours: number;
    status: string;
}

export interface OvertimeApprovedEvent {
    requestId: string;
    userId: string;
    approvedBy: string;
    status: string;
}

export interface OvertimeRejectedEvent {
    requestId: string;
    rejectedBy: string;
    step: "MANAGER" | "HR";
}

export interface OvertimeCompletedEvent {
    requestId: string;
    userId: string;
    actualHours: number;
}

// === Explanation Events ===

export interface ExplanationSubmittedEvent {
    explanationId: string;
    userId: string;
    userName: string;
    type: string;
    date: string;
}

export interface ExplanationApprovedEvent {
    explanationId: string;
    userId: string;
    approvedBy: string;
    status: string;
}

// === Shift Events ===

export interface ShiftUpdatedEvent {
    shiftId: string;
    shiftName: string;
    action: "created" | "updated" | "deleted";
}

export interface ShiftAssignedEvent {
    userId: string;
    shiftId?: string;
    shiftName?: string;
    startDate?: string;
    endDate?: string;
    action?: "assigned" | "removed";
    workCycleId?: string;
    cycleName?: string;
    cycleStartDate?: string;
}

// === Config Events ===

export interface ConfigUpdatedEvent {
    configId: string;
    changes: Record<string, unknown>;
}

// ─── Employee Events ───────────────────────────────────────────────

export interface EmployeeCreatedEvent {
    employeeId: string;
    employeeName: string;
    departmentId: string;
    departmentName: string;
}

export interface EmployeeUpdatedEvent {
    employeeId: string;
    employeeName: string;
    changes: Record<string, unknown>;
}

export interface EmployeeDeletedEvent {
    employeeId: string;
    employeeName: string;
}

export interface EmployeeDepartmentChangedEvent {
    employeeId: string;
    employeeName: string;
    previousDepartmentId: string;
    previousDepartmentName: string;
    newDepartmentId: string;
    newDepartmentName: string;
}

// === Org-Chart / Department Events ===

export interface DepartmentCreatedEvent {
    departmentId: string;
    departmentName: string;
    parentId: string | null;
}

export interface DepartmentUpdatedEvent {
    departmentId: string;
    departmentName: string;
    changes: Record<string, unknown>;
}

export interface DepartmentDeletedEvent {
    departmentId: string;
}

export interface DepartmentEmployeeMovedEvent {
    employeeId: string;
    targetDepartmentId: string;
}

export interface DepartmentTemplateAppliedEvent {
    templateId: string;
}

// === Settings Events ===

export interface SettingsUpdatedEvent {
    group: string;
    changes: Record<string, unknown>;
}

export interface RoleUpdatedEvent {
    userId: string;
    userName: string;
    newRole: string;
    updatedBy: string;
}

// === Asset Events ===

export interface AssetCreatedEvent {
    assetId: string;
    assetName: string;
    assetCode: string;
    category: string;
    createdBy: string;
    createdByName: string;
}

export interface AssetUpdatedEvent {
    assetId: string;
    changes: Record<string, unknown>;
}

export interface AssetDeletedEvent {
    assetId: string;
    assetName: string;
    assetCode: string;
}

export interface CompanyUpdatedEvent {
    changes: Record<string, unknown>;
}

export interface CompanyLogoUpdatedEvent {
    logo: string;
}

export interface AssetAssignedEvent {
    assetId: string;
    assetName: string;
    userId: string;
    userName: string;
    assignedBy: string;
    assignedByName: string;
    assignDate: string;
    expectedReturn?: string;
}

export interface AssetReturnedEvent {
    assetId: string;
    assetName: string;
    userId: string;
    userName: string;
    returnedBy: string;
    returnedByName: string;
    returnDate: string;
    condition: "GOOD" | "DAMAGED" | "LOST";
}

// === Server → Client Events ===
export interface ServerToClientEvents {
    "employee:created": (data: EmployeeCreatedEvent) => void;
    "employee:updated": (data: EmployeeUpdatedEvent) => void;
    "employee:deleted": (data: EmployeeDeletedEvent) => void;
    "employee:department-changed": (
        data: EmployeeDepartmentChangedEvent,
    ) => void;
    "attendance:check-in": (data: AttendanceCheckInEvent) => void;
    "attendance:check-out": (data: AttendanceCheckOutEvent) => void;
    "attendance:updated": (data: AttendanceUpdatedEvent) => void;
    "overtime:requested": (data: OvertimeRequestEvent) => void;
    "overtime:approved": (data: OvertimeApprovedEvent) => void;
    "overtime:manager-approved": (
        data: OvertimeApprovedEvent,
    ) => void;
    "overtime:hr-approved": (data: OvertimeApprovedEvent) => void;
    "overtime:rejected": (data: OvertimeRejectedEvent) => void;
    "overtime:completed": (data: OvertimeCompletedEvent) => void;
    "explanation:submitted": (
        data: ExplanationSubmittedEvent,
    ) => void;
    "explanation:approved": (data: ExplanationApprovedEvent) => void;
    "shift:updated": (data: ShiftUpdatedEvent) => void;
    "shift:assigned": (data: ShiftAssignedEvent) => void;
    "config:updated": (data: ConfigUpdatedEvent) => void;
    "department:created": (data: DepartmentCreatedEvent) => void;
    "department:updated": (data: DepartmentUpdatedEvent) => void;
    "department:deleted": (data: DepartmentDeletedEvent) => void;
    "department:employee-moved": (
        data: DepartmentEmployeeMovedEvent,
    ) => void;
    "department:template-applied": (
        data: DepartmentTemplateAppliedEvent,
    ) => void;
    "settings:updated": (data: SettingsUpdatedEvent) => void;
    "settings:role-updated": (data: RoleUpdatedEvent) => void;
    "asset:created": (data: AssetCreatedEvent) => void;
    "asset:updated": (data: AssetUpdatedEvent) => void;
    "asset:deleted": (data: AssetDeletedEvent) => void;
    "asset:assigned": (data: AssetAssignedEvent) => void;
    "asset:returned": (data: AssetReturnedEvent) => void;
    "company:updated": (data: CompanyUpdatedEvent) => void;
    "company:logo-updated": (data: CompanyLogoUpdatedEvent) => void;
}

// === Client → Server Events ===
export interface ClientToServerEvents {
    "join:organization": (orgId: string) => void;
    "join:user": (userId: string) => void;
    "leave:organization": (orgId: string) => void;
    "leave:user": (userId: string) => void;
}

// === Event Names (for convenience) ===
export const SOCKET_EVENTS = {
    ATTENDANCE_CHECK_IN: "attendance:check-in",
    ATTENDANCE_CHECK_OUT: "attendance:check-out",
    ATTENDANCE_UPDATED: "attendance:updated",
    OVERTIME_REQUESTED: "overtime:requested",
    OVERTIME_APPROVED: "overtime:approved",
    OVERTIME_MANAGER_APPROVED: "overtime:manager-approved",
    OVERTIME_HR_APPROVED: "overtime:hr-approved",
    OVERTIME_REJECTED: "overtime:rejected",
    OVERTIME_COMPLETED: "overtime:completed",
    EXPLANATION_SUBMITTED: "explanation:submitted",
    EXPLANATION_APPROVED: "explanation:approved",
    SHIFT_UPDATED: "shift:updated",
    SHIFT_ASSIGNED: "shift:assigned",
    CONFIG_UPDATED: "config:updated",
    DEPARTMENT_CREATED: "department:created",
    DEPARTMENT_UPDATED: "department:updated",
    DEPARTMENT_DELETED: "department:deleted",
    DEPARTMENT_EMPLOYEE_MOVED: "department:employee-moved",
    DEPARTMENT_TEMPLATE_APPLIED: "department:template-applied",
    SETTINGS_UPDATED: "settings:updated",
    SETTINGS_ROLE_UPDATED: "settings:role-updated",
    ASSET_CREATED: "asset:created",
    ASSET_UPDATED: "asset:updated",
    ASSET_DELETED: "asset:deleted",
    ASSET_ASSIGNED: "asset:assigned",
    ASSET_RETURNED: "asset:returned",
    COMPANY_UPDATED: "company:updated",
    COMPANY_LOGO_UPDATED: "company:logo-updated",
} as const;

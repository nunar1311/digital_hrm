// =============================================================================
// Barrel Export — All HRM Types
// =============================================================================

// Organization
export type { Department, Position, JobTitle } from './department';

// Employee
export type {
    Employee,
    EmergencyContact,
    Dependent,
    WorkHistory,
} from './employee';

// Contract
export type { Contract, ContractTemplate, ContractAppendix } from './contract';

// Leave
export type { LeaveType, LeaveBalance, LeaveRequest } from './leave';

// Attendance
export type {
    Shift,
    Attendance,
    AttendanceExplanation,
    OvertimeRequest,
} from './attendance';

// Payroll
export type {
    PayrollPeriod,
    PayrollRecord,
    PayrollFormula,
    TaxBracket,
} from './payroll';

// Recruitment
export type { JobPosting, Candidate } from './recruitment';

// Training & Performance
export type {
    TrainingCourse,
    TrainingParticipant,
    PerformanceCycle,
    PerformanceReview,
} from './training';

// Common / Shared
export type {
    Reward,
    Asset,
    AssetAssignment,
    OnboardingTemplate,
    OnboardingTask,
    Onboarding,
    OnboardingChecklist,
    Offboarding,
    OffboardingChecklist,
    TimelineEvent,
    Notification,
    AuditLog,
    SystemSetting,
    PaginatedResult,
    FilterParams,
} from './common';

// Theme (existing)
export type {
    ThemeStyleProps,
    ThemeMetadata,
    ThemeStyles,
    ThemeEditorState,
    ThemePreset,
} from './theme';

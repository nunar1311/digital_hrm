// =============================================================================
// Barrel Export — All HRM Types
// =============================================================================

// Organization
export type {
    Department,
    Position,
    PositionAuthority,
    PositionStatus,
} from './department';

// Employee
export type {
    Employee,
    EmergencyContact,
    Dependent,
    WorkHistory,
} from './employee';

// Contract
export type { Contract, ContractTemplate } from './contract';

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

// Onboarding
export {
    ONBOARDING_STATUS,
    ONBOARDING_CATEGORY,
    ONBOARDING_ASSIGNEE_ROLE,
    CATEGORY_LABELS,
    ASSIGNEE_ROLE_LABELS,
    STATUS_LABELS,
} from './onboarding';
export type {
    OnboardingStatus,
    OnboardingCategory,
    OnboardingAssigneeRole,
    OnboardingTemplateDB,
    OnboardingTaskDB,
    OnboardingDB,
    OnboardingChecklistDB,
    OnboardingUserInfo,
    OnboardingCandidateInfo,
    OnboardingWithProgress,
    OnboardingListParams,
    OnboardingListResult,
    HireCandidateData,
    CreateOnboardingData,
    UpdateOnboardingData,
    UpdateChecklistData,
    CreateTemplateData,
    CreateTaskData,
    UpdateTemplateData,
    WelcomePortalData,
} from './onboarding';

// Theme (existing)
export type {
    ThemeStyleProps,
    ThemeMetadata,
    ThemeStyles,
    ThemeEditorState,
    ThemePreset,
} from './theme';

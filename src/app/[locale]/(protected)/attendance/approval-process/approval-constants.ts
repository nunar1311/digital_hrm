// ─── Attendance Approval Process Constants ───

export const STEP_TYPE_OPTIONS = [
    {
        value: "APPROVER",
        labelKey: "attendanceApprovalStepTypeApprover",
    },
    {
        value: "CONDITION",
        labelKey: "attendanceApprovalStepTypeCondition",
    },
] as const;

export const APPROVER_TYPE_OPTIONS = [
    {
        value: "DIRECT_MANAGER",
        labelKey: "attendanceApprovalApproverTypeDirectManager",
        descriptionKey: "attendanceApprovalApproverTypeDirectManagerDescription",
    },
    {
        value: "MANAGER_LEVEL",
        labelKey: "attendanceApprovalApproverTypeManagerLevel",
        descriptionKey: "attendanceApprovalApproverTypeManagerLevelDescription",
    },
    {
        value: "DEPT_HEAD",
        labelKey: "attendanceApprovalApproverTypeDeptHead",
        descriptionKey: "attendanceApprovalApproverTypeDeptHeadDescription",
    },
    {
        value: "CUSTOM_LIST",
        labelKey: "attendanceApprovalApproverTypeCustomList",
        descriptionKey: "attendanceApprovalApproverTypeCustomListDescription",
    },
] as const;

export const APPROVAL_METHOD_OPTIONS = [
    {
        value: "ALL_MUST_APPROVE",
        labelKey: "attendanceApprovalMethodAllMustApprove",
        descriptionKey: "attendanceApprovalMethodAllMustApproveDescription",
    },
    {
        value: "FIRST_APPROVES",
        labelKey: "attendanceApprovalMethodFirstApproves",
        descriptionKey: "attendanceApprovalMethodFirstApprovesDescription",
    },
] as const;

export const CONDITION_TYPE_OPTIONS = [
    {
        value: "DEPARTMENT",
        labelKey: "attendanceApprovalConditionTypeDepartment",
        descriptionKey: "attendanceApprovalConditionTypeDepartmentDescription",
    },
    {
        value: "PAYROLL_COMPANY",
        labelKey: "attendanceApprovalConditionTypePayrollCompany",
        descriptionKey: "attendanceApprovalConditionTypePayrollCompanyDescription",
    },
    {
        value: "OTHER",
        labelKey: "attendanceApprovalConditionTypeOther",
        descriptionKey: "attendanceApprovalConditionTypeOtherDescription",
    },
] as const;

export const MANAGER_LEVEL_OPTIONS = [
    {
        value: 1,
        labelKey: "attendanceApprovalManagerLevel1",
        descriptionKey: "attendanceApprovalManagerLevel1Description",
    },
    {
        value: 2,
        labelKey: "attendanceApprovalManagerLevel2",
        descriptionKey: "attendanceApprovalManagerLevel2Description",
    },
    {
        value: 3,
        labelKey: "attendanceApprovalManagerLevel3",
        descriptionKey: "attendanceApprovalManagerLevel3Description",
    },
] as const;

export const ADJUSTMENT_STATUS_CONFIG: Record<
    string,
    {
        labelKey: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: string;
    }
> = {
    PENDING: {
        labelKey: "attendanceApprovalAdjustmentStatusPending",
        variant: "secondary",
        icon: "AlertCircle",
    },
    APPROVED: {
        labelKey: "attendanceApprovalAdjustmentStatusApproved",
        variant: "default",
        icon: "CheckCircle",
    },
    REJECTED: {
        labelKey: "attendanceApprovalAdjustmentStatusRejected",
        variant: "destructive",
        icon: "XCircle",
    },
    AUTO_APPROVED: {
        labelKey: "attendanceApprovalAdjustmentStatusAutoApproved",
        variant: "outline",
        icon: "Zap",
    },
    CANCELLED: {
        labelKey: "attendanceApprovalAdjustmentStatusCancelled",
        variant: "outline",
        icon: "Ban",
    },
};

export const DEFAULT_APPROVAL_STEPS: import("../types").ApprovalStep[] = [
    {
        stepOrder: 1,
        stepType: "APPROVER",
        approverType: "DIRECT_MANAGER",
        approvalMethod: "FIRST_APPROVES",
        skipIfNoApproverFound: true,
    },
];

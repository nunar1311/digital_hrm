// Types cho Attendance Approval Process

export interface ApprovalStep {
    stepOrder: number;
    stepType: "APPROVER" | "CONDITION";
    
    // Loại người duyệt (khi stepType = APPROVER)
    approverType?: "DIRECT_MANAGER" | "MANAGER_LEVEL" | "DEPT_HEAD" | "CUSTOM_LIST";
    managerLevel?: number;
    approvalMethod?: "ALL_MUST_APPROVE" | "FIRST_APPROVES";
    customApproverIds?: string[];
    
    // Điều kiện (khi stepType = CONDITION)
    conditionType?: "DEPARTMENT" | "PAYROLL_COMPANY" | "OTHER";
    conditionField?: string;
    conditionOperator?: string;
    conditionValues?: string[];
    
    // Priority cho conditions
    priority?: number;
    
    // Điều kiện bỏ qua
    skipIfNoApproverFound?: boolean;
}

export interface ApprovalProcess {
    id: string;
    name: string;
    isActive: boolean;
    sendEmailReminder?: boolean;
    skipDuplicateApprover?: boolean;
    skipSelfApprover?: boolean;
    steps?: ApprovalStep[];
    createdAt?: Date;
    updatedAt?: Date;
}

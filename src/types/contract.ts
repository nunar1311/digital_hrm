export type ContractStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "PENDING_SIGN"
    | "ACTIVE"
    | "EXPIRED"
    | "TERMINATED";

export type ContractAddendumType = "EXTENSION" | "SALARY_CHANGE";

export type ContractExportFormat = "DOCX" | "PDF";

export interface ContractEmployeeRef {
    id: string;
    name: string;
    username: string | null;
}

export interface ContractTemplateItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    content: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ContractAddendumItem {
    id: string;
    contractId: string;
    addendumType: ContractAddendumType;
    title: string;
    effectiveDate: string;
    oldEndDate: string | null;
    newEndDate: string | null;
    oldSalary: number | null;
    newSalary: number | null;
    reason: string | null;
    notes: string | null;
    createdBy: string | null;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContractListItem {
    id: string;
    contractNumber: string;
    title: string;
    contractTypeId: string | null;
    contractTypeName: string;
    templateId: string | null;
    templateName: string | null;
    employee: ContractEmployeeRef;
    startDate: string;
    endDate: string | null;
    signedDate: string | null;
    status: ContractStatus;
    salary: number | null;
    probationSalary: number | null;
    currency: string;
    fileUrl: string | null;
    notes: string | null;
    expiryInDays: number | null;
    isExpiringIn15Days: boolean;
    isExpiringIn30Days: boolean;
    approvalChain?: any;
    currentStep?: number;
    signedIp?: string | null;
    signedDevice?: string | null;
    eSignatureUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContractHistoryItem {
  id: string;
  contractId: string;
  action: string;
  statusFrom: ContractStatus | null;
  statusTo: ContractStatus | null;
  notes: string | null;
  actorId: string | null;
  actorName?: string;
  createdAt: string;
}

export interface ContractDetailItem extends ContractListItem {
    addendums: ContractAddendumItem[];
    histories: ContractHistoryItem[];
}

export interface ContractListQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: ContractStatus | "ALL";
    expiringWithinDays?: number;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    employeeId?: string;
}

export interface ContractListResult {
    items: ContractListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ContractExportPayload {
    contractId: string;
    format: ContractExportFormat;
    templateId?: string;
}

export interface ContractExportResult {
    fileName: string;
    mimeType: string;
    base64Content: string;
}

// Backward-compatible aliases for shared type barrel exports.
export type Contract = ContractListItem;
export type ContractTemplate = ContractTemplateItem;

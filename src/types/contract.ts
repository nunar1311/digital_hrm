// =============================================================================
// Contract Types
// Mirrors Prisma models: Contract, ContractTemplate
// =============================================================================

export interface Contract {
    id: string;
    contractCode: string;
    employeeId: string;
    contractType: 'PROBATION' | 'DEFINITE' | 'INDEFINITE' | 'SEASONAL';
    templateId: string | null;
    startDate: string;
    endDate: string | null;
    signingDate: string | null;
    salary: number;
    allowances: Record<string, number> | null;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
    notes: string | null;
    attachmentUrl: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
}

export interface ContractTemplate {
    id: string;
    name: string;
    content: string;
    variables: string[] | null;
    isActive: boolean;
    createdAt: string;
}

// =============================================================================
// Payroll Types
// Mirrors Prisma models: PayrollPeriod, PayrollRecord, PayrollFormula, TaxBracket
// =============================================================================

export interface PayrollPeriod {
    id: string;
    month: number;
    year: number;
    status: 'DRAFT' | 'CALCULATING' | 'REVIEW' | 'APPROVED' | 'PAID';
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    // Resolved
    recordCount?: number;
    totalNetSalary?: number;
}

export interface PayrollRecord {
    id: string;
    periodId: string;
    employeeId: string;
    baseSalary: number;
    workDays: number;
    actualWorkDays: number;
    overtimeHours: number;
    overtimePay: number;
    allowances: Record<string, number> | null;
    totalAllowance: number;
    deductions: Record<string, number> | null;
    totalDeduction: number;
    grossSalary: number;
    socialInsurance: number;
    healthInsurance: number;
    unemployment: number;
    personalTax: number;
    netSalary: number;
    notes: string | null;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    departmentName?: string;
}

export interface PayrollFormula {
    id: string;
    name: string;
    code: string;
    formula: string;
    description: string | null;
    isActive: boolean;
}

export interface TaxBracket {
    id: string;
    minIncome: number;
    maxIncome: number | null;
    rate: number;
    deduction: number;
    sortOrder: number;
}

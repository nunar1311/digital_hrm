// ─── Shared Payroll Module Types ───
// Derived from Prisma schema + server action return shapes.
// No `any` — all fields are explicitly typed.

// ─── Salary Component Types ───

export type SalaryComponentCategory =
    | "BASIC"
    | "ALLOWANCE"
    | "BONUS"
    | "DISCIPLINE"
    | "DEDUCTION"
    | "INSURANCE"
    | "TAX"
    | "OVERTIME";

export interface SalaryComponentType {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: SalaryComponentCategory;
    isTaxable: boolean;
    isInsurance: boolean;
    isBase: boolean;
    coefficient: number | null;
    maxAmount: number | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Employee Salary Component ───

export interface EmployeeSalaryComponent {
    id: string;
    userId: string;
    componentTypeId: string;
    amount: number;
    effectiveDate: string;
    endDate: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    componentType: SalaryComponentType;
    user?: {
        id: string;
        name: string;
        employeeCode: string | null;
    };
}

// ─── Salary (Base Salary) ───

export interface Salary {
    id: string;
    userId: string;
    baseSalary: number;
    effectiveDate: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
    };
}

// ─── Payroll Record ───

export type PayrollRecordStatus =
    | "DRAFT"
    | "PROCESSING"
    | "COMPLETED"
    | "CANCELLED";

export interface PayrollRecord {
    id: string;
    month: number;
    year: number;
    departmentId: string | null;
    status: PayrollRecordStatus;
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    totalTax: number;
    totalInsurance: number;
    totalDeductions: number;
    processedBy: string | null;
    processedAt: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    department?: {
        id: string;
        name: string;
    } | null;
    details?: PayrollRecordDetail[];
}

// ─── Payroll Record Detail ───

export type PayrollDetailStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PAID";

export interface PayrollRecordDetail {
    id: string;
    payrollRecordId: string;
    userId: string;
    baseSalary: number;
    grossSalary: number;
    taxableIncome: number;
    netSalary: number;
    overtimeAmount: number;
    allowanceAmount: number;
    bonusAmount: number;
    deductionAmount: number;
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    personalDeduction: number;
    dependentDeduction: number;
    taxAmount: number;
    workDays: number;
    standardDays: number;
    lateDays: number;
    overtimeHours: number;
    status: PayrollDetailStatus;
    paidAt: string | null;
    bankAccount: string | null;
    bankName: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        employeeCode: string | null;
        bankAccount: string | null;
        bankName: string | null;
        department?: {
            name: string;
        };
    };
}

// ─── Payroll Config ───

export interface PayrollConfig {
    id: string;
    key: string;
    value: number;
    description: string | null;
    effectiveDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Payslip ───

export type PayslipStatus =
    | "GENERATED"
    | "VIEWED"
    | "DOWNLOADED";

export interface Payslip {
    id: string;
    userId: string;
    payrollRecordId: string;
    month: number;
    year: number;
    employeeCode: string | null;
    employeeName: string;
    departmentName: string | null;
    position: string | null;
    baseSalary: number;
    grossSalary: number;
    netSalary: number;
    earnings: string; // JSON string
    deductions: string; // JSON string
    insurance: string; // JSON string
    tax: string; // JSON string
    status: PayslipStatus;
    viewedAt: string | null;
    downloadedAt: string | null;
    signedBy: string | null;
    signedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        employeeCode: string | null;
        department?: {
            name: string;
        };
    };
    payrollRecord?: PayrollRecord;
}

// ─── Payroll Calculation Result ───

export interface PayrollCalculationResult {
    userId: string;
    baseSalary: number;
    grossSalary: number;
    taxableIncome: number;
    netSalary: number;
    overtimeAmount: number;
    allowanceAmount: number;
    bonusAmount: number;
    deductionAmount: number;
    workDays: number;
    standardDays: number;
    lateDays: number;
    overtimeHours: number;
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    personalDeduction: number;
    dependentDeduction: number;
    taxAmount: number;
}

// ─── Insurance Rates ───

export interface InsuranceRates {
    socialRate: number;
    healthRate: number;
    unemploymentRate: number;
}

// ─── Department (for filters) ───

export interface DepartmentBasic {
    id: string;
    name: string;
}

// ─── Tax Bracket (for reference) ───

export interface TaxBracket {
    max: number;
    rate: number;
    deduction: number;
}

// Vietnamese Tax Brackets 2024
export const TAX_BRACKETS_2024: TaxBracket[] = [
    { max: 5000000, rate: 0.05, deduction: 0 },
    { max: 10000000, rate: 0.1, deduction: 250000 },
    { max: 18000000, rate: 0.15, deduction: 750000 },
    { max: 32000000, rate: 0.2, deduction: 1650000 },
    { max: 52000000, rate: 0.25, deduction: 3250000 },
    { max: 78000000, rate: 0.3, deduction: 5850000 },
    { max: 100000000, rate: 0.35, deduction: 9850000 },
    { max: Infinity, rate: 0.4, deduction: 18150000 },
];

// ─── Default Config Keys ───

export const PAYROLL_CONFIG_KEYS = {
    SOCIAL_INSURANCE_RATE: "SOCIAL_INSURANCE_RATE",
    HEALTH_INSURANCE_RATE: "HEALTH_INSURANCE_RATE",
    UNEMPLOYMENT_INSURANCE_RATE: "UNEMPLOYMENT_INSURANCE_RATE",
    OVERTIME_RATE: "OVERTIME_RATE",
    PERSONAL_DEDUCTION: "PERSONAL_DEDUCTION",
    DEPENDENT_DEDUCTION: "DEPENDENT_DEDUCTION",
} as const;

// ─── Default Values ───

export const DEFAULT_INSURANCE_RATES: InsuranceRates = {
    socialRate: 0.08, // 8%
    healthRate: 0.015, // 1.5%
    unemploymentRate: 0.01, // 1%
};

export const DEFAULT_DEDUCTIONS = {
    personal: 11000000, // 11 triệu
    dependent: 4400000, // 4.4 triệu/người phụ thuộc
};

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
    createdAt: Date;
    updatedAt: Date;
}

// ─── Employee Salary Component ───

export interface EmployeeSalaryComponent {
    id: string;
    userId: string;
    componentTypeId: string;
    amount: number;
    effectiveDate: Date;
    endDate: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    componentType: SalaryComponentType;
    user?: {
        id: string;
        name: string;
        username: string | null;
    };
}

// ─── Salary (Base Salary) ───

export interface Salary {
    id: string;
    userId: string;
    baseSalary: number;
    effectiveDate: Date;
    createdAt: Date;
    updatedAt: Date;
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
    processedByName: string | null;
    processedAt: Date | null;
    approvedBy: string | null;
    approvedByName: string | null;
    approvedAt: Date | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    department?: {
        id: string;
        name: string;
    } | null;
    departments?: { id: string; name: string }[];
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
    proratedSalary: number;
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
    status: string;
    paidAt: Date | null;
    bankAccount: string | null;
    bankName: string | null;
    createdAt: Date;
    updatedAt: Date;
    positionName?: string | null;
    positionAuthority?: string | null;
    user?: {
        id: string;
        name: string;
        username: string | null;
        bankAccount: string | null;
        bankName: string | null;
        department?: {
            id?: string;
            name: string;
        };
        position?: {
            id?: string;
            name: string;
            code?: string;
            authority?: string;
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
    username: string | null;
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
    isSecure: boolean;
    passwordHash: string | null;
    viewedAt: Date | null;
    downloadedAt: Date | null;
    sentEmailAt: Date | null;
    signedBy: string | null;
    signedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        name: string;
        email: string;
        username: string | null;
        department?: {
            name: string;
        };
        position?: {
            name: string;
        };
    };
    payrollRecord?: PayrollRecord;
}

// ─── Payslip Earnings/Deductions Item ───

export interface PayslipItem {
    name: string;
    amount: number;
    formula?: string;
    isCalculated?: boolean;
}

// ─── Payslip Insurance Detail ───

export interface PayslipInsurance {
    BHXH: number;
    BHXH_RATE: number;
    BHYT: number;
    BHYT_RATE: number;
    BHTN: number;
    BHTN_RATE: number;
    total: number;
}

// ─── Payslip Tax Detail ───

export interface PayslipTax {
    taxableIncome: number;
    taxAmount: number;
    personalDeduction: number;
    dependentDeduction: number;
    totalDependents: number;
}

// ─── Payroll Calculation Result ───

export interface PayrollCalculationResult {
    userId: string;
    baseSalary: number;
    proratedSalary: number;
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

// ─── Insurance Cap ───

export interface InsuranceCap {
    id: string;
    year: number;
    insuranceType: "SOCIAL" | "HEALTH" | "UNEMPLOYMENT";
    minSalary: number;
    maxSalary: number;
    region: string | null;
    isActive: boolean;
    effectiveDate: Date;
}

// ─── Standard Work Days ───

export interface StandardWorkDays {
    id: string;
    year: number;
    month: number;
    workDays: number;
    workHours: number;
    holidays: string[];
    note: string | null;
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

// ─── Payroll Formula ───

export type FormulaType = "EARNING" | "DEDUCTION" | "TAX" | "INSURANCE" | "NET";

export interface FormulaVariable {
    name: string;
    source: "SALARY" | "ATTENDANCE" | "COMPONENT" | "TAX" | "INSURANCE" | "CONFIG" | "CONSTANT";
    dataType: "NUMBER" | "PERCENT" | "BOOLEAN" | "TEXT";
    defaultValue?: number;
    description?: string;
}

export interface PayrollFormula {
    id: string;
    code: string;
    name: string;
    description: string | null;
    formulaType: FormulaType;
    category: string | null;
    expression: string;
    variables: FormulaVariable[];
    outputField: string | null;
    priority: number;
    isActive: boolean;
    isSystem: boolean;
    effectiveDate: Date;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Payroll Approval ───

export type ApprovalAction = "CREATED" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PayrollApproval {
    id: string;
    payrollRecordId: string;
    action: ApprovalAction;
    status: ApprovalStatus;
    note: string | null;
    approverId: string | null;
    approverName: string | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Payslip Email ───

export interface PayslipEmailPayload {
    payslipId: string;
    userId: string;
    userEmail: string;
    employeeName: string;
    month: number;
    year: number;
    netSalary: number;
    attachPdf?: boolean;
}

// ─── Vietnamese Tax Brackets 2024 ───

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
    OT_WEEKDAY_RATE: "OT_WEEKDAY_RATE",
    OT_WEEKEND_RATE: "OT_WEEKEND_RATE",
    OT_HOLIDAY_RATE: "OT_HOLIDAY_RATE",
    STANDARD_WORK_DAYS: "STANDARD_WORK_DAYS",
    STANDARD_WORK_HOURS: "STANDARD_WORK_HOURS",
    REGION_MIN_SALARY: "REGION_MIN_SALARY",
    SOCIAL_INSURANCE_CAP: "SOCIAL_INSURANCE_CAP",
    HEALTH_INSURANCE_CAP: "HEALTH_INSURANCE_CAP",
    PAYSLIP_PASSWORD_ENABLED: "PAYSLIP_PASSWORD_ENABLED",
    PAYSLIP_DEFAULT_PASSWORD: "PAYSLIP_DEFAULT_PASSWORD",
} as const;

// ─── Default Insurance Rates (Employee share) ───

export const DEFAULT_INSURANCE_RATES: InsuranceRates = {
    socialRate: 0.08, // 8%
    healthRate: 0.015, // 1.5%
    unemploymentRate: 0.01, // 1%
};

// ─── Overtime Rates ───

export const DEFAULT_OVERTIME_RATES = {
    weekday: 1.5,
    weekend: 2.0,
    holiday: 3.0,
};

// ─── Default Deductions ───

export const DEFAULT_DEDUCTIONS = {
    personal: 11000000, // 11 triệu
    dependent: 4400000, // 4.4 triệu/người phụ thuộc
};

// ─── Insurance Caps 2024 ───

export const INSURANCE_CAPS_2024 = {
    SOCIAL: {
        min: 1490000, // Lương tối thiểu vùng
        max: 29900000, // Mức lương tối đa đóng BHXH
    },
    HEALTH: {
        min: 1490000,
        max: 44790000, // 20 * lương tối thiểu vùng
    },
    UNEMPLOYMENT: {
        min: 1490000,
        max: 44790000,
    },
};

// ─── Formula Operator Types ───

export const FORMULA_OPERATORS = [
    { symbol: "+", name: "Cộng", type: "binary" },
    { symbol: "-", name: "Trừ", type: "binary" },
    { symbol: "*", name: "Nhân", type: "binary" },
    { symbol: "/", name: "Chia", type: "binary" },
    { symbol: "(", name: "Mở ngoặc", type: "grouping" },
    { symbol: ")", name: "Đóng ngoặc", type: "grouping" },
    { symbol: "IF", name: "Nếu", type: "function" },
    { symbol: "MAX", name: "Lớn nhất", type: "function" },
    { symbol: "MIN", name: "Nhỏ nhất", type: "function" },
    { symbol: "ROUND", name: "Làm tròn", type: "function" },
    { symbol: "ABS", name: "Trị tuyệt đối", type: "function" },
] as const;

// ─── Formula Variable Sources ───

export const FORMULA_VARIABLE_SOURCES = {
    SALARY: [
        { code: "baseSalary", name: "Lương cơ bản", dataType: "NUMBER" },
        { code: "grossSalary", name: "Lương Gross", dataType: "NUMBER" },
        { code: "netSalary", name: "Lương Net", dataType: "NUMBER" },
    ],
    ATTENDANCE: [
        { code: "workDays", name: "Ngày công thực tế", dataType: "NUMBER" },
        { code: "standardDays", name: "Ngày công chuẩn", dataType: "NUMBER" },
        { code: "lateDays", name: "Số ngày đi muộn", dataType: "NUMBER" },
        { code: "overtimeHours", name: "Giờ tăng ca", dataType: "NUMBER" },
        { code: "absentDays", name: "Ngày nghỉ không phép", dataType: "NUMBER" },
        { code: "leaveDays", name: "Ngày nghỉ phép", dataType: "NUMBER" },
    ],
    COMPONENT: [
        { code: "allowanceAmount", name: "Tổng phụ cấp", dataType: "NUMBER" },
        { code: "bonusAmount", name: "Tổng thưởng", dataType: "NUMBER" },
        { code: "deductionAmount", name: "Tổng khấu trừ", dataType: "NUMBER" },
        { code: "overtimeAmount", name: "Tiền tăng ca", dataType: "NUMBER" },
    ],
    INSURANCE: [
        { code: "socialInsurance", name: "BHXH", dataType: "NUMBER" },
        { code: "healthInsurance", name: "BHYT", dataType: "NUMBER" },
        { code: "unemploymentInsurance", name: "BHTN", dataType: "NUMBER" },
        { code: "totalInsurance", name: "Tổng bảo hiểm", dataType: "NUMBER" },
    ],
    TAX: [
        { code: "taxableIncome", name: "Thu nhập chịu thuế", dataType: "NUMBER" },
        { code: "taxAmount", name: "Thuế TNCN", dataType: "NUMBER" },
        { code: "personalDeduction", name: "Giảm trừ cá nhân", dataType: "NUMBER" },
        { code: "dependentDeduction", name: "Giảm trừ phụ thuộc", dataType: "NUMBER" },
    ],
    CONFIG: [
        { code: "personalDeduction", name: "Giảm trừ cá nhân", dataType: "NUMBER" },
        { code: "dependentDeduction", name: "Giảm trừ phụ thuộc", dataType: "NUMBER" },
        { code: "otRate", name: "Hệ số tăng ca", dataType: "PERCENT" },
    ],
    CONSTANT: [
        { code: "standardWorkHours", name: "Giờ làm việc chuẩn/ngày", dataType: "NUMBER", defaultValue: 8 },
        { code: "standardWorkDays", name: "Ngày làm việc chuẩn/tháng", dataType: "NUMBER", defaultValue: 22 },
        { code: "hourlyRate", name: "Lương giờ", dataType: "NUMBER" },
    ],
} as const;

/**
 * Payroll Calculation Utilities
 * Pure calculation functions for payroll processing
 */

// ─── Tax Brackets 2024 ───

export interface TaxBracket {
    max: number;
    rate: number;
    deduction: number;
}

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

// ─── Insurance Rates 2024 (Employee share) ───

export const DEFAULT_INSURANCE_RATES = {
    socialRate: 0.08, // 8%
    healthRate: 0.015, // 1.5%
    unemploymentRate: 0.01, // 1%
};

// ─── Insurance Caps 2024 ───

export const INSURANCE_CAPS_2024 = {
    SOCIAL: {
        min: 1490000,
        max: 29900000,
    },
    HEALTH: {
        min: 1490000,
        max: 44790000,
    },
    UNEMPLOYMENT: {
        min: 1490000,
        max: 44790000,
    },
};

// ─── Income Tax Calculation ───

export interface IncomeTaxResult {
    taxableIncome: number;
    taxAmount: number;
    appliedRate: number;
    bracketMax: number | null;
}

/**
 * Tính thuế TNCN theo biểu thuế lũy tiến Việt Nam 2024
 * @param taxableIncome Thu nhập chịu thuế (sau khi đã trừ các khoản giảm trừ)
 */
export function calculateIncomeTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    for (const bracket of TAX_BRACKETS_2024) {
        if (taxableIncome <= bracket.max) {
            return Math.round(taxableIncome * bracket.rate - bracket.deduction);
        }
    }

    return 0;
}

/**
 * Tính thuế TNCN chi tiết với thông tin bậc thuế
 */
export function calculateIncomeTaxDetailed(taxableIncome: number): IncomeTaxResult {
    if (taxableIncome <= 0) {
        return {
            taxableIncome,
            taxAmount: 0,
            appliedRate: 0,
            bracketMax: null,
        };
    }

    let taxAmount = 0;
    let appliedBracket: TaxBracket | null = null;

    for (const bracket of TAX_BRACKETS_2024) {
        if (taxableIncome <= bracket.max) {
            taxAmount = Math.round(taxableIncome * bracket.rate - bracket.deduction);
            appliedBracket = bracket;
            break;
        }
    }

    return {
        taxableIncome,
        taxAmount: Math.max(0, taxAmount),
        appliedRate: appliedBracket?.rate || 0,
        bracketMax: appliedBracket?.max === Infinity ? null : appliedBracket?.max,
    };
}

// ─── Insurance Calculation ───

export interface InsuranceResult {
    socialInsurance: number;
    socialInsuranceRate: number;
    healthInsurance: number;
    healthInsuranceRate: number;
    unemploymentInsurance: number;
    unemploymentInsuranceRate: number;
    totalInsurance: number;
}

export interface InsuranceRates {
    socialRate: number;
    healthRate: number;
    unemploymentRate: number;
}

export interface InsuranceCaps {
    socialMax?: number;
    healthMax?: number;
    unemploymentMax?: number;
}

/**
 * Tính các khoản bảo hiểm bắt buộc (phần người lao động trả)
 */
export function calculateInsurance(
    grossSalary: number,
    rates: InsuranceRates,
    caps?: InsuranceCaps
): InsuranceResult {
    const socialMax = caps?.socialMax || INSURANCE_CAPS_2024.SOCIAL.max;
    const healthMax = caps?.healthMax || INSURANCE_CAPS_2024.HEALTH.max;

    const socialSalary = Math.min(grossSalary, socialMax);
    const healthSalary = Math.min(grossSalary, healthMax);

    const socialInsurance = Math.round(socialSalary * rates.socialRate);
    const healthInsurance = Math.round(healthSalary * rates.healthRate);
    const unemploymentInsurance = Math.round(grossSalary * rates.unemploymentRate);

    return {
        socialInsurance,
        socialInsuranceRate: rates.socialRate,
        healthInsurance,
        healthInsuranceRate: rates.healthRate,
        unemploymentInsurance,
        unemploymentInsuranceRate: rates.unemploymentRate,
        totalInsurance: socialInsurance + healthInsurance + unemploymentInsurance,
    };
}

/**
 * Tính các khoản bảo hiểm (phiên bản đơn giản)
 */
export function calculateInsuranceSimple(grossSalary: number): InsuranceResult {
    return calculateInsurance(grossSalary, DEFAULT_INSURANCE_RATES);
}

// ─── Gross to Net Calculation ───

export interface PayrollCalculationInput {
    baseSalary: number;
    allowanceAmount?: number;
    bonusAmount?: number;
    overtimeAmount?: number;
    deductionAmount?: number;
    personalDeduction?: number;
    dependentDeduction?: number;
    dependentCount?: number;
    workDays?: number;
    standardDays?: number;
}

export interface PayrollCalculationOutput {
    baseSalary: number;
    grossSalary: number;
    totalEarnings: number;
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    totalInsurance: number;
    taxableIncome: number;
    personalDeduction: number;
    dependentDeduction: number;
    taxAmount: number;
    totalDeductions: number;
    netSalary: number;
    effectiveDeduction: number;
    insuranceRates: InsuranceRates;
}

/**
 * Tính lương từ Gross sang Net
 */
export function calculateGrossToNet(
    input: PayrollCalculationInput,
    insuranceRates: InsuranceRates = DEFAULT_INSURANCE_RATES,
    insuranceCaps?: InsuranceCaps
): PayrollCalculationOutput {
    const {
        baseSalary,
        allowanceAmount = 0,
        bonusAmount = 0,
        overtimeAmount = 0,
        deductionAmount = 0,
        personalDeduction = 11000000,
        dependentCount = 0,
    } = input;

    // Tổng thu nhập
    const grossSalary = baseSalary + allowanceAmount + bonusAmount + overtimeAmount;
    const totalEarnings = grossSalary;

    // Tính bảo hiểm
    const insurance = calculateInsurance(grossSalary, insuranceRates, insuranceCaps);

    // Giảm trừ gia cảnh
    const dependentDeduction = dependentCount * 4400000;
    const totalDeductionAmount = personalDeduction + dependentDeduction;

    // Thu nhập chịu thuế
    const taxableIncome = Math.max(0, grossSalary - insurance.totalInsurance - totalDeductionAmount);

    // Tính thuế
    const taxAmount = calculateIncomeTax(taxableIncome);

    // Tổng khấu trừ
    const totalDeductions = insurance.totalInsurance + taxAmount + deductionAmount;

    // Lương net
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
        baseSalary,
        grossSalary,
        totalEarnings,
        socialInsurance: insurance.socialInsurance,
        healthInsurance: insurance.healthInsurance,
        unemploymentInsurance: insurance.unemploymentInsurance,
        totalInsurance: insurance.totalInsurance,
        taxableIncome,
        personalDeduction,
        dependentDeduction,
        taxAmount,
        totalDeductions,
        netSalary,
        effectiveDeduction: totalDeductionAmount,
        insuranceRates,
    };
}

// ─── Overtime Calculation ───

export interface OvertimeCalculationInput {
    baseSalary: number;
    standardDays?: number;
    standardHoursPerDay?: number;
    overtimeHours: number;
    overtimeType?: "weekday" | "weekend" | "holiday";
    rate?: number;
}

export const OVERTIME_RATES = {
    weekday: 1.5,
    weekend: 2.0,
    holiday: 3.0,
};

/**
 * Tính tiền tăng ca
 */
export function calculateOvertime(input: OvertimeCalculationInput): number {
    const {
        baseSalary,
        standardDays = 22,
        standardHoursPerDay = 8,
        overtimeHours,
        overtimeType = "weekday",
        rate,
    } = input;

    if (overtimeHours <= 0) return 0;

    // Lương giờ
    const hourlyRate = baseSalary / (standardDays * standardHoursPerDay);

    // Hệ số tăng ca
    const overtimeRate = rate || OVERTIME_RATES[overtimeType];

    // Tiền tăng ca = Lương giờ * Số giờ tăng ca * Hệ số
    return Math.round(hourlyRate * overtimeHours * overtimeRate);
}

/**
 * Tính lương theo ngày công
 */
export function calculateSalaryByWorkDays(
    baseSalary: number,
    workDays: number,
    standardDays: number = 22
): number {
    if (workDays >= standardDays) {
        return baseSalary;
    }

    return Math.round((baseSalary / standardDays) * workDays);
}

// ─── Formula Evaluation ───

/**
 * Evaluate a simple mathematical expression with variables
 */
export function evaluateFormula(
    expression: string,
    variables: Record<string, number>
): number {
    let expr = expression;

    // Replace variable names with their values
    for (const [name, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${name}\\b`, "g");
        expr = expr.replace(regex, String(value));
    }

    // Remove any non-math characters for safety
    const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, "");

    try {
        // Use Function constructor for safe evaluation
        const fn = new Function(`return ${sanitized}`);
        const result = fn();
        return typeof result === "number" && !isNaN(result) ? result : 0;
    } catch {
        throw new Error("Biểu thức không hợp lệ");
    }
}

// ─── Currency Formatting ───

/**
 * Format number as Vietnamese currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "percent",
        maximumFractionDigits: 2,
    }).format(value);
}

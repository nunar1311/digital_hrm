// =============================================================================
// Mock Payroll Data — Periods, Records, Tax Brackets
// =============================================================================

import type { PayrollPeriod, PayrollRecord, TaxBracket } from '@/types';
import { mockEmployees } from './employees';

export const mockPayrollPeriods: PayrollPeriod[] = [
    { id: 'pp-001', month: 1, year: 2026, status: 'PAID', approvedBy: 'emp-001', approvedAt: '2026-02-05T10:00:00Z', createdAt: '2026-02-01T00:00:00Z', recordCount: 35, totalNetSalary: 680_000_000 },
    { id: 'pp-002', month: 2, year: 2026, status: 'APPROVED', approvedBy: 'emp-001', approvedAt: '2026-03-03T09:00:00Z', createdAt: '2026-03-01T00:00:00Z', recordCount: 35, totalNetSalary: 695_000_000 },
    { id: 'pp-003', month: 3, year: 2026, status: 'DRAFT', approvedBy: null, approvedAt: null, createdAt: '2026-03-06T00:00:00Z', recordCount: 0, totalNetSalary: 0 },
];

const SALARY_MAP: Record<string, number> = {
    'emp-001': 80_000_000, 'emp-004': 45_000_000, 'emp-007': 15_000_000,
    'emp-015': 30_000_000, 'emp-030': 5_000_000,
};

export function generatePayrollRecords(periodId: string): PayrollRecord[] {
    return mockEmployees.slice(0, 15).map((emp, i) => {
        const base = SALARY_MAP[emp.id] || (12_000_000 + i * 2_000_000);
        const actualDays = 20 + Math.floor(Math.random() * 3);
        const otHours = Math.round(Math.random() * 10 * 10) / 10;
        const otPay = Math.round(otHours * (base / 22 / 8) * 1.5);
        const allowTotal = 1_000_000;
        const gross = Math.round(base * actualDays / 22) + otPay + allowTotal;
        const si = Math.round(base * 0.08);
        const hi = Math.round(base * 0.015);
        const ue = Math.round(base * 0.01);
        const taxable = gross - si - hi - ue - 11_000_000;
        const tax = taxable > 0 ? Math.round(taxable * 0.1) : 0;
        const net = gross - si - hi - ue - tax;

        return {
            id: `pr-${periodId}-${emp.id}`, periodId, employeeId: emp.id,
            baseSalary: base, workDays: 22, actualWorkDays: actualDays,
            overtimeHours: otHours, overtimePay: otPay,
            allowances: { lunch: 500_000, transport: 300_000, phone: 200_000 },
            totalAllowance: allowTotal,
            deductions: null, totalDeduction: 0,
            grossSalary: gross, socialInsurance: si, healthInsurance: hi,
            unemployment: ue, personalTax: tax, netSalary: net, notes: null,
            employeeName: emp.fullName, employeeCode: emp.employeeCode,
            departmentName: emp.department?.name,
        };
    });
}

export const mockPayrollRecords: PayrollRecord[] = generatePayrollRecords('pp-002');

export const mockTaxBrackets: TaxBracket[] = [
    { id: 'tb-1', minIncome: 0, maxIncome: 5_000_000, rate: 0.05, deduction: 0, sortOrder: 1 },
    { id: 'tb-2', minIncome: 5_000_000, maxIncome: 10_000_000, rate: 0.10, deduction: 250_000, sortOrder: 2 },
    { id: 'tb-3', minIncome: 10_000_000, maxIncome: 18_000_000, rate: 0.15, deduction: 750_000, sortOrder: 3 },
    { id: 'tb-4', minIncome: 18_000_000, maxIncome: 32_000_000, rate: 0.20, deduction: 1_650_000, sortOrder: 4 },
    { id: 'tb-5', minIncome: 32_000_000, maxIncome: 52_000_000, rate: 0.25, deduction: 3_250_000, sortOrder: 5 },
    { id: 'tb-6', minIncome: 52_000_000, maxIncome: 80_000_000, rate: 0.30, deduction: 5_850_000, sortOrder: 6 },
    { id: 'tb-7', minIncome: 80_000_000, maxIncome: null, rate: 0.35, deduction: 9_850_000, sortOrder: 7 },
];

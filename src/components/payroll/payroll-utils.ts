// ─── Shared Payroll Utilities ───
// Dùng chung cho tất cả payroll components

import type { PayrollRecord } from "@/app/(protected)/payroll/types";

// ─── Currency Formatting ───

export function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

// ─── Status Configuration ───

export interface StatusConfig {
  label: string;
  className: string;
}

export function getPayrollStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "DRAFT":
      return {
        label: "Nháp",
        className:
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
      };
    case "PROCESSING":
      return {
        label: "Đang xử lý",
        className:
          "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      };
    default:
      return { label: status, className: "" };
  }
}

// ─── Summary Calculation ───

export interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalInsurance: number;
}

interface PayrollRecordLike {
  totalEmployees?: number | bigint;
  totalGross?: number | bigint;
  totalNet?: number | bigint;
  totalTax?: number | bigint;
  totalInsurance?: number | bigint;
}

export function calculatePayrollSummary(
  records: PayrollRecordLike[] | undefined,
): PayrollSummary {
  if (!records || records.length === 0) {
    return {
      totalEmployees: 0,
      totalGross: 0,
      totalNet: 0,
      totalTax: 0,
      totalInsurance: 0,
    };
  }

  return records.reduce<PayrollSummary>(
    (acc, r) => ({
      totalEmployees:
        acc.totalEmployees + Number(r.totalEmployees ?? 0),
      totalGross: acc.totalGross + Number(r.totalGross ?? 0),
      totalNet: acc.totalNet + Number(r.totalNet ?? 0),
      totalTax: acc.totalTax + Number(r.totalTax ?? 0),
      totalInsurance: acc.totalInsurance + Number(r.totalInsurance ?? 0),
    }),
    {
      totalEmployees: 0,
      totalGross: 0,
      totalNet: 0,
      totalTax: 0,
      totalInsurance: 0,
    },
  );
}

// ─── Chart Data ───

export interface PayrollChartDataPoint {
  name: string;
  gross: number;
  net: number;
  tax: number;
  insurance: number;
}

export function buildPayrollChartData(
  records: unknown[] | undefined,
): PayrollChartDataPoint[] {
  if (!records || records.length === 0) return [];

  const withNumeric = records.map((r) => ({
    month: Number((r as Record<string, unknown>).month),
    year: Number((r as Record<string, unknown>).year),
    totalGross: Number((r as Record<string, unknown>).totalGross ?? 0),
    totalNet: Number((r as Record<string, unknown>).totalNet ?? 0),
    totalTax: Number((r as Record<string, unknown>).totalTax ?? 0),
    totalInsurance: Number((r as Record<string, unknown>).totalInsurance ?? 0),
  }));

  const sorted = [...withNumeric].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  }).slice(-12);

  return sorted.map((r) => ({
    name: `T${r.month}/${r.year}`,
    gross: r.totalGross,
    net: r.totalNet,
    tax: r.totalTax,
    insurance: r.totalInsurance,
  }));
}

// Re-export for convenience
export type { PayrollRecord };

// ─── Detail Page Utilities ───

export interface StatusConfigDetail {
  label: string;
  className: string;
  color: string;
  bgDot: string;
}

export function getPayrollDetailStatusConfig(
  status: string,
): StatusConfigDetail {
  switch (status) {
    case "DRAFT":
      return {
        label: "Nháp",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        color: "text-slate-600",
        bgDot: "bg-slate-400",
      };
    case "PROCESSING":
      return {
        label: "Đang xử lý",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        color: "text-amber-600",
        bgDot: "bg-amber-400",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "text-emerald-600",
        bgDot: "bg-emerald-500",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "bg-red-50 text-red-700 border-red-200",
        color: "text-red-600",
        bgDot: "bg-red-400",
      };
    default:
      return {
        label: status,
        className: "",
        color: "",
        bgDot: "",
      };
  }
}

export interface SalaryRange {
  label: string;
  min: number;
  max: number;
  count: number;
}

export function buildSalaryRanges(
  details: { netSalary?: number | bigint }[],
): { ranges: SalaryRange[]; maxCount: number } {
  const ranges: SalaryRange[] = [
    { label: "< 10M", min: 0, max: 10000000, count: 0 },
    { label: "10-15M", min: 10000000, max: 15000000, count: 0 },
    { label: "15-20M", min: 15000000, max: 20000000, count: 0 },
    { label: "20-25M", min: 20000000, max: 25000000, count: 0 },
    { label: "> 25M", min: 25000000, max: Infinity, count: 0 },
  ];

  for (const d of details) {
    const net = Number(d.netSalary ?? 0);
    const range = ranges.find((r) => net >= r.min && net < r.max);
    if (range) range.count++;
  }

  const maxCount = Math.max(...ranges.map((r) => r.count), 1);
  return { ranges, maxCount };
}

export interface DeptStat {
  count: number;
  totalNet: number;
  totalGross: number;
}

export function buildDepartmentStats(
  details: { user?: { department?: { name?: string } }; netSalary?: number | bigint; grossSalary?: number | bigint }[],
): Record<string, DeptStat> {
  return details.reduce(
    (acc, detail) => {
      const deptName = detail.user?.department?.name || "Không xác định";
      if (!acc[deptName]) acc[deptName] = { count: 0, totalNet: 0, totalGross: 0 };
      acc[deptName].count++;
      acc[deptName].totalNet += Number(detail.netSalary ?? 0);
      acc[deptName].totalGross += Number(detail.grossSalary ?? 0);
      return acc;
    },
    {} as Record<string, DeptStat>,
  );
}

export function calcInsuranceTotals(details: { socialInsurance?: number | bigint; healthInsurance?: number | bigint; unemploymentInsurance?: number | bigint }[]) {
  return {
    totalBHXH: details.reduce((s, d) => s + Number(d.socialInsurance ?? 0), 0),
    totalBHYT: details.reduce((s, d) => s + Number(d.healthInsurance ?? 0), 0),
    totalBHTN: details.reduce((s, d) => s + Number(d.unemploymentInsurance ?? 0), 0),
  };
}

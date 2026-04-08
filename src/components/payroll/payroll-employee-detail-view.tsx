"use client";

import {
  User,
  Building2,
  CreditCard,
  TrendingUp,
  Minus,
  Calculator,
  Calendar,
  Clock,
  Landmark,
  LucideIcon,
  BriefcaseBusiness,
  IdCard,
} from "lucide-react";
import { formatCurrency } from "@/components/payroll/payroll-detail-table";
import type {
  PayrollRecordDetail,
  Payslip,
  PayslipItem,
  PayslipInsurance,
  PayslipTax,
} from "@/app/(protected)/payroll/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Unified data shape ─────────────────────────────────────────────

interface NormalizedDetail {
  user: {
    name: string;
    username: string | null;
    department?: { name: string } | null;
    position?: { name: string } | null;
  } | null;
  positionName: string | null;
  baseSalary: number;
  proratedSalary: number;
  allowanceAmount: number;
  bonusAmount: number;
  overtimeAmount: number;
  grossSalary: number;
  socialInsurance: number;
  healthInsurance: number;
  unemploymentInsurance: number;
  taxAmount: number;
  deductionAmount: number;
  personalDeduction: number;
  dependentDeduction: number;
  netSalary: number;
  workDays: number;
  standardDays: number;
  lateDays: number;
  bankAccount: string | null;
  bankName: string | null;
  status: string;
  // Payslip-specific
  earnings?: PayslipItem[];
  insuranceData?: PayslipInsurance;
  taxData?: PayslipTax;
  deductionsData?: PayslipItem[];
  // Period
  month: number;
  year: number;
  source: "payroll" | "payslip";
}

// ─── Normalize helpers ─────────────────────────────────────────────

function parseJsonField<T>(raw: string | T | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === "object") return raw as T;
  try {
    return JSON.parse(raw as string) as T;
  } catch {
    return fallback;
  }
}

function normalizePayrollDetail(
  detail: PayrollRecordDetail,
  month: number,
  year: number,
): NormalizedDetail {
  return {
    user: detail.user ?? null,
    positionName: detail.user?.position?.name ?? null,
    baseSalary: detail.baseSalary,
    proratedSalary: detail.proratedSalary,
    allowanceAmount: detail.allowanceAmount,
    bonusAmount: detail.bonusAmount,
    overtimeAmount: detail.overtimeAmount,
    grossSalary: detail.grossSalary,
    socialInsurance: detail.socialInsurance,
    healthInsurance: detail.healthInsurance,
    unemploymentInsurance: detail.unemploymentInsurance,
    taxAmount: detail.taxAmount,
    deductionAmount: detail.deductionAmount,
    personalDeduction: detail.personalDeduction,
    dependentDeduction: detail.dependentDeduction,
    netSalary: detail.netSalary,
    workDays: detail.workDays,
    standardDays: detail.standardDays,
    lateDays: detail.lateDays,
    bankAccount: detail.bankAccount ?? null,
    bankName: detail.bankName ?? null,
    status: detail.status,
    month,
    year,
    source: "payroll",
  };
}

function normalizePayslip(payslip: Payslip): NormalizedDetail {
  const earnings: PayslipItem[] = parseJsonField(payslip.earnings, []);
  const deductions: PayslipItem[] = parseJsonField(payslip.deductions, []);
  const insurance: PayslipInsurance = parseJsonField(payslip.insurance, {
    BHXH: 0,
    BHXH_RATE: 0,
    BHYT: 0,
    BHYT_RATE: 0,
    BHTN: 0,
    BHTN_RATE: 0,
    total: 0,
  });
  const tax: PayslipTax = parseJsonField(payslip.tax, {
    taxableIncome: 0,
    taxAmount: 0,
    personalDeduction: 0,
    dependentDeduction: 0,
    totalDependents: 0,
  });

  // Extract from earnings JSON
  const allowanceAmount = earnings
    .filter((e) =>
      ["Phụ cấp", "Allowance", "Phụ cấp cố định", "Fixed Allowance"].includes(
        e.name,
      ),
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const bonusAmount = earnings
    .filter((e) =>
      ["Thưởng", "Bonus", "Thưởng hiệu suất", "Performance Bonus"].includes(
        e.name,
      ),
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const overtimeAmount = earnings
    .filter(
      (e) =>
        ["Tăng ca", "Overtime", "Phụ cấp tăng ca", "Overtime Pay"].includes(
          e.name,
        ) ||
        e.name.toLowerCase().includes("tăng ca") ||
        e.name.toLowerCase().includes("overtime"),
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    user: {
      name: payslip.employeeName,
      username: payslip.user?.username || null,
      department: payslip.departmentName
        ? { name: payslip.departmentName }
        : null,
      position: payslip.position
        ? { name: payslip.user?.position?.name || "" }
        : null,
    },
    positionName: payslip.user?.position?.name || null,
    baseSalary: payslip.baseSalary,
    proratedSalary: payslip.baseSalary,
    allowanceAmount,
    bonusAmount,
    overtimeAmount,
    grossSalary: payslip.grossSalary,
    socialInsurance: insurance.BHXH,
    healthInsurance: insurance.BHYT,
    unemploymentInsurance: insurance.BHTN,
    taxAmount: tax.taxAmount,
    deductionAmount: deductions.reduce((sum, d) => sum + Number(d.amount), 0),
    personalDeduction: tax.personalDeduction,
    dependentDeduction: tax.dependentDeduction,
    netSalary: payslip.netSalary,
    workDays: 0,
    standardDays: 0,
    lateDays: 0,
    bankAccount: null,
    bankName: null,
    status: payslip.status,
    earnings,
    insuranceData: insurance,
    taxData: tax,
    deductionsData: deductions,
    month: payslip.month,
    year: payslip.year,
    source: "payslip",
  };
}

// ─── Status configs ────────────────────────────────────────────────

const PAYROLL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  PAID: "Đã trả",
};

const PAYSLIP_STATUS_LABELS: Record<string, string> = {
  GENERATED: "Mới",
  VIEWED: "Đã xem",
  DOWNLOADED: "Đã tải",
};

const STATUS_VARIANTS: Record<string, "secondary" | "outline" | "default"> = {
  PENDING: "secondary",
  CONFIRMED: "outline",
  PAID: "default",
  GENERATED: "secondary",
  VIEWED: "outline",
  DOWNLOADED: "default",
};

// ─── Shared sub-components ─────────────────────────────────────────

interface InfoRowProps {
  icon?: LucideIcon;
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  highlightColor?: string;
  subValue?: string;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
  highlightColor = "text-foreground",
  subValue,
}: InfoRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              highlight && highlightColor,
            )}
          >
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h4>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────

interface PayrollEmployeeDetailViewProps {
  detail?: PayrollRecordDetail;
  payslip?: Payslip;
  month?: number;
  year?: number;
}

// ─── Main component ────────────────────────────────────────────────

export function PayrollEmployeeDetailView({
  detail,
  payslip,
  month: detailMonth,
  year: detailYear,
}: PayrollEmployeeDetailViewProps) {
  // Normalize to unified shape
  const data: NormalizedDetail | null = detail
    ? normalizePayrollDetail(
        detail,
        detailMonth ?? detailYear ?? 0,
        detailYear ?? 0,
      )
    : payslip
      ? normalizePayslip(payslip)
      : null;

  if (!data) return null;

  const user = data.user;
  const statusLabel =
    (data.source === "payslip"
      ? PAYSLIP_STATUS_LABELS[data.status]
      : PAYROLL_STATUS_LABELS[data.status]) ?? data.status;
  const statusVariant = STATUS_VARIANTS[data.status] ?? "secondary";

  const isPayslip = data.source === "payslip";

  return (
    <div className="flex flex-col h-full overflow-y-hidden">
      {/* Header */}
      <div className="shrink-0 p-3 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">
              {user?.name ?? "—"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {user?.username ?? "—"}
            </p>
          </div>
          <Badge variant={statusVariant} className="shrink-0 text-xs">
            {statusLabel}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3">
        <div className="space-y-4">
          {/* Thông tin phòng ban */}
          <section>
            <SectionHeader title="Phòng ban" />
            <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
              <InfoRow
                icon={Building2}
                label="Phòng ban"
                value={user?.department?.name ?? "—"}
              />
              <InfoRow
                icon={IdCard}
                label="Mã nhân viên"
                value={user?.username ?? "—"}
              />
              {data.positionName && (
                <InfoRow
                  icon={BriefcaseBusiness}
                  label="Chức vụ"
                  value={data.positionName}
                />
              )}
            </div>
          </section>

          <Separator />

          {/* Thông tin lương */}
          <section>
            <SectionHeader title="Lương & Phụ cấp" />
            <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
              {!isPayslip && (
                <>
                  <InfoRow
                    icon={TrendingUp}
                    label="Lương cơ bản (gốc)"
                    value={formatCurrency(data.baseSalary)}
                  />
                  {detail && detail.proratedSalary !== detail.baseSalary && (
                    <InfoRow
                      icon={TrendingUp}
                      label="Lương theo ngày công"
                      value={formatCurrency(detail.proratedSalary)}
                      subValue={`${detail.workDays}/${detail.standardDays} ngày`}
                    />
                  )}
                  <InfoRow
                    icon={TrendingUp}
                    label="Phụ cấp"
                    value={formatCurrency(data.allowanceAmount)}
                  />
                  <InfoRow
                    icon={TrendingUp}
                    label="Thưởng"
                    value={formatCurrency(data.bonusAmount)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Tăng ca"
                    value={formatCurrency(data.overtimeAmount)}
                    subValue={
                      !isPayslip && detail
                        ? `${detail.overtimeHours}h`
                        : undefined
                    }
                  />
                </>
              )}

              {/* Payslip: show raw earnings breakdown */}
              {isPayslip && data.earnings && data.earnings.length > 0 && (
                <>
                  {data.earnings.map((item, i) => (
                    <InfoRow
                      key={i}
                      icon={TrendingUp}
                      label={item.name}
                      value={formatCurrency(item.amount)}
                      subValue={
                        !isPayslip && detail
                          ? `${detail.overtimeHours}h`
                          : undefined
                      }
                    />
                  ))}
                </>
              )}
            </div>
          </section>

          <Separator />

          {/* Tổng Gross */}
          <section>
            <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-700">
                  Tổng Gross
                </span>
              </div>
              <span className="text-base font-bold text-emerald-700">
                {formatCurrency(data.grossSalary)}
              </span>
            </div>
          </section>

          <Separator />

          {/* Bảo hiểm & Thuế */}
          <section>
            <SectionHeader
              title={isPayslip ? "Bảo hiểm (NLĐ)" : "Bảo hiểm & Thuế"}
            />
            <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
              {isPayslip && data.insuranceData ? (
                <>
                  {data.insuranceData.BHXH > 0 && (
                    <InfoRow
                      icon={Minus}
                      label={`BHXH (${data.insuranceData.BHXH_RATE * 100}%)`}
                      value={formatCurrency(data.insuranceData.BHXH)}
                      highlight
                      highlightColor="text-red-600"
                    />
                  )}
                  {data.insuranceData.BHYT > 0 && (
                    <InfoRow
                      icon={Minus}
                      label={`BHYT (${data.insuranceData.BHYT_RATE * 100}%)`}
                      value={formatCurrency(data.insuranceData.BHYT)}
                      highlight
                      highlightColor="text-red-600"
                    />
                  )}
                  {data.insuranceData.BHTN > 0 && (
                    <InfoRow
                      icon={Minus}
                      label={`BHTN (${data.insuranceData.BHTN_RATE * 100}%)`}
                      value={formatCurrency(data.insuranceData.BHTN)}
                      highlight
                      highlightColor="text-red-600"
                    />
                  )}
                </>
              ) : (
                <>
                  <InfoRow
                    icon={Minus}
                    label="BHXH (8%)"
                    value={formatCurrency(data.socialInsurance)}
                    highlight
                    highlightColor="text-red-600"
                  />
                  <InfoRow
                    icon={Minus}
                    label="BHYT (1.5%)"
                    value={formatCurrency(data.healthInsurance)}
                    highlight
                    highlightColor="text-red-600"
                  />
                  <InfoRow
                    icon={Minus}
                    label="BHTN (1%)"
                    value={formatCurrency(data.unemploymentInsurance)}
                    highlight
                    highlightColor="text-red-600"
                  />
                </>
              )}
              <InfoRow
                icon={Minus}
                label="Thuế TNCN"
                value={formatCurrency(data.taxAmount)}
                highlight
                highlightColor="text-red-600"
              />
              {data.deductionAmount > 0 && (
                <InfoRow
                  icon={Minus}
                  label="Khấu trừ khác"
                  value={formatCurrency(data.deductionAmount)}
                  highlight
                  highlightColor="text-red-600"
                />
              )}
              {/* Payslip: raw deductions */}
              {isPayslip &&
                data.deductionsData &&
                data.deductionsData.length > 0 && (
                  <>
                    {data.deductionsData.map((item, i) => (
                      <InfoRow
                        key={i}
                        icon={Minus}
                        label={item.name}
                        value={formatCurrency(item.amount)}
                        highlight
                        highlightColor="text-red-600"
                      />
                    ))}
                  </>
                )}
            </div>
          </section>

          <Separator />

          {/* Giảm trừ */}
          <section>
            <SectionHeader title="Giảm trừ" />
            <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
              <InfoRow
                icon={Calculator}
                label="Giảm trừ cá nhân"
                value={formatCurrency(data.personalDeduction)}
              />
              <InfoRow
                icon={Calculator}
                label="Giảm trừ phụ thuộc"
                value={
                  isPayslip && data.taxData && data.taxData.totalDependents > 0
                    ? `${formatCurrency(data.dependentDeduction)} (${data.taxData.totalDependents} người)`
                    : formatCurrency(data.dependentDeduction)
                }
              />
            </div>
          </section>

          <Separator />

          {/* Công & Ngày làm việc */}
          {!isPayslip && (
            <>
              <section>
                <SectionHeader title="Công & Làm việc" />
                <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
                  <InfoRow
                    icon={Calendar}
                    label="Ngày công"
                    value={
                      <span className="font-mono">
                        {data.workDays} / {data.standardDays}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={Clock}
                    label="Ngày muộn"
                    value={data.lateDays}
                  />
                </div>
              </section>

              {/* Thông tin ngân hàng */}

              <section>
                <SectionHeader title="Thông tin ngân hàng" />
                <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
                  <InfoRow
                    icon={Landmark}
                    label="Số tài khoản"
                    value={data.bankAccount || "—"}
                  />
                  <InfoRow label="Ngân hàng" value={data.bankName || "—"} />
                </div>
              </section>

              <Separator />
            </>
          )}

          {/* Lương Net */}
          <section className="sticky bottom-0 bg-background">
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-700">
                  Lương thực nhận (Net)
                </span>
              </div>
              <span className="text-xl font-bold text-blue-700">
                {formatCurrency(data.netSalary)}
              </span>
            </div>
          </section>

          {/* Kỳ lương */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {isPayslip
                ? `Phiếu lương tháng ${data.month}/${data.year}`
                : `Bảng lương tháng ${data.month}/${data.year}`}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

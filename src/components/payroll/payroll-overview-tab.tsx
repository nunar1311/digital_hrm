"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Wallet,
  BarChart3,
  PieChart,
  Shield,
  Receipt,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  getPayrollDetailStatusConfig,
  buildSalaryRanges,
  buildDepartmentStats,
  calcInsuranceTotals,
} from "@/components/payroll/payroll-utils";
import type {
  PayrollRecord,
  PayrollRecordDetail,
} from "@/app/(protected)/payroll/types";

interface PayrollOverviewTabProps {
  record: PayrollRecord;
  details: PayrollRecordDetail[];
}

const ICON_MAP = { Users, TrendingUp, Wallet, Receipt };

export function PayrollOverviewTab({
  record,
  details,
}: PayrollOverviewTabProps) {
  const statusCfg = getPayrollDetailStatusConfig(record.status);
  const { totalBHXH, totalBHYT, totalBHTN } = calcInsuranceTotals(details);
  const { ranges, maxCount } = buildSalaryRanges(details);
  const deptStats = buildDepartmentStats(details);

  const summaryStats = [
    {
      label: "Nhân viên",
      value: String(record.totalEmployees),
      icon: "Users",
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Tổng Gross",
      value: formatCurrency(record.totalGross),
      icon: "TrendingUp",
      bg: "bg-violet-50",
      color: "text-violet-600",
    },
    {
      label: "Tổng Net",
      value: formatCurrency(record.totalNet),
      icon: "Wallet",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Thuế TNCN",
      value: formatCurrency(record.totalTax),
      icon: "Receipt",
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
  ];

  const taxPayersCount = details.filter((d) => Number(d.taxAmount) > 0).length;

  return (
    <div className="space-y-4 overflow-y-auto flex-1 h-full">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((s) => {
          const Icon = ICON_MAP[s.icon as keyof typeof ICON_MAP];
          return (
            <Card
              key={s.label}
              className="group hover:shadow-md transition-shadow cursor-pointer p-3"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p
                      className={`text-sm font-bold ${s.color} truncate`}
                      title={s.value}
                    >
                      {s.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payroll Info + Salary Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Thông tin bảng lương
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Phòng ban</p>
                <p className="font-medium">
                  {record.department?.name || "Toàn công ty"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Số nhân viên</p>
                <p className="font-medium">{record.totalEmployees}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Người tạo</p>
                <p className="font-medium">{record.processedByName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">
                  {record.processedAt
                    ? new Date(record.processedAt).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trạng thái</span>
              <Badge
                variant="outline"
                className={`text-xs ${statusCfg.className}`}
              >
                {statusCfg.label}
              </Badge>
            </div>

            {record.approvedBy && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Người duyệt</p>
                  <p className="font-medium">{record.approvedByName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày duyệt</p>
                  <p className="font-medium">
                    {record.approvedAt
                      ? new Date(record.approvedAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>
            )}

            {record.note && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-xs">Ghi chú</p>
                  <p className="font-medium text-sm">{record.note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Salary Distribution Chart */}
        <Card className="lg:col-span-2 p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Phân bố lương Net
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-3">
              {ranges.map((range) => (
                <div key={range.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{range.label}</span>
                    <span className="font-medium">{range.count} nhân viên</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${(range.count / maxCount) * 100}%`,
                      }}
                    >
                      {range.count > 0 && (
                        <span className="text-[10px] font-medium text-primary-foreground">
                          {range.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary + Department Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Tổng hợp chi phí
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-2">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">
                Tổng thu nhập
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(record.totalGross)}
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                { label: "- BHXH (8%)", value: totalBHXH },
                { label: "- BHYT (1.5%)", value: totalBHYT },
                { label: "- BHTN (1%)", value: totalBHTN },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                Thực lĩnh (Net)
              </span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(record.totalNet)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Thống kê theo phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {Object.entries(deptStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([dept, stats]) => (
                  <div
                    key={dept}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{dept}</span>
                      <Badge variant="secondary" className="text-xs">
                        {stats.count} NV
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stats.totalNet)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance & Tax Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Chi tiết Bảo hiểm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-2">
            {[
              { name: "BHXH (8%)", label: "Bảo hiểm xã hội", value: totalBHXH },
              { name: "BHYT (1.5%)", label: "Bảo hiểm y tế", value: totalBHYT },
              {
                name: "BHTN (1%)",
                label: "Bảo hiểm thất nghiệp",
                value: totalBHTN,
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center p-3 bg-rose-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-rose-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-rose-600">{item.label}</p>
                </div>
                <span className="text-lg font-bold text-rose-600">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Tổng bảo hiểm</span>
              <span className="text-xl font-bold text-rose-600">
                {formatCurrency(record.totalInsurance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="px-2">
            <CardTitle className="text-base flex items-center gap-2">
              Chi tiết Thuế TNCN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-2">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-amber-800">Thuế TNCN</p>
                <p className="text-xs text-amber-600">
                  Thu nhập cá nhân phải nộp
                </p>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {formatCurrency(record.totalTax)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Số NV có thuế</span>
              <span className="text-lg font-semibold">
                {taxPayersCount}/{details.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Thuế TB/nhân viên</span>
              <span className="font-medium">
                {formatCurrency(
                  taxPayersCount > 0 ? record.totalTax / taxPayersCount : 0,
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

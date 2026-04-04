"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPayslips } from "../actions";
import {
  FileText,
  Eye,
  Search,
  Loader2,
  Receipt,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusConfig(status: string) {
  switch (status) {
    case "GENERATED":
      return {
        label: "Mới",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "VIEWED":
      return {
        label: "Đã xem",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "DOWNLOADED":
      return {
        label: "Đã tải",
        className: "bg-violet-50 text-violet-700 border-violet-200",
      };
    case "SENT":
      return {
        label: "Đã gửi",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return { label: status, className: "" };
  }
}

export default function PayslipsClient({
  initialData,
  isSelfService = false,
}: {
  initialData: Awaited<ReturnType<typeof getPayslips>>;
  isSelfService?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(
    new Date().getFullYear().toString()
  );

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["payslips", monthFilter, yearFilter],
    queryFn: () =>
      getPayslips(
        monthFilter === "all" || yearFilter === "all"
          ? {}
          : {
              month: parseInt(monthFilter),
              year: parseInt(yearFilter),
            }
      ),
    initialData: initialData,
  });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredPayslips = useMemo(
    () =>
      payslips?.filter((p: (typeof payslips)[number]) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          p.user.name.toLowerCase().includes(s) ||
          p.user.employeeCode?.toLowerCase().includes(s)
        );
      }),
    [payslips, search]
  );

  const stats = useMemo(
    () => ({
      total: payslips?.length || 0,
      viewed: payslips?.filter((p) => p.status !== "GENERATED").length || 0,
      pending: payslips?.filter((p) => p.status === "GENERATED").length || 0,
    }),
    [payslips]
  );

  const statCards = [
    {
      label: "Tổng phiếu lương",
      value: stats.total,
      icon: FileText,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Đã xem / tải",
      value: stats.viewed,
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Chưa xem",
      value: stats.pending,
      icon: Mail,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
  ];

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-blue-500/5 via-primary/5 to-emerald-500/5">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isSelfService ? "Phiếu lương của tôi" : "Phiếu lương"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isSelfService
                  ? "Xem và tải phiếu lương cá nhân"
                  : "Quản lý phiếu lương nhân viên"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        {!isSelfService && (
          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((s) => (
              <Card
                key={s.label}
                className="group hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${s.bg} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        {s.label}
                      </p>
                      <p className={`text-2xl font-bold ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tháng</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {filteredPayslips?.length || 0} phiếu
          </span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredPayslips || filteredPayslips.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/50 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold">
                  Không có phiếu lương
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
                  {isSelfService
                    ? "Bạn chưa có phiếu lương nào"
                    : "Chưa có phiếu lương nào được tạo cho kỳ này"}
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Kỳ lương</TableHead>
                      {!isSelfService && (
                        <>
                          <TableHead className="font-semibold">
                            Mã NV
                          </TableHead>
                          <TableHead className="font-semibold">
                            Nhân viên
                          </TableHead>
                          <TableHead className="font-semibold">
                            Phòng ban
                          </TableHead>
                        </>
                      )}
                      <TableHead className="font-semibold text-right">
                        Lương Gross
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Lương Net
                      </TableHead>
                      <TableHead className="font-semibold">
                        Trạng thái
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip) => {
                      const statusCfg = getStatusConfig(payslip.status);
                      return (
                        <TableRow key={payslip.id} className="group cursor-pointer" onClick={() => router.push(`/payroll/payslips/${payslip.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                T{payslip.month}
                              </div>
                              <span className="font-medium">
                                Tháng {payslip.month}/{payslip.year}
                              </span>
                            </div>
                          </TableCell>
                          {!isSelfService && (
                            <>
                              <TableCell className="font-mono text-sm text-muted-foreground">
                                {payslip.employeeCode || "—"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {payslip.employeeName}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {payslip.departmentName || "—"}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right font-medium text-blue-600">
                            {formatCurrency(payslip.grossSalary)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {formatCurrency(payslip.netSalary)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusCfg.className}`}
                            >
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/payroll/payslips/${payslip.id}`
                                );
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

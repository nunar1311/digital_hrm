"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { getPayslips, getMyPayslips } from "../actions";
import { FileText, Download, Eye, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCurrency(amount: number | bigint): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
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
    new Date().getFullYear().toString(),
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
            },
      ),
    initialData: initialData,
  });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredPayslips = payslips?.filter((p) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.employeeName.toLowerCase().includes(searchLower) ||
      p.employeeCode?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isSelfService ? "Phiếu lương của tôi" : "Phiếu lương"}
        </h1>
        <p className="text-muted-foreground">
          {isSelfService
            ? "Xem và tải phiếu lương cá nhân"
            : "Quản lý phiếu lương nhân viên"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
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
      </div>

      {/* Summary Cards */}
      {!isSelfService && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tổng số phiếu</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Đã xem</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.filter((p) => p.status !== "GENERATED").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Chưa xem</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.filter((p) => p.status === "GENERATED").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu lương</CardTitle>
          <CardDescription>
            {filteredPayslips?.length || 0} phiếu lương
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Đang tải...</div>
            </div>
          ) : !filteredPayslips || filteredPayslips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                Không có phiếu lương
              </h3>
              <p className="mt-2 text-sm">
                {isSelfService
                  ? "Bạn chưa có phiếu lương nào"
                  : "Chưa có phiếu lương nào được tạo"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tháng/Năm</TableHead>
                  {!isSelfService && (
                    <>
                      <TableHead>Mã NV</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Phòng ban</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Lương Gross</TableHead>
                  <TableHead className="text-right">Thuế</TableHead>
                  <TableHead className="text-right">BH</TableHead>
                  <TableHead className="text-right">Lương Net</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.month}/{payslip.year}
                    </TableCell>
                    {!isSelfService && (
                      <>
                        <TableCell>{payslip.employeeCode || "—"}</TableCell>
                        <TableCell>{payslip.employeeName}</TableCell>
                        <TableCell>{payslip.departmentName || "—"}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      {formatCurrency(Number(payslip.grossSalary))}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const tax = JSON.parse(String(payslip.tax));
                        return formatCurrency(tax["Thuế TNCN"] || 0);
                      })()}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      {(() => {
                        const ins = JSON.parse(payslip.insurance);
                        return formatCurrency(
                          (ins.BHXH || 0) + (ins.BHYT || 0) + (ins.BHTN || 0),
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell> */}
                    <TableCell>
                      {payslip.status === "GENERATED" ? (
                        <Badge variant="secondary">Mới</Badge>
                      ) : payslip.status === "VIEWED" ? (
                        <Badge>Đã xem</Badge>
                      ) : (
                        <Badge variant="outline">Đã tải</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/payroll/payslips/${payslip.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

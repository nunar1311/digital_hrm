"use client";

import { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Search,
  Send,
  MoreHorizontal,
  FileSpreadsheet,
  Trash2,
  LayoutGrid,
  List,
  Receipt,
  Eye,
  Shield,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/payroll/payroll-utils";
import type { Payslip } from "@/app/(protected)/payroll/types";

interface PayrollPayslipsTabProps {
  recordId: string;
  recordStatus: string;
  filteredPayslips: Payslip[];
  onViewPayslip: (userId: string) => void;
  onViewEmployeeDetail: (payslip: Payslip) => void;
  onExportAll: () => void;
  onSendEmail: () => void;
  onDeleteRecord: () => void;
  onRefetch: () => void;
}

function getPayslipBadgeVariant(status: string) {
  if (status === "GENERATED") return "secondary";
  if (status === "VIEWED") return "outline";
  return "default";
}

function getPayslipBadgeLabel(status: string) {
  if (status === "GENERATED") return "Mới";
  if (status === "VIEWED") return "Đã xem";
  return "Đã tải";
}

export function PayrollPayslipsTab({
  recordStatus,
  filteredPayslips,
  onViewPayslip,
  onViewEmployeeDetail,
  onExportAll,
  onSendEmail,
  onDeleteRecord,
  onRefetch,
}: PayrollPayslipsTabProps) {
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = { current: null as HTMLDivElement | null };

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(
    searchContainerRef as React.RefObject<HTMLDivElement>,
    clickOutsideRef,
  );

  const displayedPayslips = useMemo(() => {
    if (!search.trim()) return filteredPayslips;
    const q = search.toLowerCase();
    return filteredPayslips.filter(
      (p) =>
        p.employeeName.toLowerCase().includes(q) ||
        (p.username || "").toLowerCase().includes(q) ||
        (p.departmentName || "").toLowerCase().includes(q),
    );
  }, [filteredPayslips, search]);

  const handleSearchToggle = () => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
      setSearchExpanded(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Phiếu lương nhân viên</CardTitle>
            <CardDescription>
              {displayedPayslips.length} phiếu lương
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-50 opacity-100 pl-3"
                    : "w-0 opacity-0 pl-0",
                )}
              />
              <Button
                size={"icon-xs"}
                variant={"ghost"}
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0.5 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center border rounded-lg ">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("list")}
              >
                <List />
              </Button>
            </div>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-xs">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportAll}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Xuất CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRefetch}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Làm mới
                </DropdownMenuItem>
                {recordStatus === "COMPLETED" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSendEmail}>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi email phiếu lương
                    </DropdownMenuItem>
                  </>
                )}
                {recordStatus === "DRAFT" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={onDeleteRecord}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa bảng lương
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main action */}
            {recordStatus === "COMPLETED" && (
              <Button size="xs" variant="outline" onClick={onSendEmail}>
                <Send className="mr-1 h-3 w-3" />
                Gửi email
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "grid" ? (
          <GridPayslips
            payslips={displayedPayslips}
            onView={onViewPayslip}
            onViewEmployeeDetail={onViewEmployeeDetail}
          />
        ) : (
          <ListPayslips
            payslips={displayedPayslips}
            onViewEmployeeDetail={onViewEmployeeDetail}
          />
        )}

        {displayedPayslips.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search.trim()
                ? "Không tìm thấy phiếu lương phù hợp."
                : "Chưa có phiếu lương nào. Vui lòng duyệt bảng lương trước."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GridPayslips({
  payslips,
  onView,
  onViewEmployeeDetail,
}: {
  payslips: Payslip[];
  onView: (userId: string) => void;
  onViewEmployeeDetail: (payslip: Payslip) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {payslips.map((payslip, index) => (
        <Card
          key={payslip.id}
          className="cursor-pointer p-2"
          onClick={() => onViewEmployeeDetail(payslip)}
        >
          <CardContent className="p-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {payslip.employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{payslip.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {payslip.user?.username || "—"}
                  </p>
                </div>
              </div>
              {payslip.isSecure && (
                <Shield className="h-3 w-3 text-muted-foreground" />
              )}
            </div>

            <Separator className="my-2" />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Lương Net</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(payslip.netSalary)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Trạng thái
                </span>
                <Badge
                  variant={getPayslipBadgeVariant(payslip.status)}
                  className={cn(
                    "text-xs",
                    payslip.status === "DOWNLOADED" &&
                      "bg-green-100 text-green-700",
                  )}
                >
                  {getPayslipBadgeLabel(payslip.status)}
                </Badge>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                #{index + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(payslip.userId);
                }}
              >
                <Eye className="mr-1 h-3 w-3" />
                Xem
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListPayslips({
  payslips,
  onViewEmployeeDetail,
}: {
  payslips: Payslip[];
  onViewEmployeeDetail: (payslip: Payslip) => void;
}) {
  return (
    <div className="space-y-2">
      {payslips.map((payslip) => (
        <div
          key={payslip.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onViewEmployeeDetail(payslip)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {payslip.employeeName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{payslip.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {payslip.username || "—"} • {payslip.departmentName || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Lương Net</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(payslip.netSalary)}
              </p>
            </div>
            <Badge variant={getPayslipBadgeVariant(payslip.status)}>
              {getPayslipBadgeLabel(payslip.status)}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

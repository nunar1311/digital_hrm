"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CalendarDays, Loader2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getMyLeaveBalances,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getMyLeaveTypes,
} from "./actions";
import { LeaveRequestList } from "./components/leave-request-list";
import { LeaveRequestDialog } from "./components/leave-request-dialog";
import {
  ESSLeaveClientProps,
  LeaveBalance,
} from "./types";


// ============================================================
// SUB-COMPONENTS
// ============================================================

const YEAR_OPTIONS = [2024, 2025, 2026];
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
];

function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const usagePercent =
    balance.totalDays > 0
      ? ((balance.usedDays + balance.pendingDays) / balance.totalDays) * 100
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{balance.leaveTypeName}</CardTitle>
          {balance.isPaidLeave ? (
            <Badge className="text-xs bg-emerald-100 text-emerald-700">Có lương</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Không lương</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold">{balance.available}</span>
              <span className="text-sm text-muted-foreground ml-1">ngày khả dụng</span>
            </div>
            <span className="text-xs text-muted-foreground">/ {balance.totalDays} ngày</span>
          </div>
          <Progress value={100 - usagePercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Đã dùng: {balance.usedDays}</span>
            {balance.pendingDays > 0 && (
              <span className="text-amber-600">Chờ duyệt: {balance.pendingDays}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaveRequestEmptyState({ onRegister }: { onRegister: () => void }) {
  return (
    <div className="text-center py-12">
      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">Chưa có yêu cầu nghỉ phép nào</p>
      <Button variant="outline" className="mt-4 gap-2" onClick={onRegister}>
        <Plus className="h-4 w-4" />
        Đăng ký nghỉ phép đầu tiên
      </Button>
    </div>
  );
}

function LeaveRequestPagination({
  page,
  totalPages,
  total,
  year,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  year: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        Trang {page} / {totalPages} · {total} yêu cầu trong năm {year}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ESSLeaveClient({
  initialBalances,
  initialRequests,
}: ESSLeaveClientProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch leave types for request dialog
  const { data: leaveTypesData } = useQuery({
    queryKey: ["my-leave-types"],
    queryFn: getMyLeaveTypes,
  });

  // Fetch leave balances
  const { data: balances = initialBalances } = useQuery({
    queryKey: ["my-leave-balances", selectedYear],
    queryFn: () => getMyLeaveBalances(),
    initialData: initialBalances,
  });

  // Fetch leave requests
  const { data: requestsData = initialRequests, isLoading: isLoadingRequests } =
    useQuery({
      queryKey: ["my-leave-requests", selectedYear, selectedStatus, currentPage],
      queryFn: () =>
        getMyLeaveRequests({
          year: selectedYear,
          status: selectedStatus as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ALL",
          page: currentPage,
          pageSize: 10,
        }),
      initialData: initialRequests,
    });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu nghỉ phép");
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể hủy yêu cầu");
    },
  });

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-linear-to-r from-blue-50/50 to-primary/5">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-blue-600" />
                Nghỉ phép
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem số dư và đăng ký nghỉ phép
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Đăng ký nghỉ phép
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Leave Balances */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {balances.slice(0, 6).map((balance) => (
            <LeaveBalanceCard key={balance.id} balance={balance} />
          ))}
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lịch sử yêu cầu
                </CardTitle>
                <CardDescription>
                  {requestsData.total} yêu cầu trong năm {selectedYear}
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Select value={String(selectedYear)} onValueChange={handleYearChange}>
                  <SelectTrigger className="h-9 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        Năm {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-9 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requestsData.items.length === 0 ? (
              <LeaveRequestEmptyState onRegister={() => setIsDialogOpen(true)} />
            ) : (
              <>
                <LeaveRequestList
                  requests={requestsData.items}
                  onCancel={(id: string) => cancelMutation.mutate(id)}
                  isCancelling={cancelMutation.isPending}
                />
                {requestsData.totalPages > 1 && (
                  <LeaveRequestPagination
                    page={requestsData.page}
                    totalPages={requestsData.totalPages}
                    total={requestsData.total}
                    year={selectedYear}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Request Dialog */}
      <LeaveRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        leaveTypes={leaveTypesData?.leaveTypes || []}
        manager={leaveTypesData?.manager}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
          queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
          queryClient.invalidateQueries({ queryKey: ["my-leave-types"] });
        }}
      />
    </div>
  );
}

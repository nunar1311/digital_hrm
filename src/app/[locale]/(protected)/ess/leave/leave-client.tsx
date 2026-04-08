"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "ALL", labelKey: "essLeaveStatusAll" },
  { value: "PENDING", labelKey: "essLeaveStatusPending" },
  { value: "APPROVED", labelKey: "essLeaveStatusApproved" },
  { value: "REJECTED", labelKey: "essLeaveStatusRejected" },
  { value: "CANCELLED", labelKey: "essLeaveStatusCancelled" },
];

function LeaveBalanceCard({ balance, t }: { balance: LeaveBalance; t: ReturnType<typeof useTranslations> }) {
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
            <Badge className="text-xs bg-emerald-100 text-emerald-700">{t("essLeavePaid")}</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">{t("essLeaveUnpaid")}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold">{balance.available}</span>
              <span className="text-sm text-muted-foreground ml-1">{t("essLeaveAvailableDays")}</span>
            </div>
            <span className="text-xs text-muted-foreground">{t("essLeaveTotalDays", { total: balance.totalDays })}</span>
          </div>
          <Progress value={100 - usagePercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("essLeaveUsedDays", { used: balance.usedDays })}</span>
            {balance.pendingDays > 0 && (
              <span className="text-amber-600">{t("essLeavePendingDays", { pending: balance.pendingDays })}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaveRequestEmptyState({ onRegister, t }: { onRegister: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center py-12">
      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{t("essLeaveEmpty")}</p>
      <Button variant="outline" className="mt-4 gap-2" onClick={onRegister}>
        <Plus className="h-4 w-4" />
        {t("essLeaveCreateFirstRequest")}
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
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  year: number;
  onPageChange: (p: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        {t("essLeavePagination", { page, totalPages, total, year })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          {t("essLeavePrevious")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          {t("essLeaveNext")}
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
  const t = useTranslations("ProtectedPages");
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
      toast.success(t("essLeaveCancelSuccess"));
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("essLeaveCancelError"));
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
                {t("essLeaveTitle")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("essLeaveDescription")}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("essLeaveCreateRequest")}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Leave Balances */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {balances.slice(0, 6).map((balance) => (
            <LeaveBalanceCard key={balance.id} balance={balance} t={t} />
          ))}
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("essLeaveHistoryTitle")}
                </CardTitle>
                <CardDescription>
                  {t("essLeaveHistoryCount", { total: requestsData.total, year: selectedYear })}
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
                        {t("essLeaveYearOption", { year })}
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
                        {t(opt.labelKey)}
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
              <LeaveRequestEmptyState onRegister={() => setIsDialogOpen(true)} t={t} />
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
                    t={t}
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

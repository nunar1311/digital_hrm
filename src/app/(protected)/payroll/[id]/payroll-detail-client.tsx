"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Mail,
  MoreHorizontal,
  Trash2,
  Download,
  RefreshCw,
} from "lucide-react";
import { PayrollDetailTable } from "@/components/payroll/payroll-detail-table";
import { PayrollOverviewTab } from "@/components/payroll/payroll-overview-tab";
import { PayrollPayslipsTab } from "@/components/payroll/payroll-payslips-tab";
// import {
//   DeletePayrollDialog,
//   ApprovalPayrollDialog,
//   SendPayslipEmailDialog,
// } from "@/components/payroll/payroll-detail-dialogs";
import {
  updatePayrollRecordStatus,
  recalculatePayrollRecord,
  exportPayrollRecord,
  getPayrollRecord,
  getPayslips,
} from "@/app/(protected)/payroll/actions";
import { useRightSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import type {
  PayrollRecord,
  PayrollRecordDetail,
  Payslip,
} from "@/app/(protected)/payroll/types";
import { Badge } from "@/components/ui/badge";

// ─── Props ───

interface PayrollDetailClientProps {
  recordId: string;
  initialRecord: PayrollRecord | null;
  initialPayslips: Payslip[];
  departments: { id: string; name: string }[];
}

// ─── Component ───

export default function PayrollDetailClient({
  recordId,
  initialRecord,
  initialPayslips,
  departments,
}: PayrollDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openRightSidebar } = useRightSidebar();

  // ─── State ───
  const [activeTab, setActiveTab] = useState("overview");

  // ─── Queries ───
  const {
    data: record,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["payroll-record", recordId],
    queryFn: () =>
      getPayrollRecord(recordId) as unknown as Promise<PayrollRecord>,
    initialData: initialRecord,
  });

  const { data: payslips, refetch: refetchPayslips } = useQuery({
    queryKey: ["payslips-for-record", recordId],
    queryFn: () =>
      getPayslips({
        month: record?.month,
        year: record?.year,
      }) as unknown as Promise<Payslip[]>,
    initialData: initialPayslips,
    refetchInterval: 30000,
    enabled: !!record,
  });

  // ─── Mutations ───
  const updateStatusMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED") =>
      updatePayrollRecordStatus(recordId, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["payroll-record", recordId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái",
      );
    },
    onSettled: () => toast.success("Đã cập nhật trạng thái"),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportPayrollRecord(recordId),
    onSuccess: (data) => {
      if (!data.csvContent || !data.fileName) {
        toast.error(data.message || "Lỗi khi xuất file");
        return;
      }
      const blob = new Blob([data.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Đã xuất file CSV");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xuất file");
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => recalculatePayrollRecord(recordId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["payroll-record", recordId] });
        queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
        queryClient.invalidateQueries({ queryKey: ["payslips-for-record", recordId] });
      } else {
        toast.error(result.message || "Lỗi khi tính lại bảng lương");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tính lại bảng lương");
    },
  });

  // ─── Derived data ───
  const isPending =
    isLoading || updateStatusMutation.isPending || exportMutation.isPending || recalculateMutation.isPending;

  const details: PayrollRecordDetail[] = record?.details ?? [];
  const filteredPayslips = useMemo(
    () => payslips?.filter((p) => p.payrollRecordId === recordId) ?? [],
    [payslips, recordId],
  );

  // ─── Handlers ───
  const handleViewEmployeeDetail = useCallback(
    (detail: PayrollRecordDetail) => {
      if (!record) return;
      openRightSidebar("payroll_employee", {
        detail,
        month: record.month,
        year: record.year,
      });
    },
    [record, openRightSidebar],
  );

  const handleViewPayslip = useCallback(
    (userId: string) => {
      const payslip = filteredPayslips.find((p) => p.userId === userId);
      if (payslip) {
        openRightSidebar("payslip_employee", payslip);
      } else {
        toast.info("Chưa có phiếu lương cho nhân viên này");
      }
    },
    [filteredPayslips, openRightSidebar],
  );

  const handleViewEmployeeDetailFromPayslip = useCallback(
    (payslip: Payslip) => {
      openRightSidebar("payslip_employee", payslip);
    },
    [openRightSidebar],
  );

  const handleRefresh = useCallback(() => {
    refetch();
    refetchPayslips();
  }, [refetch, refetchPayslips]);

  // ─── Render ───
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <h2 className="text-xl font-semibold">Không tìm thấy bảng lương</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/payroll")}
        >
          <ArrowLeft />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 h-full flex-1 flex flex-col bg-background relative">
      {/* ─── Header ─── */}
      <div className="shrink-0 border-b">
        <div className="h-10 px-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push("/payroll")}
              tooltip="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-bold truncate">
              Bảng lương T{record.month}/{record.year}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Refresh */}
            <Button
              variant="outline"
              size="icon-xs"
              disabled={isFetching}
              onClick={handleRefresh}
              tooltip="Làm mới"
            >
              <RefreshCw
                className={cn("h-4 w-4", isFetching && "animate-spin")}
              />
            </Button>

            <Separator orientation="vertical" className="h-4!" />

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-xs" disabled={isPending}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => recalculateMutation.mutate()}
                  disabled={isPending || recalculateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tính lại bảng lương
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportMutation.mutate()}
                  disabled={isPending}
                >
                  <FileSpreadsheet />
                  Xuất CSV
                </DropdownMenuItem>
                {record.status === "COMPLETED" && (
                  <DropdownMenuItem
                  onClick={() => toast.info("Tính năng đang phát triển")}
                    disabled={isPending}
                  >
                    <Mail />
                    Gửi email phiếu lương
                  </DropdownMenuItem>
                )}
                {record.status === "DRAFT" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => toast.info("Tính năng đang phát triển")}
                      disabled={isPending}
                    >
                      <Trash2 />
                      Xóa bảng lương
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main action button by status */}
            {record.status === "DRAFT" && (
              <Button
                size="xs"
                onClick={() => updateStatusMutation.mutate("PROCESSING")}
                disabled={isPending}
                tooltip="Duyệt bảng lương"
              >
                <Check />
                Duyệt
              </Button>
            )}
            {record.status === "PROCESSING" && (
              <Button
                size="xs"
                onClick={() => updateStatusMutation.mutate("COMPLETED")}
                disabled={isPending}
                tooltip="Hoàn thành bảng lương"
              >
                <Check />
                Hoàn thành
              </Button>
            )}
            {record.status === "COMPLETED" && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => exportMutation.mutate()}
                disabled={isPending}
                tooltip="Xuất báo cáo CSV"
              >
                <Download />
                Xuất báo cáo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="flex items-center px-2 pb-0 border-b bg-background shrink-0">
          {(
            [
              { value: "overview", label: "Tổng quan", count: undefined as number | undefined },
              { value: "details", label: "Chi tiết", count: details.length },
              { value: "payslips", label: "Phiếu lương", count: filteredPayslips.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}{" "}
              {tab.count !== undefined && (
                <Badge
                  className={cn(
                    "p-0 px-1 text-[10px]",
                    activeTab === tab.value
                      ? "bg-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Tab content scrolls */}
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-2">
          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <PayrollOverviewTab record={record} details={details} />
          )}

          {/* Tab: Details */}
          {activeTab === "details" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-base font-medium">
                    Chi tiết lương nhân viên
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Danh sách chi tiết lương của {details.length} nhân viên
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => exportMutation.mutate()}
                  disabled={isPending}
                >
                  <FileSpreadsheet />
                  Xuất CSV
                </Button>
              </div>

              <PayrollDetailTable
                details={details}
                departments={departments}
                departmentId={record?.departmentId ?? null}
                onViewPayslip={handleViewPayslip}
                onExportPayslip={() => {
                  toast.info("Tính năng đang phát triển");
                }}
                onViewEmployeeDetail={handleViewEmployeeDetail}
                isLoading={false}
                hasNextPage={false}
                isFetchingNextPage={false}
                onLoadMore={undefined}
                totalDetails={details.length}
              />
            </div>
          )}

          {/* Tab: Payslips */}
          {activeTab === "payslips" && (
              <PayrollPayslipsTab
                recordId={recordId}
                recordStatus={record.status}
                filteredPayslips={filteredPayslips}
                onViewPayslip={handleViewPayslip}
                onViewEmployeeDetail={handleViewEmployeeDetailFromPayslip}
                onExportAll={() => exportMutation.mutate()}
                onSendEmail={() => toast.info("Tính năng đang phát triển")}
                onDeleteRecord={() => toast.info("Tính năng đang phát triển")}
                onRefetch={handleRefresh}
              />
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}

      {/* Delete Dialog */}
      {/* <DeletePayrollDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={record}
        onDeleted={() => router.push("/payroll")}
      /> */}

      {/* Approval Dialog */}
      {/* <ApprovalPayrollDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        record={record}
        recordId={recordId}
        onApproved={() => {
          queryClient.invalidateQueries({
            queryKey: ["payroll-record", recordId],
          });
          queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
        }}
      /> */}

      {/* Send Email Dialog */}
      {/* <SendPayslipEmailDialog
        open={sendEmailDialogOpen}
        onOpenChange={setSendEmailDialogOpen}
        record={record}
        payslipsCount={filteredPayslips.length}
        recordId={recordId}
        onSent={() =>
          queryClient.invalidateQueries({
            queryKey: ["payslips-for-record", recordId],
          })
        }
      /> */}
    </div>
  );
}

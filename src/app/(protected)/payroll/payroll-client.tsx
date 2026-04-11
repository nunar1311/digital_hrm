"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getPayrollRecords,
  deletePayrollRecord,
  deleteManyPayrollRecords,
  exportPayrollRecord,
  exportManyPayrollRecords,
} from "./actions";
import {
  calculatePayrollSummary,
  buildPayrollChartData,
} from "@/components/payroll/payroll-utils";
import { SummaryCards } from "@/components/payroll/payroll-summary-cards";
import { PayrollChart } from "@/components/payroll/payroll-chart";
import { PayrollRecordsTable } from "@/components/payroll/payroll-records-table";
import { PayrollFilters } from "@/components/payroll/payroll-filters";
import { CreatePayrollDialog } from "@/components/payroll/create-payroll-dialog";

export default function PayrollClient({
  initialRecords,
  departments,
}: {
  initialRecords: Awaited<ReturnType<typeof getPayrollRecords>>;
  departments: { id: string; name: string }[];
}) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const { data: records, isLoading } = useQuery({
    queryKey: ["payroll-records", filterStatus, filterDepartment],
    queryFn: () =>
      getPayrollRecords({
        status: filterStatus === "all" ? undefined : filterStatus,
        departmentId: filterDepartment === "all" ? undefined : filterDepartment,
      }),
    initialData: initialRecords,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayrollRecord,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã xóa bảng lương");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: exportPayrollRecord,
    onSuccess: (data) => {
      if (!data.csvContent || !data.fileName) {
        toast.error(data.message || "Lỗi khi xuất file");
        return;
      }
      const blob = new Blob([data.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file CSV");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xuất file");
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: deleteManyPayrollRecords,
    onSuccess: (data) => {
      toast.success(`Đã xóa ${data.deleted} bảng lương`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi xóa hàng loạt",
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
  });

  const batchExportMutation = useMutation({
    mutationFn: exportManyPayrollRecords,
    onSuccess: (data) => {
      if (!data.csvContent || !data.fileName) {
        toast.error(data.message || "Lỗi khi xuất file hàng loạt");
        return;
      }
      const blob = new Blob([data.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file CSV");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi xuất file hàng loạt",
      );
    },
  });

  const summary = useMemo(() => calculatePayrollSummary(records), [records]);

  const chartData = useMemo(() => buildPayrollChartData(records), [records]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b h-10 p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-bold">Bảng lương</h1>
          <CreatePayrollDialog />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto space-y-4">
        <SummaryCards summary={summary} />

        <div className="px-2">
          <Card className="p-3">
            <CardHeader className="p-0 gap-0">
              <CardTitle className="flex items-center text-base">
                So sánh Gross / Net theo tháng
              </CardTitle>
              <CardDescription>
                Biểu đồ tổng hợp các kỳ lương gần nhất
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PayrollChart records={chartData} />
            </CardContent>
          </Card>
        </div>

        <PayrollFilters
          filterDepartment={filterDepartment}
          filterStatus={filterStatus}
          departments={departments}
          recordCount={records?.length || 0}
          onDepartmentChange={setFilterDepartment}
          onStatusChange={setFilterStatus}
        />

        <PayrollRecordsTable
          records={records || []}
          isLoading={isLoading}
          onDelete={(id) => deleteMutation.mutate(id)}
          onExport={(id) => exportMutation.mutate(id)}
          onBatchDelete={(ids) => batchDeleteMutation.mutate(ids)}
          onBatchExport={(ids) => batchExportMutation.mutate(ids)}
          totalRecords={records?.length || 0}
          hasNextPage={false}
          isFetchingNextPage={false}
          columnVisibility={{}}
          onColumnVisibilityChange={() => {}}
        />
      </div>
    </div>
  );
}

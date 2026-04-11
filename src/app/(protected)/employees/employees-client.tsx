"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getEmployees, deleteEmployee, type GetEmployeesResult, type EmployeeListItem } from "./actions";
import { PAGE_SIZE } from "@/app/(protected)/departments/constants";
import { useSocketEvents } from "@/hooks/use-socket-event";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table } from "@/components/ui/table";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

import {
  EmployeesToolbar,
  EmployeesBatchActionsBar,
  EmployeesTableHeader,
  EmployeesTableBody,
  EmployeesSummary,
  useEmployeesTableColumns,
} from "./components";
import { MoveEmployeesDialog } from "@/components/departments/move-employees-dialog";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { ExportEmployeesDialog } from "@/components/employees/import-export/export-employees-dialog";
import { ManagePasswordDialog } from "@/components/employees/manage-password-dialog";
import type { EmployeeStatus } from "@/app/(protected)/employees/types";

export function EmployeesClient() {
  const queryClient = useQueryClient();
  // ─── State ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EmployeeListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [addEmployeesOpen, setAddEmployeesOpen] = useState(false);
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<string[] | null>(null);
  const [managePasswordEmployee, setManagePasswordEmployee] = useState<EmployeeListItem | null>(null);

  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>("ALL");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    username: true,
    fullName: true,
    positionName: true,
    phone: true,
    employeeStatus: true,
    gender: false,
    nationalId: false,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showEmptyDepartments, setShowEmptyDepartments] = useState(false);
  const [wrapText, setWrapText] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ─── Real-time sync ──────────────────────────────────────────────────────
  useSocketEvents(
    [
      "employee:created",
      "employee:updated",
      "employee:deleted",
      "employee:department-changed",
      "department:employee-moved",
    ],
    () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  );

  // ─── Data fetching ───────────────────────────────────────────────────────
  const { data: employeesData, isLoading: isLoadingEmployees, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<GetEmployeesResult>({
      queryKey: ["employees", { pageSize: PAGE_SIZE, search, status: statusFilter }],
      queryFn: ({ pageParam }) =>
        getEmployees({ page: pageParam as number, pageSize: PAGE_SIZE, search, status: statusFilter }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });

  const employees = useMemo(() => employeesData?.pages.flatMap((p) => p.employees) ?? [], [employeesData]);
  const total = employeesData?.pages[0]?.total ?? 0;

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const sentinel = document.getElementById("infinite-scroll-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: container, rootMargin: "400px", threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Column helpers ───────────────────────────────────────────────────────
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === employees.length ? new Set() : new Set(employees.map((e) => e.id)),
    );
  }, [employees]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const columns = useEmployeesTableColumns({
    selectedIds,
    onToggleAll: toggleAll,
    onToggleOne: toggleOne,
    totalRows: employees.length,
    onManagePassword: setManagePasswordEmployee,
  });

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // ─── Delete actions ─────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteEmployee(deleteTarget.id);
    if (result) {
      toast.success("Xóa nhân viên thành công");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } else {
      toast.error("Có lỗi xảy ra");
    }
    setDeleteTarget(null);
  }, [deleteTarget, queryClient]);

  const handleBatchDelete = useCallback(async () => {
    if (!batchDeleteTarget) return;
    const results = await Promise.allSettled(batchDeleteTarget.map((id) => deleteEmployee(id)));
    const succeeded = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.filter((r) => r.status === "rejected" || !r.value).length;
    if (failed === 0) {
      toast.success(`Đã xóa ${succeeded} nhân viên`);
    } else {
      toast.error(`Xóa thành công ${succeeded}/${batchDeleteTarget.length}, thất bại ${failed}`);
    }
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    setBatchDeleteTarget(null);
    setSelectedIds(new Set());
  }, [batchDeleteTarget, queryClient]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const rowModels = table.getRowModel().rows;

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* ── Header ── */}
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">Tất cả nhân viên</h1>
          </header>

          <EmployeesToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            showEmptyDepartments={showEmptyDepartments}
            onShowEmptyDepartmentsChange={setShowEmptyDepartments}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            settingsOpen={settingsOpen}
            onSettingsOpenChange={setSettingsOpen}
            onAddEmployee={() => setAddEmployeesOpen(true)}
            onExport={() => setExportOpen(true)}
          />
        </section>

        {/* ── Table ── */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {selectedIds.size > 0 && (
            <EmployeesBatchActionsBar
              count={selectedIds.size}
              onDelete={() => setBatchDeleteTarget(Array.from(selectedIds))}
              onMoveDepartment={() => setMoveDialogOpen(true)}
              onClearSelection={clearSelection}
            />
          )}

          <div className="h-full flex flex-col pb-8" ref={tableContainerRef}>
            <Table>
              <EmployeesTableHeader headerGroups={table.getHeaderGroups()} />
              <EmployeesTableBody
                columns={columns}
                rows={employees}
                rowModels={rowModels}
                isLoading={isLoadingEmployees}
                hasRows={!!rowModels.length}
                search={search}
                onClearSearch={() => setSearch("")}
                isFetchingNextPage={isFetchingNextPage}
              />
            </Table>

            {!isLoadingEmployees && employees.length > 0 && (
              <EmployeesSummary
                displayed={employees.length}
                total={total}
                hasMore={!!hasNextPage}
                loadedAll={employees.length >= total}
              />
            )}
          </div>
        </section>
      </div>

      {/* ── Dialogs ── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên{" "}
              <strong>{deleteTarget?.fullName || deleteTarget?.name}</strong> không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchDeleteTarget !== null} onOpenChange={(open) => !open && setBatchDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{batchDeleteTarget?.length ?? 0}</strong> nhân viên đã chọn?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa {batchDeleteTarget?.length ?? 0} nhân viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveEmployeesDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        selectedIds={Array.from(selectedIds)}
        currentDepartmentId=""
        currentDepartmentName="Tất cả phòng ban"
        onMoved={() => {
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          setSelectedIds(new Set());
        }}
      />

      <AddEmployeeDialog open={addEmployeesOpen} onClose={() => setAddEmployeesOpen(false)} />

      <ExportEmployeesDialog open={exportOpen} onOpenChange={setExportOpen} search={search} status={statusFilter} />

      <ManagePasswordDialog
        open={managePasswordEmployee !== null}
        onOpenChange={(open) => !open && setManagePasswordEmployee(null)}
        employeeId={managePasswordEmployee?.id || ""}
        employeeName={managePasswordEmployee?.fullName || managePasswordEmployee?.name || ""}
      />
    </div>
  );
}

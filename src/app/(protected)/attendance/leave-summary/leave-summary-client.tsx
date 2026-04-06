"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  Search,
  Settings,
  RefreshCw,
  X,
  Download,
  Pencil,
  BadgeCheck,
  User,
  CalendarDays,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  flexRender,
  getCoreRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getLeaveBalances,
  updateLeaveBalance,
} from "./actions";
import type {
  LeaveBalanceListResponse,
  LeaveBalanceWithRelations,
  UpdateLeaveBalanceData,
} from "./types";
import { ExportLeaveBalancesDialog } from "./components/export-leave-balances-dialog";
import { LeaveSummaryFilters } from "./components/leave-summary-filters";

const updateBalanceSchema = z.object({
  totalDays: z.number().min(0),
  usedDays: z.number().min(0),
  note: z.string().optional(),
});

type UpdateBalanceFormData = z.infer<typeof updateBalanceSchema>;

interface LeaveSummaryClientProps {
  initialData?: LeaveBalanceListResponse;
}

export function LeaveSummaryClient({ initialData }: LeaveSummaryClientProps) {
  const queryClient = useQueryClient();

  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    employeeName: true,
    department: true,
    leaveTypeName: true,
    totalDays: true,
    usedDays: true,
    pendingDays: true,
    availableDays: true,
  });

  // Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter/search state
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    leaveTypeId: "all",
    departmentId: "all",
    employeeStatus: "all",
    search: "",
  });
  const { year, leaveTypeId, departmentId, employeeStatus, search } = filters;

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<string[] | null>(
    null,
  );

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [editingBalance, setEditingBalance] =
    useState<LeaveBalanceWithRelations | null>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<LeaveBalanceWithRelations | null>(null);

  // Click outside to close search
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (filters.search.trim()) {
        setFilters((f) => ({ ...f, search: "" }));
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Fetch data (year and search still server-side, department/leaveType client-side via React Table)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "leave-balances",
      filters.year,
      filters.leaveTypeId,
      filters.departmentId,
      filters.employeeStatus,
      filters.search,
    ],
    queryFn: async () =>
      getLeaveBalances({
        year: filters.year,
        search: filters.search || undefined,
      }) as Promise<LeaveBalanceListResponse>,
    initialData,
  });

  // Extract unique departments and leave types from data for filter options
  const departments = useMemo(() => {
    const sourceData = data?.data || initialData?.data || [];
    const deptMap = new Map<string, { id: string; name: string }>();
    sourceData.forEach((item: LeaveBalanceWithRelations) => {
      if (item.user?.department) {
        deptMap.set(item.user.department.id, {
          id: item.user.department.id,
          name: item.user.department.name,
        });
      }
    });
    return Array.from(deptMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data?.data, initialData?.data]);

  const leaveTypesFromData = useMemo(() => {
    const sourceData = data?.data || initialData?.data || [];
    const ltMap = new Map<string, { id: string; name: string }>();
    sourceData.forEach((item: LeaveBalanceWithRelations) => {
      if (item.leaveType) {
        ltMap.set(item.leaveType.id, {
          id: item.leaveType.id,
          name: item.leaveType.name,
        });
      }
    });
    return Array.from(ltMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data?.data, initialData?.data]);

  // Edit form
  const editForm = useForm<UpdateBalanceFormData>({
    resolver: zodResolver(updateBalanceSchema),
    defaultValues: {
      totalDays: 0,
      usedDays: 0,
      note: "",
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveBalanceData }) =>
      updateLeaveBalance(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật số dư");
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      setEditDialog(false);
      setEditingBalance(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Đã xảy ra lỗi");
    },
  });



  // Handlers
  const handleEdit = useCallback(
    (balance: LeaveBalanceWithRelations) => {
      setEditingBalance(balance);
      editForm.reset({
        totalDays: balance.totalDays,
        usedDays: balance.usedDays,
        note: "",
      });
      setEditDialog(true);
    },
    [editForm],
  );



  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );

  // Selection handlers (must be before columns)
  const toggleAll = useCallback(() => {
    if (!data?.data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map((e) => e.id)));
    }
  }, [selectedIds.size, data?.data]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<LeaveBalanceWithRelations>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              data?.data &&
              data.data.length > 0 &&
              selectedIds.size === data.data.length
                ? true
                : selectedIds.size > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={toggleAll}
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleOne(row.original.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
            aria-label={`Chọn ${row.original.user?.fullName || row.original.user?.name}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "employeeName",
        header: "Nhân viên",
        cell: ({ row }) => {
          const name =
            row.original.user?.fullName || row.original.user?.name || "N/A";
          const initials = name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={row.original.user?.avatar || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {row.original.user?.email || "---"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "department",
        header: "Phòng ban",
        filterFn: (row, columnId, filterValue: string) => {
          if (filterValue === "all") return true;
          return row.original.user?.department?.id === filterValue;
        },
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.user?.department?.name || "---"}
          </span>
        ),
      },
      {
        id: "leaveTypeName",
        header: "Loại nghỉ",
        filterFn: (row, columnId, filterValue: string) => {
          if (filterValue === "all") return true;
          return row.original.leaveTypeId === filterValue;
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.leaveType?.name || "N/A"}</span>
          </div>
        ),
      },
      {
        accessorKey: "totalDays",
        header: "Tổng ngày",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.totalDays}</span>
        ),
      },
      {
        accessorKey: "usedDays",
        header: "Đã dùng",
        cell: ({ row }) => (
          <span className="text-red-600">{row.original.usedDays}</span>
        ),
      },

      {
        accessorKey: "pendingDays",
        header: "Đang chờ",
        cell: ({ row }) => (
          <span className="text-yellow-600">{row.original.pendingDays}</span>
        ),
      },
      {
        accessorKey: "availableDays",
        header: "Còn lại",
        cell: ({ row }) => {
          const available =
            row.original.totalDays -
            row.original.usedDays -
            row.original.pendingDays;
          return (
            <Badge variant={available > 0 ? "default" : "destructive"}>
              {available}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Hành động",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row.original);
                  }}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chỉnh sửa</TooltipContent>
            </Tooltip>

          </div>
        ),
        size: 100,
      },
    ],
    [
      data?.data,
      selectedIds,
      toggleAll,
      toggleOne,
      handleEdit,
      year,
    ],
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnVisibility,
      columnFilters,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // Get filter setters from table
  const setDepartmentFilter = (value: string) =>
    table.getColumn("department")?.setFilterValue(value);
  const setLeaveTypeFilter = (value: string) =>
    table.getColumn("leaveTypeName")?.setFilterValue(value);

  // Search handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, search: value }));
  }, []);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (filters.search.trim()) {
        setFilters((f) => ({ ...f, search: "" }));
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, filters.search]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setFilters((f) => ({ ...f, search: "" }));
        setSearchExpanded(false);
      }
    },
    [],
  );

  // Filter handlers using React Table
  const handleClearFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      year: new Date().getFullYear(),
      leaveTypeId: "all",
      departmentId: "all",
      employeeStatus: "all",
      search: "",
    }));
    table.getColumn("department")?.setFilterValue("all");
    table.getColumn("leaveTypeName")?.setFilterValue("all");
  }, [table]);

  // Get current filter values from table
  const departmentFilter =
    (table.getColumn("department")?.getFilterValue() as string) || "all";
  const leaveTypeFilter =
    (table.getColumn("leaveTypeName")?.getFilterValue() as string) || "all";

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    toast.success("Đã xóa số dư ngày nghỉ");
    setDeleteTarget(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
  }, [deleteTarget]);

  const handleBatchDelete = useCallback(async () => {
    if (!batchDeleteTarget) return;
    toast.success(`Đã xóa ${batchDeleteTarget.length} số dư ngày nghỉ`);
    queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    setBatchDeleteTarget(null);
    setSelectedIds(new Set());
  }, [batchDeleteTarget, queryClient]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="p-2 flex items-center h-10 border-b justify-between">
            <h1 className="font-bold">Tổng hợp số dư ngày nghỉ</h1>
            <Button
              variant={"outline"}
              size={"xs"}
              onClick={() => setExportDialog(true)}
            >
              <Download />
              Xuất Excel
            </Button>
          </header>
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
              {/* Combined Filters */}
              <LeaveSummaryFilters
                year={year}
                search={search}
                leaveTypes={leaveTypesFromData}
                departments={departments}
                years={years}
                onYearChange={(y) => setFilters((f) => ({ ...f, year: y }))}
                departmentFilter={departmentFilter}
                onDepartmentFilterChange={setDepartmentFilter}
                leaveTypeFilter={leaveTypeFilter}
                onLeaveTypeFilterChange={setLeaveTypeFilter}
                onClearFilters={handleClearFilters}
              />

              {/* Search */}
              <div className="relative flex items-center" ref={mergedSearchRef}>
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm kiếm nhân viên..."
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
                  <Search />
                </Button>
              </div>
              <Button
                variant={"outline"}
                size={"xs"}
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["leave-balances"],
                  })
                }
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
              </Button>

              <Separator orientation="vertical" className="h-4!" />

              <Button
                variant={"outline"}
                size={"xs"}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <TableSettingsPanel
            className="top-10"
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            defaultVisibleColumns={{
              employeeName: true,
              department: true,
              leaveTypeName: true,
              totalDays: true,
              usedDays: true,
              pendingDays: true,
              availableDays: true,
            }}
            columnOptions={[
              {
                key: "employeeName",
                label: "Nhân viên",
                icon: User,
              },
              {
                key: "department",
                label: "Phòng ban",
                icon: BadgeCheck,
              },
              {
                key: "leaveTypeName",
                label: "Loại nghỉ",
                icon: CalendarDays,
              },
              {
                key: "totalDays",
                label: "Tổng ngày",
                icon: BadgeCheck,
              },
              {
                key: "usedDays",
                label: "Đã dùng",
                icon: BadgeCheck,
              },
              {
                key: "pendingDays",
                label: "Đang chờ",
                icon: BadgeCheck,
              },
              {
                key: "availableDays",
                label: "Còn lại",
                icon: BadgeCheck,
              },
            ]}
            disabledColumnIndices={[]}
            hiddenColumnIndices={[]}
          />
        </section>

        {/* Table */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {/* Batch Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
              <span className="text-xs text-muted-foreground mr-1">
                Đã chọn{" "}
                <strong className="text-foreground">{selectedIds.size}</strong>{" "}
                bản ghi
              </span>
              <Button
                variant={"destructive"}
                size={"xs"}
                onClick={() => setBatchDeleteTarget(Array.from(selectedIds))}
              >
                <Trash2 />
                Xóa
              </Button>
              <Button
                variant="ghost"
                size={"icon-xs"}
                className="ml-auto h-6 w-6"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="h-full flex flex-col pb-8">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        className={cn(
                          "h-7 px-2 select-none z-10 relative",
                          header.column.id === "actions" ? "text-right" : "",
                        )}
                        key={header.id}
                        style={{
                          width: header.getSize(),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((col, j) => (
                        <TableCell
                          key={j}
                          style={{
                            width: col.size,
                          }}
                          className="p-2"
                        >
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group/row cursor-default">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                        <p>Không có dữ liệu số dư ngày nghỉ.</p>
                        {search && (
                          <Button
                            variant="link"
                            onClick={() =>
                              setFilters((f) => ({ ...f, search: "" }))
                            }
                          >
                            Xóa tìm kiếm
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Loading more indicator */}
            {isFetching && !isLoading && (
              <div className="flex items-center justify-center py-3 border-t">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">
                  Đang tải...
                </span>
              </div>
            )}

            {/* Summary */}
            {!isLoading && data && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{data.data.length}</strong> /{" "}
                  <strong>{data.total}</strong> bản ghi
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa số dư ngày nghỉ của{" "}
              <strong>
                {deleteTarget?.user?.fullName || deleteTarget?.user?.name}
              </strong>{" "}
              ({deleteTarget?.leaveType?.name}) không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog
        open={batchDeleteTarget !== null}
        onOpenChange={(open) => !open && setBatchDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              <strong>{batchDeleteTarget?.length ?? 0}</strong> số dư ngày nghỉ
              đã chọn? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteTarget(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa {batchDeleteTarget?.length ?? 0} bản ghi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa số dư ngày nghỉ</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((values) => {
                if (editingBalance) {
                  updateMutation.mutate({
                    id: editingBalance.id,
                    data: values,
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="totalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tổng số ngày</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="usedDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đã dùng</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportLeaveBalancesDialog
        open={exportDialog}
        onOpenChange={setExportDialog}
        year={year}
        leaveTypeId={leaveTypeId}
        departmentId={departmentId}
        employeeStatus={employeeStatus}
        search={search}
      />

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import số dư ngày nghỉ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tải lên file Excel chứa dữ liệu số dư ngày nghỉ. File cần có các
              cột: userId, leaveTypeId, totalDays, usedDays.
            </p>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Chọn file Excel
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialog(false)}
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

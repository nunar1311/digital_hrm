"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEmployees,
  deleteEmployee,
  type GetEmployeesResult,
  type EmployeeListItem,
} from "@/app/[locale]/(protected)/employees/actions";
import { deletePosition } from "@/app/[locale]/(protected)/positions/actions";
import { updateEmployee } from "@/app/[locale]/(protected)/employees/actions";
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import type { PositionListItem } from "@/app/[locale]/(protected)/positions/types";
import { PAGE_SIZE } from "@/app/[locale]/(protected)/departments/constants";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  ArrowRight,
  Search,
  X,
  ListFilter,
  Plus,
  Users,
  User,
  BadgeCheck,
  Phone,
  CircleDot,
  Loader2,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MoveEmployeesDialog } from "@/components/departments/move-employees-dialog";
import { AddEmployeesToDepartmentDialog } from "@/components/departments/add-employees-dialog";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PositionsSectionInline } from "@/components/positions/positions-section-inline";
import { PositionDropdown } from "@/components/positions/position-dropdown";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type EmployeeStatus = "ALL" | "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

const STATUS_OPTIONS: { value: EmployeeStatus; labelKey: string }[] = [
  { value: "ALL", labelKey: "departmentEmployeesStatusAll" },
  { value: "ACTIVE", labelKey: "departmentEmployeesStatusActive" },
  { value: "ON_LEAVE", labelKey: "departmentEmployeesStatusOnLeave" },
  { value: "RESIGNED", labelKey: "departmentEmployeesStatusResigned" },
  {
    value: "TERMINATED",
    labelKey: "departmentEmployeesStatusTerminated",
  },
];

interface DepartmentEmployeesClientProps {
  departmentId: string;
  departmentName: string;
}

export function DepartmentEmployeesClient({
  departmentId,
  departmentName,
}: DepartmentEmployeesClientProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("ProtectedPages");

  // Search state
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<EmployeeListItem | null>(
    null,
  );

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [addEmployeesOpen, setAddEmployeesOpen] = useState(false);
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<string[] | null>(
    null,
  );

  // Filter state
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>("ALL");
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    employeeCode: true,
    fullName: true,
    positionName: true,
    phone: true,
    employeeStatus: true,
  });

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showEmptyDepartments, setShowEmptyDepartments] = useState(false);
  const [wrapText, setWrapText] = useState(false);

  // View toggle state
  const [activeView, setActiveView] = useState<"employees" | "positions">(
    "employees",
  );

  // Position dialog state (shared between inline section and parent)
  const [positionFormOpen, setPositionFormOpen] = useState(false);
  const [editPosition, setEditPosition] = useState<PositionListItem | null>(
    null,
  );

  // Position delete confirmation state
  const [deletePositionTarget, setDeletePositionTarget] =
    useState<PositionListItem | null>(null);

  // Inline position editing state
  const [editingPositionFor, setEditingPositionFor] = useState<string | null>(
    null,
  );

  // Click outside to close search
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Real-time: invalidate queries when employee events occur
  useSocketEvents(
    [
      "employee:created",
      "employee:updated",
      "employee:deleted",
      "employee:department-changed",
      "department:employee-moved",
    ],
    () => {
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    },
  );

  // â”€â”€â”€ Delete handler â”€â”€â”€
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<GetEmployeesResult>({
    queryKey: [
      "employees",
      {
        pageSize: PAGE_SIZE,
        search,
        departmentId,
        status: statusFilter,
      },
    ],
    queryFn: ({ pageParam }) =>
      getEmployees({
        page: pageParam as number,
        pageSize: PAGE_SIZE,
        search,
        departmentId,
        status: statusFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const employees = useMemo(
    () => employeesData?.pages.flatMap((p) => p.employees) ?? [],
    [employeesData],
  );

  const total = employeesData?.pages[0]?.total ?? 0;

  // Infinite scroll: intersection observer to load more when scrolling to bottom
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const sentinel = document.getElementById("dept-infinite-scroll-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: container, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // â”€â”€â”€ Delete handler â”€â”€â”€
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    const result = await deleteEmployee(deleteTarget.id);
    if (result) {
      toast.success(t("departmentEmployeesToastDeleteSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    } else {
      toast.error(t("departmentEmployeesToastError"));
    }

    setDeleteTarget(null);
  }, [deleteTarget, queryClient, t]);

  // â”€â”€â”€ Search toggle handlers â”€â”€â”€
  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, search]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  // â”€â”€â”€ Selection handlers â”€â”€â”€

  const toggleAll = useCallback(() => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  }, [selectedIds.size, employees]);

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

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (!batchDeleteTarget) return;
    const results = await Promise.allSettled(
      batchDeleteTarget.map((id) => deleteEmployee(id)),
    );
    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value,
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || !r.value,
    ).length;
    if (failed === 0) {
      toast.success(t("departmentEmployeesToastBatchDeleteSuccess", { succeeded }));
    } else {
      toast.error(
        t("departmentEmployeesToastBatchDeletePartial", {
          succeeded,
          total: batchDeleteTarget.length,
          failed,
        }),
      );
    }
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    setBatchDeleteTarget(null);
    setSelectedIds(new Set());
  }, [batchDeleteTarget, queryClient, t]);

  const columns = useMemo<ColumnDef<EmployeeListItem>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              employees.length > 0 && selectedIds.size === employees.length
                ? true
                : selectedIds.size > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={toggleAll}
            aria-label={t("departmentEmployeesSelectAllAria")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleOne(row.original.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
            aria-label={t("departmentEmployeesSelectOneAria", {
              name:
                row.original.name ||
                row.original.fullName ||
                t("departmentEmployeesUnknown"),
            })}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "employeeCode",
        header: t("departmentEmployeesColEmployeeCode"),
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            {row.original.employeeCode || "---"}
          </span>
        ),
      },
      {
        accessorKey: "fullName",
        header: t("departmentEmployeesColFullName"),
        cell: ({ row }) => {
          const name = row.original.fullName || row.original.name;
          return (
            <Link
              href={`/employees/${row.original.id}`}
              className="flex items-center gap-3 hover:text-foreground"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 items-center justify-center text-primary font-semibold text-sm flex">
                {name.split(" ").pop()?.[0] || "?"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("departmentEmployeesHireDateLabel")} {" "}
                  {row.original.hireDate
                    ? new Date(row.original.hireDate).toLocaleDateString(
                        "vi-VN",
                      )
                    : "---"}
                </span>
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: "positionName",
        header: t("departmentEmployeesColPosition"),
        size: 200,
        cell: ({ row }) => {
          const isEditing = editingPositionFor === row.original.id;
          return (
            <Popover
              open={isEditing}
              onOpenChange={(open) =>
                setEditingPositionFor(open ? row.original.id : null)
              }
            >
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 text-left hover:text-foreground transition-colors group/pos",
                    isEditing && "text-accent-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingPositionFor(row.original.id);
                  }}
                >
                  <span
                    className={cn(
                      "font-medium",
                      !row.original.positionName &&
                        "text-muted-foreground italic",
                    )}
                  >
                    {row.original.positionName || t("departmentEmployeesUnknown")}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-2"
                align="start"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1">
                  {t("departmentEmployeesChoosePositionFor", {
                    name: row.original.fullName || row.original.name,
                  })}
                </p>
                <PositionDropdown
                  value={row.original.positionId}
                  departmentId={departmentId}
                  placeholder={t("departmentEmployeesNoPositionPlaceholder")}
                  onValueChange={async (positionId) => {
                    try {
                      await updateEmployee(row.original.id, {
                        positionId: positionId || undefined,
                      });
                      toast.success(t("departmentEmployeesToastUpdatePositionSuccess"));
                      queryClient.invalidateQueries({
                        queryKey: ["employees"],
                      });
                    } catch {
                      toast.error(t("departmentEmployeesToastUpdatePositionError"));
                    } finally {
                      setEditingPositionFor(null);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          );
        },
      },
      {
        accessorKey: "phone",
        header: t("departmentEmployeesColContact"),
        cell: ({ row }) => (
          <Link
            href={`/employees/${row.original.id}`}
            className="hover:text-foreground"
          >
            <div className="text-sm">{row.original.phone || "---"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.email}
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "employeeStatus",
        header: t("departmentEmployeesColStatus"),
        cell: ({ row }) => (
          <Link href={`/employees/${row.original.id}`}>
            <EmployeeStatusBadge
              status={row.original.employeeStatus || "ACTIVE"}
            />
          </Link>
        ),
      },
    ],
    [
      selectedIds,
      toggleAll,
      toggleOne,
      employees.length,
      editingPositionFor,
      departmentId,
      queryClient,
      t,
    ],
  );

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="p-2 flex items-center h-10">
            <h1 className="font-bold truncate">{departmentName}</h1>
          </header>
        </section>

        {/* View Toggle */}
        <div className="flex items-center gap-1 px-2 pb-1 border-b bg-transparent">
          <div
            className="relative pointer-events-auto cursor-pointer"
            onClick={() => setActiveView("employees")}
          >
            <div
              className={cn(
                "h-6 rounded static min-w-0 flex items-center px-1 gap-1 hover:bg-muted",
                activeView === "employees" &&
                  "before:content-[''] before:absolute before:-bottom-1 before:left-0 before:right-0 before:border-b-2 before:border-accent-foreground hover:bg-muted font-semibold",
              )}
            >
              <span className="text-sm">{t("departmentEmployeesViewEmployees")}</span>
            </div>
          </div>
          <div
            className="relative pointer-events-auto cursor-pointer"
            onClick={() => setActiveView("positions")}
          >
            <div
              className={cn(
                "h-6 rounded static min-w-0 flex items-center px-1 gap-1",
                activeView === "positions" &&
                  "before:content-[''] before:absolute before:-bottom-1 before:left-0 before:right-0 before:border-b-2 before:border-accent-foreground hover:bg-muted font-semibold",
              )}
            >
              <span className="text-sm">{t("departmentEmployeesViewPositions")}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {activeView === "employees" ? (
            <>
              <div className="flex items-center justify-end gap-2 px-2 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                      size="xs"
                      className={cn(
                        statusFilter !== "ALL" &&
                          "bg-primary/10 border-primary text-primary hover:text-primary",
                      )}
                    >
                      <ListFilter />
                      {statusFilter !== "ALL" && (
                        <span className="ml-1 text-xs">
                          {(() => {
                            const selectedStatus = STATUS_OPTIONS.find(
                              (s) => s.value === statusFilter,
                            );
                            return t(
                              selectedStatus?.labelKey ||
                                "departmentEmployeesStatusAll",
                            );
                          })()}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {t("departmentEmployeesStatusLabel")}
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as EmployeeStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.value}
                          checked={statusFilter === option.value}
                          onCheckedChange={() =>
                            setStatusFilter(option.value as EmployeeStatus)
                          }
                          className="text-sm"
                        >
                          {t(option.labelKey)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div
                  className="relative flex items-center"
                  ref={mergedSearchRef}
                >
                  <Input
                    ref={searchInputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={t("departmentEmployeesSearchPlaceholder")}
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
                <Separator orientation="vertical" className="h-4!" />
                <Button
                  variant={"outline"}
                  size={"xs"}
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings />
                </Button>
                <Button size={"xs"} onClick={() => setAddEmployeesOpen(true)}>
                  <Plus />
                  {t("departmentEmployeesAddButton")}
                </Button>
              </div>
              <TableSettingsPanel
                open={settingsOpen}
                onClose={setSettingsOpen}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
                columnOptions={[
                  {
                    key: "employeeCode",
                    label: t("departmentEmployeesColEmployeeCode"),
                    icon: BadgeCheck,
                  },
                  {
                    key: "fullName",
                    label: t("departmentEmployeesColFullName"),
                    icon: User,
                  },
                  {
                    key: "position",
                    label: t("departmentEmployeesColPosition"),
                    icon: BadgeCheck,
                  },
                  {
                    key: "phone",
                    label: t("departmentEmployeesColContact"),
                    icon: Phone,
                  },
                  {
                    key: "employeeStatus",
                    label: t("departmentEmployeesColStatus"),
                    icon: CircleDot,
                  },
                ]}
                defaultVisibleColumns={{
                  fullName: true,
                  positionName: true,
                  employeeStatus: true,
                }}
                showEmptyDepartments={showEmptyDepartments}
                setShowEmptyDepartments={setShowEmptyDepartments}
                wrapText={wrapText}
                setWrapText={setWrapText}
                disabledColumnIndices={[1]}
                hiddenColumnIndices={[0]}
              />

              {/* Table */}
              <section className="flex-1 relative h-full min-h-0 overflow-hidden">
                {/* Batch Actions Bar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
                    <span className="text-xs text-muted-foreground mr-1">
                      {t("departmentEmployeesSelectedPrefix")}{" "}
                      <strong className="text-foreground">
                        {selectedIds.size}
                      </strong>{" "}
                      {t("departmentEmployeesSelectedSuffix")}
                    </span>
                    <Button
                      variant={"destructive"}
                      size={"xs"}
                      onClick={() =>
                        setBatchDeleteTarget(Array.from(selectedIds))
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t("departmentEmployeesDelete")}
                    </Button>
                    <Button
                      variant={"outline"}
                      size={"xs"}
                      onClick={() => setMoveDialogOpen(true)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {t("departmentEmployeesMoveDepartment")}
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
                <div
                  className="h-full flex flex-col pb-8"
                  ref={tableContainerRef}
                >
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
                                header.column.id === "actions"
                                  ? "text-right"
                                  : "",
                              )}
                              key={header.id}
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
                      {isLoadingEmployees ? (
                        Array.from({
                          length: 8,
                        }).map((_, i) => (
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
                          <TableRow
                            key={row.id}
                            className="group/row cursor-default"
                          >
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
                              <Users className="h-8 w-8 text-muted-foreground/50" />
                              <p>{t("departmentEmployeesEmpty")}</p>
                              {search && (
                                <Button
                                  variant="link"
                                  onClick={() => setSearch("")}
                                >
                                  {t("departmentEmployeesClearSearch")}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <tbody>
                      <tr>
                        {/* Infinite scroll sentinel */}
                        <td
                          id="dept-infinite-scroll-sentinel"
                          className="h-px shrink-0 mt-4"
                        />
                      </tr>
                    </tbody>
                  </Table>

                  {/* Loading more indicator */}
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-3 border-t">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t("departmentEmployeesLoadingMore")}
                      </span>
                    </div>
                  )}

                  {/* Summary */}
                  {!isLoadingEmployees && employees.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-2 border-t shrink-0 bg-background">
                      <p className="text-xs text-muted-foreground">
                        {t("departmentEmployeesShowing")} <strong>{employees.length}</strong> /{" "}
                        <strong>{total}</strong> {t("departmentEmployeesTotalEmployees")}
                      </p>
                      {!hasNextPage && employees.length < total && (
                        <span className="text-xs text-muted-foreground">
                          {t("departmentEmployeesLoadedAll")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <PositionsSectionInline
              departmentId={departmentId}
              departmentName={departmentName}
              onEdit={(pos: PositionListItem | null) => {
                setEditPosition(pos);
                setPositionFormOpen(true);
              }}
              onDelete={(pos: PositionListItem) => setDeletePositionTarget(pos)}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("departmentEmployeesDeleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("departmentEmployeesDeleteConfirmPrefix")}{" "}
              <strong>{deleteTarget?.fullName || deleteTarget?.name}</strong>{" "}
              {t("departmentEmployeesDeleteConfirmSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t("departmentEmployeesCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("departmentEmployeesDelete")}
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
            <AlertDialogTitle>{t("departmentEmployeesBatchDeleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("departmentEmployeesBatchDeleteConfirmPrefix")} {" "}
              <strong>{batchDeleteTarget?.length ?? 0}</strong> {t("departmentEmployeesSelectedSuffix")}. {t("departmentEmployeesCannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteTarget(null)}>
              {t("departmentEmployeesCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("departmentEmployeesDelete")} {batchDeleteTarget?.length ?? 0} {t("departmentEmployeesSelectedSuffix")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Employees Dialog */}
      <MoveEmployeesDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        selectedIds={Array.from(selectedIds)}
        currentDepartmentId={departmentId}
        currentDepartmentName={departmentName}
        onMoved={() => {
          queryClient.invalidateQueries({
            queryKey: ["employees"],
          });
          setSelectedIds(new Set());
        }}
      />

      {/* Add Employees To Department Dialog */}
      <AddEmployeesToDepartmentDialog
        open={addEmployeesOpen}
        onOpenChange={setAddEmployeesOpen}
        departmentId={departmentId}
        departmentName={departmentName}
        onAssigned={() => {
          queryClient.invalidateQueries({
            queryKey: ["employees"],
          });
        }}
      />

      {/* Position Form Dialog */}
      <PositionFormDialog
        open={positionFormOpen}
        onClose={() => {
          setPositionFormOpen(false);
          setEditPosition(null);
        }}
        editData={editPosition}
        defaultDepartmentId={departmentId}
        defaultDepartmentName={departmentName}
      />

      {/* Delete Position Confirmation Dialog */}
      <AlertDialog
        open={deletePositionTarget !== null}
        onOpenChange={(open) => !open && setDeletePositionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("departmentEmployeesDeletePositionConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("departmentEmployeesDeletePositionConfirmPrefix")} {" "}
              <strong>{deletePositionTarget?.name}</strong>
              {deletePositionTarget && deletePositionTarget.userCount > 0 ? (
                <span className="block mt-1 text-destructive">
                  {t("departmentEmployeesPositionInUsePrefix")} <strong>{deletePositionTarget.userCount}</strong> {t("departmentEmployeesPositionInUseSuffix")}
                </span>
              ) : (
                <span className="block mt-1 text-muted-foreground">
                  {t("departmentEmployeesCannotUndo")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePositionTarget(null)}>
              {t("departmentEmployeesCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletePositionTarget) return;
                try {
                  const result = await deletePosition(deletePositionTarget.id);
                  if (result.success) {
                    toast.success(t("departmentEmployeesToastDeletePositionSuccess"));
                    queryClient.invalidateQueries({
                      queryKey: ["positions"],
                    });
                  } else {
                    toast.error(result.error || t("departmentEmployeesToastDeletePositionError"));
                  }
                } catch {
                  toast.error(t("departmentEmployeesToastDeletePositionError"));
                }
                setDeletePositionTarget(null);
              }}
              disabled={
                deletePositionTarget?.userCount
                  ? deletePositionTarget.userCount > 0
                  : false
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("departmentEmployeesDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


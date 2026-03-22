"use client";

import {
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
} from "react";
import Link from "next/link";
import {
    useInfiniteQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getEmployees,
    deleteEmployee,
    type GetEmployeesResult,
    type EmployeeListItem,
} from "./actions";
import { PAGE_SIZE } from "@/app/(protected)/departments/constants";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { Button } from "@/components/ui/button";
import {
    Search,
    Settings,
    Trash2,
    ArrowRight,
    X,
    ListFilter,
    Plus,
    Users,
    User,
    BadgeCheck,
    Phone,
    CircleDot,
    Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MoveEmployeesDialog } from "@/components/departments/move-employees-dialog";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { ExportEmployeesDialog } from "@/components/employees/import-export/export-employees-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmployeeStatus =
    | "ALL"
    | "ACTIVE"
    | "ON_LEAVE"
    | "RESIGNED"
    | "TERMINATED";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "ACTIVE", label: "Đang làm việc" },
    { value: "ON_LEAVE", label: "Nghỉ phép" },
    { value: "RESIGNED", label: "Đã nghỉ việc" },
    { value: "TERMINATED", label: "Sa thải" },
];

export function EmployeesClient() {
    const queryClient = useQueryClient();

    // Search state
    const [search, setSearch] = useState("");
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] =
        useState<EmployeeListItem | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(),
    );
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [addEmployeesOpen, setAddEmployeesOpen] = useState(false);
    const [batchDeleteTarget, setBatchDeleteTarget] = useState<
        string[] | null
    >(null);

    // Filter state
    const [statusFilter, setStatusFilter] =
        useState<EmployeeStatus>("ALL");
    const [columnVisibility, setColumnVisibility] = useState<
        Record<string, boolean>
    >({
        select: true,
        employeeCode: true,
        fullName: true,
        positionName: true,
        phone: true,
        employeeStatus: true,
    });

    // Settings panel state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [showEmptyDepartments, setShowEmptyDepartments] =
        useState(false);
    const [wrapText, setWrapText] = useState(false);

    // Click outside to close search
    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (search.trim()) {
                setSearch("");
            }
            setSearchExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(
        searchContainerRef,
        clickOutsideRef,
    );

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
                status: statusFilter,
            },
        ],
        queryFn: ({ pageParam }) =>
            getEmployees({
                page: pageParam as number,
                pageSize: PAGE_SIZE,
                search,
                status: statusFilter,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages
                ? lastPage.page + 1
                : undefined,
    });

    const employees = useMemo(
        () => employeesData?.pages.flatMap((p) => p.employees) ?? [],
        [employeesData],
    );

    const total = employeesData?.pages[0]?.total ?? 0;

    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Infinite scroll: intersection observer to load more when scrolling to bottom
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        const sentinel = document.getElementById(
            "infinite-scroll-sentinel",
        );
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            { root: container, rootMargin: "400px", threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;

        const result = await deleteEmployee(deleteTarget.id);
        if (result) {
            toast.success("Xóa nhân viên thành công");
            queryClient.invalidateQueries({
                queryKey: ["employees"],
            });
        } else {
            toast.error("Có lỗi xảy ra");
        }

        setDeleteTarget(null);
    }, [deleteTarget, queryClient]);

    // ─── Search toggle handlers ───
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

    // ─── Selection handlers ───

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
            toast.success(`Đã xóa ${succeeded} nhân viên`);
        } else {
            toast.error(
                `Xóa thành công ${succeeded}/${batchDeleteTarget.length}, thất bại ${failed}`,
            );
        }
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        setBatchDeleteTarget(null);
        setSelectedIds(new Set());
    }, [batchDeleteTarget, queryClient]);

    const columns = useMemo<ColumnDef<EmployeeListItem>[]>(
        () => [
            {
                id: "select",
                header: () => (
                    <Checkbox
                        checked={
                            employees.length > 0 &&
                            selectedIds.size === employees.length
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
                        onCheckedChange={() =>
                            toggleOne(row.original.id)
                        }
                        className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                        aria-label={`Chọn ${row.original.name || row.original.fullName}`}
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
                size: 40,
            },
            {
                accessorKey: "employeeCode",
                header: "Mã NV",
                cell: ({ row }) => (
                    <span className="font-medium text-muted-foreground">
                        {row.original.employeeCode || "---"}
                    </span>
                ),
            },
            {
                accessorKey: "fullName",
                header: "Họ và tên",
                cell: ({ row }) => {
                    const name =
                        row.original.fullName || row.original.name;
                    return (
                        <Link
                            href={`/employees/${row.original.id}`}
                            className="flex items-center gap-3 hover:text-foreground"
                        >
                            <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 items-center justify-center text-primary font-semibold text-sm flex">
                                {name.split(" ").pop()?.[0] || "?"}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold">
                                    {name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Vào làm:{" "}
                                    {row.original.hireDate
                                        ? new Date(
                                              row.original.hireDate,
                                          ).toLocaleDateString(
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
                header: "Chức vụ / Phòng ban",
                cell: ({ row }) => (
                    <Link
                        href={`/employees/${row.original.id}`}
                        className="hover:text-foreground"
                    >
                        <div className="font-medium">
                            {row.original.positionName || "Chưa rõ"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.departmentName || "Chưa rõ"}
                        </div>
                    </Link>
                ),
            },
            {
                accessorKey: "phone",
                header: "SĐT / Email",
                cell: ({ row }) => (
                    <Link
                        href={`/employees/${row.original.id}`}
                        className="hover:text-foreground"
                    >
                        <div className="text-sm">
                            {row.original.phone || "---"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.email}
                        </div>
                    </Link>
                ),
            },
            {
                accessorKey: "employeeStatus",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Link href={`/employees/${row.original.id}`}>
                        <EmployeeStatusBadge
                            status={
                                row.original.employeeStatus ||
                                "ACTIVE"
                            }
                        />
                    </Link>
                ),
            },
        ],
        [selectedIds, toggleAll, toggleOne, employees.length],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
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
                    <header className="p-2 flex items-center h-10 border-b">
                        <h1 className="font-bold">
                            Tất cả nhân viên
                        </h1>
                    </header>
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                        <Button
                            variant={"outline"}
                            size={"xs"}
                            onClick={() => setExportOpen(true)}
                        >
                            Xuất file Excel
                        </Button>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={
                                            statusFilter !== "ALL"
                                                ? "outline"
                                                : "ghost"
                                        }
                                        size="xs"
                                        className={cn(
                                            statusFilter !== "ALL" &&
                                                "bg-primary/10 border-primary text-primary hover:text-primary",
                                        )}
                                    >
                                        <ListFilter />
                                        {statusFilter !== "ALL" && (
                                            <span className="ml-1 text-xs">
                                                {
                                                    STATUS_OPTIONS.find(
                                                        (s) =>
                                                            s.value ===
                                                            statusFilter,
                                                    )?.label
                                                }
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                >
                                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                                        Trạng thái
                                    </DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={statusFilter}
                                        onValueChange={(value) =>
                                            setStatusFilter(
                                                value as EmployeeStatus,
                                            )
                                        }
                                    >
                                        {STATUS_OPTIONS.map(
                                            (option) => (
                                                <DropdownMenuCheckboxItem
                                                    key={option.value}
                                                    checked={
                                                        statusFilter ===
                                                        option.value
                                                    }
                                                    onCheckedChange={() =>
                                                        setStatusFilter(
                                                            option.value as EmployeeStatus,
                                                        )
                                                    }
                                                    className="text-sm"
                                                >
                                                    {option.label}
                                                </DropdownMenuCheckboxItem>
                                            ),
                                        )}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {/* Search */}
                            <div
                                className="relative flex items-center"
                                ref={mergedSearchRef}
                            >
                                <Input
                                    ref={searchInputRef}
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
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
                                        searchExpanded &&
                                            "[&_svg]:text-primary",
                                    )}
                                >
                                    <Search />
                                </Button>
                            </div>

                            <Separator
                                orientation="vertical"
                                className="h-4!"
                            />

                            <Button
                                variant={"outline"}
                                size={"xs"}
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings />
                            </Button>
                            <Button
                                size={"xs"}
                                onClick={() =>
                                    setAddEmployeesOpen(true)
                                }
                            >
                                <Plus />
                                Nhân viên
                            </Button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <TableSettingsPanel
                        open={settingsOpen}
                        onClose={setSettingsOpen}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        columnOptions={[
                            {
                                key: "select",
                                label: "Chọn",
                                icon: Checkbox,
                            },
                            {
                                key: "employeeCode",
                                label: "Mã NV",
                                icon: BadgeCheck,
                            },
                            {
                                key: "fullName",
                                label: "Họ và tên",
                                icon: User,
                            },
                            {
                                key: "positionName",
                                label: "Chức vụ / Phòng ban",

                                icon: BadgeCheck,
                            },
                            {
                                key: "phone",
                                label: "SĐT / Email",
                                icon: Phone,
                            },
                            {
                                key: "employeeStatus",
                                label: "Trạng thái",
                                icon: CircleDot,
                            },
                        ]}
                        showEmptyDepartments={showEmptyDepartments}
                        setShowEmptyDepartments={
                            setShowEmptyDepartments
                        }
                        wrapText={wrapText}
                        setWrapText={setWrapText}
                        disabledColumnIndices={[2]}
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
                                <strong className="text-foreground">
                                    {selectedIds.size}
                                </strong>{" "}
                                nhân viên
                            </span>
                            <Button
                                variant={"destructive"}
                                size={"xs"}
                                onClick={() =>
                                    setBatchDeleteTarget(
                                        Array.from(selectedIds),
                                    )
                                }
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Xóa
                            </Button>
                            <Button
                                variant={"outline"}
                                size={"xs"}
                                onClick={() =>
                                    setMoveDialogOpen(true)
                                }
                            >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Chuyển phòng ban
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
                                {table
                                    .getHeaderGroups()
                                    .map((headerGroup) => (
                                        <TableRow
                                            key={headerGroup.id}
                                            className="hover:bg-transparent"
                                        >
                                            {headerGroup.headers.map(
                                                (header) => (
                                                    <TableHead
                                                        className={cn(
                                                            "h-7 px-2 select-none z-10 relative",
                                                            header
                                                                .column
                                                                .id ===
                                                                "actions"
                                                                ? "text-right"
                                                                : "",
                                                        )}
                                                        key={
                                                            header.id
                                                        }
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                  header
                                                                      .column
                                                                      .columnDef
                                                                      .header,
                                                                  header.getContext(),
                                                              )}
                                                    </TableHead>
                                                ),
                                            )}
                                        </TableRow>
                                    ))}
                            </TableHeader>
                            <TableBody>
                                {isLoadingEmployees ? (
                                    Array.from({ length: 8 }).map(
                                        (_, i) => (
                                            <TableRow key={i}>
                                                {columns.map(
                                                    (col, j) => (
                                                        <TableCell
                                                            key={j}
                                                            style={{
                                                                width: col.size,
                                                            }}
                                                            className="p-2"
                                                        >
                                                            <Skeleton className="h-4 w-full" />
                                                        </TableCell>
                                                    ),
                                                )}
                                            </TableRow>
                                        ),
                                    )
                                ) : table.getRowModel().rows
                                      ?.length ? (
                                    table
                                        .getRowModel()
                                        .rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="group/row cursor-default"
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <TableCell
                                                            key={
                                                                cell.id
                                                            }
                                                        >
                                                            {flexRender(
                                                                cell
                                                                    .column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            )}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                columns.length + 1
                                            }
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                                <p>
                                                    Không tìm thấy
                                                    nhân viên nào.
                                                </p>
                                                {search && (
                                                    <Button
                                                        variant="link"
                                                        onClick={() =>
                                                            setSearch(
                                                                "",
                                                            )
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

                        {/* Infinite scroll sentinel */}
                        <div
                            id="infinite-scroll-sentinel"
                            className="h-px"
                        />

                        {/* Loading more indicator */}
                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center py-3 border-t">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-xs text-muted-foreground">
                                    Đang tải thêm...
                                </span>
                            </div>
                        )}

                        {/* Summary */}
                        {!isLoadingEmployees &&
                            employees.length > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
                                    <p className="text-xs text-muted-foreground">
                                        Hiển thị{" "}
                                        <strong>
                                            {employees.length}
                                        </strong>{" "}
                                        / <strong>{total}</strong>{" "}
                                        nhân viên
                                    </p>
                                    {!hasNextPage &&
                                        employees.length < total && (
                                            <span className="text-xs text-muted-foreground">
                                                Đã tải hết
                                            </span>
                                        )}
                                </div>
                            )}
                    </div>
                </section>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) =>
                    !open && setDeleteTarget(null)
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa nhân viên{" "}
                            <strong>
                                {deleteTarget?.fullName ||
                                    deleteTarget?.name}
                            </strong>{" "}
                            không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setDeleteTarget(null)}
                        >
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
                onOpenChange={(open) =>
                    !open && setBatchDeleteTarget(null)
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa hàng loạt
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa{" "}
                            <strong>
                                {batchDeleteTarget?.length ?? 0}
                            </strong>{" "}
                            nhân viên đã chọn? Hành động này không thể
                            hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setBatchDeleteTarget(null)}
                        >
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa {batchDeleteTarget?.length ?? 0} nhân
                            viên
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move Employees Dialog */}
            <MoveEmployeesDialog
                open={moveDialogOpen}
                onClose={() => setMoveDialogOpen(false)}
                selectedIds={Array.from(selectedIds)}
                currentDepartmentId=""
                currentDepartmentName="Tất cả phòng ban"
                onMoved={() => {
                    queryClient.invalidateQueries({
                        queryKey: ["employees"],
                    });
                    setSelectedIds(new Set());
                }}
            />

            {/* Add Employee Dialog */}
            <AddEmployeeDialog
                open={addEmployeesOpen}
                onClose={() => setAddEmployeesOpen(false)}
            />

            {/* Export Employees Dialog */}
            <ExportEmployeesDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                search={search}
                status={statusFilter}
            />
        </div>
    );
}

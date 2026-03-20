"use client";

import {
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
} from "react";
import {
    useQuery,
    useInfiniteQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type Row,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    MoreHorizontal,
    Users,
    RefreshCw,
    Settings,
    Edit,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import { cn } from "@/lib/utils";
import CardToolbar, { type CardToolbarRef } from "./card-toolbar";
import type {
    EmployeeListItem,
    GetEmployeesResult,
} from "@/app/(protected)/employees/actions";
import { getDashboardEmployees } from "@/app/(protected)/dashboard/actions";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Building2,
    Briefcase,
    FileText,
    Tag,
} from "lucide-react";
import { Label } from "@/components/ui/label";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang làm việc" },
    { value: "PROBATION", label: "Thử việc" },
    { value: "ON_LEAVE", label: "Nghỉ phép" },
    { value: "SUSPENDED", label: "Tạm ngưng" },
    { value: "TERMINATED", label: "Đã nghỉ việc" },
];

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Đang làm việc",
    PROBATION: "Thử việc",
    ON_LEAVE: "Nghỉ phép",
    SUSPENDED: "Tạm ngưng",
    TERMINATED: "Đã nghỉ việc",
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PROBATION:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    ON_LEAVE:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    SUSPENDED:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    TERMINATED:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const EMPLOYMENT_TYPE_OPTIONS = [
    { value: "ALL", label: "Tất cả loại hợp đồng" },
    { value: "FULL_TIME", label: "Toàn thời gian" },
    { value: "PART_TIME", label: "Bán thời gian" },
    { value: "CONTRACTOR", label: "Hợp đồng" },
    { value: "INTERN", label: "Thực tập sinh" },
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    CONTRACTOR: "Hợp đồng",
    INTERN: "Thực tập sinh",
};

// ─── Types ───────────────────────────────────────────────────────────────────

// interface ApiResponse {
//     employees: EmployeeListItem[];
//     total: number;
//     page: number;
//     pageSize: number;
//     totalPages: number;
// }

// ─── Fetcher ─────────────────────────────────────────────────────────────────

// async function fetchEmployeesPage(
//     pageParam: number,
//     search: string,
//     status: string,
//     employmentType: string,
//     sortBy: string,
//     sortOrder: "asc" | "desc",
// ): Promise<ApiResponse> {
//     const params = new URLSearchParams();
//     params.set("page", String(pageParam));
//     params.set("pageSize", String(PAGE_SIZE));
//     params.set("sortBy", sortBy);
//     params.set("sortOrder", sortOrder);
//     if (search) params.set("search", search);
//     if (status !== "ALL") params.set("status", status);
//     if (employmentType !== "ALL")
//         params.set("employmentType", employmentType);

//     const res = await fetch(
//         `/api/dashboard/employees?${params.toString()}`,
//     );
//     if (!res.ok) {
//         const err = await res
//             .json()
//             .catch(() => ({ error: "Unknown error" }));
//         throw new Error(err.error || "Failed to fetch");
//     }
//     return res.json();
// }

// ─── EmployeeTable ────────────────────────────────────────────────────────────

interface EmployeeTableProps {
    employees: EmployeeListItem[];
    isLoading: boolean;
    globalOffset: number;
    onViewEmployee: (employee: EmployeeListItem) => void;
    sorting: SortingState;
    columnVisibility: Record<string, boolean>;
    showEmptyDepartments: boolean;
    wrapText: boolean;
}

function EmployeeTable({
    employees,
    isLoading,
    globalOffset,
    onViewEmployee,
    sorting,
    columnVisibility,
    showEmptyDepartments,
    wrapText,
}: EmployeeTableProps) {
    const filteredEmployees = useMemo(() => {
        if (showEmptyDepartments) return employees;
        return employees.filter(
            (emp) =>
                emp.departmentName &&
                emp.departmentName.trim() !== "",
        );
    }, [employees, showEmptyDepartments]);

    const columns = useMemo<ColumnDef<EmployeeListItem>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected()
                                ? true
                                : table.getIsSomePageRowsSelected()
                                  ? "indeterminate"
                                  : false
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Chọn tất cả"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) =>
                            row.toggleSelected(!!value)
                        }
                        aria-label="Chọn"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                    />
                ),
                size: 30,
                enableSorting: false,
            },
            {
                accessorKey: "name",
                id: "employee",
                header: "Nhân viên",
                size: 250,
                maxSize: 250,
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="font-medium truncate text-xs">
                                    {emp.fullName || emp.name}
                                </span>

                                {emp.employeeCode && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        - {emp.employeeCode}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate">
                                {emp.email}
                            </span>
                        </div>
                    );
                },
                sortingFn: (
                    rowA: Row<EmployeeListItem>,
                    rowB: Row<EmployeeListItem>,
                ) => {
                    const a =
                        rowA.original.fullName || rowA.original.name;
                    const b =
                        rowB.original.fullName || rowB.original.name;
                    return a.localeCompare(b, "vi");
                },
            },
            {
                accessorKey: "departmentName",
                header: "Phòng ban",
                size: 200,
                maxSize: 200,
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "text-xs block",
                            wrapText
                                ? "whitespace-normal wrap-break-word max-w-none"
                                : "truncate max-w-30",
                        )}
                    >
                        {row.original.departmentName || (
                            <span className="text-muted-foreground italic">
                                —
                            </span>
                        )}
                    </span>
                ),
            },
            {
                accessorKey: "position",
                header: "Chức vụ",
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "text-xs block",
                            wrapText
                                ? "whitespace-normal wrap-break-word max-w-none"
                                : "truncate max-w-25",
                        )}
                    >
                        {row.original.position || (
                            <span className="text-muted-foreground italic">
                                —
                            </span>
                        )}
                    </span>
                ),
            },
            {
                accessorKey: "employmentType",
                header: "Loại hợp đồng",
                cell: ({ row }) => (
                    <span className="text-xs whitespace-nowrap">
                        {row.original.employmentType
                            ? EMPLOYMENT_TYPE_LABELS[
                                  row.original.employmentType
                              ] || row.original.employmentType
                            : "—"}
                    </span>
                ),
            },
            {
                accessorKey: "employeeStatus",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Badge
                        variant="secondary"
                        className={cn(
                            "text-[10px] px-1.5 py-0 h-4 border-0 font-normal whitespace-nowrap",
                            row.original.employeeStatus
                                ? STATUS_COLORS[
                                      row.original.employeeStatus
                                  ] ||
                                      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                : "",
                        )}
                    >
                        {row.original.employeeStatus
                            ? STATUS_LABELS[
                                  row.original.employeeStatus
                              ] || row.original.employeeStatus
                            : "—"}
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-36"
                        >
                            <DropdownMenuItem
                                onClick={() =>
                                    onViewEmployee(row.original)
                                }
                            >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                Xem chi tiết
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
                size: 40,
                enableSorting: false,
            },
        ],
        [globalOffset, onViewEmployee, wrapText],
    );

    // TanStack Table's useReactTable() returns unstable functions — known limitation.
    // eslint-disable-next-line
    const table = useReactTable({
        data: filteredEmployees,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        manualPagination: true,
        enableRowSelection: true,
        state: { sorting, columnVisibility },
        onColumnVisibilityChange: () => {},
    });

    const getSortIcon = (columnId: string) => {
        const sort = sorting.find((s) => s.id === columnId);
        if (!sort)
            return (
                <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/50" />
            );
        return sort.desc ? (
            <ArrowDown className="h-2.5 w-2.5 text-primary" />
        ) : (
            <ArrowUp className="h-2.5 w-2.5 text-primary" />
        );
    };

    return (
        <div className="relative flex flex-col h-full overflow-hidden rounded">
            {/* Sticky Header */}
            <div className="shrink-0 overflow-x-auto z-10 relative">
                <Table className="text-xs">
                    <TableHeader>
                        {table
                            .getHeaderGroups()
                            .map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className="hover:bg-transparent"
                                >
                                    {headerGroup.headers.map(
                                        (header) => {
                                            const canSort =
                                                header.column.getCanSort();
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    className="h-7 px-2 select-none z-10 relative"
                                                    style={{
                                                        width: header.getSize(),
                                                    }}
                                                >
                                                    {canSort ? (
                                                        <button
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            className="flex items-center gap-1 hover:text-foreground transition-colors"
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
                                                            {getSortIcon(
                                                                header
                                                                    .column
                                                                    .id,
                                                            )}
                                                        </button>
                                                    ) : header.isPlaceholder ? null : (
                                                        flexRender(
                                                            header
                                                                .column
                                                                .columnDef
                                                                .header,
                                                            header.getContext(),
                                                        )
                                                    )}
                                                </TableHead>
                                            );
                                        },
                                    )}
                                </TableRow>
                            ))}
                    </TableHeader>
                </Table>
            </div>
            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto min-h-0">
                <Table className="text-xs">
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((_, j) => (
                                        <TableCell
                                            key={j}
                                            className="p-2"
                                        >
                                            <Skeleton className="h-3.5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        <Users className="h-6 w-6 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">
                                            Không có nhân viên nào
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group/row cursor-default"
                                >
                                    {row
                                        .getVisibleCells()
                                        .map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="p-2"
                                            >
                                                {flexRender(
                                                    cell.column
                                                        .columnDef
                                                        .cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// ─── LoadMore sentinel (Intersection Observer for infinite scroll) ────────────

interface LoadMoreSentinelProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

function LoadMoreSentinel({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: LoadMoreSentinelProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !isFetchingNextPage) {
                    onLoadMore();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    return (
        <div ref={sentinelRef} className="h-1">
            {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2">
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-[10px] text-muted-foreground">
                        Đang tải thêm...
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── EmployeeTableDashboard ───────────────────────────────────────────────────

interface EmployeeTableDashboardProps {
    employees: EmployeeListItem[];
    isLoading: boolean;
    globalOffset: number;
    isFetching: boolean;
    sorting: SortingState;
    handleViewEmployee: (employee: EmployeeListItem) => void;
    columnVisibility: Record<string, boolean>;
    showEmptyDepartments: boolean;
    wrapText: boolean;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    employmentFilter: string;
    setEmploymentFilter: (v: string) => void;
    searchValue: string;
    setSearchValue: (v: string) => void;
    toolbarRef: React.RefObject<CardToolbarRef>;
    editMode: boolean;
}

const EmployeeTableDashboard = ({
    employees,
    isLoading,
    globalOffset,
    sorting,
    handleViewEmployee,
    columnVisibility,
    showEmptyDepartments,
    wrapText,
    statusFilter,
    setStatusFilter,
    employmentFilter,
    setEmploymentFilter,
    searchValue,
    setSearchValue,
    toolbarRef,
    editMode,
}: EmployeeTableDashboardProps) => {
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const localRef = useRef<HTMLDivElement>(null);

    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (searchValue.trim()) {
                setSearchValue("");
            }
            setSearchExpanded(false);
        }
    });
    const searchContainerRef = useMergedRef(
        localRef,
        clickOutsideRef,
    );

    const handleSearchToggle = useCallback(() => {
        if (!searchExpanded) {
            setSearchExpanded(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
            if (searchValue.trim()) {
                setSearchValue("");
            }
            setSearchExpanded(false);
        }
    }, [searchExpanded, searchValue, setSearchValue]);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setSearchValue("");
                setSearchExpanded(false);
            }
        },
        [setSearchValue, setSearchExpanded],
    );

    return (
        <div className="flex flex-col h-full w-full gap-2">
            {/* ── Filters ── */}
            {editMode && (
                <div className="flex items-center justify-end gap-2 flex-wrap shrink-0">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v);
                        }}
                    >
                        <SelectTrigger size="sm" className="h-7!">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={employmentFilter}
                        onValueChange={(v) => {
                            setEmploymentFilter(v);
                        }}
                    >
                        <SelectTrigger size="sm" className="h-7!">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Handle search */}
                    <div
                        className="relative flex items-center"
                        ref={searchContainerRef}
                    >
                        <Input
                            ref={searchInputRef}
                            value={searchValue}
                            onChange={(e) =>
                                setSearchValue(e.target.value)
                            }
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
                        size={"icon-xs"}
                        variant={"ghost"}
                        onClick={() =>
                            toolbarRef.current?.openSettings()
                        }
                    >
                        <Settings className="size-3.5" />
                    </Button>
                </div>
            )}

            {/* ── Table ── */}
            <EmployeeTable
                employees={employees}
                isLoading={isLoading}
                globalOffset={globalOffset}
                onViewEmployee={handleViewEmployee}
                sorting={sorting}
                columnVisibility={columnVisibility}
                showEmptyDepartments={showEmptyDepartments}
                wrapText={wrapText}
            />
        </div>
    );
};

// ─── CardWidgetList ──────────────────────────────────────────────────────────

interface CardWidgetListProps {
    initialEmployees: GetEmployeesResult;
    editMode?: boolean;
}

const CardWidgetList = ({
    initialEmployees,
    editMode = false,
}: CardWidgetListProps) => {
    const toolbarRef = useRef<CardToolbarRef>(null);

    // ── Infinite Query ──
    const [sorting, setSorting] = useState<SortingState>([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [employmentFilter, setEmploymentFilter] = useState("ALL");
    const [searchValue, setSearchValue] = useState("");

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery<GetEmployeesResult>({
        queryKey: [
            "dashboard",
            "employees",
            statusFilter,
            employmentFilter,
            searchValue,
        ],
        queryFn: async ({ pageParam }) => {
            const res = await getDashboardEmployees({
                page: pageParam as number,
                pageSize: PAGE_SIZE,
                sortBy: sorting[0]?.id || "name",
                sortOrder: sorting[0]?.desc ? "desc" : "asc",
                status:
                    statusFilter === "ALL" ? undefined : statusFilter,
                employmentType:
                    employmentFilter === "ALL"
                        ? undefined
                        : employmentFilter,
                search: searchValue || undefined,
            });
            return JSON.parse(
                JSON.stringify(res),
            ) as GetEmployeesResult;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages
                ? lastPage.page + 1
                : undefined,
        initialData: () => {
            if (
                statusFilter === "ALL" &&
                employmentFilter === "ALL" &&
                searchValue === ""
            ) {
                return {
                    pages: [initialEmployees],
                    pageParams: [1],
                };
            }
            return undefined;
        },
    });

    const employees = useMemo(
        () => data?.pages.flatMap((p) => p.employees) ?? [],
        [data],
    );

    const globalOffset = 0;

    const handleViewEmployee = useCallback(
        (employee: EmployeeListItem) => {
            // Navigate to employee detail — can be wired later
            window.open(`/employees/${employee.id}`, "_blank");
        },
        [],
    );

    const handleFetchNextPage = useCallback(() => {
        fetchNextPage();
    }, [fetchNextPage]);
    const [columnVisibility, setColumnVisibility] = useState({
        select: true,
        employee: true,
        departmentName: true,
        position: true,
        employmentType: true,
        employeeStatus: true,
        actions: true,
    });
    const [showEmptyDepartments, setShowEmptyDepartments] =
        useState(true);
    const [wrapText, setWrapText] = useState(false);

    const columnOptions = [
        { key: "employee", label: "Tên nhân viên", icon: User },
        {
            key: "departmentName",
            label: "Phòng ban",
            icon: Building2,
        },
        { key: "position", label: "Chức vụ", icon: Briefcase },
        {
            key: "employmentType",
            label: "Loại hợp đồng",
            icon: FileText,
        },
        { key: "employeeStatus", label: "Trạng thái", icon: Tag },
    ];

    const settingsContent = (
        <>
            <div className="px-2 min-w-0 flex flex-col">
                <div
                    className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "justify-between! px-0",
                    })}
                >
                    <Label htmlFor="show-empty-departments">
                        Hiện phòng ban trống
                    </Label>
                    <Switch
                        id="show-empty-departments"
                        checked={showEmptyDepartments}
                        onCheckedChange={setShowEmptyDepartments}
                    />
                </div>
                <div
                    className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "justify-between! px-0",
                    })}
                >
                    <Label htmlFor="wrap-text">Xuống dòng</Label>
                    <Switch
                        id="wrap-text"
                        checked={wrapText}
                        onCheckedChange={setWrapText}
                    />
                </div>
            </div>
            <Separator className="my-2" />
            <div className="px-2 min-w-0 flex flex-col">
                <span
                    className="text-xs text-end font-medium text-muted-foreground"
                    onClick={(checked) => {
                        const val = !checked;
                        setColumnVisibility((prev) => ({
                            ...prev,
                            employee: val,
                            departmentName: val,
                            position: val,
                            employmentType: val,
                            employeeStatus: val,
                        }));
                    }}
                >
                    Ẩn tất cả cột
                </span>
                {columnOptions.map(
                    ({ key, label, icon: Icon }, index) => (
                        <div
                            key={key}
                            className={cn(
                                buttonVariants({
                                    variant: "ghost",
                                    size: "sm",
                                    className:
                                        "justify-between! px-0 ",
                                }),
                                index === 0 &&
                                    "opacity-50 cursor-not-allowed",
                            )}
                            aria-disabled={index === 0}
                        >
                            <Label
                                htmlFor={`column-${key}`}
                                className={"flex items-center gap-2"}
                            >
                                <Icon className="size-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {label}
                                </span>
                            </Label>
                            <Switch
                                id={`column-${key}`}
                                checked={
                                    columnVisibility[
                                        key as keyof typeof columnVisibility
                                    ]
                                }
                                onCheckedChange={(checked) =>
                                    setColumnVisibility((prev) => ({
                                        ...prev,
                                        [key]: checked,
                                    }))
                                }
                                disabled={index === 0}
                            />
                        </div>
                    ),
                )}
            </div>
        </>
    );

    return (
        <CardToolbar
            ref={toolbarRef}
            title="Danh sách nhân viên"
            settingsContent={settingsContent}
        >
            <EmployeeTableDashboard
                editMode={editMode}
                toolbarRef={
                    toolbarRef as React.RefObject<CardToolbarRef>
                }
                employees={employees}
                isLoading={isLoading}
                globalOffset={globalOffset}
                isFetching={isFetching}
                sorting={sorting}
                handleViewEmployee={handleViewEmployee}
                columnVisibility={columnVisibility}
                showEmptyDepartments={showEmptyDepartments}
                wrapText={wrapText}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                employmentFilter={employmentFilter}
                setEmploymentFilter={setEmploymentFilter}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
            />
            {hasNextPage && (
                <LoadMoreSentinel
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={!!isFetchingNextPage}
                    onLoadMore={handleFetchNextPage}
                />
            )}
        </CardToolbar>
    );
};

export default CardWidgetList;

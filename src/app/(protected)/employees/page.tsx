"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployees, getDepartmentOptions } from "./actions";
import { useDebounce } from "@/hooks/use-debounce";
import type { EmployeeListItem } from "./actions";

const PAGE_SIZE = 10;

// Department type for dropdown
interface DepartmentOption {
    id: string;
    name: string;
}

export default function EmployeesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL state
    const urlSearch = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const pageParam = searchParams.get("page") || "1";
    const currentPage = parseInt(pageParam, 10) || 1;

    // Local state for search input
    const [localSearch, setLocalSearch] = React.useState(urlSearch);
    const debouncedSearch = useDebounce(localSearch, 500);

    // Fetch departments
    const { data: departmentData } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            const data = await getDepartmentOptions();
            return data.map((d: DepartmentOption) => ({ id: d.id, name: d.name }));
        },
    });

    // Fetch employees with filters
    const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
        queryKey: ["employees", currentPage, urlSearch, departmentId, status],
        queryFn: async () => {
            return await getEmployees({
                page: currentPage,
                pageSize: PAGE_SIZE,
                search: urlSearch,
                departmentId: departmentId === "ALL" ? undefined : departmentId,
                status: status === "ALL" ? undefined : status,
            });
        },
    });

    const employees = employeesData?.employees || [];
    const total = employeesData?.total || 0;
    const totalPages = employeesData?.totalPages || 0;
    const departments = departmentData || [];

    // Sync debounced search to URL
    React.useEffect(() => {
        if (debouncedSearch !== urlSearch) {
            updateFilters({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

    // Filter update helper
    const updateFilters = React.useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "" || value === "ALL") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        // Always reset to page 1 when filters change (unless explicitly updating page)
        if (!("page" in updates)) {
            params.set("page", "1");
        }

        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    // Handle clear all
    const handleClearFilters = () => {
        setLocalSearch("");
        router.push(pathname);
    };

    const hasActiveFilters = urlSearch || departmentId !== "ALL" || status !== "ALL";

    // TanStack Table columns
    const columns = React.useMemo<ColumnDef<EmployeeListItem>[]>(
        () => [
            {
                accessorKey: "employeeCode",
                header: "Mã NV",
                cell: ({ row }) => (
                    <Link href={`/employees/${row.original.id}`} className="font-medium text-muted-foreground hover:text-foreground">
                        {row.original.employeeCode || "---"}
                    </Link>
                ),
            },
            {
                accessorKey: "fullName",
                header: "Họ và tên",
                cell: ({ row }) => {
                    const name = row.original.fullName || row.original.name;
                    return (
                        <Link href={`/employees/${row.original.id}`} className="flex items-center gap-3 hover:text-foreground">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-semibold text-sm">
                                {name.split(' ').pop()?.[0] || "?"}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold">{name}</span>
                                <span className="text-xs text-muted-foreground">
                                    Vào làm: {row.original.hireDate ? new Date(row.original.hireDate).toLocaleDateString('vi-VN') : "---"}
                                </span>
                            </div>
                        </Link>
                    );
                },
            },
            {
                accessorKey: "position",
                header: "Chức vụ / Phòng ban",
                cell: ({ row }) => (
                    <Link href={`/employees/${row.original.id}`} className="hover:text-foreground">
                        <div className="font-medium">{row.original.position || "Chưa rõ"}</div>
                        <div className="text-xs text-muted-foreground">{row.original.departmentName || "Chưa rõ"}</div>
                    </Link>
                ),
            },
            {
                accessorKey: "phone",
                header: "SĐT / Email",
                cell: ({ row }) => (
                    <Link href={`/employees/${row.original.id}`} className="hover:text-foreground">
                        <div className="text-sm">{row.original.phone || "---"}</div>
                        <div className="text-xs text-muted-foreground">{row.original.email}</div>
                    </Link>
                ),
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Link href={`/employees/${row.original.id}`} className="inline-flex">
                        <EmployeeStatusBadge status={row.original.employeeStatus || "ACTIVE"} />
                    </Link>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: employees,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Danh sách nhân viên</h1>
                    <p className="text-muted-foreground">Quản lý toàn bộ hồ sơ nhân sự trong công ty.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Thêm nhân viên
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:max-w-[300px] space-y-1.5">
                    <Input
                        id="search-employee"
                        name="search-employee"
                        type="search"
                        placeholder="Tên, mã NV, email, SĐT..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Select 
                            name="department" 
                            value={departmentId} 
                            onValueChange={(val) => updateFilters({ departmentId: val })}
                        >
                            <SelectTrigger id="department-filter">
                                <SelectValue placeholder="Tất cả phòng ban" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Select 
                            name="status" 
                            value={status} 
                            onValueChange={(val) => updateFilters({ status: val })}
                        >
                            <SelectTrigger id="status-filter">
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
                                <SelectItem value="ON_LEAVE">Nghỉ phép</SelectItem>
                                <SelectItem value="RESIGNED">Đã nghỉ việc</SelectItem>
                                <SelectItem value="TERMINATED">Đã chấm dứt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        className="shrink-0 text-muted-foreground px-2 h-10"
                        onClick={handleClearFilters}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Xóa bộ lọc
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoadingEmployees ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span>Đang tải dữ liệu...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Search className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.</p>
                                        {hasActiveFilters && (
                                            <Button variant="link" onClick={handleClearFilters} className="mt-2">
                                                Xóa bộ lọc
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Hiển thị <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> - <strong>{Math.min(currentPage * PAGE_SIZE, total)}</strong> trong tổng số <strong>{total}</strong> bản ghi
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: String(currentPage - 1) })}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium px-2">
                            Trang {currentPage} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: String(currentPage + 1) })}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

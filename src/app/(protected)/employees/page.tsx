"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, Filter, X } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { mockEmployees } from "@/mock/employees";
import { mockDepartments, mockPositions } from "@/mock/departments";
import { filterEmployees, paginate } from "@/mock/helpers";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZE = 10;

export default function EmployeesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Read URL state
    const urlSearch = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "ALL";
    const positionId = searchParams.get("positionId") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const pageParam = searchParams.get("page") || "1";
    const currentPage = parseInt(pageParam, 10) || 1;

    // Local state for debounced search input
    const [localSearch, setLocalSearch] = React.useState(urlSearch);
    const debouncedSearch = useDebounce(localSearch, 500);

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

    // Sync debounced search to URL
    React.useEffect(() => {
        if (debouncedSearch !== urlSearch) {
            updateFilters({ search: debouncedSearch });
        }
    }, [debouncedSearch, urlSearch, updateFilters]);

    // Handle clear all
    const handleClearFilters = () => {
        setLocalSearch("");
        router.push(pathname);
    };

    // Derive filtered and paginated data
    const filtered = filterEmployees(mockEmployees, {
        search: urlSearch,
        departmentId: departmentId === "ALL" ? undefined : departmentId,
        positionId: positionId === "ALL" ? undefined : positionId,
        status: status === "ALL" ? undefined : status,
    });

    const { data: currentEmployees, totalPages, total } = paginate(filtered, currentPage, PAGE_SIZE);

    const hasActiveFilters = urlSearch || departmentId !== "ALL" || positionId !== "ALL" || status !== "ALL";

    return (
        <div className="space-y-6">
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

            <Card className="shadow-sm">
                <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:max-w-[300px] space-y-1.5">
                            <label htmlFor="search-employee" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Search className="h-4 w-4" /> Tìm kiếm
                            </label>
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
                                <label htmlFor="department-filter" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Filter className="h-4 w-4" /> Phòng ban
                                </label>
                                <Select name="department" value={departmentId} onValueChange={(val) => updateFilters({ departmentId: val })}>
                                    <SelectTrigger id="department-filter">
                                        <SelectValue placeholder="Tất cả phòng ban" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
                                        {mockDepartments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="position-filter" className="text-sm font-medium text-muted-foreground">Chức vụ</label>
                                <Select name="position" value={positionId} onValueChange={(val) => updateFilters({ positionId: val })}>
                                    <SelectTrigger id="position-filter">
                                        <SelectValue placeholder="Tất cả chức vụ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả chức vụ</SelectItem>
                                        {mockPositions.filter(p => departmentId === "ALL" || p.departmentId === departmentId).map(pos => (
                                            <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                                <Select name="status" value={status} onValueChange={(val) => updateFilters({ status: val })}>
                                    <SelectTrigger id="status-filter">
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
                                        <SelectItem value="ON_LEAVE">Nghỉ phép</SelectItem>
                                        <SelectItem value="RESIGNED">Đã nghỉ việc</SelectItem>
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
                </CardContent>
            </Card>
            {/* Table Section */}
            <div className="rounded-md border overflow-x-auto overflow-hidden mt-4">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[80px]">Mã NV</TableHead>
                            <TableHead>Họ và tên</TableHead>
                            <TableHead>Chức vụ / Phòng ban</TableHead>
                            <TableHead>SĐT / Email</TableHead>
                            <TableHead>Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentEmployees.length > 0 ? (
                            currentEmployees.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">
                                        <Link href={`/employees/${emp.id}`} className="block w-full">
                                            {emp.employeeCode}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/employees/${emp.id}`} className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-semibold text-sm">
                                                {emp.fullName.split(' ').pop()?.[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{emp.fullName}</span>
                                                <span className="text-xs text-muted-foreground">Vào làm: {new Date(emp.hireDate || '').toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/employees/${emp.id}`} className="block w-full">
                                            <div className="font-medium">{emp.position?.name || 'Chưa rõ'}</div>
                                            <div className="text-xs text-muted-foreground">{emp.department?.name || 'Chưa rõ'}</div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/employees/${emp.id}`} className="block w-full">
                                            <div className="text-sm">{emp.phone}</div>
                                            <div className="text-xs text-muted-foreground">{emp.personalEmail}</div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/employees/${emp.id}`} className="block w-full h-full flex items-center">
                                            <EmployeeStatusBadge status={emp.status} />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
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
                            Trước
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
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

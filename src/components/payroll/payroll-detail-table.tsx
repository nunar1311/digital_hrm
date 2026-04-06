"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Eye, FileDown, Search, Loader2, MoreHorizontal, Filter, X } from "lucide-react";
import type { PayrollRecordDetail, PayrollDetailStatus } from "@/app/(protected)/payroll/types";

export function formatCurrency(amount: number | bigint | unknown): string {
    const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(num);
}

interface PayrollDetailTableProps {
    details: PayrollRecordDetail[];
    departments: { id: string; name: string }[];
    onViewPayslip: (userId: string) => void;
    onExportPayslip: (userId: string) => void;
}

export function PayrollDetailTable({
    details: initialDetails,
    departments,
    onViewPayslip,
    onExportPayslip,
}: PayrollDetailTableProps) {
    const [search, setSearch] = useState("");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<PayrollRecordDetail | null>(null);
    const PAGE_SIZE = 20;

    const filteredDetails = initialDetails.filter((detail) => {
        const matchesSearch =
            search === "" ||
            detail.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            detail.user?.employeeCode?.toLowerCase().includes(search.toLowerCase());

        const matchesDepartment =
            filterDepartment === "all" ||
            detail.user?.department?.name === departments.find((d) => d.id === filterDepartment)?.name;

        const matchesStatus = filterStatus === "all" || detail.status === filterStatus;

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const totalPages = Math.ceil(filteredDetails.length / PAGE_SIZE);
    const paginatedDetails = filteredDetails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusBadge = (status: PayrollDetailStatus) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary">Chờ duyệt</Badge>;
            case "CONFIRMED":
                return <Badge variant="outline" className="bg-blue-50">Đã xác nhận</Badge>;
            case "PAID":
                return <Badge variant="default" className="bg-green-600">Đã trả</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const activeFiltersCount = [
        filterDepartment !== "all",
        filterStatus !== "all",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterDepartment("all");
        setFilterStatus("all");
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã NV, họ tên..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 pr-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant={showFilters ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="hidden sm:flex"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center items-center text-xs">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>

                    {/* Mobile filter dropdown */}
                    <div className="flex sm:hidden gap-2 w-full">
                        <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setPage(1); }}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Phòng ban" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                                <SelectItem value="PAID">Đã trả</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desktop filters panel */}
                    {showFilters && (
                        <div className="hidden sm:flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                            <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setPage(1); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Phòng ban" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                                    <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                                    <SelectItem value="PAID">Đã trả</SelectItem>
                                </SelectContent>
                            </Select>

                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground"
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                <div className="flex items-center gap-4">
                    <span>
                        Hiển thị <strong>{paginatedDetails.length}</strong> / <strong>{filteredDetails.length}</strong> nhân viên
                    </span>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                            {activeFiltersCount} bộ lọc đang active
                        </Badge>
                    )}
                </div>
                {search && (
                    <span className="hidden sm:inline">
                        Tìm thấy "<strong>{filteredDetails.length}</strong>" kết quả cho "<strong>{search}</strong>"
                    </span>
                )}
            </div>

            {/* Table with horizontal scroll */}
            <div className="rounded-lg border bg-background overflow-hidden">
                <ScrollArea className="w-full">
                    <div className="min-w-[900px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-10 sticky left-0 bg-muted/50 z-10"></TableHead>
                                    <TableHead className="w-12 sticky left-10 bg-muted/50 z-10">STT</TableHead>
                                    <TableHead className="w-28 sticky left-18 bg-muted/50 z-10">Mã NV</TableHead>
                                    <TableHead className="min-w-[150px] sticky left-38 bg-muted/50 z-10">Họ tên</TableHead>
                                    <TableHead className="min-w-[120px]">Phòng ban</TableHead>
                                    <TableHead className="text-right min-w-[120px]">Lương CB</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Phụ cấp</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Thưởng</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Tăng ca</TableHead>
                                    <TableHead className="text-right min-w-[120px] bg-emerald-50/50">Gross</TableHead>
                                    <TableHead className="text-right min-w-[90px]">BHXH</TableHead>
                                    <TableHead className="text-right min-w-[90px]">BHYT</TableHead>
                                    <TableHead className="text-right min-w-[90px]">BHTN</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Thuế TNCN</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Khấu trừ</TableHead>
                                    <TableHead className="text-right min-w-[120px] bg-blue-50/50 font-semibold">Net</TableHead>
                                    <TableHead className="w-28">Trạng thái</TableHead>
                                    <TableHead className="w-20 text-center">Ngày công</TableHead>
                                    <TableHead className="w-28 text-right sticky right-0 bg-muted/50 z-10">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDetails.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={19} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="h-8 w-8 text-muted-foreground/50" />
                                                <p>Không có dữ liệu</p>
                                                {(search || activeFiltersCount > 0) && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearch("");
                                                            clearFilters();
                                                        }}
                                                    >
                                                        Xóa bộ lọc
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedDetails.map((detail, index) => (
                                        <>
                                            <TableRow key={detail.id} className="hover:bg-muted/50 group">
                                                <TableCell className="sticky left-0 bg-background group-hover:bg-muted/50 z-10">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => toggleRow(detail.id)}
                                                    >
                                                        {expandedRows.has(detail.id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="sticky left-10 bg-background group-hover:bg-muted/50 z-10">
                                                    {(page - 1) * PAGE_SIZE + index + 1}
                                                </TableCell>
                                                <TableCell className="sticky left-18 bg-background group-hover:bg-muted/50 z-10 font-mono text-sm">
                                                    {detail.user?.employeeCode || "—"}
                                                </TableCell>
                                                <TableCell className="sticky left-38 bg-background group-hover:bg-muted/50 z-10 font-medium">
                                                    {detail.user?.name || "—"}
                                                </TableCell>
                                                <TableCell>{detail.user?.department?.name || "—"}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(detail.baseSalary)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(detail.allowanceAmount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(detail.bonusAmount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(detail.overtimeAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium bg-emerald-50/30">
                                                    {formatCurrency(detail.grossSalary)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(detail.socialInsurance)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(detail.healthInsurance)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(detail.unemploymentInsurance)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(detail.taxAmount)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(detail.deductionAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-green-600 bg-blue-50/30">
                                                    {formatCurrency(detail.netSalary)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(detail.status)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-mono">
                                                        {detail.workDays}/{detail.standardDays}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/50 z-10">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => onViewPayslip(detail.userId)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Xem phiếu lương
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onExportPayslip(detail.userId)}>
                                                                <FileDown className="mr-2 h-4 w-4" />
                                                                Tải PDF
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.has(detail.id) && (
                                                <TableRow key={`${detail.id}-expanded`} className="bg-muted/20">
                                                    <TableCell colSpan={19} className="p-4">
                                                        <div className="bg-background rounded-lg border p-4 space-y-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-medium flex items-center gap-2">
                                                                    <ChevronDown className="h-4 w-4" />
                                                                    Chi tiết lương của {detail.user?.name}
                                                                </h4>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => onViewPayslip(detail.userId)}
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        Xem phiếu lương
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Lương cơ bản</p>
                                                                    <p className="font-medium">{formatCurrency(detail.baseSalary)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Phụ cấp</p>
                                                                    <p className="font-medium">{formatCurrency(detail.allowanceAmount)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Thưởng</p>
                                                                    <p className="font-medium">{formatCurrency(detail.bonusAmount)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Tăng ca ({detail.overtimeHours}h)</p>
                                                                    <p className="font-medium">{formatCurrency(detail.overtimeAmount)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Tổng Gross</p>
                                                                    <p className="font-medium text-green-600">{formatCurrency(detail.grossSalary)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">BHXH (8%)</p>
                                                                    <p className="font-medium text-red-600">{formatCurrency(detail.socialInsurance)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">BHYT (1.5%)</p>
                                                                    <p className="font-medium text-red-600">{formatCurrency(detail.healthInsurance)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">BHTN (1%)</p>
                                                                    <p className="font-medium text-red-600">{formatCurrency(detail.unemploymentInsurance)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Giảm trừ cá nhân</p>
                                                                    <p className="font-medium">{formatCurrency(detail.personalDeduction)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Giảm trừ phụ thuộc</p>
                                                                    <p className="font-medium">{formatCurrency(detail.dependentDeduction)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Thuế TNCN</p>
                                                                    <p className="font-medium text-red-600">{formatCurrency(detail.taxAmount)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Khấu trừ khác</p>
                                                                    <p className="font-medium text-red-600">{formatCurrency(detail.deductionAmount)}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Ngày công</p>
                                                                    <p className="font-medium">{detail.workDays}/{detail.standardDays}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Ngày muộn</p>
                                                                    <p className="font-medium">{detail.lateDays}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Số tài khoản</p>
                                                                    <p className="font-medium font-mono">{detail.bankAccount || "—"}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">Ngân hàng</p>
                                                                    <p className="font-medium">{detail.bankName || "—"}</p>
                                                                </div>
                                                            </div>
                                                            <Separator />
                                                            <div className="flex items-center justify-end">
                                                                <div className="text-right">
                                                                    <p className="text-sm text-muted-foreground">Lương thực nhận (Net)</p>
                                                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(detail.netSalary)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                        {" | "}
                        Tổng <strong>{filteredDetails.length}</strong> bản ghi
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            Đầu
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Trước
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className="w-9"
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Sau
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            Cuối
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

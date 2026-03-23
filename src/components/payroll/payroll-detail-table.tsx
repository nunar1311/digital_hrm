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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Eye, FileDown, Search, Loader2 } from "lucide-react";
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Chi tiết bảng lương</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {filteredDetails.length} nhân viên
                    </span>
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo mã NV, họ tên..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>

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
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="w-12">STT</TableHead>
                                <TableHead className="w-24">Mã NV</TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Phòng ban</TableHead>
                                <TableHead className="text-right">Lương CB</TableHead>
                                <TableHead className="text-right">Phụ cấp</TableHead>
                                <TableHead className="text-right">Thưởng</TableHead>
                                <TableHead className="text-right">Tăng ca</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right">BHXH</TableHead>
                                <TableHead className="text-right">BHYT</TableHead>
                                <TableHead className="text-right">BHTN</TableHead>
                                <TableHead className="text-right">Thuế TNCN</TableHead>
                                <TableHead className="text-right">Khấu trừ</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="w-24">Trạng thái</TableHead>
                                <TableHead className="w-20">Ngày công</TableHead>
                                <TableHead className="w-28 text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDetails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDetails.map((detail, index) => (
                                    <>
                                        <TableRow key={detail.id} className="hover:bg-muted/50">
                                            <TableCell>
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
                                            <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {detail.user?.employeeCode || "—"}
                                            </TableCell>
                                            <TableCell className="font-medium">
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
                                            <TableCell className="text-right font-medium">
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
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(detail.netSalary)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(detail.status)}</TableCell>
                                            <TableCell className="text-center">
                                                {detail.workDays}/{detail.standardDays}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => onViewPayslip(detail.userId)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => onExportPayslip(detail.userId)}
                                                    >
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows.has(detail.id) && (
                                            <TableRow key={`${detail.id}-expanded`} className="bg-muted/30">
                                                <TableCell colSpan={19} className="p-4">
                                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Lương cơ bản</p>
                                                            <p className="font-medium">{formatCurrency(detail.baseSalary)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Phụ cấp</p>
                                                            <p className="font-medium">{formatCurrency(detail.allowanceAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Thưởng</p>
                                                            <p className="font-medium">{formatCurrency(detail.bonusAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Tăng ca ({detail.overtimeHours}h)</p>
                                                            <p className="font-medium">{formatCurrency(detail.overtimeAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Tổng Gross</p>
                                                            <p className="font-medium">{formatCurrency(detail.grossSalary)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">BHXH (8%)</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.socialInsurance)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">BHYT (1.5%)</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.healthInsurance)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">BHTN (1%)</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.unemploymentInsurance)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Giảm trừ cá nhân</p>
                                                            <p className="font-medium">{formatCurrency(detail.personalDeduction)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Giảm trừ phụ thuộc</p>
                                                            <p className="font-medium">{formatCurrency(detail.dependentDeduction)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Thuế TNCN</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.taxAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Khấu trừ khác</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.deductionAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Ngày công</p>
                                                            <p className="font-medium">{detail.workDays}/{detail.standardDays}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Ngày muộn</p>
                                                            <p className="font-medium">{detail.lateDays}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Số tài khoản</p>
                                                            <p className="font-medium">{detail.bankAccount || "—"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Ngân hàng</p>
                                                            <p className="font-medium">{detail.bankName || "—"}</p>
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

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredDetails.length)} trong {filteredDetails.length} bản ghi
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Trước
                            </Button>
                            <span className="text-sm">
                                Trang {page}/{totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

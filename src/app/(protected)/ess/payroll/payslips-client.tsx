"use client";

import { useState } from "react";
import {
    Wallet,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    FileText,
    Calendar,
    DollarSign,
    Minus,
    Plus,
    Filter,
    Eye,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Payslip {
    id: string;
    month: number;
    year: number;
    baseSalary: number;
    allowances: number;
    overtimePay: number;
    bonuses: number;
    deductions: number;
    tax: number;
    insurance: number;
    otherDeductions: number;
    netSalary: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
}

interface ESSPayslipsClientProps {
    initialPayslips: Payslip[];
}

const MONTHS = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

function formatCurrency(amount: number | null) {
    if (amount === null || amount === undefined) return "0";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getStatusConfig(status: string) {
    switch (status) {
        case "PAID":
            return { label: "Đã thanh toán", variant: "default" as const, className: "bg-emerald-100 text-emerald-800" };
        case "PENDING":
            return { label: "Chờ thanh toán", variant: "secondary" as const, className: "bg-amber-100 text-amber-800" };
        case "PROCESSING":
            return { label: "Đang xử lý", variant: "secondary" as const };
        case "GENERATED":
            return { label: "Đã phát hành", variant: "default" as const, className: "bg-blue-100 text-blue-800" };
        case "VIEWED":
            return { label: "Đã xem", variant: "secondary" as const, className: "bg-purple-100 text-purple-800" };
        default:
            return { label: status, variant: "outline" as const };
    }
}

function PayslipDetailDialog({ 
    payslip, 
    open, 
    onClose 
}: { 
    payslip: Payslip | null; 
    open: boolean; 
    onClose: () => void;
}) {
    if (!payslip) return null;

    const status = getStatusConfig(payslip.status);
    const grossSalary = (payslip.baseSalary || 0) + (payslip.allowances || 0) + (payslip.overtimePay || 0) + (payslip.bonuses || 0);
    const totalDeductions = (payslip.tax || 0) + (payslip.insurance || 0) + (payslip.otherDeductions || 0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        Phiếu lương {MONTHS[payslip.month - 1]} {payslip.year}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-center justify-between">
                        <Badge variant={status.variant} className={status.className}>
                            {status.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Ngày thanh toán: {formatDate(payslip.paidAt)}
                        </span>
                    </div>

                    {/* Thông tin lương */}
                    <Card className="bg-green-50/50 border-green-100">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Lương thực nhận</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {formatCurrency(payslip.netSalary)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bảng chi tiết */}
                    <div className="border rounded-lg overflow-hidden">
                        {/* Thu nhập */}
                        <div className="bg-emerald-50 px-4 py-2 border-b">
                            <div className="flex items-center gap-2 text-emerald-800 font-medium">
                                <Plus className="h-4 w-4" />
                                Thu nhập
                            </div>
                        </div>
                        <div className="divide-y">
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Lương cơ bản</span>
                                <span className="font-medium">{formatCurrency(payslip.baseSalary)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Phụ cấp</span>
                                <span className="font-medium">{formatCurrency(payslip.allowances)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Làm thêm giờ (OT)</span>
                                <span className="font-medium">{formatCurrency(payslip.overtimePay)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Thưởng</span>
                                <span className="font-medium">{formatCurrency(payslip.bonuses)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-emerald-50/50 font-semibold">
                                <span>Tổng thu nhập</span>
                                <span className="text-emerald-700">{formatCurrency(grossSalary)}</span>
                            </div>
                        </div>

                        {/* Khấu trừ */}
                        <div className="bg-red-50 px-4 py-2 border-t border-b">
                            <div className="flex items-center gap-2 text-red-800 font-medium">
                                <Minus className="h-4 w-4" />
                                Khấu trừ
                            </div>
                        </div>
                        <div className="divide-y">
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Thuế TNCN</span>
                                <span className="font-medium text-red-600">{formatCurrency(payslip.tax)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Bảo hiểm</span>
                                <span className="font-medium text-red-600">{formatCurrency(payslip.insurance)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-muted-foreground">Khấu trừ khác</span>
                                <span className="font-medium text-red-600">{formatCurrency(payslip.otherDeductions)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-red-50/50 font-semibold">
                                <span>Tổng khấu trừ</span>
                                <span className="text-red-700">{formatCurrency(totalDeductions)}</span>
                            </div>
                        </div>

                        {/* Thực nhận */}
                        <div className="bg-green-100 px-4 py-3">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-green-900">Thực nhận</span>
                                <span className="text-green-800 text-xl">{formatCurrency(payslip.netSalary)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                        <Button className="gap-2">
                            <Download className="h-4 w-4" />
                            Tải phiếu lương
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PayslipCard({ 
    payslip, 
    onView 
}: { 
    payslip: Payslip; 
    onView: () => void;
}) {
    const status = getStatusConfig(payslip.status);
    
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-100 text-green-600">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                {MONTHS[payslip.month - 1]} {payslip.year}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {payslip.status === "PAID" && payslip.paidAt 
                                    ? `Thanh toán: ${formatDate(payslip.paidAt)}`
                                    : "Chưa thanh toán"
                                }
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={status.variant} className={status.className}>
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Salary Summary */}
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Lương cơ bản</span>
                        <span className="font-medium">{formatCurrency(payslip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Phụ cấp + OT + Thưởng</span>
                        <span className="font-medium text-emerald-600">
                            +{formatCurrency(payslip.allowances + payslip.overtimePay + payslip.bonuses)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Thuế + BHXH</span>
                        <span className="font-medium text-red-600">
                            -{formatCurrency(payslip.tax + payslip.insurance)}
                        </span>
                    </div>
                    
                    {/* Net Salary */}
                    <div className="flex justify-between items-center pt-2 bg-green-50 -mx-4 px-4 py-3 -mb-4 rounded-b-lg">
                        <span className="font-semibold text-green-800">Thực nhận</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(payslip.netSalary)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ESSPayslipsClient({ initialPayslips }: ESSPayslipsClientProps) {
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    // Filter payslips
    const filteredPayslips = initialPayslips.filter((p) => {
        const matchesYear = p.year === selectedYear;
        const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
        return matchesYear && matchesStatus;
    });

    // Stats
    const stats = {
        totalPayslips: initialPayslips.length,
        paidPayslips: initialPayslips.filter(p => ["GENERATED", "VIEWED", "PAID"].includes(p.status)).length,
        totalIncome: initialPayslips
            .filter(p => ["GENERATED", "VIEWED", "PAID"].includes(p.status))
            .reduce((sum, p) => sum + (p.netSalary || 0), 0),
    };

    // Available years
    const availableYears = Array.from(
        new Set(initialPayslips.map(p => p.year))
    ).sort((a, b) => b - a);

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-green-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-green-600" />
                                Phiếu lương
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Xem và tải phiếu lương của bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.totalPayslips}</div>
                                    <p className="text-xs text-muted-foreground">Tổng phiếu lương</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.paidPayslips}</div>
                                    <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(stats.totalIncome)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Tổng thu nhập đã nhận</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {availableYears.length > 0 ? (
                                availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        Năm {year}
                                    </option>
                                ))
                            ) : (
                                <option value={new Date().getFullYear()}>
                                    Năm {new Date().getFullYear()}
                                </option>
                            )}
                        </select>

                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="GENERATED">Đã phát hành</option>
                            <option value="VIEWED">Đã xem</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="PENDING">Chờ thanh toán</option>
                            <option value="PROCESSING">Đang xử lý</option>
                        </select>
                    </div>
                </div>

                {/* Payslips Grid */}
                {filteredPayslips.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-4">
                                Chưa có phiếu lương cho kỳ lựa chọn
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPayslips.map((payslip) => (
                            <PayslipCard
                                key={payslip.id}
                                payslip={payslip}
                                onView={() => setSelectedPayslip(payslip)}
                            />
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">Thông tin phiếu lương</p>
                                <ul className="mt-2 space-y-1 text-blue-800 text-xs">
                                    <li>• Phiếu lương được tạo tự động sau khi kỳ lương kết thúc</li>
                                    <li>• Vui lòng kiểm tra kỹ các khoản thu nhập và khấu trừ</li>
                                    <li>• Nếu có thắc mắc, liên hệ bộ phận HR/TC để được giải đáp</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <PayslipDetailDialog
                payslip={selectedPayslip}
                open={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
            />
        </div>
    );
}

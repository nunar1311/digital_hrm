"use client";

import { useState } from "react";
import {
    Briefcase,
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    AlertCircle,
    XCircle,
    type LucideIcon,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Contract {
    id: string;
    contractNumber: string;
    title: string;
    typeName: string;
    typeDuration: number | null;
    startDate: Date;
    endDate: Date | null;
    status: string;
    salary: number | null;
    currency: string;
    probationSalary: number | null;
    signedDate: Date | null;
    fileUrl: string | null;
    notes: string | null;
}

interface ESSContractsClientProps {
    initialContracts: Contract[];
}

const statusConfig: Record<string, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: LucideIcon;
    bgClass: string;
}> = {
    DRAFT: { label: "Bản nháp", variant: "secondary", icon: FileText, bgClass: "bg-muted/50" },
    PENDING: { label: "Chờ ký", variant: "secondary", className: "bg-amber-100 text-amber-800", icon: FileText, bgClass: "bg-amber-50" },
    ACTIVE: { label: "Đang hiệu lực", variant: "default", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2, bgClass: "bg-emerald-50" },
    EXPIRED: { label: "Hết hạn", variant: "outline", icon: XCircle, bgClass: "bg-muted/50" },
    TERMINATED: { label: "Đã chấm dứt", variant: "destructive", icon: XCircle, bgClass: "bg-red-50" },
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}

function formatCurrency(amount: number | null, currency: string = "VND") {
    if (amount === null) return "-";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency", currency, maximumFractionDigits: 0,
    }).format(amount);
}

function getContractDuration(startDate: string, endDate: string | null) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (!end) return "Không thời hạn";
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months} tháng`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} năm`;
    return `${years} năm ${remainingMonths} tháng`;
}

function getContractStatus(contract: Contract): string {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = contract.endDate ? new Date(contract.endDate) : null;
    if (contract.status === "TERMINATED") return "TERMINATED";
    if (contract.status === "DRAFT") return "DRAFT";
    if (contract.status === "PENDING") return "PENDING";
    if (now < start) return "PENDING";
    if (end && now > end) return "EXPIRED";
    return "ACTIVE";
}

function ContractCard({ contract }: { contract: Contract }) {
    const computedStatus = getContractStatus(contract);
    const status = statusConfig[computedStatus] || statusConfig.ACTIVE;
    const StatusIcon = status.icon;
    const isExpiringSoon = computedStatus === "ACTIVE" && contract.endDate && contract.endDate.getTime() - new Date().getTime() < 90 * 24 * 60 * 60 * 1000;

    return (
        <Card className={cn("hover:shadow-md transition-all", isExpiringSoon && "border-amber-300")}>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2.5 rounded-lg", status.bgClass)}>
                            <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{contract.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">Số: {contract.contractNumber}</CardDescription>
                        </div>
                    </div>
                    <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Loại hợp đồng</p>
                        <p className="text-sm font-medium">{contract.typeName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Thời hạn</p>
                        <p className="text-sm font-medium">{getContractDuration(contract.startDate.toISOString(), contract.endDate?.toISOString() ?? null)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Ngày bắt đầu</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(contract.startDate.toISOString())}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Ngày kết thúc</p>
                        <p className="text-sm font-medium">{contract.endDate ? formatDate(contract.endDate.toISOString()) : "Không thời hạn"}</p>
                    </div>
                </div>

                {contract.salary && (
                    <div className="pt-3 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Lương chính thức</p>
                                <p className="text-sm font-bold text-emerald-700">{formatCurrency(contract.salary, contract.currency)}</p>
                                <p className="text-xs text-muted-foreground">/ tháng</p>
                            </div>
                            {contract.probationSalary && (
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Lương thử việc</p>
                                    <p className="text-sm font-medium">{formatCurrency(contract.probationSalary, contract.currency)}</p>
                                    <p className="text-xs text-muted-foreground">/ tháng</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isExpiringSoon && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-xs text-amber-800">
                            <p className="font-medium">Hợp đồng sắp hết hạn</p>
                            <p>Vui lòng liên hệ bộ phận HCNS để gia hạn.</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                        {contract.signedDate && <span>Đã ký: {formatDate(contract.signedDate.toISOString())}</span>}
                    </div>
                    {contract.fileUrl && (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />Tải file
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function ESSContractsClient({ initialContracts }: ESSContractsClientProps) {
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const filteredContracts = statusFilter === "ALL" ? initialContracts : initialContracts.filter((c) => getContractStatus(c) === statusFilter);

    const stats = {
        total: initialContracts.length,
        active: initialContracts.filter((c) => getContractStatus(c) === "ACTIVE").length,
        expired: initialContracts.filter((c) => getContractStatus(c) === "EXPIRED").length,
        expiringSoon: initialContracts.filter((c) => {
            const status = getContractStatus(c);
            return status === "ACTIVE" && c.endDate && c.endDate.getTime() - new Date().getTime() < 90 * 24 * 60 * 60 * 1000;
        }).length,
    };

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            <div className="shrink-0 border-b bg-linear-to-r from-indigo-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <Briefcase className="h-6 w-6 text-indigo-600" />
                                Hợp đồng lao động
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Xem thông tin hợp đồng và quyền lợi của bạn</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><FileText className="h-5 w-5" /></div>
                                <div><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Tổng hợp đồng</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                                <div><div className="text-2xl font-bold">{stats.active}</div><p className="text-xs text-muted-foreground">Đang hiệu lực</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 text-red-600"><XCircle className="h-5 w-5" /></div>
                                <div><div className="text-2xl font-bold">{stats.expired}</div><p className="text-xs text-muted-foreground">Hết hạn</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow border-amber-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><AlertCircle className="h-5 w-5" /></div>
                                <div><div className="text-2xl font-bold">{stats.expiringSoon}</div><p className="text-xs text-muted-foreground">Sắp hết hạn</p></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Lọc:</span>
                    {["ALL", "ACTIVE", "PENDING", "EXPIRED", "TERMINATED"].map((status) => (
                        <Button key={status} variant={statusFilter === status ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(status)}>
                            {status === "ALL" && "Tất cả"}
                            {status === "ACTIVE" && "Đang hiệu lực"}
                            {status === "PENDING" && "Chờ ký"}
                            {status === "EXPIRED" && "Hết hạn"}
                            {status === "TERMINATED" && "Đã chấm dứt"}
                        </Button>
                    ))}
                </div>

                {filteredContracts.length === 0 ? (
                    <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground mb-4">{statusFilter === "ALL" ? "Bạn chưa có hợp đồng lao động nào" : "Không có hợp đồng phù hợp"}</p></CardContent></Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {filteredContracts.map((contract) => <ContractCard key={contract.id} contract={contract} />)}
                    </div>
                )}

                <Card className="bg-indigo-50/50 border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-indigo-900">Thông tin hợp đồng</p>
                                <ul className="mt-2 space-y-1 text-indigo-800 text-xs">
                                    <li>• Hợp đồng lao động là căn cứ pháp lý giữa bạn và công ty</li>
                                    <li>• Vui lòng đọc kỹ và ký nhận khi nhận được hợp đồng mới</li>
                                    <li>• Nếu có thắc mắc, liên hệ bộ phận HCNS</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

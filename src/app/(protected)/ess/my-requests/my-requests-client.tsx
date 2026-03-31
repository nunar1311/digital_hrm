"use client";

import { useState } from "react";
import Link from "next/link";
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    CalendarDays,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Calendar,
    Plus,
    ArrowRight,
    Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types - Updated to match Prisma schema
interface LeaveRequest {
    id: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string | null;
    status: string;
    createdAt: string;
    leaveBalance?: {
        leaveType: {
            id: string;
            name: string;
            isPaidLeave: boolean;
        };
    } | null;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
}

interface AdminRequest {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
}

interface OvertimeRequest {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    reason: string;
    status: string;
    managerApprovedBy: string | null;
    managerApprovedAt: string | null;
    hrApprovedBy: string | null;
    hrApprovedAt: string | null;
    rejectedBy: string | null;
    rejectedAt: string | null;
    rejectedReason: string | null;
    createdAt: string;
}

interface ESSMyRequestsClientProps {
    leaveRequests: LeaveRequest[];
    adminRequests: AdminRequest[];
    overtimeRequests: OvertimeRequest[];
}

// Status Config
const statusConfig: Record<string, { 
    label: string; 
    variant: "default" | "secondary" | "destructive" | "outline"; 
    className?: string;
    icon: any;
}> = {
    PENDING: { 
        label: "Đang chờ", 
        variant: "secondary", 
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100", 
        icon: Clock 
    },
    APPROVED: { 
        label: "Đã duyệt", 
        variant: "default", 
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100", 
        icon: CheckCircle2 
    },
    REJECTED: { 
        label: "Từ chối", 
        variant: "destructive", 
        icon: XCircle 
    },
    CANCELLED: { 
        label: "Đã hủy", 
        variant: "outline", 
        className: "text-muted-foreground", 
        icon: XCircle 
    },
};

const adminRequestTypes: Record<string, { label: string; icon: any }> = {
    SALARY_CONFIRMATION: { label: "Xác nhận lương", icon: FileText },
    WORK_CERTIFICATE: { label: "Giấy xác nhận lao động", icon: Briefcase },
    TAX_CONFIRMATION: { label: "Xác nhận thuế", icon: FileText },
    SOCIAL_INSURANCE: { label: "Sổ BHXH", icon: FileText },
    RESIGNATION_LETTER: { label: "Đơn xin nghỉ việc", icon: FileText },
    RECOMMENDATION_LETTER: { label: "Thư giới thiệu", icon: FileText },
    OTHER: { label: "Khác", icon: FileText },
};

// Helper functions
function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTime(timeStr: string) {
    return timeStr.substring(0, 5);
}

// Request Card Components
function LeaveRequestCard({ request }: { request: LeaveRequest }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const status = statusConfig[request.status] || statusConfig.PENDING;
    const leaveTypeName = request.leaveBalance?.leaveType?.name || "Nghỉ phép";

    return (
        <div className={cn(
            "rounded-lg border transition-all",
            status.className?.includes("bg-amber") && "bg-amber-50/50 border-amber-200",
            status.className?.includes("bg-emerald") && "bg-emerald-50/50 border-emerald-200",
            request.status === "REJECTED" && "bg-red-50/50 border-red-200",
        )}>
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2.5 rounded-lg",
                        status.className?.includes("bg-amber") ? "bg-amber-100 text-amber-600" :
                        status.className?.includes("bg-emerald") ? "bg-emerald-100 text-emerald-600" :
                        request.status === "REJECTED" ? "bg-red-100 text-red-600" :
                        "bg-muted"
                    )}>
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{leaveTypeName}</span>
                            <Badge variant={status.variant} className={status.className}>
                                {status.label}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            <span className="mx-2">•</span>
                            {request.totalDays} ngày
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        {formatDateTime(request.createdAt)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Ngày tạo:</span>
                        <span className="font-medium">{formatDateTime(request.createdAt)}</span>
                    </div>

                    {request.reason && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Lý do</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                {request.reason}
                            </p>
                        </div>
                    )}

                    {request.status === "REJECTED" && request.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Lý do từ chối</span>
                            </div>
                            <p className="text-sm text-red-800">{request.rejectionReason}</p>
                        </div>
                    )}

                    {request.status === "APPROVED" && request.approvedAt && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đã được duyệt</span>
                            <span className="text-muted-foreground">
                                lúc {formatDateTime(request.approvedAt)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AdminRequestCard({ request }: { request: AdminRequest }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const status = statusConfig[request.status] || statusConfig.PENDING;
    const typeConfig = adminRequestTypes[request.type] || adminRequestTypes.OTHER;
    const TypeIcon = typeConfig.icon;

    return (
        <div className={cn(
            "rounded-lg border transition-all",
            status.className?.includes("bg-amber") && "bg-amber-50/50 border-amber-200",
            status.className?.includes("bg-emerald") && "bg-emerald-50/50 border-emerald-200",
            request.status === "REJECTED" && "bg-red-50/50 border-red-200",
        )}>
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2.5 rounded-lg",
                        status.className?.includes("bg-amber") ? "bg-amber-100 text-amber-600" :
                        status.className?.includes("bg-emerald") ? "bg-emerald-100 text-emerald-600" :
                        request.status === "REJECTED" ? "bg-red-100 text-red-600" :
                        "bg-teal-100 text-teal-600"
                    )}>
                        <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{typeConfig.label}</span>
                            <Badge variant={status.variant} className={status.className}>
                                {status.label}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(request.createdAt)}
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    {request.description && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Mô tả</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                {request.description}
                            </p>
                        </div>
                    )}

                    {request.status === "REJECTED" && request.rejectReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Lý do từ chối</span>
                            </div>
                            <p className="text-sm text-red-800">{request.rejectReason}</p>
                        </div>
                    )}

                    {request.reviewedAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đã xử lý: {formatDateTime(request.reviewedAt)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function OvertimeRequestCard({ request }: { request: OvertimeRequest }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const status = statusConfig[request.status] || statusConfig.PENDING;

    return (
        <div className={cn(
            "rounded-lg border transition-all",
            status.className?.includes("bg-amber") && "bg-amber-50/50 border-amber-200",
            status.className?.includes("bg-emerald") && "bg-emerald-50/50 border-emerald-200",
            request.status === "REJECTED" && "bg-red-50/50 border-red-200",
        )}>
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2.5 rounded-lg",
                        status.className?.includes("bg-amber") ? "bg-amber-100 text-amber-600" :
                        status.className?.includes("bg-emerald") ? "bg-emerald-100 text-emerald-600" :
                        request.status === "REJECTED" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                    )}>
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Làm thêm giờ</span>
                            <Badge variant={status.variant} className={status.className}>
                                {status.label}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(request.date)}
                            <span className="mx-2">•</span>
                            {formatTime(request.startTime)} - {formatTime(request.endTime)}
                            <span className="mx-2">•</span>
                            {request.hours} giờ
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Ngày tạo:</span>
                        <span className="font-medium">{formatDateTime(request.createdAt)}</span>
                    </div>

                    {request.reason && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Lý do</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                {request.reason}
                            </p>
                        </div>
                    )}

                    {request.status === "REJECTED" && request.rejectedReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Lý do từ chối</span>
                            </div>
                            <p className="text-sm text-red-800">{request.rejectedReason}</p>
                        </div>
                    )}

                    {request.status === "APPROVED" && (
                        <div className="space-y-2">
                            {request.managerApprovedAt && (
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Quản lý duyệt: {formatDateTime(request.managerApprovedAt)}</span>
                                </div>
                            )}
                            {request.hrApprovedAt && (
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>HR duyệt: {formatDateTime(request.hrApprovedAt)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Empty State Component
function EmptyState({ title, description, actionHref, actionLabel }: {
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
}) {
    return (
        <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">{title}</p>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            {actionHref && actionLabel && (
                <Button asChild>
                    <Link href={actionHref}>
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Link>
                </Button>
            )}
        </div>
    );
}

// Main Component
export function ESSMyRequestsClient({
    leaveRequests,
    adminRequests,
    overtimeRequests,
}: ESSMyRequestsClientProps) {
    // Stats
    const allRequests = [...leaveRequests, ...adminRequests, ...overtimeRequests];
    const pendingRequests = allRequests.filter(r => r.status === "PENDING");
    const approvedRequests = allRequests.filter(r => r.status === "APPROVED");
    const rejectedRequests = allRequests.filter(r => r.status === "REJECTED");

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-purple-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <FileText className="h-6 w-6 text-purple-600" />
                                Đơn của tôi
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Theo dõi và quản lý các yêu cầu của bạn
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/ess/leave">
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Đăng ký nghỉ phép
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/ess/requests">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Yêu cầu HC
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className={cn(
                        "hover:shadow-md transition-shadow",
                        pendingRequests.length > 0 && "border-amber-200"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{allRequests.length}</div>
                                    <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        "hover:shadow-md transition-shadow",
                        pendingRequests.length > 0 && "border-amber-200"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{pendingRequests.length}</div>
                                    <p className="text-xs text-muted-foreground">Đang chờ duyệt</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{approvedRequests.length}</div>
                                    <p className="text-xs text-muted-foreground">Đã duyệt</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                                    <XCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{rejectedRequests.length}</div>
                                    <p className="text-xs text-muted-foreground">Từ chối</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList className="bg-muted/50">
                        <TabsTrigger value="all" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Tất cả
                            <Badge variant="secondary" className="ml-1">{allRequests.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="leave" className="gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Nghỉ phép
                            <Badge variant="secondary" className="ml-1">{leaveRequests.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="overtime" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Làm thêm giờ
                            <Badge variant="secondary" className="ml-1">{overtimeRequests.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="admin" className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Yêu cầu HC
                            <Badge variant="secondary" className="ml-1">{adminRequests.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* All Requests */}
                    <TabsContent value="all" className="space-y-4">
                        {allRequests.length === 0 ? (
                            <Card>
                                <CardContent>
                                    <EmptyState
                                        title="Chưa có yêu cầu nào"
                                        description="Bắt đầu bằng cách tạo yêu cầu mới"
                                        actionHref="/ess/leave"
                                        actionLabel="Đăng ký nghỉ phép"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {allRequests.map((request) => {
                                    // Type guard based on presence of fields
                                    if ("leaveBalance" in request) {
                                        return <LeaveRequestCard key={request.id} request={request as LeaveRequest} />;
                                    } else if ("date" in request && "startTime" in request) {
                                        return <OvertimeRequestCard key={request.id} request={request as OvertimeRequest} />;
                                    } else {
                                        return <AdminRequestCard key={request.id} request={request as AdminRequest} />;
                                    }
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* Leave Requests */}
                    <TabsContent value="leave" className="space-y-4">
                        {leaveRequests.length === 0 ? (
                            <Card>
                                <CardContent>
                                    <EmptyState
                                        title="Chưa có đơn nghỉ phép nào"
                                        description="Tạo đơn nghỉ phép mới"
                                        actionHref="/ess/leave"
                                        actionLabel="Đăng ký nghỉ phép"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {leaveRequests.map((request) => (
                                    <LeaveRequestCard key={request.id} request={request} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Overtime Requests */}
                    <TabsContent value="overtime" className="space-y-4">
                        {overtimeRequests.length === 0 ? (
                            <Card>
                                <CardContent>
                                    <EmptyState
                                        title="Chưa có yêu cầu OT nào"
                                        description="Liên hệ quản lý để đăng ký làm thêm giờ"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {overtimeRequests.map((request) => (
                                    <OvertimeRequestCard key={request.id} request={request} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Admin Requests */}
                    <TabsContent value="admin" className="space-y-4">
                        {adminRequests.length === 0 ? (
                            <Card>
                                <CardContent>
                                    <EmptyState
                                        title="Chưa có yêu cầu HC nào"
                                        description="Tạo yêu cầu hành chính mới"
                                        actionHref="/ess/requests"
                                        actionLabel="Tạo yêu cầu HC"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {adminRequests.map((request) => (
                                    <AdminRequestCard key={request.id} request={request} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

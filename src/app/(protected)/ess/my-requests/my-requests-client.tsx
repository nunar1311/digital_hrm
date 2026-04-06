"use client";

import { useState } from "react";
import Link from "next/link";
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    CalendarDays,
    Plus,
    Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LeaveRequestCard } from "./components/leave-request-card";
import { AdminRequestCard } from "./components/admin-request-card";

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

interface EmptyStateProps {
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
}

function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">{title}</p>
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

export function ESSMyRequestsClient({
    leaveRequests,
    adminRequests,
    overtimeRequests,
}: ESSMyRequestsClientProps) {
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
                    <Card className="hover:shadow-md transition-shadow">
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

                    <Card className={cn("hover:shadow-md transition-shadow", pendingRequests.length > 0 && "border-amber-200")}>
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
                    <TabsContent value="all" className="space-y-3">
                        {allRequests.length === 0 ? (
                            <Card><CardContent><EmptyState title="Chưa có yêu cầu nào" description="Bắt đầu bằng cách tạo yêu cầu mới" actionHref="/ess/leave" actionLabel="Đăng ký nghỉ phép" /></CardContent></Card>
                        ) : (
                            allRequests.map((request) => {
                                if ("leaveBalance" in request) return <LeaveRequestCard key={request.id} request={request as LeaveRequest} onCancel={() => {}} isCancelling={false} />;
                                if ("date" in request && "startTime" in request) return <Card key={request.id} className="p-4 text-muted-foreground"><Clock className="h-4 w-4 inline mr-2" />Yêu cầu OT: {(request as OvertimeRequest).hours} giờ</Card>;
                                return <AdminRequestCard key={request.id} request={request as AdminRequest} onCancel={() => {}} isCancelling={false} />;
                            })
                        )}
                    </TabsContent>

                    {/* Leave Requests */}
                    <TabsContent value="leave" className="space-y-3">
                        {leaveRequests.length === 0 ? (
                            <Card><CardContent><EmptyState title="Chưa có đơn nghỉ phép nào" description="Tạo đơn nghỉ phép mới" actionHref="/ess/leave" actionLabel="Đăng ký nghỉ phép" /></CardContent></Card>
                        ) : (
                            leaveRequests.map((request) => (
                                <LeaveRequestCard key={request.id} request={request} onCancel={() => {}} isCancelling={false} />
                            ))
                        )}
                    </TabsContent>

                    {/* Overtime Requests */}
                    <TabsContent value="overtime" className="space-y-3">
                        {overtimeRequests.length === 0 ? (
                            <Card><CardContent><EmptyState title="Chưa có yêu cầu OT nào" description="Liên hệ quản lý để đăng ký làm thêm giờ" /></CardContent></Card>
                        ) : (
                            overtimeRequests.map((request) => (
                                <Card key={request.id} className="p-4">
                                    <p className="text-sm font-medium">Yêu cầu OT: {request.hours} giờ</p>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Admin Requests */}
                    <TabsContent value="admin" className="space-y-3">
                        {adminRequests.length === 0 ? (
                            <Card><CardContent><EmptyState title="Chưa có yêu cầu HC nào" description="Tạo yêu cầu hành chính mới" actionHref="/ess/requests" actionLabel="Tạo yêu cầu HC" /></CardContent></Card>
                        ) : (
                            adminRequests.map((request) => (
                                <AdminRequestCard key={request.id} request={request} onCancel={() => {}} isCancelling={false} />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

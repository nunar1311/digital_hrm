"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText,
    Search,
    Filter,
    X,
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
    User,
    Building2,
    Calendar,
    Loader2,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    getAdminRequests,
    getAdminRequestStats,
    approveAdminRequest,
    rejectAdminRequest,
} from "./actions";
import type {
    AdminRequestListItem,
    AdminRequestDetail,
    AdminRequestStatus,
    AdminRequestType,
    AdminRequestStats,
} from "./types";
import {
    ADMIN_REQUEST_TYPE_LABELS,
    ADMIN_REQUEST_STATUS_LABELS,
    ADMIN_REQUEST_STATUS_COLORS,
    RESIGNATION_TYPES,
} from "./types";

interface AdminRequestsClientProps {
    initialRequests: AdminRequestListItem[];
    initialStats: AdminRequestStats;
    canManage: boolean;
}

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

function getInitials(name: string | null | undefined) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Request Detail Dialog
function RequestDetailDialog({
    request,
    open,
    onOpenChange,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
    canManage,
}: {
    request: AdminRequestListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: () => void;
    onReject: (reason: string) => void;
    isApproving: boolean;
    isRejecting: boolean;
    canManage: boolean;
}) {
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const isResignation = request && RESIGNATION_TYPES.includes(request.type as AdminRequestType);
    const isPending = request?.status === "PENDING";

    if (!request) return null;

    const statusConfig = ADMIN_REQUEST_STATUS_COLORS[request.status as AdminRequestStatus] || "";
    const statusLabel = ADMIN_REQUEST_STATUS_LABELS[request.status as AdminRequestStatus] || request.status;
    const typeLabel = ADMIN_REQUEST_TYPE_LABELS[request.type as AdminRequestType] || request.type;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Chi tiết yêu cầu
                    </DialogTitle>
                    <DialogDescription>
                        Mã yêu cầu: {request.id.slice(-8).toUpperCase()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status & Type */}
                    <div className="flex items-center justify-between">
                        <Badge className={statusConfig}>{statusLabel}</Badge>
                        <span className="text-sm text-muted-foreground">
                            {typeLabel}
                        </span>
                    </div>

                    {/* Employee Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={request.user.image || undefined} />
                            <AvatarFallback>{getInitials(request.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="font-semibold">{request.user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{request.user.username || request.user.email}</span>
                                {request.user.department && (
                                    <>
                                        <span>•</span>
                                        <Building2 className="h-3 w-3" />
                                        <span>{request.user.department.name}</span>
                                    </>
                                )}
                                {request.user.position && (
                                    <>
                                        <span>•</span>
                                        <span>{request.user.position.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Ngày gửi</div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatDate(request.createdAt)}</span>
                            </div>
                        </div>
                        {request.reviewedAt && (
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Ngày xử lý</div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{formatDateTime(request.reviewedAt)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Mô tả yêu cầu</div>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            {request.description || "Không có mô tả"}
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {request.status === "REJECTED" && request.rejectReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                            <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                                <XCircle className="h-4 w-4" />
                                Lý do từ chối
                            </div>
                            <div className="text-sm text-red-800">{request.rejectReason}</div>
                        </div>
                    )}

                    {/* Resignation Warning */}
                    {isResignation && isPending && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <div className="font-medium text-amber-800">
                                    Đơn xin nghỉ việc
                                </div>
                                <div className="text-amber-700 mt-1">
                                    Khi duyệt đơn này, hệ thống sẽ tự động tạo quy trình Offboarding cho nhân viên
                                    (bao gồm checklist bàn giao, thu hồi tài sản, khóa tài khoản, exit interview).
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reject Form */}
                    {showRejectForm && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Lý do từ chối *</div>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối yêu cầu..."
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {isPending && canManage && (
                        <>
                            {!showRejectForm ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRejectForm(true)}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Từ chối
                                    </Button>
                                    <Button
                                        onClick={onApprove}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Duyệt
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectForm(false);
                                            setRejectReason("");
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => onReject(rejectReason)}
                                        disabled={!rejectReason.trim() || isRejecting}
                                    >
                                        {isRejecting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <XCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Xác nhận từ chối
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Main Component
export function AdminRequestsClient({
    initialRequests,
    initialStats,
    canManage,
}: AdminRequestsClientProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<AdminRequestListItem | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Queries
    const { data: requests = initialRequests, isLoading: isLoadingList } = useQuery({
        queryKey: ["admin-requests", search, statusFilter, typeFilter],
        queryFn: () =>
            getAdminRequests({
                search: search || undefined,
                status: statusFilter !== "all" ? (statusFilter as AdminRequestStatus) : undefined,
                type: typeFilter !== "all" ? (typeFilter as AdminRequestType) : undefined,
            }),
        initialData: initialRequests,
    });

    const { data: stats = initialStats } = useQuery({
        queryKey: ["admin-request-stats"],
        queryFn: getAdminRequestStats,
        initialData: initialStats,
    });

    // Mutations
    const approveMutation = useMutation({
        mutationFn: (id: string) => approveAdminRequest(id),
        onSuccess: (data) => {
            toast.success(data.message || "Đã duyệt yêu cầu");
            queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-request-stats"] });
            setDetailOpen(false);
            setSelectedRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi duyệt yêu cầu");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            rejectAdminRequest(id, { reason }),
        onSuccess: (data) => {
            toast.success(data.message || "Đã từ chối yêu cầu");
            queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-request-stats"] });
            setDetailOpen(false);
            setSelectedRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Lỗi khi từ chối yêu cầu");
        },
    });

    // Filter by search
    const filteredRequests = search
        ? requests.filter(
              (r) =>
                  r.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                  r.user.email.toLowerCase().includes(search.toLowerCase()) ||
                  r.user.username?.toLowerCase().includes(search.toLowerCase()) ||
                  r.description.toLowerCase().includes(search.toLowerCase())
          )
        : requests;

    // Group by status for tabs
    const pendingRequests = filteredRequests.filter((r) => r.status === "PENDING");
    const approvedRequests = filteredRequests.filter((r) => r.status === "APPROVED");
    const rejectedRequests = filteredRequests.filter((r) => r.status === "REJECTED");

    const handleViewDetail = (request: AdminRequestListItem) => {
        setSelectedRequest(request);
        setDetailOpen(true);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileCheck className="h-6 w-6 text-teal-600" />
                        Yêu cầu hành chính
                    </h1>
                    <p className="text-muted-foreground">
                        Xem và duyệt các yêu cầu từ nhân viên
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
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
                                <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
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
                                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                                <p className="text-xs text-muted-foreground">Từ chối</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, mã NV, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-10"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Lọc trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="PENDING">Đang chờ</SelectItem>
                            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                            <SelectItem value="REJECTED">Từ chối</SelectItem>
                            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Lọc loại yêu cầu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả loại</SelectItem>
                            {Object.entries(ADMIN_REQUEST_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">
                        Tất cả ({filteredRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Đang chờ ({pendingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Đã duyệt ({approvedRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Từ chối ({rejectedRequests.length})
                    </TabsTrigger>
                </TabsList>

                {["all", "pending", "approved", "rejected"].map((tab) => {
                    const data =
                        tab === "all"
                            ? filteredRequests
                            : tab === "pending"
                            ? pendingRequests
                            : tab === "approved"
                            ? approvedRequests
                            : rejectedRequests;

                    return (
                        <TabsContent key={tab} value={tab} className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {data.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">
                                                Chưa có yêu cầu nào
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.map((request) => {
                                                const statusConfig =
                                                    ADMIN_REQUEST_STATUS_COLORS[
                                                        request.status as AdminRequestStatus
                                                    ] || "";
                                                const statusLabel =
                                                    ADMIN_REQUEST_STATUS_LABELS[
                                                        request.status as AdminRequestStatus
                                                    ] || request.status;
                                                const typeLabel =
                                                    ADMIN_REQUEST_TYPE_LABELS[
                                                        request.type as AdminRequestType
                                                    ] || request.type;
                                                const isResignation = RESIGNATION_TYPES.includes(
                                                    request.type as AdminRequestType
                                                );

                                                return (
                                                    <div
                                                        key={request.id}
                                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage
                                                                    src={
                                                                        request.user.image ||
                                                                        undefined
                                                                    }
                                                                />
                                                                <AvatarFallback>
                                                                    {getInitials(request.user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {request.user.name}
                                                                    </span>
                                                                    {isResignation && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs bg-red-50 text-red-700 border-red-200"
                                                                        >
                                                                            Nghỉ việc
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    <span>
                                                                        {request.user.username ||
                                                                            request.user.email}
                                                                    </span>
                                                                    {request.user.department && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>
                                                                                {
                                                                                    request.user
                                                                                        .department
                                                                                        .name
                                                                                }
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {typeLabel} •{" "}
                                                                    {formatDate(request.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Badge className={statusConfig}>
                                                                {statusLabel}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleViewDetail(request)
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>

            {/* Detail Dialog */}
            <RequestDetailDialog
                request={selectedRequest}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onApprove={() =>
                    selectedRequest && approveMutation.mutate(selectedRequest.id)
                }
                onReject={(reason) =>
                    selectedRequest &&
                    rejectMutation.mutate({ id: selectedRequest.id, reason })
                }
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
                canManage={canManage}
            />
        </div>
    );
}

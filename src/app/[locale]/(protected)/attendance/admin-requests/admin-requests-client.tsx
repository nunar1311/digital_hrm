"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText,
    Search,
    X,
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
    Building2,
    Calendar,
    Loader2,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    getAdminRequests,
    getAdminRequestStats,
    approveAdminRequest,
    rejectAdminRequest,
} from "./actions";
import type {
    AdminRequestListItem,
    AdminRequestStatus,
    AdminRequestType,
    AdminRequestStats,
} from "./types";
import { ADMIN_REQUEST_STATUS_COLORS, RESIGNATION_TYPES } from "./types";

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
    const t = useTranslations("ProtectedPages");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const isResignation = request && RESIGNATION_TYPES.includes(request.type as AdminRequestType);
    const isPending = request?.status === "PENDING";

    const getStatusLabel = (status: AdminRequestStatus): string => {
        switch (status) {
            case "PENDING":
                return t("attendanceAdminRequestsFilterStatusPending");
            case "APPROVED":
                return t("attendanceAdminRequestsFilterStatusApproved");
            case "REJECTED":
                return t("attendanceAdminRequestsFilterStatusRejected");
            case "CANCELLED":
                return t("attendanceAdminRequestsFilterStatusCancelled");
            default:
                return status;
        }
    };

    const getTypeLabel = (type: AdminRequestType): string => {
        switch (type) {
            case "SALARY_CONFIRMATION":
                return t("attendanceAdminRequestsTypeSalaryConfirmation");
            case "WORK_CERTIFICATE":
                return t("attendanceAdminRequestsTypeWorkCertificate");
            case "TAX_CONFIRMATION":
                return t("attendanceAdminRequestsTypeTaxConfirmation");
            case "SOCIAL_INSURANCE":
                return t("attendanceAdminRequestsTypeSocialInsurance");
            case "RESIGNATION_LETTER":
                return t("attendanceAdminRequestsTypeResignationLetter");
            case "RECOMMENDATION_LETTER":
                return t("attendanceAdminRequestsTypeRecommendationLetter");
            case "OTHER":
                return t("attendanceAdminRequestsTypeOther");
            default:
                return type;
        }
    };

    if (!request) return null;

    const statusConfig = ADMIN_REQUEST_STATUS_COLORS[request.status as AdminRequestStatus] || "";
    const statusLabel = getStatusLabel(request.status as AdminRequestStatus);
    const typeLabel = getTypeLabel(request.type as AdminRequestType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t("attendanceAdminRequestsDetailTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceAdminRequestsDetailCode", {
                            code: request.id.slice(-8).toUpperCase(),
                        })}
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
                                <span>{request.user.employeeCode || request.user.email}</span>
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
                            <div className="text-sm text-muted-foreground">
                                {t("attendanceAdminRequestsDetailSubmittedDate")}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatDate(request.createdAt)}</span>
                            </div>
                        </div>
                        {request.reviewedAt && (
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">
                                    {t("attendanceAdminRequestsDetailProcessedDate")}
                                </div>
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
                        <div className="text-sm font-medium">
                            {t("attendanceAdminRequestsDetailDescriptionLabel")}
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            {request.description || t("attendanceAdminRequestsDetailNoDescription")}
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {request.status === "REJECTED" && request.rejectReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                            <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                                <XCircle className="h-4 w-4" />
                                {t("attendanceAdminRequestsDetailRejectReason")}
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
                                    {t("attendanceAdminRequestsDetailResignationTitle")}
                                </div>
                                <div className="text-amber-700 mt-1">
                                    {t("attendanceAdminRequestsDetailResignationDescription")}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reject Form */}
                    {showRejectForm && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                {t("attendanceAdminRequestsDetailRejectReasonRequired")}
                            </div>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t("attendanceAdminRequestsDetailRejectReasonPlaceholder")}
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
                                        {t("attendanceAdminRequestsActionReject")}
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
                                        {t("attendanceAdminRequestsActionApprove")}
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
                                        {t("attendanceAdminRequestsActionCancel")}
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
                                        {t("attendanceAdminRequestsActionConfirmReject")}
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
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<AdminRequestListItem | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const getStatusLabel = (status: AdminRequestStatus): string => {
        switch (status) {
            case "PENDING":
                return t("attendanceAdminRequestsFilterStatusPending");
            case "APPROVED":
                return t("attendanceAdminRequestsFilterStatusApproved");
            case "REJECTED":
                return t("attendanceAdminRequestsFilterStatusRejected");
            case "CANCELLED":
                return t("attendanceAdminRequestsFilterStatusCancelled");
            default:
                return status;
        }
    };

    const getTypeLabel = (type: AdminRequestType): string => {
        switch (type) {
            case "SALARY_CONFIRMATION":
                return t("attendanceAdminRequestsTypeSalaryConfirmation");
            case "WORK_CERTIFICATE":
                return t("attendanceAdminRequestsTypeWorkCertificate");
            case "TAX_CONFIRMATION":
                return t("attendanceAdminRequestsTypeTaxConfirmation");
            case "SOCIAL_INSURANCE":
                return t("attendanceAdminRequestsTypeSocialInsurance");
            case "RESIGNATION_LETTER":
                return t("attendanceAdminRequestsTypeResignationLetter");
            case "RECOMMENDATION_LETTER":
                return t("attendanceAdminRequestsTypeRecommendationLetter");
            case "OTHER":
                return t("attendanceAdminRequestsTypeOther");
            default:
                return type;
        }
    };

    const getTabLabel = (tab: "all" | "pending" | "approved" | "rejected"): string => {
        switch (tab) {
            case "all":
                return t("attendanceAdminRequestsTabAll");
            case "pending":
                return t("attendanceAdminRequestsTabPending");
            case "approved":
                return t("attendanceAdminRequestsTabApproved");
            case "rejected":
                return t("attendanceAdminRequestsTabRejected");
            default:
                return tab;
        }
    };

    // Queries
    const { data: requests = initialRequests } = useQuery({
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
            toast.success(data.message || t("attendanceAdminRequestsToastApproveSuccess"));
            queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-request-stats"] });
            setDetailOpen(false);
            setSelectedRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || t("attendanceAdminRequestsToastApproveError"));
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            rejectAdminRequest(id, { reason }),
        onSuccess: (data) => {
            toast.success(data.message || t("attendanceAdminRequestsToastRejectSuccess"));
            queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-request-stats"] });
            setDetailOpen(false);
            setSelectedRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || t("attendanceAdminRequestsToastRejectError"));
        },
    });

    // Filter by search
    const filteredRequests = search
        ? requests.filter(
              (r) =>
                  r.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                  r.user.email.toLowerCase().includes(search.toLowerCase()) ||
                  r.user.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
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
                        {t("attendanceAdminRequestsTitle")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("attendanceAdminRequestsDescription")}
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
                                <p className="text-xs text-muted-foreground">{t("attendanceAdminRequestsStatsTotal")}</p>
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
                                <p className="text-xs text-muted-foreground">{t("attendanceAdminRequestsStatsPending")}</p>
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
                                <p className="text-xs text-muted-foreground">{t("attendanceAdminRequestsStatsApproved")}</p>
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
                                <p className="text-xs text-muted-foreground">{t("attendanceAdminRequestsStatsRejected")}</p>
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
                        placeholder={t("attendanceAdminRequestsSearchPlaceholder")}
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
                            <SelectValue placeholder={t("attendanceAdminRequestsFilterStatusPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("attendanceAdminRequestsFilterStatusAll")}</SelectItem>
                            <SelectItem value="PENDING">{t("attendanceAdminRequestsFilterStatusPending")}</SelectItem>
                            <SelectItem value="APPROVED">{t("attendanceAdminRequestsFilterStatusApproved")}</SelectItem>
                            <SelectItem value="REJECTED">{t("attendanceAdminRequestsFilterStatusRejected")}</SelectItem>
                            <SelectItem value="CANCELLED">{t("attendanceAdminRequestsFilterStatusCancelled")}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={t("attendanceAdminRequestsFilterTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("attendanceAdminRequestsFilterTypeAll")}</SelectItem>
                            {[
                                "SALARY_CONFIRMATION",
                                "WORK_CERTIFICATE",
                                "TAX_CONFIRMATION",
                                "SOCIAL_INSURANCE",
                                "RESIGNATION_LETTER",
                                "RECOMMENDATION_LETTER",
                                "OTHER",
                            ].map((value) => (
                                <SelectItem key={value} value={value}>
                                    {getTypeLabel(value as AdminRequestType)}
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
                        {t("attendanceAdminRequestsTabWithCount", {
                            label: getTabLabel("all"),
                            count: filteredRequests.length,
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        {t("attendanceAdminRequestsTabWithCount", {
                            label: getTabLabel("pending"),
                            count: pendingRequests.length,
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        {t("attendanceAdminRequestsTabWithCount", {
                            label: getTabLabel("approved"),
                            count: approvedRequests.length,
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        {t("attendanceAdminRequestsTabWithCount", {
                            label: getTabLabel("rejected"),
                            count: rejectedRequests.length,
                        })}
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
                                                {t("attendanceAdminRequestsEmpty")}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.map((request) => {
                                                const statusConfig =
                                                    ADMIN_REQUEST_STATUS_COLORS[
                                                        request.status as AdminRequestStatus
                                                    ] || "";
                                                const statusLabel = getStatusLabel(
                                                    request.status as AdminRequestStatus
                                                );
                                                const typeLabel = getTypeLabel(
                                                    request.type as AdminRequestType
                                                );
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
                                                                            {t("attendanceAdminRequestsResignationBadge")}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    <span>
                                                                        {request.user.employeeCode ||
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
                                                                <span className="sr-only">
                                                                    {t("attendanceAdminRequestsActionViewDetail")}
                                                                </span>
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

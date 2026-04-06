"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    FileText,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Filter,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitAdministrativeRequest, cancelAdministrativeRequest } from "../actions";

interface AdministrativeRequest {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
    responseAttachment: string | null;
    reviewedByUser?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
}

interface ESSRequestsClientProps {
    initialRequests: AdministrativeRequest[];
}

const requestTypes = [
    { value: "SALARY_CONFIRMATION", label: "Xác nhận lương" },
    { value: "WORK_CERTIFICATE", label: "Giấy xác nhận lao động" },
    { value: "TAX_CONFIRMATION", label: "Xác nhận thuế" },
    { value: "SOCIAL_INSURANCE", label: "Sổ BHXH/Sổ bảo hiểm" },
    { value: "RESIGNATION_LETTER", label: "Đơn xin nghỉ việc" },
    { value: "RECOMMENDATION_LETTER", label: "Thư giới thiệu" },
    { value: "OTHER", label: "Khác" },
];

const statusConfig: Record<string, { 
    label: string; 
    variant: "default" | "secondary" | "destructive" | "outline"; 
    className?: string;
    icon: any;
    bgClass: string;
}> = {
    PENDING: { 
        label: "Đang chờ", 
        variant: "secondary", 
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100", 
        icon: Clock,
        bgClass: "bg-amber-50",
    },
    APPROVED: { 
        label: "Đã duyệt", 
        variant: "default", 
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100", 
        icon: CheckCircle2,
        bgClass: "bg-emerald-50",
    },
    REJECTED: { 
        label: "Từ chối", 
        variant: "destructive", 
        icon: XCircle,
        bgClass: "bg-red-50",
    },
    CANCELLED: { 
        label: "Đã hủy", 
        variant: "outline", 
        className: "text-muted-foreground", 
        icon: XCircle,
        bgClass: "bg-muted/50",
    },
};

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getTypeLabel(type: string) {
    return requestTypes.find(t => t.value === type)?.label || type;
}

function RequestCard({ request, onCancel, isCancelling }: { 
    request: AdministrativeRequest; 
    onCancel: () => void;
    isCancelling: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const status = statusConfig[request.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;
    const isPending = request.status === "PENDING";

    return (
        <>
            <div className={cn(
                "rounded-lg border transition-all p-4",
                status.bgClass,
                isExpanded && "ring-2 ring-primary/20"
            )}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg bg-background",
                            status.bgClass.replace("-50", "-100")
                        )}>
                            <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{getTypeLabel(request.type)}</span>
                                <Badge variant={status.variant} className={status.className}>
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {formatDateTime(request.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isPending && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCancelDialog(true)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                Hủy
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                            <h4 className="text-sm font-medium mb-1">Mô tả yêu cầu</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                {request.description || "Không có mô tả"}
                            </p>
                        </div>
                        
                        {request.status === "REJECTED" && request.rejectReason && (
                            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-700 mb-1">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Lý do từ chối</span>
                                </div>
                                <p className="text-sm text-red-800">
                                    {request.rejectReason}
                                </p>
                            </div>
                        )}

                        {request.reviewedAt && request.reviewedByUser && (
                            <div className="text-xs text-muted-foreground">
                                <span>Đã xử lý bởi: {request.reviewedByUser.name || request.reviewedByUser.email}</span>
                                <span className="mx-1">•</span>
                                <span>lúc {formatDateTime(request.reviewedAt)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cancel Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy yêu cầu</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn hủy yêu cầu này không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onCancel();
                                setShowCancelDialog(false);
                            }}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang hủy...
                                </>
                            ) : (
                                "Hủy yêu cầu"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function ESSRequestsClient({ initialRequests }: ESSRequestsClientProps) {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: async (requestId: string) => {
            return cancelAdministrativeRequest(requestId);
        },
        onSuccess: () => {
            toast.success("Đã hủy yêu cầu");
            queryClient.invalidateQueries({ queryKey: ["my-admin-requests"] });
        },
        onError: () => {
            toast.error("Không thể hủy yêu cầu");
        },
    });

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: async () => {
            const result = await submitAdministrativeRequest({
                type: selectedType,
                description,
            });
            return result;
        },
        onSuccess: () => {
            toast.success("Đã gửi yêu cầu thành công!");
            setIsDialogOpen(false);
            setSelectedType("");
            setDescription("");
            queryClient.invalidateQueries({ queryKey: ["my-admin-requests"] });
        },
        onError: () => {
            toast.error("Không thể gửi yêu cầu");
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const handleSubmit = () => {
        if (!selectedType) {
            toast.error("Vui lòng chọn loại yêu cầu");
            return;
        }
        setIsSubmitting(true);
        submitMutation.mutate();
    };

    // Filter requests
    const filteredRequests = statusFilter === "ALL" 
        ? initialRequests 
        : initialRequests.filter(r => r.status === statusFilter);

    // Stats
    const stats = {
        total: initialRequests.length,
        pending: initialRequests.filter(r => r.status === "PENDING").length,
        approved: initialRequests.filter(r => r.status === "APPROVED").length,
        rejected: initialRequests.filter(r => r.status === "REJECTED").length,
    };

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-teal-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <FileText className="h-6 w-6 text-teal-600" />
                                Yêu cầu hành chính
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Gửi yêu cầu xác nhận lương, giấy tờ, xác nhận công tác
                            </p>
                        </div>
                        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo yêu cầu mới
                        </Button>
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
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.pending}</div>
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
                                    <div className="text-2xl font-bold">{stats.approved}</div>
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
                                    <div className="text-2xl font-bold">{stats.rejected}</div>
                                    <p className="text-xs text-muted-foreground">Từ chối</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Lọc theo trạng thái:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                            <SelectItem value="PENDING">Đang chờ</SelectItem>
                            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                            <SelectItem value="REJECTED">Từ chối</SelectItem>
                            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Requests List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách yêu cầu</CardTitle>
                        <CardDescription>
                            {filteredRequests.length} yêu cầu
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    Chưa có yêu cầu nào
                                </p>
                                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo yêu cầu đầu tiên
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredRequests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        onCancel={() => cancelMutation.mutate(request.id)}
                                        isCancelling={cancelMutation.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Request Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo yêu cầu hành chính</DialogTitle>
                        <DialogDescription>
                            Chọn loại yêu cầu và nhập mô tả chi tiết để gửi đến bộ phận HCNS.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Loại yêu cầu *</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại yêu cầu" />
                                </SelectTrigger>
                                <SelectContent>
                                    {requestTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả chi tiết</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập mô tả chi tiết yêu cầu của bạn..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={!selectedType || isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Gửi yêu cầu
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

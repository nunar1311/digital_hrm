"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AdminRequest {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
    reviewedByUser?: { id: string; name: string | null; email: string } | null;
}

const STATUS_CONFIG: Record<string, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: any;
}> = {
    PENDING: { label: "Đang chờ", variant: "secondary", className: "bg-amber-100 text-amber-800 hover:bg-amber-100", icon: ChevronDown },
    APPROVED: { label: "Đã duyệt", variant: "default", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100", icon: CheckCircle2 },
    REJECTED: { label: "Từ chối", variant: "destructive", icon: XCircle },
    CANCELLED: { label: "Đã hủy", variant: "outline", className: "text-muted-foreground", icon: XCircle },
};

const REQUEST_TYPES: Record<string, { label: string }> = {
    SALARY_CONFIRMATION: { label: "Xác nhận lương" },
    WORK_CERTIFICATE: { label: "Giấy xác nhận lao động" },
    TAX_CONFIRMATION: { label: "Xác nhận thuế" },
    SOCIAL_INSURANCE: { label: "Sổ BHXH" },
    RESIGNATION_LETTER: { label: "Đơn xin nghỉ việc" },
    RECOMMENDATION_LETTER: { label: "Thư giới thiệu" },
    OTHER: { label: "Khác" },
};

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export function AdminRequestCard({
    request,
    onCancel,
    isCancelling
}: {
    request: AdminRequest;
    onCancel: () => void;
    isCancelling: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
    const typeConfig = REQUEST_TYPES[request.type] || REQUEST_TYPES.OTHER;

    return (
        <>
            <div className={cn("rounded-lg border transition-all",
                status.className?.includes("bg-amber") ? "bg-amber-50/50 border-amber-200" :
                status.className?.includes("bg-emerald") ? "bg-emerald-50/50 border-emerald-200" :
                request.status === "REJECTED" ? "bg-red-50/50 border-red-200" : "")}>
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-lg",
                            status.className?.includes("bg-amber") ? "bg-amber-100 text-amber-600" :
                            status.className?.includes("bg-emerald") ? "bg-emerald-100 text-emerald-600" :
                            request.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-600")}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{typeConfig.label}</span>
                                <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{formatDateTime(request.createdAt)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {request.status === "PENDING" && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setShowCancelDialog(true); }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                Hủy
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t space-y-3">
                        {request.description && (
                            <div>
                                <h4 className="text-sm font-medium mb-1">Mô tả</h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{request.description}</p>
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

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc muốn hủy yêu cầu này không?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Đóng</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { onCancel(); setShowCancelDialog(false); }} className="bg-destructive hover:bg-destructive/90">
                            Hủy yêu cầu
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

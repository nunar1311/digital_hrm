"use client";

import { useState } from "react";
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    X,
    Calendar,
    FileText,
    Loader2,
    LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { LeaveRequestItem } from "../types";

interface LeaveRequestListProps {
    requests: LeaveRequestItem[];
    onCancel: (id: string) => void;
    isCancelling: boolean;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatDateRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
        return formatDate(start);
    }
    
    return `${formatDate(start)} → ${formatDate(end)}`;
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

const statusConfig: Record<string, { 
    label: string; 
    variant: "default" | "secondary" | "destructive" | "outline"; 
    className?: string; 
    icon: LucideIcon;
    bgClass: string;
    textClass: string;
}> = {
    PENDING: { 
        label: "Đang chờ duyệt", 
        variant: "secondary", 
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100", 
        icon: Clock,
        bgClass: "bg-amber-50",
        textClass: "text-amber-600",
    },
    APPROVED: { 
        label: "Đã duyệt", 
        variant: "default", 
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100", 
        icon: CheckCircle2,
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-600",
    },
    REJECTED: { 
        label: "Từ chối", 
        variant: "destructive", 
        className: "bg-red-100 text-red-800 hover:bg-red-100", 
        icon: XCircle,
        bgClass: "bg-red-50",
        textClass: "text-red-600",
    },
    CANCELLED: { 
        label: "Đã hủy", 
        variant: "outline", 
        className: "text-muted-foreground", 
        icon: XCircle,
        bgClass: "bg-muted/50",
        textClass: "text-muted-foreground",
    },
};

function LeaveRequestCard({ 
    request, 
    onCancel, 
    isCancelling 
}: { 
    request: LeaveRequestItem; 
    onCancel: (id: string) => void;
    isCancelling: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const status = statusConfig[request.status];
    const StatusIcon = status.icon;
    const isPending = request.status === "PENDING";

    return (
        <>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className={cn(
                    "rounded-lg border transition-all",
                    status.bgClass,
                    isExpanded && "ring-2 ring-primary/20"
                )}>
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn("p-2 rounded-lg bg-background", status.textClass)}>
                                        <StatusIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{request.leaveType?.name ?? "N/A"}</span>
                                            <Badge variant={status.variant} className={status.className}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formatDateRange(request.startDate, request.endDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                <div className="text-right mr-2">
                                    <div className="text-lg font-bold">{request.totalDays}</div>
                                    <div className="text-xs text-muted-foreground">ngày</div>
                                </div>
                                
                                {isPending && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCancelDialog(true)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                                
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        </div>

                        {/* Quick info row */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Đăng ký: {formatDateTime(request.createdAt)}</span>
                            </div>
                            {request.approvedAt && (
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    <span>Duyệt: {formatDateTime(request.approvedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expanded content */}
                    <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0 border-t bg-background/50">
                            <div className="grid gap-4 mt-4">
                                {/* Details */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Chi tiết yêu cầu
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Loại nghỉ phép</p>
                                            <p className="font-medium">{request.leaveType?.name ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Số ngày</p>
                                            <p className="font-medium">{request.totalDays} ngày</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Ngày bắt đầu</p>
                                            <p className="font-medium">{formatDate(request.startDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Ngày kết thúc</p>
                                            <p className="font-medium">{formatDate(request.endDate)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                {request.reason && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Lý do</h4>
                                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                            {request.reason}
                                        </p>
                                    </div>
                                )}

                                {/* Rejection reason */}
                                {request.status === "REJECTED" && request.rejectionReason && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-red-700 mb-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Lý do từ chối</span>
                                        </div>
                                        <p className="text-sm text-red-800">
                                            {request.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Approval info */}
                                {request.approvedByUser && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Người duyệt</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                                {request.approvedByUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{request.approvedByUser.name}</p>
                                                {request.approvedAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Duyệt lúc {formatDateTime(request.approvedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này không? 
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Đóng</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onCancel(request.id);
                                setShowCancelDialog(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang hủy...
                                </>
                            ) : (
                                "Hủy yêu cầu"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function LeaveRequestList({ requests, onCancel, isCancelling }: LeaveRequestListProps) {
    if (requests.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Không có yêu cầu nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <LeaveRequestCard
                    key={request.id}
                    request={request}
                    onCancel={() => onCancel(request.id)}
                    isCancelling={isCancelling}
                />
            ))}
        </div>
    );
}

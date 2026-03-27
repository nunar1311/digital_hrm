"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    CheckCircle,
    XCircle,
    Ban,
    AlertCircle,
    Zap,
    Loader2,
    Eye,
    ChevronDown,
    ChevronRight,
    Clock,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AttendanceAdjustmentRequest } from "../types";
import { ADJUSTMENT_STATUS_CONFIG } from "./approval-constants";
import { useTimezone } from "@/hooks/use-timezone";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string, timezone: string): string {
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("vi-VN", {
            timeZone: timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date);
    } catch {
        return dateStr;
    }
}

function formatTime(timeStr: string | undefined): string {
    if (!timeStr) return "—";
    return timeStr;
}

interface AdjustmentTableProps {
    requests: AttendanceAdjustmentRequest[];
    currentUserId: string;
    isPending: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    onCancel?: (id: string) => void;
    onViewDetail?: (request: AttendanceAdjustmentRequest) => void;
    actionMode: "own" | "approve" | "all";
}

interface ApprovalChainStep {
    stepOrder: number;
    approverName: string;
    approverAvatar: string | null;
    approverId: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    actionAt: string | null;
    comment: string | null;
}

function StatusBadge({ status }: { status: string }) {
    const config =
        ADJUSTMENT_STATUS_CONFIG[status] ||
        ADJUSTMENT_STATUS_CONFIG.PENDING;
    const icons: Record<string, React.ElementType> = {
        AlertCircle,
        CheckCircle,
        XCircle,
        Zap,
        Ban,
    };
    const Icon = icons[config.icon] || AlertCircle;

    return (
        <Badge
            variant={
                config.variant as
                    | "default"
                    | "secondary"
                    | "destructive"
                    | "outline"
            }
        >
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
        </Badge>
    );
}

function getInitialsFromName(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/** Build approval chain from a request's approval chain JSON */
function buildApprovalChain(
    request: AttendanceAdjustmentRequest
): ApprovalChainStep[] {
    if (!request.approvalChain) return [];
    try {
        const chain = Array.isArray(request.approvalChain)
            ? request.approvalChain
            : JSON.parse(request.approvalChain as string);
        return chain as ApprovalChainStep[];
    } catch {
        return [];
    }
}

/** Step icon + color by status */
function StepStatusIcon({
    status,
}: {
    status: "PENDING" | "APPROVED" | "REJECTED";
}) {
    if (status === "APPROVED") {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === "REJECTED") {
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
}

/** Approval chain cell with expandable detail */
function ApprovalChainCell({
    request,
    timezone,
}: {
    request: AttendanceAdjustmentRequest;
    timezone: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const chain = buildApprovalChain(request);

    if (chain.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const completedSteps = chain.filter((s) => s.status !== "PENDING").length;
    const totalSteps = chain.length;

    return (
        <div className="space-y-1">
            {/* Summary pill */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs hover:underline focus:outline-none"
            >
                {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <span
                    className={
                        completedSteps === totalSteps
                            ? "text-green-600 font-medium"
                            : "text-yellow-600 font-medium"
                    }
                >
                    {completedSteps}/{totalSteps}
                </span>
                <span className="text-muted-foreground">bước</span>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="ml-4 border-l-2 border-muted pl-3 space-y-2">
                    {chain.map((step, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <StepStatusIcon status={step.status} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium truncate">
                                        {step.approverName}
                                    </span>
                                </div>
                                {step.actionAt && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {new Intl.DateTimeFormat("vi-VN", {
                                            timeZone: timezone,
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }).format(new Date(step.actionAt))}
                                    </p>
                                )}
                                {step.comment && (
                                    <p className="text-[10px] text-muted-foreground italic mt-0.5">
                                        "{step.comment}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function AdjustmentTable({
    requests,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onCancel,
    onViewDetail,
    actionMode,
}: AdjustmentTableProps) {
    const { timezone } = useTimezone();
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Infinite scroll with proper cleanup
    useEffect(() => {
        if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry?.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isPending) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Không có yêu cầu nào
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nhân viên</TableHead>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Giờ điều chỉnh</TableHead>
                            <TableHead>Lý do</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Luồng duyệt</TableHead>
                            <TableHead className="w-[120px]">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage
                                                src={
                                                    request.userAvatar || ""
                                                }
                                            />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(request.userName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {request.userName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {request.departmentName}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {formatDate(request.date, timezone)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Vào:{" "}
                                            </span>
                                            {formatTime(request.checkInTime)}
                                        </p>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Ra:{" "}
                                            </span>
                                            {formatTime(
                                                request.checkOutTime,
                                            )}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                    <p
                                        className="text-sm truncate"
                                        title={request.reason}
                                    >
                                        {request.reason}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={request.status} />
                                </TableCell>
                                <TableCell>
                                    <ApprovalChainCell
                                        request={request}
                                        timezone={timezone}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {onViewDetail && (
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() =>
                                                    onViewDetail(request)
                                                }
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {actionMode === "own" &&
                                            request.status === "PENDING" &&
                                            onCancel && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() =>
                                                        onCancel(request.id)
                                                    }
                                                    title="Hủy yêu cầu"
                                                >
                                                    <Ban className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}

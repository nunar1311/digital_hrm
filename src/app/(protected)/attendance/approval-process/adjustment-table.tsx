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

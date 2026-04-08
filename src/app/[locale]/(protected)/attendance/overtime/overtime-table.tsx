"use client";

import { useRef, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    CheckCircle,
    XCircle,
    Ban,
    ShieldCheck,
    Timer,
    Loader2,
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
import type { OvertimeRequest } from "../types";
import { STATUS_MAP, DAY_TYPE_LABELS } from "./overtime-constants";
import { useTimezone } from "@/hooks/use-timezone";

export type OvertimeActionMode =
    | "own"
    | "manager-approve"
    | "hr-review"
    | "confirm"
    | false;

interface OvertimeTableProps {
    requests: OvertimeRequest[];
    showUser: boolean;
    actionMode: OvertimeActionMode;
    currentUserId: string;
    isPending: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    onCancel?: (id: string) => void;
    onConfirmHours?: (request: OvertimeRequest) => void;
    onManagerApprove?: (id: string) => void;
    onManagerReject?: (id: string) => void;
    onHrApprove?: (id: string) => void;
    onHrReject?: (id: string) => void;
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
    const Icon = s.icon;
    return (
        <Badge variant={s.variant}>
            <Icon className="h-3 w-3" /> {s.label}
        </Badge>
    );
}

export function OvertimeTable({
    requests,
    showUser,
    actionMode,
    currentUserId,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onCancel,
    onConfirmHours,
    onManagerApprove,
    onManagerReject,
    onHrApprove,
    onHrReject,
}: OvertimeTableProps) {
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();
    const { timezone } = useTimezone();

    // ─── Infinite Scroll ───
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleIntersect = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (
                entries[0]?.isIntersecting &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage],
    );

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: "200px",
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleIntersect]);

    const colCount =
        (showUser ? 1 : 0) +
        8 +
        (actionMode === "confirm" ? 2 : 0) +
        (actionMode ? 1 : 0);

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        {showUser && (
                            <TableHead>{t("attendanceOvertimeTableHeaderEmployee")}</TableHead>
                        )}
                        <TableHead>{t("attendanceOvertimeTableHeaderDate")}</TableHead>
                        <TableHead>{t("attendanceOvertimeTableHeaderStartTime")}</TableHead>
                        <TableHead>{t("attendanceOvertimeTableHeaderEndTime")}</TableHead>
                        <TableHead className="text-center">
                            {t("attendanceOvertimeTableHeaderHours")}
                        </TableHead>
                        <TableHead>{t("attendanceOvertimeTableHeaderDayType")}</TableHead>
                        <TableHead className="text-center">
                            {t("attendanceOvertimeTableHeaderCoefficient")}
                        </TableHead>
                        <TableHead>{t("attendanceOvertimeTableHeaderStatus")}</TableHead>
                        <TableHead>{t("attendanceOvertimeTableHeaderReason")}</TableHead>
                        {actionMode === "confirm" && (
                            <>
                                <TableHead>
                                    {t("attendanceOvertimeTableHeaderActualStart")}
                                </TableHead>
                                <TableHead>
                                    {t("attendanceOvertimeTableHeaderActualEnd")}
                                </TableHead>
                            </>
                        )}
                        {actionMode && (
                            <TableHead className="text-right">
                                {t("attendanceOvertimeTableHeaderActions")}
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((r) => (
                        <TableRow key={r.id}>
                            {showUser && (
                                <TableCell className="font-medium">
                                    {r.user?.name || "—"}
                                </TableCell>
                            )}
                            <TableCell>
                                {new Date(r.date).toLocaleDateString(
                                    locale,
                                    { timeZone: timezone }
                                )}
                            </TableCell>
                            <TableCell>{r.startTime}</TableCell>
                            <TableCell>{r.endTime}</TableCell>
                            <TableCell className="text-center font-bold">
                                {r.actualHours != null
                                    ? `${r.actualHours}${t("attendanceOvertimeActualHoursSuffix")}`
                                    : `${r.hours}h`}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {DAY_TYPE_LABELS[r.dayType] ||
                                        r.dayType}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-blue-600">
                                x{r.coefficient}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className="max-w-50 truncate">
                                {r.reason}
                            </TableCell>
                            {actionMode === "confirm" && (
                                <>
                                    <TableCell>
                                        {r.actualStartTime || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {r.actualEndTime || "—"}
                                    </TableCell>
                                </>
                            )}

                            {/* Own actions */}
                            {actionMode === "own" && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {r.status === "HR_APPROVED" &&
                                            r.userId ===
                                                currentUserId && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        onConfirmHours?.(r)
                                                    }
                                                    disabled={isPending}
                                                >
                                                    <Timer className="mr-1 h-3 w-3" />{" "}
                                                    {t("attendanceOvertimeActionConfirmActualHours")}
                                                </Button>
                                            )}
                                        {(r.status === "PENDING" ||
                                            r.status ===
                                                "MANAGER_APPROVED" ||
                                            r.status ===
                                                "HR_APPROVED") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() =>
                                                    onCancel?.(r.id)
                                                }
                                                disabled={isPending}
                                            >
                                                <Ban className="mr-1 h-3 w-3" />{" "}
                                                {t("attendanceOvertimeActionCancel")}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            )}

                            {/* Manager approve actions */}
                            {actionMode === "manager-approve" && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() =>
                                                onManagerApprove?.(r.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                            {t("attendanceOvertimeActionApprove")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                onManagerReject?.(r.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <XCircle className="mr-1 h-3 w-3" />{" "}
                                            {t("attendanceOvertimeActionReject")}
                                        </Button>
                                    </div>
                                </TableCell>
                            )}

                            {/* HR review actions */}
                            {actionMode === "hr-review" && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() =>
                                                onHrApprove?.(r.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <ShieldCheck className="mr-1 h-3 w-3" />{" "}
                                            {t("attendanceOvertimeActionApprove")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                onHrReject?.(r.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <XCircle className="mr-1 h-3 w-3" />{" "}
                                            {t("attendanceOvertimeActionReject")}
                                        </Button>
                                    </div>
                                </TableCell>
                            )}

                            {/* Confirm actions */}
                            {actionMode === "confirm" && (
                                <TableCell className="text-right">
                                    {r.status === "HR_APPROVED" &&
                                        !r.actualHours && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() =>
                                                    onConfirmHours?.(r)
                                                }
                                                disabled={isPending}
                                            >
                                                <Timer className="mr-1 h-3 w-3" />{" "}
                                                {t("attendanceOvertimeActionConfirm")}
                                            </Button>
                                        )}
                                    {r.status === "COMPLETED" && (
                                        <Badge variant="default">
                                            <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                            {t("attendanceOvertimeActionConfirmed")}
                                        </Badge>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {requests.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={colCount}
                                className="h-24 text-center text-muted-foreground"
                            >
                                {t("attendanceOvertimeTableEmpty")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
        </>
    );
}

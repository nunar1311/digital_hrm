"use client";

import Image from "next/image";
import { CheckCircle, XCircle, ImageIcon } from "lucide-react";
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
import { STATUS_MAP, TYPE_LABELS } from "./explanations-constants";
import type {
    ExplanationWithAttendance,
    ExplanationWithAttendanceAndUser,
} from "../types";
import { useTimezone } from "@/hooks/use-timezone";

interface ExplanationTableProps {
    explanations: (
        | ExplanationWithAttendance
        | ExplanationWithAttendanceAndUser
    )[];
    showUser: boolean;
    showActions: "approve" | false;
    isPending: boolean;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
    const Icon = s.icon;
    return (
        <Badge variant={s.variant}>
            <Icon className="mr-1 h-3 w-3" /> {s.label}
        </Badge>
    );
}

export function ExplanationTable({
    explanations,
    showUser,
    showActions,
    isPending,
    onApprove,
    onReject,
}: ExplanationTableProps) {
    const { timezone } = useTimezone();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {showUser && <TableHead>Nhân viên</TableHead>}
                    <TableHead>Ngày chấm công</TableHead>
                    <TableHead>Ca làm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Minh chứng</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    {showActions && (
                        <TableHead className="text-right">
                            Thao tác
                        </TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {explanations.map((e) => (
                    <TableRow key={e.id}>
                        {showUser && (
                            <TableCell className="font-medium">
                                {"user" in e.attendance
                                    ? (
                                          e.attendance as ExplanationWithAttendanceAndUser["attendance"]
                                      ).user?.name
                                    : "—"}
                            </TableCell>
                        )}
                        <TableCell>
                            {e.attendance?.date
                                ? new Date(
                                      e.attendance.date,
                                  ).toLocaleDateString("vi-VN", { timeZone: timezone })
                                : "—"}
                        </TableCell>
                        <TableCell>
                            {e.attendance?.shift?.name || "—"}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {TYPE_LABELS[e.type] || e.type}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={e.status} />
                        </TableCell>
                        <TableCell className="max-w-50 truncate">
                            {e.reason}
                        </TableCell>
                        <TableCell>
                            {e.attachment ? (
                                <a
                                    href={e.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Image
                                        src={e.attachment}
                                        alt="Minh chứng"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded object-cover hover:opacity-80"
                                    />
                                </a>
                            ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                        </TableCell>
                        <TableCell>
                            {new Date(e.createdAt).toLocaleDateString(
                                "vi-VN",
                                { timeZone: timezone }
                            )}
                        </TableCell>
                        {showActions && (
                            <TableCell className="text-right">
                                {e.status === "PENDING" && (
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() =>
                                                onApprove?.(e.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                            Duyệt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                onReject?.(e.id)
                                            }
                                            disabled={isPending}
                                        >
                                            <XCircle className="mr-1 h-3 w-3" />{" "}
                                            Từ chối
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
                {explanations.length === 0 && (
                    <TableRow>
                        <TableCell
                            colSpan={showUser ? 9 : 8}
                            className="h-24 text-center text-muted-foreground"
                        >
                            Không có giải trình nào.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

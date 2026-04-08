"use client";

import Image from "next/image";
import { CheckCircle, XCircle, ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { STATUS_MAP, TYPE_TRANSLATION_KEYS } from "./explanations-constants";
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

function StatusBadge({
    status,
    t,
}: {
    status: string;
    t: ReturnType<typeof useTranslations>;
}) {
    const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
    const Icon = s.icon;
    return (
        <Badge variant={s.variant}>
            <Icon className="mr-1 h-3 w-3" /> {t(s.labelKey)}
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
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();
    const { timezone } = useTimezone();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {showUser && (
                        <TableHead>{t("attendanceExplanationsTableHeaderEmployee")}</TableHead>
                    )}
                    <TableHead>{t("attendanceExplanationsTableHeaderAttendanceDate")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderShift")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderType")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderStatus")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderReason")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderEvidence")}</TableHead>
                    <TableHead>{t("attendanceExplanationsTableHeaderSubmittedDate")}</TableHead>
                    {showActions && (
                        <TableHead className="text-right">
                            {t("attendanceExplanationsTableHeaderActions")}
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
                                  ).toLocaleDateString(locale, { timeZone: timezone })
                                : "—"}
                        </TableCell>
                        <TableCell>
                            {e.attendance?.shift?.name || "—"}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {TYPE_TRANSLATION_KEYS[e.type]
                                    ? t(TYPE_TRANSLATION_KEYS[e.type])
                                    : e.type}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={e.status} t={t} />
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
                                        alt={t("attendanceExplanationsEvidenceAlt")}
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
                                locale,
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
                                            {t("attendanceExplanationsActionApprove")}
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
                                            {t("attendanceExplanationsActionReject")}
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
                            {t("attendanceExplanationsTableEmpty")}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

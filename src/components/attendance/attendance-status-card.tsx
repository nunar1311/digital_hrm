"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Timer,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    Camera,
} from "lucide-react";
import type { AttendanceRecord } from "@/app/[locale]/(protected)/attendance/types";
import { useTimezone } from "@/hooks/use-timezone";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface StatusInfo {
    label: string;
    color: string;
}

interface AttendanceStatusCardProps {
    att?: AttendanceRecord | null;
    statusInfo?: StatusInfo | null;
}

export function AttendanceStatusCard({
    att,
    statusInfo,
}: AttendanceStatusCardProps) {
    const [previewPhoto, setPreviewPhoto] = useState<{
        src: string;
        label: string;
    } | null>(null);
    const { timezone } = useTimezone();
    const t = useTranslations("ProtectedPages");

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        {t("attendanceStatusCardTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {att ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                    {t("attendanceStatusCardStatusLabel")}
                                </span>
                                {statusInfo && (
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                                    >
                                        {statusInfo.label}
                                    </span>
                                )}
                            </div>
                            {att.lateMinutes > 0 && (
                                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                                    <AlertTriangle className="h-4 w-4" />{" "}
                                    {t("attendanceStatusCardLateMinutes", {
                                        minutes: att.lateMinutes,
                                    })}
                                </div>
                            )}
                            {att.earlyMinutes > 0 && (
                                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                    <AlertTriangle className="h-4 w-4" />{" "}
                                    {t("attendanceStatusCardEarlyMinutes", {
                                        minutes: att.earlyMinutes,
                                    })}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                {att.checkInVerified ? (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <ShieldCheck className="h-4 w-4" />{" "}
                                        {t("attendanceStatusCardCheckInVerified")}
                                    </span>
                                ) : att.checkIn ? (
                                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                        <ShieldAlert className="h-4 w-4" />{" "}
                                        {t("attendanceStatusCardCheckInUnverified")}
                                    </span>
                                ) : null}
                            </div>

                            {/* Check-in / Check-out Photos */}
                            {(att.checkInPhoto ||
                                att.checkOutPhoto) && (
                                    <div className="space-y-2">
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <Camera className="h-4 w-4" />{" "}
                                            {t("attendanceStatusCardPhotosLabel")}
                                        </span>
                                        <div className="grid grid-cols-2 gap-3">
                                            {att.checkInPhoto && (
                                                <button
                                                    className="group relative overflow-hidden rounded-lg border"
                                                    onClick={() =>
                                                        setPreviewPhoto({
                                                            src: att.checkInPhoto!,
                                                            label: t("attendanceStatusCardCheckInAt", {
                                                                time: new Date(
                                                                    att.checkIn!,
                                                                ).toLocaleTimeString(
                                                                    "vi-VN",
                                                                    {
                                                                        timeZone: timezone,
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                ),
                                                            }),
                                                        })
                                                    }
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={
                                                            att.checkInPhoto
                                                        }
                                                        alt={t("attendanceStatusCardCheckInPhotoAlt")}
                                                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                                                        {t("attendanceStatusCardCheckInLabel")}{" "}
                                                        {att.checkIn &&
                                                            new Date(
                                                                att.checkIn,
                                                            ).toLocaleTimeString(
                                                                "vi-VN",
                                                                {
                                                                    timeZone: timezone,
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                    </span>
                                                </button>
                                            )}
                                            {att.checkOutPhoto && (
                                                <button
                                                    className="group relative overflow-hidden rounded-lg border"
                                                    onClick={() =>
                                                        setPreviewPhoto({
                                                            src: att.checkOutPhoto!,
                                                            label: t("attendanceStatusCardCheckOutAt", {
                                                                time: new Date(
                                                                    att.checkOut!,
                                                                ).toLocaleTimeString(
                                                                    "vi-VN",
                                                                    {
                                                                        timeZone: timezone,
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                ),
                                                            }),
                                                        })
                                                    }
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={
                                                            att.checkOutPhoto
                                                        }
                                                        alt={t("attendanceStatusCardCheckOutPhotoAlt")}
                                                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                                                        {t("attendanceStatusCardCheckOutLabel")}{" "}
                                                        {att.checkOut &&
                                                            new Date(
                                                                att.checkOut,
                                                            ).toLocaleTimeString(
                                                                "vi-VN",
                                                                {
                                                                    timeZone: timezone,
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {att?.explanation && (
                                <div className="rounded-lg border p-3 text-sm">
                                    <p className="font-medium">
                                        {t("attendanceStatusCardExplanationLabel")} {" "}
                                        {att?.explanation?.reason}
                                    </p>
                                    <Badge
                                        variant={
                                            att?.explanation
                                                ?.status ===
                                                "APPROVED"
                                                ? "default"
                                                : att?.explanation
                                                    .status ===
                                                    "REJECTED"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                        className="mt-1"
                                    >
                                        {att?.explanation?.status ===
                                            "APPROVED"
                                            ? t("attendanceStatusCardApproved")
                                            : att?.explanation
                                                ?.status ===
                                                "REJECTED"
                                                ? t("attendanceStatusCardRejected")
                                                : t("attendanceStatusCardPending")}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t("attendanceStatusCardNoData")}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Photo Preview Dialog */}
            <Dialog
                open={previewPhoto !== null}
                onOpenChange={(open) => {
                    if (!open) setPreviewPhoto(null);
                }}
            >
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            {previewPhoto?.label}
                        </DialogTitle>
                    </DialogHeader>
                    {previewPhoto && (
                        <Image
                            src={previewPhoto.src}
                            alt={previewPhoto.label}
                            className="w-full object-contain"
                            fill
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}


"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    MapPin,
    Clock,
    Camera,
    ShieldCheck,
    ShieldAlert,
    Smartphone,
    Wifi,
    Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type {
    AttendanceRecordWithUser,
    CheckInMethod,
} from "@/app/[locale]/(protected)/attendance/types";
import { useTimezone } from "@/hooks/use-timezone";

const STATUS_MAP: Record<
    string,
    {
        labelKey: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PRESENT: { labelKey: "attendanceStatusBadgePresent", variant: "default" },
    LATE: { labelKey: "attendanceStatusBadgeLate", variant: "secondary" },
    EARLY_LEAVE: {
        labelKey: "attendanceStatusBadgeEarlyLeave",
        variant: "secondary",
    },
    LATE_AND_EARLY: {
        labelKey: "attendanceStatusBadgeLateAndEarly",
        variant: "destructive",
    },
    ABSENT: { labelKey: "attendanceStatusBadgeAbsent", variant: "destructive" },
    HALF_DAY: { labelKey: "attendanceStatusBadgeHalfDay", variant: "outline" },
    ON_LEAVE: { labelKey: "attendanceStatusBadgeOnLeave", variant: "outline" },
    HOLIDAY: { labelKey: "attendanceStatusBadgeHoliday", variant: "outline" },
};

const METHOD_MAP: Record<
    CheckInMethod,
    { labelKey: string; icon: typeof MapPin }
> = {
    GPS: { labelKey: "attendanceRecordDetailMethodGps", icon: MapPin },
    WIFI: { labelKey: "attendanceRecordDetailMethodWifi", icon: Wifi },
    FACE_ID: {
        labelKey: "attendanceRecordDetailMethodFaceId",
        icon: Camera,
    },
    MANUAL: { labelKey: "attendanceRecordDetailMethodManual", icon: Clock },
    QR: { labelKey: "attendanceRecordDetailMethodQr", icon: Smartphone },
    VANTAY: {
        labelKey: "attendanceRecordDetailMethodFingerprint",
        icon: Smartphone,
    },
};

type TranslateFn = ReturnType<typeof useTranslations>;

function formatTime(dateStr: string | null, timezone: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function formatDate(dateStr: string, timezone: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        timeZone: timezone,
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function LocationDisplay({
    location,
    t,
}: {
    location: string | null;
    t: TranslateFn;
}) {
    if (!location)
        return (
            <span className="text-muted-foreground text-sm">
                {t("attendanceRecordDetailNoData")}
            </span>
        );

    const [lat, lng] = location.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng))
        return <span className="text-sm">{location}</span>;

    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-xs">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
            </div>
            <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-4 hover:underline"
            >
                {t("attendanceRecordDetailViewOnGoogleMaps")}
            </a>
        </div>
    );
}

function MethodBadge({
    method,
    t,
}: {
    method: CheckInMethod | null;
    t: TranslateFn;
}) {
    if (!method) return <Badge variant="outline">{t("attendanceRecordDetailUnknown")}</Badge>;
    const info = METHOD_MAP[method];
    if (!info) return <Badge variant="outline">{method}</Badge>;
    const Icon = info.icon;
    return (
        <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {t(info.labelKey)}
        </Badge>
    );
}

function VerifiedBadge({
    verified,
    t,
}: {
    verified: boolean;
    t: TranslateFn;
}) {
    return verified ? (
        <Badge
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700"
        >
            <ShieldCheck className="h-3 w-3" />
            {t("attendanceRecordDetailVerified")}
        </Badge>
    ) : (
        <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            {t("attendanceRecordDetailUnverified")}
        </Badge>
    );
}

interface RecordDetailSheetProps {
    record: AttendanceRecordWithUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RecordDetailSheet({
    record,
    open,
    onOpenChange,
}: RecordDetailSheetProps) {
    const [previewPhoto, setPreviewPhoto] = useState<{
        src: string;
        label: string;
    } | null>(null);
    const { timezone } = useTimezone();
    const t = useTranslations("ProtectedPages");

    if (!record) return null;

    const status = STATUS_MAP[record.status] ?? {
        labelKey: "",
        variant: "outline" as const,
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto gap-0">
                    <SheetHeader>
                        <SheetTitle>
                            {t("attendanceRecordDetailTitle")}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="p-4 space-y-6">
                        {/* Employee Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={
                                        record.user.image ?? undefined
                                    }
                                />
                                <AvatarFallback>
                                    {record.user.name
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">
                                    {record.user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {record.user.employeeCode ?? "—"}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Badge variant={status.variant}>
                                    {status.labelKey
                                        ? t(status.labelKey)
                                        : record.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Date & Shift */}
                        <div className="rounded-lg border p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {t("attendanceRecordDetailDateLabel")}
                                </span>
                                <span className="font-medium">
                                    {formatDate(record.date, timezone)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {t("attendanceRecordDetailShiftLabel")}
                                </span>
                                <span className="font-medium">
                                    {record.shift
                                        ? `${record.shift.name} (${record.shift.startTime} - ${record.shift.endTime})`
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {t("attendanceRecordDetailSourceLabel")}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {record.source}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* Check-in Section */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                {t("attendanceRecordDetailCheckInTitle")}
                            </h4>
                            <div className="rounded-lg border p-3 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {t("attendanceRecordDetailTimeLabel")}
                                    </span>
                                    <span className="font-mono text-sm font-medium">
                                        {formatTime(record.checkIn, timezone)}
                                    </span>
                                </div>
                                {record.lateMinutes > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            {t("attendanceRecordDetailLateLabel")}
                                        </span>
                                        <Badge variant="secondary">
                                            {t("attendanceRecordDetailMinutesValue", {
                                                minutes: record.lateMinutes,
                                            })}
                                        </Badge>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {t("attendanceRecordDetailMethodLabel")}
                                    </span>
                                    <MethodBadge
                                        method={record.checkInMethod}
                                        t={t}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {t("attendanceRecordDetailVerifyLabel")}
                                    </span>
                                    <VerifiedBadge
                                        verified={
                                            record.checkInVerified
                                        }
                                        t={t}
                                    />
                                </div>
                                {record.checkInDeviceId && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            {t("attendanceRecordDetailDeviceLabel")}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="gap-1 font-mono text-xs"
                                        >
                                            <Smartphone className="h-3 w-3" />
                                            {record.checkInDeviceId}
                                        </Badge>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">
                                        {t("attendanceRecordDetailGpsLabel")}
                                    </span>
                                    <LocationDisplay
                                        location={
                                            record.checkInLocation
                                        }
                                        t={t}
                                    />
                                </div>
                                {record.checkInPhoto && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1.5">
                                            {t("attendanceRecordDetailPhotoLabel")}
                                        </span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={record.checkInPhoto}
                                            alt={t("attendanceRecordDetailCheckInPhotoAlt")}
                                            className="h-24 w-24 rounded-lg object-cover cursor-pointer border hover:opacity-80 transition"
                                            onClick={() =>
                                                setPreviewPhoto({
                                                    src: record.checkInPhoto!,
                                                    label: t("attendanceRecordDetailCheckInPhotoAlt"),
                                                })
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Check-out Section */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                {t("attendanceRecordDetailCheckOutTitle")}
                            </h4>
                            <div className="rounded-lg border p-3 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {t("attendanceRecordDetailTimeLabel")}
                                    </span>
                                    <span className="font-mono text-sm font-medium">
                                        {formatTime(record.checkOut, timezone)}
                                    </span>
                                </div>
                                {record.earlyMinutes > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            {t("attendanceRecordDetailEarlyLeaveLabel")}
                                        </span>
                                        <Badge variant="secondary">
                                            {t("attendanceRecordDetailMinutesValue", {
                                                minutes: record.earlyMinutes,
                                            })}
                                        </Badge>
                                    </div>
                                )}
                                {record.checkOut && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {t("attendanceRecordDetailMethodLabel")}
                                            </span>
                                            <MethodBadge
                                                method={
                                                    record.checkOutMethod
                                                }
                                                t={t}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {t("attendanceRecordDetailVerifyLabel")}
                                            </span>
                                            <VerifiedBadge
                                                verified={
                                                    record.checkOutVerified
                                                }
                                                t={t}
                                            />
                                        </div>
                                        {record.checkOutDeviceId && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">
                                                    {t("attendanceRecordDetailDeviceLabel")}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 font-mono text-xs"
                                                >
                                                    <Smartphone className="h-3 w-3" />
                                                    {
                                                        record.checkOutDeviceId
                                                    }
                                                </Badge>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm text-muted-foreground block mb-1">
                                                {t("attendanceRecordDetailGpsLabel")}
                                            </span>
                                            <LocationDisplay
                                                location={
                                                    record.checkOutLocation
                                                }
                                                t={t}
                                            />
                                        </div>
                                        {record.checkOutPhoto && (
                                            <div>
                                                <span className="text-sm text-muted-foreground block mb-1.5">
                                                    {t("attendanceRecordDetailPhotoLabel")}
                                                </span>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={
                                                        record.checkOutPhoto
                                                    }
                                                    alt={t("attendanceRecordDetailCheckOutPhotoAlt")}
                                                    className="h-24 w-24 rounded-lg object-cover cursor-pointer border hover:opacity-80 transition"
                                                    onClick={() =>
                                                        setPreviewPhoto(
                                                            {
                                                                src: record.checkOutPhoto!,
                                                                label: t("attendanceRecordDetailCheckOutPhotoAlt"),
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {!record.checkOut && (
                                    <p className="text-sm text-muted-foreground italic">
                                        {t("attendanceRecordDetailNotCheckedOut")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Work Metrics */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">
                                {t("attendanceRecordDetailStatsTitle")}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        {t("attendanceRecordDetailWorkHoursLabel")}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {record.workHours != null
                                            ? `${record.workHours}${t("attendanceRecordDetailHourSuffix")}`
                                            : "—"}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        {t("attendanceRecordDetailOvertimeLabel")}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {record.overtimeHours != null
                                            ? `${record.overtimeHours}${t("attendanceRecordDetailHourSuffix")}`
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Explanation */}
                        {record.explanation && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">
                                        {t("attendanceRecordDetailExplanationTitle")}
                                    </h4>
                                    <div className="rounded-lg border p-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {t("attendanceRecordDetailTypeLabel")}
                                            </span>
                                            <Badge variant="outline">
                                                {
                                                    record.explanation
                                                        .type
                                                }
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {t("attendanceRecordDetailStatusLabel")}
                                            </span>
                                            <Badge
                                                variant={
                                                    record.explanation
                                                        .status ===
                                                    "APPROVED"
                                                        ? "default"
                                                        : record
                                                                .explanation
                                                                .status ===
                                                            "REJECTED"
                                                          ? "destructive"
                                                          : "secondary"
                                                }
                                            >
                                                {record.explanation
                                                    .status ===
                                                "APPROVED"
                                                    ? t("attendanceRecordDetailApproved")
                                                    : record
                                                            .explanation
                                                            .status ===
                                                        "REJECTED"
                                                      ? t("attendanceRecordDetailRejected")
                                                      : t("attendanceRecordDetailPending")}
                                            </Badge>
                                        </div>
                                        <p className="text-sm">
                                            {
                                                record.explanation
                                                    .reason
                                            }
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Note */}
                        {record.note && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">
                                        {t("attendanceRecordDetailNoteTitle")}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {record.note}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Photo Preview Dialog */}
            <Dialog
                open={previewPhoto !== null}
                onOpenChange={(o) => {
                    if (!o) setPreviewPhoto(null);
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={previewPhoto.src}
                            alt={previewPhoto.label}
                            className="w-full object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}


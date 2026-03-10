"use client";

import { useState } from "react";
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
} from "@/app/(protected)/attendance/types";
import { useTimezone } from "@/hooks/use-timezone";

const STATUS_MAP: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PRESENT: { label: "Đúng giờ", variant: "default" },
    LATE: { label: "Đi muộn", variant: "secondary" },
    EARLY_LEAVE: { label: "Về sớm", variant: "secondary" },
    LATE_AND_EARLY: { label: "Muộn & Sớm", variant: "destructive" },
    ABSENT: { label: "Vắng mặt", variant: "destructive" },
    HALF_DAY: { label: "Nửa ngày", variant: "outline" },
    ON_LEAVE: { label: "Nghỉ phép", variant: "outline" },
    HOLIDAY: { label: "Ngày lễ", variant: "outline" },
};

const METHOD_MAP: Record<
    CheckInMethod,
    { label: string; icon: typeof MapPin }
> = {
    GPS: { label: "GPS", icon: MapPin },
    WIFI: { label: "WiFi", icon: Wifi },
    FACE_ID: { label: "Nhận diện khuôn mặt", icon: Camera },
    MANUAL: { label: "Thủ công", icon: Clock },
    QR: { label: "Mã QR", icon: Smartphone },
    VANTAY: { label: "Vân tay", icon: Smartphone },
};

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

function LocationDisplay({ location }: { location: string | null }) {
    if (!location)
        return (
            <span className="text-muted-foreground text-sm">
                Không có dữ liệu
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
                Xem trên Google Maps &rarr;
            </a>
        </div>
    );
}

function MethodBadge({ method }: { method: CheckInMethod | null }) {
    if (!method) return <Badge variant="outline">Không rõ</Badge>;
    const info = METHOD_MAP[method];
    if (!info) return <Badge variant="outline">{method}</Badge>;
    const Icon = info.icon;
    return (
        <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {info.label}
        </Badge>
    );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
    return verified ? (
        <Badge
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700"
        >
            <ShieldCheck className="h-3 w-3" />
            Đã xác minh
        </Badge>
    ) : (
        <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            Chưa xác minh
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

    if (!record) return null;

    const status = STATUS_MAP[record.status] ?? {
        label: record.status,
        variant: "outline" as const,
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto gap-0">
                    <SheetHeader>
                        <SheetTitle>Chi tiết chấm công</SheetTitle>
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
                                    {status.label}
                                </Badge>
                            </div>
                        </div>

                        {/* Date & Shift */}
                        <div className="rounded-lg border p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Ngày
                                </span>
                                <span className="font-medium">
                                    {formatDate(record.date, timezone)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Ca làm việc
                                </span>
                                <span className="font-medium">
                                    {record.shift
                                        ? `${record.shift.name} (${record.shift.startTime} - ${record.shift.endTime})`
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Nguồn
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
                                Check-in
                            </h4>
                            <div className="rounded-lg border p-3 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Thời gian
                                    </span>
                                    <span className="font-mono text-sm font-medium">
                                        {formatTime(record.checkIn, timezone)}
                                    </span>
                                </div>
                                {record.lateMinutes > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            Muộn
                                        </span>
                                        <Badge variant="secondary">
                                            {record.lateMinutes} phút
                                        </Badge>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Phương thức
                                    </span>
                                    <MethodBadge
                                        method={record.checkInMethod}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Xác minh
                                    </span>
                                    <VerifiedBadge
                                        verified={
                                            record.checkInVerified
                                        }
                                    />
                                </div>
                                {record.checkInDeviceId && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            Thiết bị
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
                                        Vị trí GPS
                                    </span>
                                    <LocationDisplay
                                        location={
                                            record.checkInLocation
                                        }
                                    />
                                </div>
                                {record.checkInPhoto && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1.5">
                                            Ảnh xác minh
                                        </span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={record.checkInPhoto}
                                            alt="Ảnh check-in"
                                            className="h-24 w-24 rounded-lg object-cover cursor-pointer border hover:opacity-80 transition"
                                            onClick={() =>
                                                setPreviewPhoto({
                                                    src: record.checkInPhoto!,
                                                    label: "Ảnh check-in",
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
                                Check-out
                            </h4>
                            <div className="rounded-lg border p-3 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Thời gian
                                    </span>
                                    <span className="font-mono text-sm font-medium">
                                        {formatTime(record.checkOut, timezone)}
                                    </span>
                                </div>
                                {record.earlyMinutes > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            Về sớm
                                        </span>
                                        <Badge variant="secondary">
                                            {record.earlyMinutes} phút
                                        </Badge>
                                    </div>
                                )}
                                {record.checkOut && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                Phương thức
                                            </span>
                                            <MethodBadge
                                                method={
                                                    record.checkOutMethod
                                                }
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                Xác minh
                                            </span>
                                            <VerifiedBadge
                                                verified={
                                                    record.checkOutVerified
                                                }
                                            />
                                        </div>
                                        {record.checkOutDeviceId && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">
                                                    Thiết bị
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
                                                Vị trí GPS
                                            </span>
                                            <LocationDisplay
                                                location={
                                                    record.checkOutLocation
                                                }
                                            />
                                        </div>
                                        {record.checkOutPhoto && (
                                            <div>
                                                <span className="text-sm text-muted-foreground block mb-1.5">
                                                    Ảnh xác minh
                                                </span>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={
                                                        record.checkOutPhoto
                                                    }
                                                    alt="Ảnh check-out"
                                                    className="h-24 w-24 rounded-lg object-cover cursor-pointer border hover:opacity-80 transition"
                                                    onClick={() =>
                                                        setPreviewPhoto(
                                                            {
                                                                src: record.checkOutPhoto!,
                                                                label: "Ảnh check-out",
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
                                        Chưa check-out
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Work Metrics */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">
                                Thống kê
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        Giờ làm
                                    </p>
                                    <p className="text-lg font-bold">
                                        {record.workHours != null
                                            ? `${record.workHours}h`
                                            : "—"}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        Tăng ca
                                    </p>
                                    <p className="text-lg font-bold">
                                        {record.overtimeHours != null
                                            ? `${record.overtimeHours}h`
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
                                        Giải trình
                                    </h4>
                                    <div className="rounded-lg border p-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                Loại
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
                                                Trạng thái
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
                                                    ? "Đã duyệt"
                                                    : record
                                                            .explanation
                                                            .status ===
                                                        "REJECTED"
                                                      ? "Từ chối"
                                                      : "Chờ duyệt"}
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
                                        Ghi chú
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

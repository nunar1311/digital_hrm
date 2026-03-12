"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Camera,
    MapPin,
    Clock,
    Wifi,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    CalendarOff,
    CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type {
    AttendanceConfig,
    AttendanceRecord,
    ShiftBasic,
} from "@/app/(protected)/attendance/types";
import { CameraConfirmDialog } from "./camera-confirm-dialog";
import { useTimezone } from "@/hooks/use-timezone";

export interface CheckInPayload {
    method: "GPS" | "WIFI" | "FACE_ID" | "MANUAL" | "QR";
    location?: string;
    photo?: string;
    wifiSsid?: string;
    shiftId?: string;
}

interface AttendanceActionPanelProps {
    config?: AttendanceConfig | null;
    att?: AttendanceRecord | null;
    isLoading: boolean;
    hasShiftToday: boolean;
    todayShifts: ShiftBasic[];
    selectedShift: ShiftBasic | null;
    onShiftChange: (shiftId: string) => void;
    onCheckIn: (payload: CheckInPayload) => void;
    onCheckOut: (payload: CheckInPayload) => void;
}

export function AttendanceActionPanel({
    config,
    att,
    isLoading,
    hasShiftToday,
    todayShifts,
    selectedShift,
    onShiftChange,
    onCheckIn,
    onCheckOut,
}: AttendanceActionPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { timezone } = useTimezone();
    const [location, setLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [wifiIp, setWifiIp] = useState<string | null>(null);
    const [wifiChecking, setWifiChecking] = useState(false);
    const [gpsChecking, setGpsChecking] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [wifiWarning, setWifiWarning] = useState<{
        open: boolean;
        ip: string;
    }>({
        open: false,
        ip: "",
    });

    // Camera dialog state
    const [cameraAction, setCameraAction] = useState<
        "check-in" | "check-out" | null
    >(null);

    // Update clock
    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date()),
            1000,
        );
        return () => clearInterval(timer);
    }, []);

    // ─── Auto-detect GPS ───
    const detectGps = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setGpsError("Trình duyệt không hỗ trợ GPS");
            return;
        }
        setGpsChecking(true);
        setGpsError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setGpsChecking(false);
            },
            (err) => {
                setGpsError(err.message);
                setGpsChecking(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    // ─── Auto-detect WiFi ───
    const detectWifi = useCallback(async () => {
        setWifiChecking(true);
        try {
            const res = await fetch("/api/attendance/check-wifi");
            const result = (await res.json()) as {
                ip: string;
                matched: boolean;
                ssid?: string;
            };
            if (result.matched) {
                setWifiIp(result.ip);
                setWifiWarning({ open: false, ip: "" });
                toast.success(
                    `Đã xác minh IP WiFi công ty: ${result.ip}${
                        result.ssid ? ` (${result.ssid})` : ""
                    }`,
                );
            } else {
                setWifiIp(null);
                setWifiWarning({ open: true, ip: result.ip });
            }
        } catch {
            toast.error("Không thể kiểm tra WiFi. Vui lòng thử lại.");
        } finally {
            setWifiChecking(false);
        }
    }, []);

    // ─── Initial Checks ───
    useEffect(() => {
        if (config?.requireGps) {
            detectGps();
        }
        if (config?.requireWifi) {
            detectWifi();
        }
    }, [
        config?.requireGps,
        config?.requireWifi,
        detectGps,
        detectWifi,
    ]);

    // ─── Build Payload ───
    const buildPayload = (photo?: string) => {
        return {
            method: "GPS" as const,
            location: location
                ? `${location.lat},${location.lng}`
                : undefined,
            photo,
            wifiSsid: wifiIp ? "COMPANY_WIFI_VERIFIED" : undefined,
        };
    };

    const handleActionClick = (action: "check-in" | "check-out") => {
        // Always open camera dialog for selfie confirmation
        setCameraAction(action);
    };

    const handleCameraConfirm = (photoBase64: string) => {
        const payload = buildPayload(photoBase64);
        if (cameraAction === "check-in") {
            onCheckIn(payload);
        } else {
            onCheckOut(payload);
        }
        setCameraAction(null);
    };

    // ─── Status ───
    const hasCheckedIn = !!att?.checkIn;
    const hasCheckedOut = !!att?.checkOut;

    // ─── Blockers ───
    const wifiRequired = !!config?.requireWifi;
    const gpsRequired = !!config?.requireGps;
    const wifiBlocked = wifiRequired && !wifiIp;
    const gpsBlocked = gpsRequired && !location;
    const verificationBlocked = wifiBlocked || gpsBlocked;
    const noShiftBlocked = !hasShiftToday;

    return (
        <div className="space-y-6">
            {/* ─── No Shift Warning ─── */}
            {noShiftBlocked && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <CardContent className="flex items-start gap-3">
                        <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                                Không có ca làm việc hôm nay
                            </h3>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                Bạn chưa được phân ca cho ngày hôm
                                nay. Vui lòng liên hệ quản lý hoặc bộ
                                phận nhân sự để được phân ca trước khi
                                chấm công.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Chấm công trực
                        tuyến
                    </CardTitle>
                    <CardDescription>
                        Hệ thống ghi nhận thời gian với xác minh chống
                        gian lận
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Đồng hồ */}
                    <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-6">
                        <h2 className="text-4xl font-bold tracking-tighter tabular-nums">
                            {currentTime.toLocaleTimeString("vi-VN", {
                            timeZone: timezone,
                        })}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {currentTime.toLocaleDateString("vi-VN", {
                                timeZone: timezone,
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Anti-fraud indicators */}
                    {config && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <span className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                Xác minh tự động
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                                {config.requireGps && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />{" "}
                                            GPS (bán kính{" "}
                                            {
                                                config.maxGpsDistanceMeters
                                            }
                                            m)
                                        </span>
                                        {gpsChecking ? (
                                            <Badge
                                                variant="outline"
                                                className="text-xs animate-pulse"
                                            >
                                                Đang lấy vị trí...
                                            </Badge>
                                        ) : location ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-600 text-xs"
                                            >
                                                <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                                                {location.lat.toFixed(
                                                    4,
                                                )}
                                                ,{" "}
                                                {location.lng.toFixed(
                                                    4,
                                                )}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="destructive"
                                                className="text-xs cursor-pointer"
                                                onClick={detectGps}
                                            >
                                                <XCircle className="mr-1 h-3 w-3" />{" "}
                                                {gpsError
                                                    ? "Lỗi GPS — Thử lại"
                                                    : "Chưa xác minh"}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                                {config.requireWifi && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4" />{" "}
                                            WiFi công ty
                                        </span>
                                        {wifiChecking ? (
                                            <Badge
                                                variant="outline"
                                                className="text-xs animate-pulse"
                                            >
                                                Đang kiểm tra...
                                            </Badge>
                                        ) : wifiIp ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-600 text-xs"
                                            >
                                                <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                                                {wifiIp}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="destructive"
                                                className="text-xs cursor-pointer"
                                                onClick={detectWifi}
                                            >
                                                <XCircle className=" h-3 w-3" />{" "}
                                                Không khớp IP — Thử
                                                lại
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Verification blocked warning */}
                            {verificationBlocked && (
                                <div className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-2">
                                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        Chưa đủ điều kiện xác minh.
                                        {gpsBlocked &&
                                            " Cần vị trí GPS."}
                                        {wifiBlocked &&
                                            " Cần kết nối WiFi công ty."}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selfie requirement indicator */}
                    {config?.requireSelfie && (
                        <div className="rounded-lg border p-3 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Chụp
                                ảnh xác minh
                            </span>
                            <Badge
                                variant="outline"
                                className="text-xs"
                            >
                                Bắt buộc khi chấm công
                            </Badge>
                        </div>
                    )}

                    {/* Shift Selector — only show when employee has shifts */}
                    {hasShiftToday && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-primary" />{" "}
                                Ca làm việc hôm nay
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                >
                                    {todayShifts.length} ca
                                </Badge>
                            </h3>

                            {todayShifts.length > 1 &&
                            !hasCheckedIn ? (
                                <Select
                                    value={selectedShift?.id ?? ""}
                                    onValueChange={onShiftChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ca làm việc" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {todayShifts.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={s.id}
                                            >
                                                {s.name} (
                                                {s.startTime} -{" "}
                                                {s.endTime})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : selectedShift ? (
                                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                                    <span className="font-medium">
                                        {selectedShift.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {selectedShift.startTime} -{" "}
                                        {selectedShift.endTime}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Check-in / Check-out */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                                handleActionClick("check-in")
                            }
                            disabled={
                                isLoading ||
                                hasCheckedIn ||
                                verificationBlocked ||
                                noShiftBlocked ||
                                !selectedShift
                            }
                        >
                            {hasCheckedIn ? (
                                <span className="flex flex-col items-center">
                                    <span>Đã Check-in</span>
                                    <span className="text-xs font-normal">
                                        {new Date(
                                            att!.checkIn!,
                                        ).toLocaleTimeString(
                                            "vi-VN",
                                            {
                                                timeZone: timezone,
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </span>
                                </span>
                            ) : (
                                "Check-in"
                            )}
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            className="w-full"
                            onClick={() =>
                                handleActionClick("check-out")
                            }
                            disabled={
                                isLoading ||
                                !hasCheckedIn ||
                                hasCheckedOut ||
                                verificationBlocked
                            }
                        >
                            {hasCheckedOut ? (
                                <span className="flex flex-col items-center">
                                    <span>Đã Check-out</span>
                                    <span className="text-xs font-normal">
                                        {new Date(
                                            att!.checkOut!,
                                        ).toLocaleTimeString(
                                            "vi-VN",
                                            {
                                                timeZone: timezone,
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </span>
                                </span>
                            ) : (
                                "Check-out"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* WiFi Error Dialog */}
            <Dialog
                open={wifiWarning.open}
                onOpenChange={(open) =>
                    setWifiWarning((p) => ({ ...p, open }))
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="h-5 w-5" />
                            Không kết nối WiFi công ty
                        </DialogTitle>
                        <DialogDescription className="pt-2 space-y-3">
                            <span className="block">
                                Hệ thống phát hiện địa chỉ IP hiện tại
                                của bạn{" "}
                                <span className="font-mono font-semibold text-foreground">
                                    ({wifiWarning.ip})
                                </span>{" "}
                                không nằm trong danh sách mạng nội bộ
                                công ty.
                            </span>
                            <span className="block">
                                Bạn cần kết nối vào mạng WiFi của công
                                ty để có thể thực hiện chấm công. Vui
                                lòng kiểm tra lại.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium">Lưu ý:</p>
                                <ul className="mt-1 list-inside list-disc space-y-0.5">
                                    <li>
                                        Đảm bảo đã kết nối WiFi công
                                        ty (không dùng 4G/5G)
                                    </li>
                                    <li>Tắt VPN nếu đang sử dụng</li>
                                    <li>
                                        Liên hệ IT nếu vẫn gặp lỗi
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setWifiWarning({
                                    open: false,
                                    ip: "",
                                })
                            }
                        >
                            Đóng
                        </Button>
                        <Button
                            onClick={() => {
                                setWifiWarning({
                                    open: false,
                                    ip: "",
                                });
                                detectWifi();
                            }}
                        >
                            <Wifi className="mr-2 h-4 w-4" />
                            Kiểm tra lại
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Camera Confirm Dialog */}
            <CameraConfirmDialog
                open={cameraAction !== null}
                onOpenChange={(open) => {
                    if (!open) setCameraAction(null);
                }}
                title={
                    cameraAction === "check-in"
                        ? "Xác nhận Check-in"
                        : "Xác nhận Check-out"
                }
                description="Chụp ảnh selfie để xác minh danh tính trước khi chấm công."
                onConfirm={handleCameraConfirm}
                isPending={isLoading}
            />
        </div>
    );
}

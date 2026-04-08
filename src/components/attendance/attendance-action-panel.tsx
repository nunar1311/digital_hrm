"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Camera,
  MapPin,
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
} from "@/app/[locale]/(protected)/attendance/types";
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
  const t = useTranslations("ProtectedPages");
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // â”€â”€â”€ Auto-detect GPS â”€â”€â”€
  const detectGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsError(t("attendanceActionPanelGpsUnsupported"));
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
  }, [t]);

  // â”€â”€â”€ Auto-detect WiFi â”€â”€â”€
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
          result.ssid
            ? t("attendanceActionPanelWifiVerifiedWithSsid", {
                ip: result.ip,
                ssid: result.ssid,
              })
            : t("attendanceActionPanelWifiVerified", {
                ip: result.ip,
              }),
        );
      } else {
        setWifiIp(null);
        setWifiWarning({ open: true, ip: result.ip });
      }
    } catch {
      toast.error(t("attendanceActionPanelWifiCheckError"));
    } finally {
      setWifiChecking(false);
    }
  }, [t]);

  // â”€â”€â”€ Initial Checks â”€â”€â”€
  useEffect(() => {
    if (config?.requireGps) {
      detectGps();
    }
    if (config?.requireWifi) {
      detectWifi();
    }
  }, [config?.requireGps, config?.requireWifi, detectGps, detectWifi]);

  // â”€â”€â”€ Build Payload â”€â”€â”€
  const buildPayload = (photo?: string) => {
    return {
      method: "GPS" as const,
      location: location ? `${location.lat},${location.lng}` : undefined,
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

  // â”€â”€â”€ Status â”€â”€â”€
  const hasCheckedIn = !!att?.checkIn;
  const hasCheckedOut = !!att?.checkOut;

  // â”€â”€â”€ Blockers â”€â”€â”€
  const wifiRequired = !!config?.requireWifi;
  const gpsRequired = !!config?.requireGps;
  const wifiBlocked = wifiRequired && !wifiIp;
  const gpsBlocked = gpsRequired && !location;
  const verificationBlocked = wifiBlocked || gpsBlocked;
  const noShiftBlocked = !hasShiftToday;

  return (
    <div className="space-y-6">
      {/* â”€â”€â”€ No Shift Warning â”€â”€â”€ */}
      {noShiftBlocked && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="flex items-start gap-3">
            <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                {t("attendanceActionPanelNoShiftTitle")}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {t("attendanceActionPanelNoShiftDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("attendanceActionPanelTitle")}</CardTitle>
          <CardDescription>
            {t("attendanceActionPanelDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Äá»“ng há»“ */}
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
                {t("attendanceActionPanelAutoVerification")}
              </span>
              <div className="grid grid-cols-1 gap-2">
                {config.requireGps && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {t("attendanceActionPanelGpsRadius")}{" "}
                      {config.maxGpsDistanceMeters}
                      m)
                    </span>
                    {gpsChecking ? (
                      <Badge
                        variant="outline"
                        className="text-xs animate-pulse"
                      >
                        {t("attendanceActionPanelGpsLoading")}
                      </Badge>
                    ) : location ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="text-xs cursor-pointer"
                        onClick={detectGps}
                      >
                        <XCircle className="mr-1 h-3 w-3" />{" "}
                        {gpsError
                          ? t("attendanceActionPanelGpsErrorRetry")
                          : t("attendanceActionPanelUnverified")}
                      </Badge>
                    )}
                  </div>
                )}
                {config.requireWifi && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" /> {t("attendanceActionPanelCompanyWifi")}
                    </span>
                    {wifiChecking ? (
                      <Badge
                        variant="outline"
                        className="text-xs animate-pulse"
                      >
                        {t("attendanceActionPanelWifiChecking")}
                      </Badge>
                    ) : wifiIp ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> {wifiIp}
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="text-xs cursor-pointer"
                        onClick={detectWifi}
                      >
                        <XCircle className=" h-3 w-3" />
                        {t("attendanceActionPanelWifiIpMismatchRetry")}
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
                    {t("attendanceActionPanelVerificationBlocked")}
                    {gpsBlocked && ` ${t("attendanceActionPanelNeedGps")}`}
                    {wifiBlocked && ` ${t("attendanceActionPanelNeedCompanyWifi")}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Selfie requirement indicator */}
          {config?.requireSelfie && (
            <div className="rounded-lg border p-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" /> {t("attendanceActionPanelSelfieVerification")}
              </span>
              <Badge variant="outline" className="text-xs">
                {t("attendanceActionPanelSelfieRequired")}
              </Badge>
            </div>
          )}

          {/* Shift Selector â€” only show when employee has shifts */}
          {hasShiftToday && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> {t("attendanceActionPanelTodayShift")}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {t("attendanceActionPanelShiftCount", {
                    count: todayShifts.length,
                  })}
                </Badge>
              </h3>

              {todayShifts.length > 1 && !hasCheckedIn ? (
                <Select
                  value={selectedShift?.id ?? ""}
                  onValueChange={onShiftChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("attendanceActionPanelSelectShiftPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {todayShifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedShift ? (
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{selectedShift.name}</span>
                  <span className="text-muted-foreground">
                    {selectedShift.startTime} - {selectedShift.endTime}
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
              onClick={() => handleActionClick("check-in")}
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
                  <span>{t("attendanceActionPanelCheckedIn")}</span>
                  <span className="text-xs font-normal">
                    {new Date(att!.checkIn!).toLocaleTimeString("vi-VN", {
                      timeZone: timezone,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              ) : (
                t("attendanceActionPanelCheckIn")
              )}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="w-full"
              onClick={() => handleActionClick("check-out")}
              disabled={
                isLoading ||
                !hasCheckedIn ||
                hasCheckedOut ||
                verificationBlocked
              }
            >
              {hasCheckedOut ? (
                <span className="flex flex-col items-center">
                  <span>{t("attendanceActionPanelCheckedOut")}</span>
                  <span className="text-xs font-normal">
                    {new Date(att!.checkOut!).toLocaleTimeString("vi-VN", {
                      timeZone: timezone,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              ) : (
                t("attendanceActionPanelCheckOut")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WiFi Error Dialog */}
      <Dialog
        open={wifiWarning.open}
        onOpenChange={(open) => setWifiWarning((p) => ({ ...p, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {t("attendanceActionPanelWifiDialogTitle")}
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <span className="block">
                {t("attendanceActionPanelWifiDialogDetected", {
                  ip: wifiWarning.ip,
                })}
              </span>
              <span className="block">
                {t("attendanceActionPanelWifiDialogDescription")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">{t("attendanceActionPanelWifiDialogNote")}</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>{t("attendanceActionPanelWifiDialogTip1")}</li>
                  <li>{t("attendanceActionPanelWifiDialogTip2")}</li>
                  <li>{t("attendanceActionPanelWifiDialogTip3")}</li>
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
              {t("attendanceActionPanelClose")}
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
              {t("attendanceActionPanelRetry")}
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
            ? t("attendanceCheckDialogCameraTitle")
            : t("attendanceActionPanelCameraCheckOutTitle")
        }
        description={t("attendanceCheckDialogCameraDescription")}
        onConfirm={handleCameraConfirm}
        isPending={isLoading}
      />
    </div>
  );
}


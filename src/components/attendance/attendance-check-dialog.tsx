"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock, CalendarClock, Timer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  checkTodayShiftOnLogin,
  checkIn,
} from "@/app/[locale]/(protected)/attendance/actions";
import { CameraConfirmDialog } from "./camera-confirm-dialog";
import { useTimezone } from "@/hooks/use-timezone";

const SESSION_KEY = "attendance-check-dismissed";

export function AttendanceCheckDialog() {
  const t = useTranslations("ProtectedPages");
  const queryClient = useQueryClient();
  const { timezone } = useTimezone();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!window.sessionStorage.getItem(SESSION_KEY);
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect GPS
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // GPS error silently ignored for login dialog
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  // Query: check shift on login
  const { data, isLoading: isChecking } = useQuery({
    queryKey: ["attendance", "login-check"],
    queryFn: async () => {
      const res = await checkTodayShiftOnLogin();
      return res;
    },
    enabled: !dismissed,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      toast.success(t("attendanceCheckDialogToastSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["attendance", "today"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "login-check"],
      });
      handleDismiss();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("attendanceCheckDialogToastError"));
    },
  });

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  }, []);

  // Determine selected shift
  const currentShift = useMemo(() => {
    if (!data?.todayShifts?.length) return null;
    if (selectedShiftId) {
      return data.todayShifts.find((s) => s.id === selectedShiftId) ?? null;
    }
    return data.currentShift ?? data.todayShifts[0] ?? null;
  }, [data, selectedShiftId]);

  const handleCameraConfirm = useCallback(
    (photoBase64: string) => {
      if (!currentShift) return;
      checkInMutation.mutate({
        method: "GPS",
        location: location ? `${location.lat},${location.lng}` : undefined,
        photo: photoBase64,
        shiftId: currentShift.id,
      });
      setCameraOpen(false);
    },
    [currentShift, location, checkInMutation],
  );

  const handleCheckIn = useCallback(() => {
    setCameraOpen(true);
  }, []);

  // Calculate time window info for display
  const timeWindowInfo = useMemo(() => {
    if (!currentShift) return null;

    const [sh, sm] = currentShift.startTime.split(":").map(Number);
    const shiftStartMinutes = sh * 60 + sm;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const windowClose = shiftStartMinutes + currentShift.lateThreshold;
    const minutesLeft = windowClose - nowMinutes;
    const totalWindow = data?.minutesUntilWindowClose
      ? data.minutesUntilWindowClose + (nowMinutes - (shiftStartMinutes - 60))
      : currentShift.lateThreshold + 60;

    const elapsed = totalWindow - minutesLeft;
    const progress = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100));

    return {
      minutesLeft: Math.max(0, minutesLeft),
      progress,
      isLate: nowMinutes > shiftStartMinutes,
      lateBy: Math.max(0, nowMinutes - shiftStartMinutes),
    };
  }, [currentShift, currentTime, data]);

  // Don't show if:
  // - dismissed
  // - still checking
  // - no shift today
  // - already checked in
  // - not within check-in window
  const shouldShow =
    !dismissed &&
    !isChecking &&
    data?.hasShift &&
    !data?.hasCheckedIn &&
    data?.isWithinCheckInWindow;

  if (!shouldShow) return null;

  return (
    <>
      <Dialog open={true}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {t("attendanceCheckDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("attendanceCheckDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {/* Current Time */}
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
            <h2 className="text-3xl font-bold tracking-tighter tabular-nums">
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

          {/* Shift Info */}
          {currentShift && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {currentShift.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {currentShift.startTime} - {currentShift.endTime}
                </Badge>
              </div>

              {/* Time Window Progress */}
              {timeWindowInfo && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {timeWindowInfo.isLate ? (
                        <span className="text-destructive font-medium">
                          {t("attendanceCheckDialogLateBy", {
                            minutes: timeWindowInfo.lateBy,
                          })}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {t("attendanceCheckDialogEarly")}
                        </span>
                      )}
                    </span>
                    <span>
                      {t("attendanceCheckDialogMinutesLeft", {
                        minutes: timeWindowInfo.minutesLeft,
                      })}
                    </span>
                  </div>
                  <Progress value={timeWindowInfo.progress} className="h-1.5" />
                </div>
              )}
            </div>
          )}

          {/* Multi-shift selector */}
          {data?.todayShifts && data.todayShifts.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("attendanceCheckDialogSelectShiftLabel")}
              </label>
              <Select
                value={currentShift?.id ?? ""}
                onValueChange={setSelectedShiftId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("attendanceCheckDialogSelectShiftPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {data.todayShifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              {t("attendanceCheckDialogLater")}
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || !currentShift}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRight className="mr-1.5 h-4 w-4" />
              {t("attendanceCheckDialogCheckInNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <CameraConfirmDialog
        open={cameraOpen}
        onOpenChange={(open) => {
          if (!open) setCameraOpen(false);
        }}
        title={t("attendanceCheckDialogCameraTitle")}
        description={t("attendanceCheckDialogCameraDescription")}
        onConfirm={handleCameraConfirm}
        isPending={checkInMutation.isPending}
      />
    </>
  );
}


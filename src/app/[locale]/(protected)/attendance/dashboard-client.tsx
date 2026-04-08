"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
    checkIn,
    checkOut,
    getAttendanceConfig,
    getTodayAttendance,
} from "./actions";
import type {
    TodayAttendanceData,
    AttendanceConfig,
    ShiftBasic,
} from "./types";
import { useSocketEvent } from "@/hooks/use-socket-event";

import { AttendanceActionPanel } from "@/components/attendance/attendance-action-panel";
import { AttendanceStatusCard } from "@/components/attendance/attendance-status-card";
import { AttendanceShiftCard } from "@/components/attendance/attendance-shift-card";
import { AttendanceStatsCard } from "@/components/attendance/attendance-stats-card";

const STATUS_COLORS: Record<string, string> = {
    PRESENT:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    LATE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    EARLY_LEAVE:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    LATE_AND_EARLY: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    ABSENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    HALF_DAY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ON_LEAVE:
        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    HOLIDAY:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
};

export function AttendanceDashboard({
    initialData,
}: {
    initialData: TodayAttendanceData;
}) {
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case "PRESENT":
                return t("attendanceDashboardStatusPresent");
            case "LATE":
                return t("attendanceDashboardStatusLate");
            case "EARLY_LEAVE":
                return t("attendanceDashboardStatusEarlyLeave");
            case "LATE_AND_EARLY":
                return t("attendanceDashboardStatusLateAndEarly");
            case "ABSENT":
                return t("attendanceDashboardStatusAbsent");
            case "HALF_DAY":
                return t("attendanceDashboardStatusHalfDay");
            case "ON_LEAVE":
                return t("attendanceDashboardStatusOnLeave");
            case "HOLIDAY":
                return t("attendanceDashboardStatusHoliday");
            default:
                return status;
        }
    };

    // ─── Queries ───
    const { data: todayData } = useQuery({
        queryKey: ["attendance", "today"],
        queryFn: async () => {
            const res = await getTodayAttendance();
            return JSON.parse(
                JSON.stringify(res),
            ) as TodayAttendanceData;
        },
        initialData,
    });

    const { data: config } = useQuery<AttendanceConfig | null>({
        queryKey: ["attendance", "config"],
        queryFn: async () => {
            const res = await getAttendanceConfig();
            return res
                ? (JSON.parse(
                      JSON.stringify(res),
                  ) as AttendanceConfig)
                : null;
        },
    });

    // ─── Real-time WebSocket Updates ───
    useSocketEvent("attendance:check-in", (data) => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "today"],
        });
        queryClient.invalidateQueries({
            queryKey: ["attendance", "monthly"],
        });
        toast.info(t("attendanceDashboardToastSocketCheckIn", { userName: data.userName }), {
            description: data.shiftName
                ? t("attendanceDashboardToastSocketShift", { shiftName: data.shiftName })
                : undefined,
        });
    });

    useSocketEvent("attendance:check-out", (data) => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "today"],
        });
        queryClient.invalidateQueries({
            queryKey: ["attendance", "monthly"],
        });
        toast.info(t("attendanceDashboardToastSocketCheckOut", { userName: data.userName }), {
            description: t("attendanceDashboardToastSocketWorkHours", { workHours: data.workHours }),
        });
    });

    useSocketEvent("config:updated", () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "config"],
        });
    });

    useSocketEvent("shift:updated", () => {
        queryClient.invalidateQueries({
            queryKey: ["shifts"],
        });
    });

    // ─── Mutations ───
    const checkInMutation = useMutation({
        mutationFn: checkIn,
        onSuccess: () => {
            toast.success(t("attendanceDashboardToastCheckInSuccess"));
            queryClient.invalidateQueries({
                queryKey: ["attendance", "today"],
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || t("attendanceDashboardToastAttendanceError"),
            );
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: checkOut,
        onSuccess: () => {
            toast.success(t("attendanceDashboardToastCheckOutSuccess"));
            queryClient.invalidateQueries({
                queryKey: ["attendance", "today"],
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || t("attendanceDashboardToastAttendanceError"),
            );
        },
    });

    const isLoading =
        checkInMutation.isPending || checkOutMutation.isPending;
    const att = todayData.attendance;
    const statusInfo = att?.status
        ? {
              label: getStatusLabel(att.status),
              color: STATUS_COLORS[att.status] ?? "",
          }
        : null;
    const todayShifts = useMemo(
        () => todayData.todayShifts ?? [],
        [todayData.todayShifts],
    );
    const hasShiftToday = todayData.hasShiftToday ?? false;

    // ─── Shift Selection ───
    // Auto-select: ưu tiên ca đã check-in, rồi assignedShift (auto-detect), rồi ca đầu tiên
    const [manualShiftId, setManualShiftId] = useState<string | null>(
        null,
    );

    const attShiftId = att?.shiftId ?? null;
    const serverAssignedShift = todayData.assignedShift;

    const selectedShift = useMemo<ShiftBasic | null>(() => {
        // 1. Nếu đã check-in → dùng ca trong attendance
        if (attShiftId) {
            return (
                todayShifts.find((s) => s.id === attShiftId) ??
                serverAssignedShift
            );
        }
        // 2. Nếu user đã chọn thủ công
        if (manualShiftId) {
            return (
                todayShifts.find((s) => s.id === manualShiftId) ??
                null
            );
        }
        // 3. Auto-detect từ server
        return serverAssignedShift;
    }, [attShiftId, manualShiftId, todayShifts, serverAssignedShift]);

    return (
        <div className="grid gap-6 lg:grid-cols-2 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
            <div className="space-y-6 lg:overflow-y-auto lg:pr-2 no-scrollbar">
                <AttendanceActionPanel
                    config={config}
                    att={att}
                    isLoading={isLoading}
                    hasShiftToday={hasShiftToday}
                    todayShifts={todayShifts}
                    selectedShift={selectedShift}
                    onShiftChange={setManualShiftId}
                    onCheckIn={(payload) =>
                        checkInMutation.mutate({
                            ...payload,
                            shiftId: selectedShift?.id,
                        })
                    }
                    onCheckOut={(payload) =>
                        checkOutMutation.mutate(payload)
                    }
                />
            </div>

            <div className="space-y-6 lg:overflow-y-auto lg:pr-2 no-scrollbar">
                <AttendanceStatusCard
                    att={att}
                    statusInfo={statusInfo}
                />
                <AttendanceShiftCard
                    shift={selectedShift}
                    todayShifts={todayShifts}
                    hasShiftToday={hasShiftToday}
                />
                <AttendanceStatsCard
                    periodType="week"
                />
            </div>
        </div>
    );
}

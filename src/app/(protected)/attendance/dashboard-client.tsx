"use client";

import { useState, useMemo } from "react";
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

const STATUS_LABELS: Record<
    string,
    { label: string; color: string }
> = {
    PRESENT: {
        label: "Đúng giờ",
        color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    LATE: {
        label: "Đi muộn",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    EARLY_LEAVE: {
        label: "Về sớm",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    LATE_AND_EARLY: {
        label: "Muộn & Sớm",
        color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    ABSENT: {
        label: "Vắng mặt",
        color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    HALF_DAY: {
        label: "Nửa ngày",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    ON_LEAVE: {
        label: "Nghỉ phép",
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    },
    HOLIDAY: {
        label: "Ngày lễ",
        color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    },
};

export function AttendanceDashboard({
    initialData,
}: {
    initialData: TodayAttendanceData;
}) {
    const queryClient = useQueryClient();

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
        queryClient.refetchQueries({
            queryKey: ["attendance", "today"],
            type: "active",
        });
        queryClient.invalidateQueries({
            queryKey: ["attendance", "monthly"],
        });
        toast.info(`${data.userName} vừa check-in`, {
            description: data.shiftName
                ? `Ca: ${data.shiftName}`
                : undefined,
        });
    });

    useSocketEvent("attendance:check-out", (data) => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "today"],
        });
        queryClient.refetchQueries({
            queryKey: ["attendance", "today"],
            type: "active",
        });
        queryClient.invalidateQueries({
            queryKey: ["attendance", "monthly"],
        });
        toast.info(`${data.userName} vừa check-out`, {
            description: `Giờ làm: ${data.workHours}h`,
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
        onSuccess: (result) => {
            // Check if server returned error (not thrown)
            if (!result.success) {
                toast.error(result.error || "Có lỗi xảy ra khi chấm công");
                return;
            }
            toast.success("Check-in thành công!");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "today"],
            });
            // Force refetch to update UI immediately
            queryClient.refetchQueries({
                queryKey: ["attendance", "today"],
                type: "active",
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Có lỗi xảy ra khi chấm công",
            );
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: checkOut,
        onSuccess: (result) => {
            // Check if server returned error (not thrown)
            if (!result.success) {
                toast.error(result.error || "Có lỗi xảy ra khi check-out");
                return;
            }
            toast.success("Check-out thành công!");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "today"],
            });
            // Force refetch to update UI immediately
            queryClient.refetchQueries({
                queryKey: ["attendance", "today"],
                type: "active",
            });
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "Có lỗi xảy ra khi chấm công",
            );
        },
    });

    const isLoading =
        checkInMutation.isPending || checkOutMutation.isPending;
    const att = todayData.attendance;
    const statusInfo = att?.status ? STATUS_LABELS[att.status] : null;
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
        <div className="grid gap-6 lg:grid-cols-2 h-full lg:overflow-hidden pb-4">
            <div className="space-y-6 lg:overflow-y-auto lg:pr-2 no-scrollbar pb-8">
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

            <div className="space-y-6 lg:overflow-y-auto lg:pr-2 no-scrollbar pb-8">
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

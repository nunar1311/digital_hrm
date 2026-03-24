"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    format,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    addDays,
    eachDayOfInterval,
    differenceInCalendarDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

import {
    getShifts,
    getUsers,
    createShift,
    updateShift,
    deleteShift,
    assignShift,
    assignWorkCycle,
    assignWorkCycleToDepartment,
    getShiftAssignmentsForRange,
    removeShiftAssignment,
} from "../actions";
import type {
    Shift,
    ShiftAssignment,
    UserBasic,
    WorkCycle,
} from "../types";
import type { DepartmentBasic } from "../types";
import { useSocketEvent } from "@/hooks/use-socket-event";
import {
    type ViewMode,
    hashShiftIdToColor,
    capitalizeFirst,
} from "./shifts-constants";
import type {
    ShiftFormValues,
    AssignFormValues,
    AssignCycleFormValues,
    AssignCycleDeptFormValues,
} from "./shift-dialogs";

// ─── Hook Return Type ───

export interface UseShiftsDataReturn {
    // View
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;
    currentDate: Date;
    rangeLabel: string;
    visibleDays: Date[];
    weekDays: Date[];

    // Navigation
    goToday: () => void;
    goPrev: () => void;
    goNext: () => void;

    // Queries
    shifts: Shift[];
    calendarData: {
        sortedUsers: (UserBasic & { image?: string | null })[];
        userAssignments: Map<
            string,
            Map<string, (ShiftAssignment & { user: UserBasic })[]>
        >;
    };
    shiftColorMap: Map<string, ReturnType<typeof hashShiftIdToColor>>;

    // Search & Infinite scroll
    searchQuery: string;
    debouncedSearch: string;
    handleSearchChange: (value: string) => void;
    filteredUsers: (UserBasic & { image?: string | null })[];
    hasMore: boolean;
    loadMore: () => void;

    // Department filter
    departmentIds: string[];
    setDepartmentIds: (ids: string[]) => void;
    departments: DepartmentBasic[];

    // Shift CRUD Dialog
    isShiftDialogOpen: boolean;
    setIsShiftDialogOpen: (open: boolean) => void;
    editingShift: Shift | null;
    openCreateShift: () => void;
    openEditShift: (shift: Shift) => void;
    handleShiftSubmit: (values: ShiftFormValues) => void;
    deleteTarget: Shift | null;
    setDeleteTarget: (shift: Shift | null) => void;
    handleDeleteShift: () => void;

    // Assign
    assignDialogOpen: boolean;
    setAssignDialogOpen: (open: boolean) => void;
    handleAssign: (values: AssignFormValues) => void;

    // Quick assign
    quickAssignCell: { userId: string; date: Date } | null;
    setQuickAssignCell: (
        cell: { userId: string; date: Date } | null,
    ) => void;
    handleQuickAssign: (shiftId: string) => void;

    // Delete assignment
    deleteAssignmentId: string | null;
    setDeleteAssignmentId: (id: string | null) => void;
    removeAssignMutation: ReturnType<
        typeof useMutation<{ success: boolean }, Error, string>
    >;

    // Cycle assignment
    cycleDialogOpen: boolean;
    setCycleDialogOpen: (open: boolean) => void;
    handleAssignCycle: (values: AssignCycleFormValues) => void;
    workCycles: WorkCycle[];
    assignCycleUserId: string | null;
    assignCycleDate: Date | null;
    setAssignCycleUserId: (id: string | null) => void;
    setAssignCycleDate: (date: Date | null) => void;
    assignCycleMutation: {
        mutate: (params: {
            userId: string;
            workCycleId: string;
            cycleStartDate: Date;
            endDate?: Date;
        }) => void;
        isPending: boolean;
    };

    // Cycle assignment by department
    cycleDeptDialogOpen: boolean;
    setCycleDeptDialogOpen: (open: boolean) => void;
    handleAssignCycleDept: (
        values: AssignCycleDeptFormValues,
    ) => void;

    // User shift stats
    getUserShiftCount: (userId: string) => {
        totalShifts: number;
        totalHours: number;
    };

    // Computed stats
    stats: {
        totalShiftsDefined: number;
        activeShifts: number;
        assignedUsersCount: number;
        unassignedUsersCount: number;
        totalWeeklyHours: number;
        totalAssignments: number;
    };

    // Loading
    isPending: boolean;

    // Props pass-through
    users: UserBasic[];
    canManage: boolean;

    // Refresh
    refreshUsers: () => void;
}

// ─── Hook ───

export function useShiftsData({
    initialShifts,
    initialWorkCycles,
    users,
    departments,
    canManage,
}: {
    initialShifts: Shift[];
    initialWorkCycles: WorkCycle[];
    users: UserBasic[];
    departments: DepartmentBasic[];
    canManage: boolean;
}): UseShiftsDataReturn {
    const queryClient = useQueryClient();

    // ─── View State ───
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [currentDate, setCurrentDate] = useState(new Date());

    // ─── Shift CRUD Dialog ───
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<Shift | null>(
        null,
    );

    // ─── Assign Dialog ───
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);

    // ─── Quick-assign from cell click ───
    const [quickAssignCell, setQuickAssignCell] = useState<{
        userId: string;
        date: Date;
    } | null>(null);

    // ─── Delete assignment confirm ───
    const [deleteAssignmentId, setDeleteAssignmentId] = useState<
        string | null
    >(null);

    // ─── Cycle Assignment Dialog ───
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);

    // Track selected user and date when opening cycle dialog from calendar
    const [assignCycleUserId, setAssignCycleUserId] = useState<
        string | null
    >(null);
    const [assignCycleDate, setAssignCycleDate] =
        useState<Date | null>(null);

    // ─── Cycle Assignment by Department Dialog ───
    const [cycleDeptDialogOpen, setCycleDeptDialogOpen] =
        useState(false);

    // ─── Search ───
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // ─── Infinite scroll state (declared early — used by filter resets) ───
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // ─── Department filter ───
    const [departmentIds, setDepartmentIdsState] = useState<string[]>(
        [],
    );
    const setDepartmentIds = useCallback((ids: string[]) => {
        setDepartmentIdsState(ids);
        setVisibleCount(PAGE_SIZE);
    }, []);

    // B-05: Debounce with proper cleanup on unmount / value change
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setVisibleCount(PAGE_SIZE);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    // ─── Week range ───
    const weekStart = useMemo(
        () => startOfWeek(currentDate, { weekStartsOn: 1 }),
        [currentDate],
    );
    const weekEnd = useMemo(
        () => endOfWeek(currentDate, { weekStartsOn: 1 }),
        [currentDate],
    );
    const weekDays = useMemo(
        () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
        [weekStart, weekEnd],
    );

    // ─── Month range ───
    const monthStart = useMemo(
        () => startOfMonth(currentDate),
        [currentDate],
    );
    const monthEnd = useMemo(
        () => endOfMonth(currentDate),
        [currentDate],
    );
    const monthDays = useMemo(
        () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
        [monthStart, monthEnd],
    );

    // ─── Formatted range labels ───
    const rangeStart =
        viewMode === "month"
            ? monthStart
            : viewMode === "week"
              ? weekStart
              : currentDate;
    const rangeEnd =
        viewMode === "month"
            ? monthEnd
            : viewMode === "week"
              ? weekEnd
              : currentDate;
    const rangeLabel = useMemo(() => {
        if (viewMode === "day") {
            return capitalizeFirst(
                format(currentDate, "EEEE, dd/MM/yyyy", {
                    locale: vi,
                }),
            );
        }
        if (viewMode === "month") {
            return capitalizeFirst(
                format(currentDate, "'Tháng' MM, yyyy", {
                    locale: vi,
                }),
            );
        }
        return `${format(weekStart, "dd/MM/yyyy")} – ${format(weekEnd, "dd/MM/yyyy")}`;
    }, [viewMode, currentDate, weekStart, weekEnd]);

    // ─── Real-time WebSocket ───
    useSocketEvent("shift:updated", () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "shifts"],
        });
    });
    useSocketEvent("shift:assigned", () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "shiftAssignments"],
        });
    });
    useSocketEvent("department:employee-moved", () => {
        queryClient.invalidateQueries({
            queryKey: ["attendance", "users"],
        });
    });

    // ─── Queries ───
    const { data: shifts = initialShifts } = useQuery({
        queryKey: ["attendance", "shifts"],
        queryFn: async () => {
            const res = await getShifts();
            return JSON.parse(JSON.stringify(res)) as Shift[];
        },
        initialData: initialShifts,
    });

    const { data: usersData = users } = useQuery({
        queryKey: ["attendance", "users"],
        queryFn: async () => {
            const res = await getUsers();
            return JSON.parse(JSON.stringify(res)) as UserBasic[];
        },
        initialData: users,
    });

    const { data: assignments = [] } = useQuery({
        queryKey: [
            "attendance",
            "shiftAssignments",
            "range",
            format(rangeStart, "yyyy-MM-dd"),
            format(rangeEnd, "yyyy-MM-dd"),
        ],
        queryFn: async () => {
            const res = await getShiftAssignmentsForRange(
                format(rangeStart, "yyyy-MM-dd"),
                format(rangeEnd, "yyyy-MM-dd"),
            );
            return JSON.parse(
                JSON.stringify(res),
            ) as (ShiftAssignment & {
                user: UserBasic & { image?: string | null };
            })[];
        },
    });

    // ─── Client-side filtering ───
    const filteredUsers = useMemo(() => {
        let result = usersData as (UserBasic & {
            image?: string | null;
        })[];
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.employeeCode?.toLowerCase().includes(q),
            );
        }
        if (departmentIds.length > 0) {
            // If users have department data, filter by department
            // Otherwise, show all users (department data not yet populated)
            const usersWithDept = result.filter(
                (u) => u.departmentId,
            );
            if (usersWithDept.length > 0) {
                result = usersWithDept.filter((u) =>
                    departmentIds.includes(u.departmentId!),
                );
            }
            // If no users have department data, show all (waiting for data population)
        }
        return result;
    }, [usersData, debouncedSearch, departmentIds]);

    const hasMore = visibleCount < filteredUsers.length;
    const loadMore = useCallback(() => {
        setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredUsers.length),
        );
    }, [filteredUsers.length]);

    const totalCount = filteredUsers.length;

    // ─── Shift color map ───
    // B-02: Use ID hash so colors are stable when shifts are added/removed
    const shiftColorMap = useMemo(() => {
        const map = new Map<
            string,
            ReturnType<typeof hashShiftIdToColor>
        >();
        shifts.forEach((s) =>
            map.set(s.id, hashShiftIdToColor(s.id)),
        );
        return map;
    }, [shifts]);

    // ─── Build user → day → assignments map ───
    const calendarData = useMemo(() => {
        // Only show users that pass the current search / department filter
        const allowedUserIds = new Set(
            filteredUsers.map((u) => u.id),
        );

        const userMap = new Map<
            string,
            UserBasic & { image?: string | null }
        >();
        const userAssignments = new Map<
            string,
            Map<string, (ShiftAssignment & { user: UserBasic })[]>
        >();

        for (const a of assignments) {
            if (!allowedUserIds.has(a.userId)) continue;
            if (!userMap.has(a.userId)) {
                userMap.set(a.userId, a.user);
                userAssignments.set(a.userId, new Map());
            }
            const dayMap = userAssignments.get(a.userId)!;

            const days =
                viewMode === "month"
                    ? monthDays
                    : viewMode === "week"
                      ? weekDays
                      : [currentDate];

            // ── Work cycle assignment: resolve per-day shift from cycle pattern ──
            if (a.workCycleId && a.workCycle && a.cycleStartDate) {
                const cycleStart = new Date(a.cycleStartDate);
                cycleStart.setHours(0, 0, 0, 0);
                const totalDays = a.workCycle.totalDays;

                for (const day of days) {
                    const dayStart = new Date(day);
                    dayStart.setHours(0, 0, 0, 0);

                    const assignStart = new Date(a.startDate);
                    assignStart.setHours(0, 0, 0, 0);
                    const assignEnd = a.endDate
                        ? new Date(a.endDate)
                        : null;
                    if (assignEnd)
                        assignEnd.setHours(23, 59, 59, 999);

                    const covers =
                        assignStart <= dayStart &&
                        (assignEnd === null || assignEnd >= dayStart);

                    if (!covers) continue;

                    const dayDiff = differenceInCalendarDays(
                        dayStart,
                        cycleStart,
                    );
                    const dayIndex =
                        ((dayDiff % totalDays) + totalDays) %
                        totalDays;
                    const entry = a.workCycle.entries.find(
                        (e) => e.dayIndex === dayIndex,
                    );

                    if (!entry || entry.isDayOff || !entry.shift)
                        continue;

                    // Create a virtual ShiftAssignment for this day with shift resolved
                    const virtualAssignment: ShiftAssignment & {
                        user: UserBasic;
                    } = {
                        ...a,
                        shift: {
                            id: entry.shift.id,
                            name: entry.shift.name,
                            code: entry.shift.code,
                            startTime: entry.shift.startTime,
                            endTime: entry.shift.endTime,
                            breakMinutes: 0,
                            lateThreshold: 0,
                            earlyThreshold: 0,
                            isDefault: false,
                            isActive: true,
                        },
                        shiftId: entry.shift.id,
                    };

                    const key = format(day, "yyyy-MM-dd");
                    if (!dayMap.has(key)) dayMap.set(key, []);
                    dayMap.get(key)!.push(virtualAssignment);
                }
                continue;
            }

            // ── Regular shift assignment ──
            for (const day of days) {
                const assignStart = new Date(a.startDate);
                assignStart.setHours(0, 0, 0, 0);
                const assignEnd = a.endDate
                    ? new Date(a.endDate)
                    : null;
                if (assignEnd) assignEnd.setHours(23, 59, 59, 999);

                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);

                const covers =
                    assignStart <= dayStart &&
                    (assignEnd === null || assignEnd >= dayStart);

                if (covers) {
                    const key = format(day, "yyyy-MM-dd");
                    if (!dayMap.has(key)) dayMap.set(key, []);
                    dayMap.get(key)!.push(a);
                }
            }
        }

        // Include visible users (infinite scroll) with NO assignments
        const visibleUsers = filteredUsers.slice(0, visibleCount);
        for (const u of visibleUsers) {
            if (!userMap.has(u.id)) {
                userMap.set(u.id, u);
                userAssignments.set(u.id, new Map());
            }
        }

        const sortedUsers = Array.from(userMap.values()).sort(
            (a, b) => a.name.localeCompare(b.name),
        );

        return { sortedUsers, userAssignments };
    }, [
        assignments,
        filteredUsers,
        visibleCount,
        weekDays,
        monthDays,
        viewMode,
        currentDate,
    ]);

    // ─── Computed stats ───
    const stats = useMemo(() => {
        const activeShifts = shifts.filter((s) => s.isActive).length;
        const usersWithAssignments = new Set<string>();
        let totalAssignments = 0;
        let totalWeeklyHours = 0;

        calendarData.userAssignments.forEach((dayMap, userId) => {
            let hasAssignment = false;
            dayMap.forEach((dayAssigns) => {
                if (dayAssigns.length > 0) hasAssignment = true;
                totalAssignments += dayAssigns.length;
                for (const a of dayAssigns) {
                    const s = a.shift;
                    if (s) {
                        const [sh, sm] = s.startTime
                            .split(":")
                            .map(Number);
                        const [eh, em] = s.endTime
                            .split(":")
                            .map(Number);
                        let h = eh - sh + (em - sm) / 60;
                        if (h < 0) h += 24;
                        // B-03: Clamp per-assignment net hours to avoid negative contributions
                        totalWeeklyHours += Math.max(
                            0,
                            h - s.breakMinutes / 60,
                        );
                    }
                }
            });
            if (hasAssignment) usersWithAssignments.add(userId);
        });

        return {
            totalShiftsDefined: shifts.length,
            activeShifts,
            assignedUsersCount: usersWithAssignments.size,
            unassignedUsersCount: Math.max(
                0,
                totalCount - usersWithAssignments.size,
            ),
            totalWeeklyHours: Math.max(0, totalWeeklyHours),
            totalAssignments,
        };
    }, [shifts, calendarData.userAssignments, totalCount]);

    // ─── Mutations ───
    const createMutation = useMutation({
        mutationFn: createShift,
        onSuccess: () => {
            toast.success("Tạo ca mới thành công");
            setIsShiftDialogOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: ShiftFormValues;
        }) => updateShift(id, data),
        onSuccess: () => {
            toast.success("Cập nhật ca thành công");
            setIsShiftDialogOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteShift,
        onSuccess: () => {
            toast.success("Xóa ca thành công");
            setDeleteTarget(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const assignMutation = useMutation({
        mutationFn: (params: {
            userId: string;
            shiftId: string;
            startDate: Date;
            endDate?: Date;
        }) =>
            assignShift(
                params.userId,
                params.shiftId,
                params.startDate,
                params.endDate ? new Date(params.endDate) : undefined,
            ),
        onSuccess: () => {
            toast.success("Phân ca thành công");
            setAssignDialogOpen(false);
            setQuickAssignCell(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const removeAssignMutationObj = useMutation({
        mutationFn: removeShiftAssignment,
        onSuccess: () => {
            toast.success("Đã xóa phân ca");
            setDeleteAssignmentId(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const assignCycleMutation = useMutation({
        mutationFn: (params: {
            userId: string;
            workCycleId: string;
            cycleStartDate: Date;
            endDate?: Date;
        }) =>
            assignWorkCycle(
                params.userId,
                params.workCycleId,
                params.cycleStartDate,
                params.endDate,
            ),
        onSuccess: () => {
            toast.success("Gán chu kỳ làm việc thành công");
            setCycleDialogOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const assignCycleDeptMutation = useMutation({
        mutationFn: (params: {
            departmentId: string;
            workCycleId: string;
            cycleStartDate: Date;
            endDate?: Date;
        }) =>
            assignWorkCycleToDepartment(
                params.departmentId,
                params.workCycleId,
                params.cycleStartDate,
                params.endDate,
            ),
        onSuccess: (result) => {
            let msg = `Đã gán chu kỳ cho ${result.assigned} nhân viên phòng ${result.departmentName}`;
            if (result.skipped > 0) {
                msg += ` (bỏ qua ${result.skipped} NV đã có chu kỳ)`;
            }
            toast.success(msg);
            setCycleDeptDialogOpen(false);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const isPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        assignMutation.isPending ||
        removeAssignMutationObj.isPending ||
        assignCycleMutation.isPending ||
        assignCycleDeptMutation.isPending;

    // ─── Navigation ───
    const goToday = useCallback(() => setCurrentDate(new Date()), []);
    const goPrev = useCallback(() => {
        setCurrentDate((d) =>
            viewMode === "month"
                ? subMonths(d, 1)
                : viewMode === "week"
                  ? subWeeks(d, 1)
                  : addDays(d, -1),
        );
    }, [viewMode]);
    const goNext = useCallback(() => {
        setCurrentDate((d) =>
            viewMode === "month"
                ? addMonths(d, 1)
                : viewMode === "week"
                  ? addWeeks(d, 1)
                  : addDays(d, 1),
        );
    }, [viewMode]);

    // ─── Shift CRUD ───
    const openCreateShift = () => {
        setEditingShift(null);
        setIsShiftDialogOpen(true);
    };
    const openEditShift = (shift: Shift) => {
        setEditingShift(shift);
        setIsShiftDialogOpen(true);
    };
    const handleShiftSubmit = (values: ShiftFormValues) => {
        // B-06: Prevent duplicate shift codes client-side
        const isDuplicateCode = shifts.some(
            (s) =>
                s.code === values.code && s.id !== editingShift?.id,
        );
        if (isDuplicateCode) {
            toast.error(`Mã ca "${values.code}" đã tồn tại`);
            return;
        }
        if (editingShift) {
            updateMutation.mutate({
                id: editingShift.id,
                data: values,
            });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleDeleteShift = () => {
        if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
    };

    // ─── Assign ───
    const handleAssign = (values: AssignFormValues) => {
        assignMutation.mutate({
            userId: values.userId,
            shiftId: values.shiftId,
            startDate: values.startDate,
            endDate: values.endDate,
        });
    };

    const handleQuickAssign = (shiftId: string) => {
        if (!quickAssignCell) return;
        assignMutation.mutate({
            userId: quickAssignCell.userId,
            shiftId,
            startDate: quickAssignCell.date,
            endDate: quickAssignCell.date,
        });
    };

    // ─── Assign Cycle ───
    const handleAssignCycle = (values: AssignCycleFormValues) => {
        // Use selected user from calendar if available, otherwise use form value
        const userId = assignCycleUserId || values.userId;
        const startDate = assignCycleDate
            ? assignCycleDate
            : new Date(values.startDate);

        assignCycleMutation.mutate({
            userId,
            workCycleId: values.workCycleId,
            cycleStartDate: startDate,
            endDate: values.endDate || undefined,
        });
    };

    // ─── Assign Cycle by Department ───
    const handleAssignCycleDept = (
        values: AssignCycleDeptFormValues,
    ) => {
        assignCycleDeptMutation.mutate({
            departmentId: values.departmentId,
            workCycleId: values.workCycleId,
            cycleStartDate: values.startDate,
            endDate: values.endDate || undefined,
        });
    };

    // ─── Count total shifts for a user ───
    const getUserShiftCount = useCallback(
        (userId: string) => {
            const dayMap = calendarData.userAssignments.get(userId);
            if (!dayMap) return { totalShifts: 0, totalHours: 0 };
            let totalShifts = 0;
            let totalHours = 0;
            dayMap.forEach((dayAssignments) => {
                totalShifts += dayAssignments.length;
                for (const a of dayAssignments) {
                    const s = a.shift;
                    if (s) {
                        const [sh, sm] = s.startTime
                            .split(":")
                            .map(Number);
                        const [eh, em] = s.endTime
                            .split(":")
                            .map(Number);
                        let h = eh - sh + (em - sm) / 60;
                        if (h < 0) h += 24;
                        // B-03: Clamp per-assignment to avoid negative hours
                        totalHours += Math.max(
                            0,
                            h - s.breakMinutes / 60,
                        );
                    }
                }
            });
            return {
                totalShifts,
                totalHours: Math.max(0, totalHours),
            };
        },
        [calendarData.userAssignments],
    );

    // ─── Visible days ───
    const visibleDays =
        viewMode === "month"
            ? monthDays
            : viewMode === "week"
              ? weekDays
              : [currentDate];

    return {
        viewMode,
        setViewMode,
        currentDate,
        rangeLabel,
        visibleDays,
        weekDays,
        goToday,
        goPrev,
        goNext,
        shifts,
        calendarData,
        shiftColorMap,
        searchQuery,
        debouncedSearch,
        handleSearchChange,
        filteredUsers,
        hasMore,
        loadMore,
        departmentIds,
        setDepartmentIds,
        departments,
        isShiftDialogOpen,
        setIsShiftDialogOpen,
        editingShift,
        openCreateShift,
        openEditShift,
        handleShiftSubmit,
        deleteTarget,
        setDeleteTarget,
        handleDeleteShift,
        assignDialogOpen,
        setAssignDialogOpen,
        handleAssign,
        quickAssignCell,
        setQuickAssignCell,
        handleQuickAssign,
        deleteAssignmentId,
        setDeleteAssignmentId,
        removeAssignMutation: removeAssignMutationObj,
        cycleDialogOpen,
        setCycleDialogOpen,
        handleAssignCycle,
        assignCycleUserId,
        assignCycleDate,
        setAssignCycleUserId,
        setAssignCycleDate,
        cycleDeptDialogOpen,
        setCycleDeptDialogOpen,
        handleAssignCycleDept,
        workCycles: initialWorkCycles,
        getUserShiftCount,
        stats,
        isPending,
        users,
        canManage,
        refreshUsers: () =>
            queryClient.invalidateQueries({
                queryKey: ["attendance", "users"],
            }),
        assignCycleMutation,
    };
}

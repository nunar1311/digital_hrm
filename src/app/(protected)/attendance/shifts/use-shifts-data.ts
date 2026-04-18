"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
import { useTimezone } from "@/contexts/timezone-context";

import {
  getShifts,
  getUsersWithAssignmentsPaginated,
  createShift,
  updateShift,
  deleteShift,
  assignShift,
  assignWorkCycle,
  assignWorkCycleToDepartment,
  removeShiftAssignment,
} from "../actions";
import type { Shift, ShiftAssignment, UserBasic, WorkCycle } from "../types";
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
  pendingDate: Date;
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
  totalCount: number;
  loadedCount: number;
  hasMore: boolean;
  loadMore: () => void;
  isFetchingNextPage: boolean;
  isLoadingUsers: boolean;

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
  handleQuickAssign: (shiftId: string, userId: string, date: Date) => void;

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
  handleAssignCycleDept: (values: AssignCycleDeptFormValues) => void;

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
  isFetchingAssignments: boolean;

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
  const { formatDateKey, nowInTimezone } = useTimezone();

  // ─── View State ───
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // pendingDate: UI shows this immediately when navigating (synchronous)
  const [pendingDate, setPendingDate] = useState(new Date());
  // currentDate: used for queries — updated after data loads (deferred)
  const [currentDate, setCurrentDate] = useState(new Date());

  // When pendingDate changes to a new range, update currentDate to trigger query
  // Use a ref to skip initial mount (first render should use same date)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setCurrentDate(pendingDate);
      return;
    }
    setCurrentDate(pendingDate);
    // Reset users when navigating to a new period
    queryClient.resetQueries({ queryKey: ["attendance", "users"] });
  }, [pendingDate, queryClient]);

  // ─── Auto-refresh when day changes (timezone-aware) ───
  // Stable interval ref — never recreated on renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    let lastDateKey = formatDateKey(new Date());
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const currentDateKey = formatDateKey(new Date());
      if (currentDateKey !== lastDateKey) {
        lastDateKey = currentDateKey;
        setPendingDate(nowInTimezone());
        queryClient.invalidateQueries({
          queryKey: ["attendance", "users"],
        });
      }
    }, 60_000); // check every 60s (was 30s — less frequent is enough)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [formatDateKey, nowInTimezone, queryClient]);

  // ─── Shift CRUD Dialog ───
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  // ─── Assign Dialog ───
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // ─── Delete assignment confirm ───
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(
    null,
  );

  // ─── Cycle Assignment Dialog ───
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);

  // Track selected user and date when opening cycle dialog from calendar
  const [assignCycleUserId, setAssignCycleUserId] = useState<string | null>(
    null,
  );
  const [assignCycleDate, setAssignCycleDate] = useState<Date | null>(null);

  // ─── Cycle Assignment by Department Dialog ───
  const [cycleDeptDialogOpen, setCycleDeptDialogOpen] = useState(false);

  // ─── Search ───
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Infinite scroll ────────────────────────────────────────────────────────
  const PAGE_SIZE = 20;
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ─── Department filter ───
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  // Debounce search + reset on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // ─── Week range (pending — drives UI immediately) ───
  const weekStart = useMemo(
    () => startOfWeek(pendingDate, { weekStartsOn: 1 }),
    [pendingDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(pendingDate, { weekStartsOn: 1 }),
    [pendingDate],
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  );

  // ─── Month range (pending — drives UI immediately) ───
  const monthStart = useMemo(
    () => startOfMonth(pendingDate),
    [pendingDate],
  );
  const monthEnd = useMemo(
    () => endOfMonth(pendingDate),
    [pendingDate],
  );
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  // ─── Query ranges (current — used for data fetching) ───
  const queryWeekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const queryWeekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate],
  );
  const queryMonthStart = useMemo(
    () => startOfMonth(currentDate),
    [currentDate],
  );
  const queryMonthEnd = useMemo(
    () => endOfMonth(currentDate),
    [currentDate],
  );

  // ─── Query date range strings (stable — only change on navigation) ───
  const queryRangeStart = useMemo(() => {
    const d = viewMode === "month"
      ? queryMonthStart
      : viewMode === "week"
        ? queryWeekStart
        : currentDate;
    return format(d, "yyyy-MM-dd");
  }, [viewMode, queryMonthStart, queryWeekStart, currentDate]);

  const queryRangeEnd = useMemo(() => {
    const d = viewMode === "month"
      ? queryMonthEnd
      : viewMode === "week"
        ? queryWeekEnd
        : currentDate;
    return format(d, "yyyy-MM-dd");
  }, [viewMode, queryMonthEnd, queryWeekEnd, currentDate]);

  // useInfiniteQuery: fetch users + their assignments together, page by page
  const {
    data: usersPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingUsers,
  } = useInfiniteQuery({
    queryKey: ["attendance", "users", debouncedSearch, departmentIds, queryRangeStart, queryRangeEnd],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getUsersWithAssignmentsPaginated({
        page: pageParam,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        departmentId: departmentIds[0] ?? undefined,
        rangeStart: queryRangeStart,
        rangeEnd: queryRangeEnd,
      });
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Cumulative count of all loaded users across all pages
      const totalLoaded = allPages.reduce((acc, p) => acc + p.users.length, 0);
      return totalLoaded < lastPage.totalCount
        ? (lastPage.page ?? 1) + 1
        : undefined;
    },
  });

  // Flatten all pages into single mergedUsers + mergedAssignments arrays
  const mergedUsers = useMemo(() => {
    if (!usersPages) return users as (UserBasic & { image?: string | null })[];
    const all = usersPages.pages.flatMap((p) => p.users);
    return all as (UserBasic & { image?: string | null })[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPages]);

  const mergedAssignments = useMemo(() => {
    if (!usersPages) return [] as (ShiftAssignment & { user: UserBasic & { image?: string | null } })[];
    const all = usersPages.pages.flatMap((p) => p.assignments ?? []);
    return all as (ShiftAssignment & { user: UserBasic & { image?: string | null } })[];
  }, [usersPages]);

  const mergedLeaveRequests = useMemo(() => {
    if (!usersPages) return [] as Array<{ id: string; userId: string; startDate: string; endDate: string; }>;
    const all = usersPages.pages.flatMap((p) => p.leaveRequests ?? []);
    return all as Array<{ id: string; userId: string; startDate: string; endDate: string; }>;
  }, [usersPages]);

  // Total count from server (accurate, not client-side approximation)
  const totalCount = usersPages?.pages[0]?.totalCount ?? users.length;
  const loadedCount = usersPages?.pages.reduce(
    (acc, page) => acc + page.users.length,
    0,
  ) ?? mergedUsers.length;
  const hasMore = hasNextPage ?? false;

  // Load more: called by IntersectionObserver sentinel
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Formatted range labels (uses pendingDate for immediate UI update) ───
  const rangeLabel = useMemo(() => {
    if (viewMode === "day") {
      return capitalizeFirst(
        format(pendingDate, "EEEE, dd/MM/yyyy", {
          locale: vi,
        }),
      );
    }
    if (viewMode === "month") {
      return capitalizeFirst(
        format(pendingDate, "'Tháng' MM, yyyy", {
          locale: vi,
        }),
      );
    }
    return `${format(weekStart, "dd/MM/yyyy")} – ${format(weekEnd, "dd/MM/yyyy")}`;
  }, [viewMode, pendingDate, weekStart, weekEnd]);

  // ─── Real-time WebSocket ───
  useSocketEvent("shift:updated", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "shifts"],
    });
  });
  useSocketEvent("shift:assigned", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "users"],
    });
  });
  useSocketEvent("department:employee-moved", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "users"],
    });
  });

  // ─── Queries ───
  const {
    data: shifts = initialShifts,
  } = useQuery({
    queryKey: ["attendance", "shifts"],
    queryFn: async () => {
      const res = await getShifts();
      return JSON.parse(JSON.stringify(res)) as Shift[];
    },
    initialData: initialShifts,
  });

  // Assignments now come from the combined infinite query — no separate assignments query needed.
  // isFetchingAssignments just mirrors the initial loading state.
  const assignments = mergedAssignments;
  const isFetchingAssignments = isLoadingUsers;

  // ─── Client-side filtering (now server-side via useInfiniteQuery) ───
  // Since search/department filter is handled server-side, mergedUsers is already filtered.
  const filteredUsers = useMemo(() => {
    return mergedUsers;
  }, [mergedUsers]);

  // ─── Shift color map ───
  // B-02: Use ID hash so colors are stable when shifts are added/removed
  const shiftColorMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof hashShiftIdToColor>>();
    shifts.forEach((s) => map.set(s.id, hashShiftIdToColor(s.id)));
    return map;
  }, [shifts]);

  // ─── Build user → day → assignments map ───
  // Use refs to track previous values — avoid creating new Map references
  // unless the actual assignment data has changed.
  const userAssignmentsRef = useRef<
    Map<string, Map<string, (ShiftAssignment & { user: UserBasic })[]>>
  >(new Map());
  const sortedUsersRef = useRef<(UserBasic & { image?: string | null })[]>([]);

  const calendarData = useMemo(() => {
    // Only show users that pass the current search / department filter
    const allowedUserIds = new Set(filteredUsers.map((u) => u.id));

    const leaves = mergedLeaveRequests;
    const isUserOnLeave = (userId: string, dayStart: Date) => {
        return leaves.some((l) => {
             if (l.userId !== userId) return false;
             const lStart = new Date(l.startDate);
             lStart.setHours(0,0,0,0);
             const lEnd = new Date(l.endDate);
             lEnd.setHours(23,59,59,999);
             return lStart <= dayStart && lEnd >= dayStart;
        });
    };

    // Rebuild userAssignments map (needed because Map keys/values change)
    const userAssignments = userAssignmentsRef.current;
    const userMap = new Map<string, UserBasic & { image?: string | null }>();

    // Reset all existing entries
    userAssignments.forEach((dayMap) => dayMap.clear());
    // Add users that exist in assignments
    for (const a of assignments) {
      if (!allowedUserIds.has(a.userId)) continue;
      if (!userMap.has(a.userId)) {
        userMap.set(a.userId, a.user);
        if (!userAssignments.has(a.userId)) {
          userAssignments.set(a.userId, new Map());
        }
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

          if (isUserOnLeave(a.userId, dayStart)) continue;

          const assignStart = new Date(a.startDate);
          assignStart.setHours(0, 0, 0, 0);
          const assignEnd = a.endDate ? new Date(a.endDate) : null;
          if (assignEnd) assignEnd.setHours(23, 59, 59, 999);

          const covers =
            assignStart <= dayStart &&
            (assignEnd === null || assignEnd >= dayStart);

          if (!covers) continue;

          const dayDiff = differenceInCalendarDays(dayStart, cycleStart);
          const dayIndex = ((dayDiff % totalDays) + totalDays) % totalDays;
          const entry = a.workCycle.entries.find(
            (e) => e.dayIndex === dayIndex,
          );

          if (!entry || entry.isDayOff || !entry.shift) continue;

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
              type: "FIXED",
            },
            shiftId: entry.shift.id,
          };

          const key = formatDateKey(day);
          if (!dayMap.has(key)) dayMap.set(key, []);
          dayMap.get(key)!.push(virtualAssignment);
        }
        continue;
      }

      // ── Regular shift assignment ──
      for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);

        if (isUserOnLeave(a.userId, dayStart)) continue;

        const assignStart = new Date(a.startDate);
        assignStart.setHours(0, 0, 0, 0);
        const assignEnd = a.endDate ? new Date(a.endDate) : null;
        if (assignEnd) assignEnd.setHours(23, 59, 59, 999);

        const covers =
          assignStart <= dayStart &&
          (assignEnd === null || assignEnd >= dayStart);

        if (covers) {
          const key = formatDateKey(day);
          if (!dayMap.has(key)) dayMap.set(key, []);
          dayMap.get(key)!.push(a);
        }
      }
    }

    // Include all filtered users — even those with NO assignments
    for (const u of filteredUsers) {
      if (!userMap.has(u.id)) {
        userMap.set(u.id, u);
        if (!userAssignments.has(u.id)) {
          userAssignments.set(u.id, new Map());
        }
      }
    }

    // Reuse sortedUsers array unless users changed
    const newSortedUsers = Array.from(userMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Check if sortedUsers array is different (compare by IDs)
    const prevIds = sortedUsersRef.current.map((u) => u.id);
    const newIds = newSortedUsers.map((u) => u.id);
    const idsChanged =
      prevIds.length !== newIds.length ||
      prevIds.some((id, i) => id !== newIds[i]);

    if (idsChanged) {
      sortedUsersRef.current = newSortedUsers;
    }

    return {
      sortedUsers: sortedUsersRef.current,
      userAssignments,
    };
  }, [
    assignments,
    mergedLeaveRequests,
    filteredUsers,
    weekDays,
    monthDays,
    viewMode,
    currentDate,
    formatDateKey,
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
            const [sh, sm] = s.startTime.split(":").map(Number);
            const [eh, em] = s.endTime.split(":").map(Number);
            let h = eh - sh + (em - sm) / 60;
            if (h < 0) h += 24;
            // B-03: Clamp per-assignment net hours to avoid negative contributions
            totalWeeklyHours += Math.max(0, h - s.breakMinutes / 60);
          }
        }
      });
      if (hasAssignment) usersWithAssignments.add(userId);
    });

    return {
      totalShiftsDefined: shifts.length,
      activeShifts,
      assignedUsersCount: usersWithAssignments.size,
      unassignedUsersCount: Math.max(0, totalCount - usersWithAssignments.size),
      totalWeeklyHours: Math.max(0, totalWeeklyHours),
      totalAssignments,
    };
  }, [shifts, calendarData.userAssignments, totalCount]);

  // ─── Mutations ───
  const createMutation = useMutation({
    mutationFn: createShift,
    onMutate: async (newShift) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "shifts"] });

      const optimisticShift = {
        id: `optimistic-${Date.now()}`,
        ...newShift,
        isDefault: newShift.isDefault ?? false,
        isActive: newShift.isActive ?? true,
      } as unknown as Shift;

      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["attendance", "shifts"] },
        (old) => {
          if (!old) return [optimisticShift] as Shift[];
          return [...old, optimisticShift] as Shift[];
        },
      );

      return { optimisticShift };
    },
    onSuccess: () => {
      toast.success("Tạo ca mới thành công");
      setIsShiftDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftFormValues }) =>
      updateShift(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "shifts"] });

      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["attendance", "shifts"] },
        (old) => {
          if (!old) return old;
          return old.map((shift) =>
            shift.id === id ? ({ ...shift, ...data } as Shift) : shift,
          );
        },
      );

      return {};
    },
    onSuccess: () => {
      toast.success("Cập nhật ca thành công");
      setIsShiftDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onMutate: async (shiftId) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "shifts"] });

      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["attendance", "shifts"] },
        (old) => {
          if (!old) return old;
          return old.filter((shift) => shift.id !== shiftId);
        },
      );

      return {};
    },
    onSuccess: () => {
      toast.success("Xóa ca thành công");
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
  });

  /** Normalize a local Date to noon UTC for the same calendar date (prevents timezone shift) */
  const toNoonUTC = useCallback(
    (date: Date): Date => {
      const key = formatDateKey(date); // "yyyy-MM-dd" in configured timezone
      return new Date(`${key}T12:00:00Z`);
    },
    [formatDateKey],
  );

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
        toNoonUTC(params.startDate),
        params.endDate ? toNoonUTC(params.endDate) : undefined,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Phân ca thành công");
        setAssignDialogOpen(false);
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
        throw new Error(data.error || "Có lỗi xảy ra");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
  });

  const removeAssignMutationObj = useMutation({
    mutationFn: removeShiftAssignment,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Đã xóa phân ca");
        setDeleteAssignmentId(null);
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
        throw new Error(result.error || "Có lỗi xảy ra");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "shifts"],
      });
    },
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
        toNoonUTC(params.cycleStartDate),
        params.endDate ? toNoonUTC(params.endDate) : undefined,
      ),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Có lỗi xảy ra");
        throw new Error(result.error || "Có lỗi xảy ra");
      }
      toast.success("Gán chu kỳ làm việc thành công");
      setCycleDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["attendance", "users"],
      });
    },
    onError: (err: Error) => toast.error(err.message || "Có lỗi xảy ra"),
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
        toNoonUTC(params.cycleStartDate),
        params.endDate ? toNoonUTC(params.endDate) : undefined,
      ),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Có lỗi xảy ra");
        throw new Error(result.error || "Có lỗi xảy ra");
      }
      let msg = `Đã gán chu kỳ cho ${result.assigned} nhân viên phòng ${result.departmentName}`;
      if ((result.skipped ?? 0) > 0) {
        msg += ` (bỏ qua ${result.skipped} nhân viên đã có chu kỳ)`;
      }
      toast.success(msg);
      setCycleDeptDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["attendance", "users"],
      });
    },
    onError: (err: Error) => toast.error(err.message || "Có lỗi xảy ra"),
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
  // goToday/Prev/Next update pendingDate immediately → UI renders first, query fires after
  const goToday = useCallback(
    () => setPendingDate(nowInTimezone()),
    [nowInTimezone],
  );
  const goPrev = useCallback(() => {
    setPendingDate((d) =>
      viewMode === "month"
        ? subMonths(d, 1)
        : viewMode === "week"
          ? subWeeks(d, 1)
          : addDays(d, -1),
    );
  }, [viewMode]);
  const goNext = useCallback(() => {
    setPendingDate((d) =>
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
      (s) => s.code === values.code && s.id !== editingShift?.id,
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

  const handleQuickAssign = useCallback(
    (shiftId: string, userId: string, date: Date) => {
      assignMutation.mutate({
        userId,
        shiftId,
        startDate: date,
        endDate: date,
      });
    },
    [assignMutation],
  );

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
  const handleAssignCycleDept = (values: AssignCycleDeptFormValues) => {
    assignCycleDeptMutation.mutate({
      departmentId: values.departmentId,
      workCycleId: values.workCycleId,
      cycleStartDate: values.startDate,
      endDate: values.endDate || undefined,
    });
  };

  // ─── Visible days ───
  const visibleDays =
    viewMode === "month"
      ? monthDays
      : viewMode === "week"
        ? weekDays
        : [pendingDate];

  return {
    viewMode,
    setViewMode,
    currentDate,
    pendingDate,
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
    totalCount,
    loadedCount,
    isFetchingNextPage,
    isLoadingUsers,
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
    stats,
    isPending,
    isFetchingAssignments,
    users,
    canManage,
    refreshUsers: () =>
      queryClient.invalidateQueries({
        queryKey: ["attendance", "users"],
      }),
    assignCycleMutation,
  };
}

"use client";

import { useRef, useEffect, useCallback, useMemo, useState, memo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useTimezone } from "@/contexts/timezone-context";
import { Calendar, Clock, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Shift, ShiftAssignment, UserBasic, WorkCycle } from "../types";
import type { ShiftColor, ViewMode } from "./shifts-constants";
import { capitalizeFirst, getInitials } from "./shifts-constants";
import { ShiftCard } from "./shift-card";
import { AssignCycleInlineForm } from "./assign-cycle-inline-form";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeRowVariant = "month" | "week";

interface ShiftCalendarGridProps {
  visibleDays: Date[];
  sortedUsers: (UserBasic & { image?: string | null })[];
  userAssignments: Map<
    string,
    Map<string, (ShiftAssignment & { user: UserBasic })[]>
  >;
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  isFetchingAssignments: boolean;
  isFetchingNextPage: boolean;
  debouncedSearch: string;
  onQuickAssign: (shiftId: string, userId: string, date: Date) => void;
  onRemoveAssignment: (id: string) => void;
  hasMore: boolean;
  loadMore: () => void;
  viewMode: ViewMode;
  workCycles?: WorkCycle[];
  totalCount: number;
  loadedCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHORT_DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShiftCalendarGrid({
  visibleDays,
  sortedUsers,
  userAssignments,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  isFetchingNextPage,
  debouncedSearch,
  onQuickAssign,
  onRemoveAssignment,
  hasMore,
  loadMore,
  viewMode,
  workCycles,
  totalCount,
  loadedCount,
}: ShiftCalendarGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMonthView = viewMode === "month";
  const { isTodayInTimezone, formatDateKey } = useTimezone();

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore) {
        loadMore();
      }
    },
    [hasMore, loadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // ── Precompute day shift counts once for all headers (O(n) → O(1) per header) ──
  const dayShiftCounts = useMemo(() => {
    return computeDayShiftCounts(
      userAssignments,
      visibleDays.map(formatDateKey),
    );
  }, [userAssignments, visibleDays, formatDateKey]);

  // ── Memoized header ─────────────────────────────────────────────────────────
  const dayHeaders = useMemo(
    () =>
      visibleDays.map((day) => (
        <DayHeaderMemo
          key={day.toISOString()}
          day={day}
          dayShiftCounts={dayShiftCounts}
          isMonthView={isMonthView}
          isTodayInTimezone={isTodayInTimezone}
          formatDateKey={formatDateKey}
        />
      )),
    [
      visibleDays,
      dayShiftCounts,
      isMonthView,
      isTodayInTimezone,
      formatDateKey,
    ],
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  const emptyState = useMemo(() => {
    const hasSearch = debouncedSearch.trim();
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        {hasSearch
          ? `Không tìm thấy`
          : isMonthView
            ? "Chưa có nhân viên"
            : "Chưa có nhân viên hoặc phân ca nào."}
      </div>
    );
  }, [debouncedSearch, isMonthView]);

  // ── Row renderer ────────────────────────────────────────────────────────────
  // Each EmployeeRowMemo computes its own stats from dayMap, so only rows whose
  // userId data changed will re-render. QuickAssignCell/Set read from context.
  const userRows = useMemo(
    () =>
      sortedUsers.map((user) => (
        <EmployeeRowMemo
          key={user.id}
          user={user}
          visibleDays={visibleDays}
          userAssignments={userAssignments}
          shifts={shifts}
          shiftColorMap={shiftColorMap}
          canManage={canManage}
          isPending={isPending}
          onQuickAssign={onQuickAssign}
          onRemoveAssignment={onRemoveAssignment}
          variant={isMonthView ? "month" : "week"}
          workCycles={workCycles}
          isTodayInTimezone={isTodayInTimezone}
          formatDateKey={formatDateKey}
        />
      )),
    [
      sortedUsers,
      visibleDays,
      userAssignments,
      shifts,
      shiftColorMap,
      canManage,
      isPending,
      onQuickAssign,
      onRemoveAssignment,
      isMonthView,
      workCycles,
      isTodayInTimezone,
      formatDateKey,
    ],
  );

  return (
    <div className="flex h-full min-w-200 flex-col">
      {isMonthView ? (
        <div className="no-scrollbar overflow-auto h-[calc(100vh-8rem)] relative">
          <div
            className="flex flex-col"
            style={{ minWidth: `${192 + visibleDays.length * 44}px` }}
          >
            {/* Sticky header */}
            <div
              className="grid sticky top-0 z-30 shrink-0 border-b bg-muted"
              style={{
                gridTemplateColumns: `192px repeat(${visibleDays.length}, minmax(44px, 1fr))`,
              }}
            >
              <div className="sticky left-0 top-0 z-30 flex h-11 items-center border-r bg-muted px-3 py-2">
                <span className="text-sm font-semibold text-muted-foreground">
                  Nhân viên
                </span>
              </div>
              {dayHeaders}
            </div>

            {/* Data rows */}
            {sortedUsers.length === 0 ? emptyState : userRows}

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            <div ref={sentinelRef} className="h-0" />

            {/* Summary footer */}
            {sortedUsers.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-muted sticky bottom-0 z-100">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{loadedCount}</strong> /{" "}
                  <strong>{totalCount}</strong> nhân viên
                </p>
                {!hasMore && loadedCount < totalCount && (
                  <span className="text-xs text-muted-foreground">
                    Đã tải hết
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Sticky header */}
          <div
            className="sticky top-0 z-50 grid shrink-0 border-b bg-muted/60 backdrop-blur-sm"
            style={{
              gridTemplateColumns: `240px repeat(${visibleDays.length}, 1fr)`,
            }}
          >
            <div className="flex items-center gap-2 border-r py-3 px-4">
              <span className="text-sm font-semibold text-muted-foreground">
                Nhân viên
              </span>
            </div>
            {dayHeaders}
          </div>

          {/* Scrollable rows */}
          <div className="no-scrollbar flex-1 overflow-y-auto max-h-[calc(100vh-12.5rem)] relative">
            {sortedUsers.length === 0 ? emptyState : userRows}

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            <div ref={sentinelRef} className="h-px" />

            {/* Summary footer */}
            {sortedUsers.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-muted sticky bottom-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{loadedCount}</strong> /{" "}
                  <strong>{totalCount}</strong> nhân viên
                </p>
                {!hasMore && loadedCount < totalCount && (
                  <span className="text-xs text-muted-foreground">
                    Đã tải hết
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Day Column Header ────────────────────────────────────────────────────────

// Precompute shift count per day key to avoid O(n) loop inside each header
function computeDayShiftCounts(
  userAssignments: Map<
    string,
    Map<string, (ShiftAssignment & { user: UserBasic })[]>
  >,
  dayKeys: string[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const key of dayKeys) counts.set(key, 0);
  userAssignments.forEach((dayMap) => {
    dayMap.forEach((assigns, key) => {
      const current = counts.get(key) ?? 0;
      counts.set(key, current + (assigns?.length ?? 0));
    });
  });
  return counts;
}

interface DayHeaderProps {
  day: Date;
  dayShiftCounts: Map<string, number>;
  isMonthView: boolean;
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}

const DayHeaderMemo = memo(function DayHeaderMemo({
  day,
  dayShiftCounts,
  isMonthView,
  isTodayInTimezone,
  formatDateKey,
}: DayHeaderProps) {
  const today = isTodayInTimezone(day);
  const dayOfWeek = isMonthView
    ? SHORT_DAY_NAMES[day.getDay()]
    : capitalizeFirst(format(day, "EEEE", { locale: vi }));
  const dayNum = isMonthView ? format(day, "dd") : format(day, "dd/MM");
  const dow = day.getDay();
  const isSunday = dow === 0;
  const isSaturday = dow === 6;
  const dayKey = formatDateKey(day);
  const dayShiftCount = dayShiftCounts.get(dayKey) ?? 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-r",
        isMonthView ? "px-0.5 py-1" : "px-2 py-2",
        today && "bg-primary/5",
        (isSunday || isSaturday) && "bg-muted",
      )}
    >
      <span
        className={cn(
          "font-medium",
          isMonthView ? "text-[10px]" : "text-xs",
          today
            ? "text-primary"
            : isSunday
              ? "text-destructive"
              : "text-muted-foreground",
        )}
      >
        {dayOfWeek}
      </span>
      <span
        className={cn(
          "font-bold",
          isMonthView ? "text-xs" : "mt-0.5 text-sm",
          today && "rounded-full bg-primary px-1.5 py-0.5 text-white",
        )}
      >
        {dayNum}
      </span>
      {!isMonthView && (
        <span className="mt-0.5 text-[10px] text-muted-foreground">
          {dayShiftCount} ca
        </span>
      )}
    </div>
  );
});

// ─── Employee Row (unified for both views) ────────────────────────────────────

interface EmployeeRowProps {
  user: UserBasic & { image?: string | null };
  visibleDays: Date[];
  userAssignments: Map<
    string,
    Map<string, (ShiftAssignment & { user: UserBasic })[]>
  >;
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  onQuickAssign: (shiftId: string, userId: string, date: Date) => void;
  onRemoveAssignment: (id: string) => void;
  variant: EmployeeRowVariant;
  workCycles?: WorkCycle[];
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}

const EmployeeRowMemo = memo(function EmployeeRowMemo({
  user,
  visibleDays,
  userAssignments,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  onQuickAssign,
  onRemoveAssignment,
  variant,
  workCycles,
  isTodayInTimezone,
  formatDateKey,
}: EmployeeRowProps) {
  const isMonthView = variant === "month";

  const dayMap = useMemo(
    () =>
      userAssignments.get(user.id) ??
      new Map<string, (ShiftAssignment & { user: UserBasic })[]>(),
    [userAssignments, user.id],
  );

  // Compute stats directly from dayMap — avoids prop dependency that forces all
  // rows to rebuild whenever any user's assignments change
  const { totalShifts, totalHours } = useMemo(() => {
    let totalShifts = 0;
    let totalHours = 0;
    dayMap.forEach((dayAssignments) => {
      totalShifts += dayAssignments.length;
      for (const a of dayAssignments) {
        const s = a.shift;
        if (s) {
          const [sh, sm] = s.startTime.split(":").map(Number);
          const [eh, em] = s.endTime.split(":").map(Number);
          let h = eh - sh + (em - sm) / 60;
          if (h < 0) h += 24;
          totalHours += Math.max(0, h - (s.breakMinutes ?? 0) / 60);
        }
      }
    });
    return { totalShifts, totalHours: Math.max(0, totalHours) };
  }, [dayMap]);

  // quickAssignCell comes from context — stable reference via useMemo in provider
  // setQuickAssignCell comes from context — always stable, never new ref
  const dayCells = useMemo(
    () =>
      visibleDays.map((day) => (
        <DayCellMemo
          key={day.toISOString()}
          day={day}
          userId={user.id}
          userName={user.name}
          dayMap={dayMap}
          shifts={shifts}
          shiftColorMap={shiftColorMap}
          canManage={canManage}
          isPending={isPending}
          onQuickAssign={onQuickAssign}
          onRemoveAssignment={onRemoveAssignment}
          isMonthView={isMonthView}
          workCycles={workCycles}
          isTodayInTimezone={isTodayInTimezone}
          formatDateKey={formatDateKey}
        />
      )),
    [
      visibleDays,
      user.id,
      user.name,
      dayMap,
      shifts,
      shiftColorMap,
      canManage,
      isPending,
      onQuickAssign,
      onRemoveAssignment,
      isMonthView,
      workCycles,
      isTodayInTimezone,
      formatDateKey,
    ],
  );

  if (isMonthView) {
    return (
      <div
        className="group/row grid items-stretch border-b last:border-b-0 hover:bg-muted/20"
        style={{
          gridTemplateColumns: `192px repeat(${visibleDays.length}, minmax(44px, 1fr))`,
        }}
      >
        {/* Sticky employee cell */}
        <div className="sticky left-0 z-20 flex min-h-11 items-center gap-2 self-stretch border-r bg-background px-3 py-2 group-hover/row:bg-muted">
          <Avatar className="h-6 w-6 shrink-0">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="text-[10px] font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium leading-tight">
              {user.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalHours > 0
                ? `${totalHours.toFixed(0)}h/${totalShifts} ca`
                : "Chưa phân ca"}
            </p>
          </div>
        </div>
        {dayCells}
      </div>
    );
  }

  return (
    <div
      className="grid border-b hover:bg-muted/20"
      style={{
        gridTemplateColumns: `240px repeat(${visibleDays.length}, 1fr)`,
      }}
    >
      {/* Employee info */}
      <div className="flex items-center gap-3 border-r py-3 px-4">
        <Avatar className="h-8 w-8">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {user.name}{" "}
            <Badge variant="secondary" className="text-[9px] h-5">
              {user.employeeCode}
            </Badge>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalHours > 0
              ? `${totalHours.toFixed(0)}h/${totalShifts} ca`
              : "Chưa phân ca"}
          </p>
        </div>
      </div>
      {dayCells}
    </div>
  );
});

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: Date;
  userId: string;
  userName: string;
  dayMap: Map<string, (ShiftAssignment & { user: UserBasic })[]>;
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  onQuickAssign: (shiftId: string, userId: string, date: Date) => void;
  onRemoveAssignment: (id: string) => void;
  isMonthView: boolean;
  workCycles?: WorkCycle[];
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}

// ─── Add Shift Button (lazy — only computes content when popover opens) ──────
// Receives raw IDs so we don't need to pre-filter in every cell.
const AddShiftButton = memo(function AddShiftButton({
  userId,
  userName,
  day,
  shifts,
  shiftColorMap,
  dayAssignmentShiftIds,
  isPending,
  onQuickAssign,
  workCycles,
  hasAssignments,
}: {
  userId: string;
  userName: string;
  day: Date;
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  dayAssignmentShiftIds: Set<string>;
  isPending: boolean;
  onQuickAssign: (shiftId: string, userId: string, date: Date) => void;
  workCycles?: WorkCycle[];
  hasAssignments: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Compute lazily — only when the popover actually opens
  const content = useMemo(() => {
    if (!isOpen) return null;

    const activeShifts = shifts.filter((s) => s.isActive);
    const hasActiveCycles =
      workCycles && workCycles.filter((c) => c.isActive).length > 0;

    return (
      <Tabs defaultValue="shift" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
          <TabsTrigger value="shift" className="flex items-center gap-1.5">
            <Clock />
            <span>Chọn ca</span>
          </TabsTrigger>
          <TabsTrigger value="cycle" className="flex items-center gap-1.5">
            <Calendar />
            <span>Gán chu kỳ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shift" className="p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Chọn ca cho{" "}
            <span className="font-semibold text-foreground">{userName}</span>
          </p>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {activeShifts.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Chưa có ca nào
              </p>
            ) : (
              activeShifts.map((s) => {
                const color = shiftColorMap.get(s.id);
                const alreadyAssigned = dayAssignmentShiftIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    disabled={alreadyAssigned || isPending}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                      alreadyAssigned && "cursor-not-allowed opacity-50",
                    )}
                    onClick={() => {
                      onQuickAssign(s.id, userId, day);
                      setIsOpen(false);
                    }}
                  >
                    <span
                      className={cn("h-2.5 w-2.5 rounded-full", color?.dot)}
                    />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.startTime} - {s.endTime}
                    </span>
                    {alreadyAssigned && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="cycle" className="p-3">
          {hasActiveCycles ? (
            <AssignCycleInlineForm
              userId={userId}
              userName={userName}
              workCycles={workCycles!.filter((c) => c.isActive)}
              defaultStartDate={day}
              onSuccess={() => setIsOpen(false)}
            />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Chưa có chu kỳ nào được tạo
            </p>
          )}
        </TabsContent>
      </Tabs>
    );
  }, [
    isOpen,
    shifts,
    shiftColorMap,
    dayAssignmentShiftIds,
    isPending,
    onQuickAssign,
    workCycles,
    userId,
    userName,
    day,
  ]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex min-h-4 max-h-6 w-full items-center justify-center rounded border border-dashed border-muted-foreground/30 text-muted-foreground/50 transition-all hover:border-primary/50 hover:text-primary",
            !hasAssignments && "mt-auto",
            "opacity-0 group-hover/cell:opacity-100",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
});

const DayCellMemo = memo(function DayCellMemo({
  day,
  userId,
  userName,
  dayMap,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  onQuickAssign,
  onRemoveAssignment,
  isMonthView,
  workCycles,
  isTodayInTimezone,
  formatDateKey,
}: DayCellProps) {
  const today = isTodayInTimezone(day);
  const dow = day.getDay();
  const isSunday = dow === 0;
  const isSaturday = dow === 6;
  const dayKey = formatDateKey(day);

  const dayAssignments = dayMap.get(dayKey) ?? [];

  // Precompute shift IDs — avoids creating new arrays on every render
  const dayAssignmentShiftIds = useMemo(
    () =>
      new Set(dayAssignments.map((a) => a.shiftId).filter(Boolean) as string[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayAssignments.length, dayAssignments[0]?.shiftId],
  );

  return (
    <div
      className={cn(
        "group/cell relative flex flex-col border-r cursor-pointer",
        isMonthView
          ? "min-h-11 items-center justify-between gap-0.5 p-1"
          : "min-h-8 gap-1 p-1.5",
        today && "bg-primary/5",
        (isSunday || isSaturday) && "bg-muted/40",
      )}
    >
      {isMonthView
        ? dayAssignments.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex flex-wrap items-center justify-center gap-0.5">
                  {dayAssignments.map((a) => {
                    const color = a.shiftId
                      ? shiftColorMap.get(a.shiftId)
                      : undefined;
                    return (
                      <span
                        key={a.id}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          color?.dot ?? "bg-gray-400",
                        )}
                      />
                    );
                  })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {userName} – {format(day, "dd/MM")}
                </p>
                <div className="flex flex-col gap-1">
                  {dayAssignments.map((a) => {
                    const color = a.shiftId
                      ? shiftColorMap.get(a.shiftId)
                      : undefined;
                    const s = a.shift;
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "group flex items-center justify-between rounded-md border px-2 py-1 text-xs",
                          color?.bg,
                          color?.border,
                          color?.text,
                        )}
                      >
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{s?.name}</span>
                          <span className="opacity-70">
                            {s?.startTime} - {s?.endTime}
                          </span>
                        </div>
                        {canManage && (
                          <button
                            className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40"
                            onClick={() => onRemoveAssignment(a.id)}
                          >
                            <X />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )
        : dayAssignments.map((a) => {
            const color = a.shiftId ? shiftColorMap.get(a.shiftId) : undefined;
            return (
              <ShiftCard
                key={a.id}
                assignment={a}
                color={color}
                canManage={canManage}
                onRemove={() => onRemoveAssignment(a.id)}
              />
            );
          })}

      {canManage && (
        <AddShiftButton
          userId={userId}
          userName={userName}
          day={day}
          shifts={shifts}
          shiftColorMap={shiftColorMap}
          dayAssignmentShiftIds={dayAssignmentShiftIds}
          isPending={isPending}
          onQuickAssign={onQuickAssign}
          workCycles={workCycles}
          hasAssignments={dayAssignments.length > 0}
        />
      )}
    </div>
  );
});

// ─── End of ShiftCalendarGrid ───────────────────────────────────────────────

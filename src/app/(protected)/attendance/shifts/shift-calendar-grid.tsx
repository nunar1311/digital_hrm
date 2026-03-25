"use client";

import { useRef, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useTimezone } from "@/contexts/timezone-context";
import { Plus, Check, X, Calendar, Clock } from "lucide-react";
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

interface ShiftCalendarGridProps {
  visibleDays: Date[];
  calendarData: {
    sortedUsers: (UserBasic & { image?: string | null })[];
    userAssignments: Map<
      string,
      Map<string, (ShiftAssignment & { user: UserBasic })[]>
    >;
  };
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  debouncedSearch: string;
  quickAssignCell: { userId: string; date: Date } | null;
  setQuickAssignCell: (cell: { userId: string; date: Date } | null) => void;
  onQuickAssign: (shiftId: string) => void;
  onRemoveAssignment: (id: string) => void;
  getUserShiftCount: (userId: string) => {
    totalShifts: number;
    totalHours: number;
  };
  hasMore: boolean;
  loadMore: () => void;
  viewMode: ViewMode;
  workCycles?: WorkCycle[];
}

export function ShiftCalendarGrid({
  visibleDays,
  calendarData,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  debouncedSearch,
  quickAssignCell,
  setQuickAssignCell,
  onQuickAssign,
  onRemoveAssignment,
  getUserShiftCount,
  hasMore,
  loadMore,
  viewMode,
  workCycles,
}: ShiftCalendarGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMonthView = viewMode === "month";
  const { isTodayInTimezone, formatDateKey } = useTimezone();

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
  return (
    <div className="flex min-w-200 flex-col">
      {isMonthView ? (
        // Month view: sticky employee column + scrollable calendar grid
        <div className="overflow-auto h-[calc(100vh-8rem)] no-scrollbar">
          <div
            className="flex flex-col"
            style={{
              minWidth: `${192 + visibleDays.length * 44}px`,
            }}
          >
            {/* Header row */}
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
              {visibleDays.map((day) => (
                <DayHeader
                  key={day.toISOString()}
                  day={day}
                  calendarData={calendarData}
                  isMonthView={isMonthView}
                  isTodayInTimezone={isTodayInTimezone}
                  formatDateKey={formatDateKey}
                />
              ))}
            </div>
            {/* Data rows */}
            {calendarData.sortedUsers.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                {debouncedSearch.trim()
                  ? `Không tìm thấy`
                  : "Chưa có nhân viên"}
              </div>
            ) : (
              calendarData.sortedUsers.map((user) => (
                <EmployeeRowMonthView
                  key={user.id}
                  user={user}
                  visibleDays={visibleDays}
                  calendarData={calendarData}
                  shifts={shifts}
                  shiftColorMap={shiftColorMap}
                  canManage={canManage}
                  isPending={isPending}
                  quickAssignCell={quickAssignCell}
                  setQuickAssignCell={setQuickAssignCell}
                  onQuickAssign={onQuickAssign}
                  onRemoveAssignment={onRemoveAssignment}
                  getUserShiftCount={getUserShiftCount}
                  workCycles={workCycles}
                  isTodayInTimezone={isTodayInTimezone}
                  formatDateKey={formatDateKey}
                />
              ))
            )}
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-1" />
          </div>
        </div>
      ) : (
        // Week view: original layout with horizontal scroll
        <>
          {/* Header row with day names */}
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
            {visibleDays.map((day) => (
              <DayHeader
                key={day.toISOString()}
                day={day}
                calendarData={calendarData}
                isMonthView={isMonthView}
                isTodayInTimezone={isTodayInTimezone}
                formatDateKey={formatDateKey}
              />
            ))}
          </div>

          {/* Scrollable employee rows */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-13.5rem)] no-scrollbar">
            {calendarData.sortedUsers.length === 0 && (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                {debouncedSearch.trim()
                  ? `Không tìm thấy nhân viên phù hợp với "${debouncedSearch}"`
                  : "Chưa có nhân viên hoặc phân ca nào."}
              </div>
            )}
            {calendarData.sortedUsers.map((user) => (
              <EmployeeRow
                key={user.id}
                user={user}
                visibleDays={visibleDays}
                calendarData={calendarData}
                shifts={shifts}
                shiftColorMap={shiftColorMap}
                canManage={canManage}
                isPending={isPending}
                quickAssignCell={quickAssignCell}
                setQuickAssignCell={setQuickAssignCell}
                onQuickAssign={onQuickAssign}
                onRemoveAssignment={onRemoveAssignment}
                getUserShiftCount={getUserShiftCount}
                isMonthView={isMonthView}
                workCycles={workCycles}
                isTodayInTimezone={isTodayInTimezone}
                formatDateKey={formatDateKey}
              />
            ))}
          </div>
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}
    </div>
  );
}

// ─── Day Column Header ───

const SHORT_DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function DayHeader({
  day,
  calendarData,
  isMonthView,
  isTodayInTimezone,
  formatDateKey,
}: {
  day: Date;
  calendarData: ShiftCalendarGridProps["calendarData"];
  isMonthView: boolean;
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}) {
  const today = isTodayInTimezone(day);
  const dayOfWeek = isMonthView
    ? SHORT_DAY_NAMES[day.getDay()]
    : format(day, "EEEE", { locale: vi });
  const dayNum = isMonthView ? format(day, "dd") : format(day, "dd/MM");
  const isSunday = day.getDay() === 0;
  const isSaturday = day.getDay() === 6;

  // Count total shifts for this day
  let dayShiftCount = 0;
  calendarData.userAssignments.forEach((dayMap) => {
    const key = formatDateKey(day);
    dayShiftCount += dayMap.get(key)?.length ?? 0;
  });

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
        {isMonthView ? dayOfWeek : capitalizeFirst(dayOfWeek)}
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
}

// ─── Employee Row ───

function EmployeeRow({
  user,
  visibleDays,
  calendarData,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  quickAssignCell,
  setQuickAssignCell,
  onQuickAssign,
  onRemoveAssignment,
  getUserShiftCount,
  isMonthView,
  workCycles,
  isTodayInTimezone,
  formatDateKey,
}: {
  user: UserBasic & { image?: string | null };
  visibleDays: Date[];
  calendarData: ShiftCalendarGridProps["calendarData"];
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  quickAssignCell: { userId: string; date: Date } | null;
  setQuickAssignCell: (cell: { userId: string; date: Date } | null) => void;
  onQuickAssign: (shiftId: string) => void;
  onRemoveAssignment: (id: string) => void;
  getUserShiftCount: (userId: string) => {
    totalShifts: number;
    totalHours: number;
  };
  isMonthView: boolean;
  workCycles?: WorkCycle[];
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}) {
  const dayMap =
    calendarData.userAssignments.get(user.id) ??
    new Map<string, (ShiftAssignment & { user: UserBasic })[]>();
  const { totalShifts, totalHours } = getUserShiftCount(user.id);

  return (
    <div
      className="grid border-b hover:bg-muted/20"
      style={{
        gridTemplateColumns: isMonthView
          ? `200px repeat(${visibleDays.length}, minmax(44px, 1fr))`
          : `240px repeat(${visibleDays.length}, 1fr)`,
      }}
    >
      {/* Employee info */}
      <div
        className={cn(
          "flex items-center gap-3 border-r py-3",
          isMonthView ? "gap-2 px-3" : "gap-3 px-4",
        )}
      >
        <Avatar className={cn(isMonthView ? "h-6 w-6" : "h-8 w-8")}>
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium leading-tight",
              isMonthView ? "text-xs" : "text-sm",
            )}
          >
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

      {/* Day cells */}
      {visibleDays.map((day) => (
        <DayCell
          key={day.toISOString()}
          day={day}
          userId={user.id}
          userName={user.name}
          dayAssignments={dayMap.get(formatDateKey(day)) ?? []}
          shifts={shifts}
          shiftColorMap={shiftColorMap}
          canManage={canManage}
          isPending={isPending}
          quickAssignCell={quickAssignCell}
          setQuickAssignCell={setQuickAssignCell}
          onQuickAssign={onQuickAssign}
          onRemoveAssignment={onRemoveAssignment}
          isMonthView={isMonthView}
          workCycles={workCycles}
          isTodayInTimezone={isTodayInTimezone}
        />
      ))}
    </div>
  );
}

// ─── Employee Row for Month View (employee cell + day cells in same row, with sticky employee) ───

function EmployeeRowMonthView({
  user,
  visibleDays,
  calendarData,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  quickAssignCell,
  setQuickAssignCell,
  onQuickAssign,
  onRemoveAssignment,
  getUserShiftCount,
  workCycles,
  isTodayInTimezone,
  formatDateKey,
}: {
  user: UserBasic & { image?: string | null };
  visibleDays: Date[];
  calendarData: ShiftCalendarGridProps["calendarData"];
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  quickAssignCell: { userId: string; date: Date } | null;
  setQuickAssignCell: (cell: { userId: string; date: Date } | null) => void;
  onQuickAssign: (shiftId: string) => void;
  onRemoveAssignment: (id: string) => void;
  getUserShiftCount: (userId: string) => {
    totalShifts: number;
    totalHours: number;
  };
  workCycles?: WorkCycle[];
  isTodayInTimezone: (date: Date) => boolean;
  formatDateKey: (date: Date) => string;
}) {
  const dayMap =
    calendarData.userAssignments.get(user.id) ??
    new Map<string, (ShiftAssignment & { user: UserBasic })[]>();
  const { totalShifts, totalHours } = getUserShiftCount(user.id);

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
      {/* Day cells */}
      {visibleDays.map((day) => (
        <DayCell
          key={day.toISOString()}
          day={day}
          userId={user.id}
          userName={user.name}
          dayAssignments={dayMap.get(formatDateKey(day)) ?? []}
          shifts={shifts}
          shiftColorMap={shiftColorMap}
          canManage={canManage}
          isPending={isPending}
          quickAssignCell={quickAssignCell}
          setQuickAssignCell={setQuickAssignCell}
          onQuickAssign={onQuickAssign}
          onRemoveAssignment={onRemoveAssignment}
          isMonthView={true}
          workCycles={workCycles}
          isTodayInTimezone={isTodayInTimezone}
        />
      ))}
    </div>
  );
}

// ─── Day Cell (shift cards + quick-assign popover) ───

function DayCell({
  day,
  userId,
  userName,
  dayAssignments,
  shifts,
  shiftColorMap,
  canManage,
  isPending,
  quickAssignCell,
  setQuickAssignCell,
  onQuickAssign,
  onRemoveAssignment,
  isMonthView,
  workCycles,
  isTodayInTimezone,
}: {
  day: Date;
  userId: string;
  userName: string;
  dayAssignments: (ShiftAssignment & { user: UserBasic })[];
  shifts: Shift[];
  shiftColorMap: Map<string, ShiftColor>;
  canManage: boolean;
  isPending: boolean;
  quickAssignCell: { userId: string; date: Date } | null;
  setQuickAssignCell: (cell: { userId: string; date: Date } | null) => void;
  onQuickAssign: (shiftId: string) => void;
  onRemoveAssignment: (id: string) => void;
  isMonthView: boolean;
  workCycles?: WorkCycle[];
  isTodayInTimezone: (date: Date) => boolean;
}) {
  const today = isTodayInTimezone(day);
  const isSunday = day.getDay() === 0;
  const isSaturday = day.getDay() === 6;

  return (
    <div
      className={cn(
        "group/cell relative flex flex-col border-r",
        isMonthView
          ? "min-h-11 items-center justify-between gap-0.5 p-1"
          : "min-h-8 gap-1 p-1.5",
        today && "bg-primary/5",
        (isSunday || isSaturday) && "bg-muted/40",
      )}
    >
      {/* Shift assignment cards / dots */}
      {isMonthView
        ? // Compact month view: colored dots with tooltip
          dayAssignments.length > 0 && (
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
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )
        : // Full view: shift cards
          dayAssignments.map((a) => {
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

      {/* Add button (visible on hover) */}
      {canManage && (
        <Popover
          open={
            quickAssignCell?.userId === userId &&
            isSameDay(quickAssignCell?.date ?? new Date(0), day)
          }
          onOpenChange={(open) => {
            if (!open) setQuickAssignCell(null);
          }}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex min-h-4 max-h-6 w-full items-center justify-center rounded border border-dashed border-muted-foreground/30 text-muted-foreground/50 transition-all hover:border-primary/50 hover:text-primary",
                dayAssignments.length === 0 && "mt-auto",
                "opacity-0 group-hover/cell:opacity-100",
              )}
              onClick={() =>
                setQuickAssignCell({
                  userId,
                  date: day,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Tabs defaultValue="shift" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                <TabsTrigger
                  value="shift"
                  className="flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Chọn ca</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cycle"
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Gán chu kỳ</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Chọn ca */}
              <TabsContent value="shift" className="p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Chọn ca cho{" "}
                  <span className="font-semibold text-foreground">
                    {userName}
                  </span>
                </p>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {shifts
                    .filter((s) => s.isActive)
                    .map((s) => {
                      const c = shiftColorMap.get(s.id);
                      const alreadyAssigned = dayAssignments.some(
                        (da) => da.shiftId === s.id,
                      );
                      return (
                        <button
                          key={s.id}
                          disabled={alreadyAssigned || isPending}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                            alreadyAssigned && "cursor-not-allowed opacity-50",
                          )}
                          onClick={() => onQuickAssign(s.id)}
                        >
                          <span
                            className={cn("h-2.5 w-2.5 rounded-full", c?.dot)}
                          />
                          <span className="flex-1 truncate">{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {s.startTime} - {s.endTime}
                          </span>
                          {alreadyAssigned && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  {shifts.filter((s) => s.isActive).length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      Chưa có ca nào
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 2: Gán chu kỳ */}
              <TabsContent value="cycle" className="p-3">
                {workCycles &&
                workCycles.filter((c: WorkCycle) => c.isActive).length > 0 ? (
                  <AssignCycleInlineForm
                    userId={userId}
                    userName={userName}
                    workCycles={workCycles.filter((c: WorkCycle) => c.isActive)}
                    defaultStartDate={day}
                    onSuccess={() => setQuickAssignCell(null)}
                  />
                ) : (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Chưa có chu kỳ nào được tạo
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

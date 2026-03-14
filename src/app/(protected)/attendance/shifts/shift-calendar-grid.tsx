"use client";

import { useRef, useEffect, useCallback } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Check, Calendar as CalendarIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Shift, ShiftAssignment, UserBasic } from "../types";
import type { ShiftColor, ViewMode } from "./shifts-constants";
import { capitalizeFirst, getInitials } from "./shifts-constants";
import { ShiftCard } from "./shift-card";

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
    setQuickAssignCell: (
        cell: { userId: string; date: Date } | null,
    ) => void;
    onQuickAssign: (shiftId: string) => void;
    onRemoveAssignment: (id: string) => void;
    getUserShiftCount: (userId: string) => {
        totalShifts: number;
        totalHours: number;
    };
    hasMore: boolean;
    loadMore: () => void;
    viewMode: ViewMode;
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
}: ShiftCalendarGridProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const isMonthView = viewMode === "month";

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
        <div className="flex h-full min-w-200 flex-col overflow-x-auto">
            {/* Header row with day names */}
            <div
                className="sticky top-0 z-10 grid shrink-0 border-b bg-muted/60 backdrop-blur-sm"
                style={{
                    gridTemplateColumns: isMonthView
                        ? `200px repeat(${visibleDays.length}, minmax(44px, 1fr))`
                        : `240px repeat(${visibleDays.length}, 1fr)`,
                }}
            >
                <div
                    className={cn(
                        "flex items-center gap-2 border-r py-3",
                        isMonthView ? "px-3" : "px-4",
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
                    />
                ))}
            </div>

            {/* Scrollable employee rows */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-17rem)] no-scrollbar">
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
                    />
                ))}
                {/* Sentinel for infinite scroll */}
                <div ref={sentinelRef} className="h-1" />
            </div>
        </div>
    );
}

// ─── Day Column Header ───

const SHORT_DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function DayHeader({
    day,
    calendarData,
    isMonthView,
}: {
    day: Date;
    calendarData: ShiftCalendarGridProps["calendarData"];
    isMonthView: boolean;
}) {
    const today = isToday(day);
    const dayOfWeek = isMonthView
        ? SHORT_DAY_NAMES[day.getDay()]
        : format(day, "EEEE", { locale: vi });
    const dayNum = isMonthView
        ? format(day, "dd")
        : format(day, "dd/MM");
    const isSunday = day.getDay() === 0;
    const isSaturday = day.getDay() === 6;

    // Count total shifts for this day
    let dayShiftCount = 0;
    calendarData.userAssignments.forEach((dayMap) => {
        const key = format(day, "yyyy-MM-dd");
        dayShiftCount += dayMap.get(key)?.length ?? 0;
    });

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center border-r",
                isMonthView ? "px-0.5 py-1" : "px-2 py-2",
                today && "bg-primary/5",
                (isSunday || isSaturday) && "bg-muted/80",
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
                    today &&
                        "rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground",
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
}: {
    user: UserBasic & { image?: string | null };
    visibleDays: Date[];
    calendarData: ShiftCalendarGridProps["calendarData"];
    shifts: Shift[];
    shiftColorMap: Map<string, ShiftColor>;
    canManage: boolean;
    isPending: boolean;
    quickAssignCell: { userId: string; date: Date } | null;
    setQuickAssignCell: (
        cell: { userId: string; date: Date } | null,
    ) => void;
    onQuickAssign: (shiftId: string) => void;
    onRemoveAssignment: (id: string) => void;
    getUserShiftCount: (userId: string) => {
        totalShifts: number;
        totalHours: number;
    };
    isMonthView: boolean;
}) {
    const dayMap =
        calendarData.userAssignments.get(user.id) ??
        new Map<string, (ShiftAssignment & { user: UserBasic })[]>();
    const { totalShifts, totalHours } = getUserShiftCount(user.id);

    return (
        <div
            className="grid border-b last:border-b-0 hover:bg-muted/20"
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
                <Avatar
                    className={cn(
                        isMonthView ? "h-6 w-6" : "h-8 w-8",
                    )}
                >
                    {user.image && (
                        <AvatarImage
                            src={user.image}
                            alt={user.name}
                        />
                    )}
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
                    dayAssignments={
                        dayMap.get(format(day, "yyyy-MM-dd")) ?? []
                    }
                    shifts={shifts}
                    shiftColorMap={shiftColorMap}
                    canManage={canManage}
                    isPending={isPending}
                    quickAssignCell={quickAssignCell}
                    setQuickAssignCell={setQuickAssignCell}
                    onQuickAssign={onQuickAssign}
                    onRemoveAssignment={onRemoveAssignment}
                    isMonthView={isMonthView}
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
    setQuickAssignCell: (
        cell: { userId: string; date: Date } | null,
    ) => void;
    onQuickAssign: (shiftId: string) => void;
    onRemoveAssignment: (id: string) => void;
    isMonthView: boolean;
}) {
    const today = isToday(day);
    const isSunday = day.getDay() === 0;
    const isSaturday = day.getDay() === 6;

    return (
        <div
            className={cn(
                "group relative flex flex-col border-r",
                isMonthView
                    ? "min-h-10 items-center justify-center gap-0.5 p-0.5"
                    : "min-h-18 gap-1 p-1.5",
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
                                          ? shiftColorMap.get(
                                                a.shiftId,
                                            )
                                          : undefined;
                                      return (
                                          <span
                                              key={a.id}
                                              className={cn(
                                                  "h-2.5 w-2.5 rounded-full",
                                                  color?.dot ??
                                                      "bg-gray-400",
                                              )}
                                          />
                                      );
                                  })}
                              </button>
                          </PopoverTrigger>
                          <PopoverContent
                              className="w-56 p-2"
                              align="start"
                          >
                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  {userName} – {format(day, "dd/MM")}
                              </p>
                              <div className="flex flex-col gap-1">
                                  {dayAssignments.map((a) => {
                                      const color = a.shiftId
                                          ? shiftColorMap.get(
                                                a.shiftId,
                                            )
                                          : undefined;
                                      const s = a.shift;
                                      return (
                                          <div
                                              key={a.id}
                                              className={cn(
                                                  "flex items-center justify-between rounded-md border px-2 py-1 text-xs",
                                                  color?.bg,
                                                  color?.border,
                                                  color?.text,
                                              )}
                                          >
                                              <span className="font-medium">
                                                  {s?.name}
                                              </span>
                                              <span>
                                                  {s?.startTime} -{" "}
                                                  {s?.endTime}
                                              </span>
                                          </div>
                                      );
                                  })}
                              </div>
                          </PopoverContent>
                      </Popover>
                  )
                : // Full view: shift cards
                  dayAssignments.map((a) => {
                      const color = a.shiftId
                          ? shiftColorMap.get(a.shiftId)
                          : undefined;
                      return (
                          <ShiftCard
                              key={a.id}
                              assignment={a}
                              color={color}
                              canManage={canManage}
                              onRemove={() =>
                                  onRemoveAssignment(a.id)
                              }
                          />
                      );
                  })}

            {/* Add button (visible on hover) */}
            {canManage && (
                <Popover
                    open={
                        quickAssignCell?.userId === userId &&
                        isSameDay(
                            quickAssignCell?.date ?? new Date(0),
                            day,
                        )
                    }
                    onOpenChange={(open) => {
                        if (!open) setQuickAssignCell(null);
                    }}
                >
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "flex h-6 w-full items-center justify-center rounded border border-dashed border-muted-foreground/30 text-muted-foreground/50 transition-all hover:border-primary/50 hover:text-primary",
                                dayAssignments.length === 0 &&
                                    "mt-auto",
                                "opacity-0 group-hover:opacity-100",
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
                    <PopoverContent
                        className="w-56 p-2"
                        align="start"
                    >
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Chọn ca cho{" "}
                            <span className="font-semibold text-foreground">
                                {userName}
                            </span>
                        </p>
                        <div className="flex flex-col gap-1">
                            {shifts
                                .filter((s) => s.isActive)
                                .map((s) => {
                                    const c = shiftColorMap.get(s.id);
                                    const alreadyAssigned =
                                        dayAssignments.some(
                                            (da) =>
                                                da.shiftId === s.id,
                                        );
                                    return (
                                        <button
                                            key={s.id}
                                            disabled={
                                                alreadyAssigned ||
                                                isPending
                                            }
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                                                alreadyAssigned &&
                                                    "cursor-not-allowed opacity-50",
                                            )}
                                            onClick={() =>
                                                onQuickAssign(s.id)
                                            }
                                        >
                                            <span
                                                className={cn(
                                                    "h-2.5 w-2.5 rounded-full",
                                                    c?.dot,
                                                )}
                                            />
                                            <span className="flex-1 truncate">
                                                {s.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {s.startTime} -{" "}
                                                {s.endTime}
                                            </span>
                                            {alreadyAssigned && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </button>
                                    );
                                })}
                            {shifts.filter((s) => s.isActive)
                                .length === 0 && (
                                <p className="py-2 text-center text-xs text-muted-foreground">
                                    Chưa có ca nào
                                </p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

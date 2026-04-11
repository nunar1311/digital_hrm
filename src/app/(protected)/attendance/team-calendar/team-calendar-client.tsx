"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarOff,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  LayoutList,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getTeamLeaveCalendar,
  getTodayAbsentees,
  getDepartmentsForFilter,
  type TeamLeaveEntry,
  type DepartmentOption,
} from "./actions";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isoToDate(iso: string) {
  return new Date(iso);
}

function dateInRange(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// ─────────────────────────────────────────────────────────────
// Today's Absentees Card
// ─────────────────────────────────────────────────────────────

function TodayAbsenteesCard({
  departmentId,
}: {
  departmentId: string | undefined;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["team-calendar-today", departmentId],
    queryFn: () => getTodayAbsentees(departmentId || undefined),
    staleTime: 60_000,
  });

  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className="border-2 border-dashed shrink-0 p-3">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-semibold flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            <p>Vắng mặt hôm nay</p>
          </div>
          <span className="text-xs font-normal text-muted-foreground ">
            {todayStr}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <RefreshCw className="size-3.5 animate-spin" />
            Đang tải...
          </div>
        ) : !data || data.total === 0 ? (
          <div className="flex items-center gap-1 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500" />
            Tất cả nhân viên đều có mặt hôm nay
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/10">
                <CalendarOff className="size-3 mr-1" />
                {data.approved} đã duyệt
              </Badge>
              {data.pending > 0 && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200"
                >
                  <Clock className="size-3 mr-1" />
                  {data.pending} chờ duyệt
                </Badge>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {data.employees.map((emp) => (
                <div
                  key={emp.userId}
                  className="flex items-center gap-2.5 py-1"
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage src={emp.userAvatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(emp.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {emp.userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {emp.leaveTypeName}
                      {emp.departmentName && ` • ${emp.departmentName}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      emp.status === "APPROVED"
                        ? "text-red-600 border-red-200"
                        : "text-amber-600 border-amber-200",
                    )}
                  >
                    {emp.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// List View
// ─────────────────────────────────────────────────────────────

function ListView({
  entries,
  year,
  month,
}: {
  entries: TeamLeaveEntry[];
  year: number;
  month: number;
}) {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const days: Date[] = [];
  const cur = new Date(periodStart);
  while (cur <= periodEnd) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const dayEntries = useMemo(() => {
    return days.map((day) => ({
      date: day,
      entries: entries.filter((e) =>
        dateInRange(day, isoToDate(e.startDate), isoToDate(e.endDate)),
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, year, month]);

  const nonEmptyDays = dayEntries.filter((d) => d.entries.length > 0);

  if (nonEmptyDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <CalendarDays className="size-10 opacity-30" />
        <p className="text-sm">Không có ai nghỉ phép trong tháng này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nonEmptyDays.map(({ date, entries: dayList }) => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return (
          <div key={date.toISOString()}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-md",
                  isWeekend
                    ? "bg-red-50 text-red-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {date.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </div>
              <div className="flex-1 border-t border-dashed" />
              <Badge variant="secondary" className="text-[10px]">
                {dayList.length} người
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dayList.map((entry) => (
                <div
                  key={`${entry.id}-${date.toISOString()}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors",
                    entry.status === "APPROVED"
                      ? "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
                      : "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30",
                  )}
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={entry.userAvatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(entry.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs">
                      {entry.userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {entry.leaveTypeName}
                      {entry.departmentName && ` · ${entry.departmentName}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      entry.status === "APPROVED"
                        ? "text-red-600 border-red-200"
                        : "text-amber-600 border-amber-200",
                    )}
                  >
                    {entry.totalDays}N
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar Cell
// ─────────────────────────────────────────────────────────────

function CalendarCell({
  date,
  entries,
  isCurrentMonth,
  isToday,
}: {
  date: Date;
  entries: TeamLeaveEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
}) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const approved = entries.filter((e) => e.status === "APPROVED");
  const pending = entries.filter((e) => e.status === "PENDING");

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={cn(
          "min-h-[95px] p-1.5 border-b border-r last:border-r-0 transition-colors",
          !isCurrentMonth && "bg-muted/20 opacity-50",
          isCurrentMonth && isWeekend && "bg-red-50/30 dark:bg-red-950/10",
          isToday && "bg-blue-50/50 dark:bg-blue-950/20",
          entries.length > 0 && isCurrentMonth && "cursor-default",
        )}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
              isToday && "bg-primary text-primary-foreground",
              !isToday && isWeekend && "text-red-500",
              !isToday && !isWeekend && "text-foreground",
            )}
          >
            {date.getDate()}
          </span>
          {entries.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {entries.length}
            </span>
          )}
        </div>

        {/* Leave entries */}
        <div className="space-y-0.5">
          {approved.slice(0, 2).map((entry) => (
            <Tooltip key={entry.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 truncate cursor-default hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
                  <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">{entry.userName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="font-semibold">{entry.userName}</p>
                <p className="text-xs opacity-80">{entry.leaveTypeName}</p>
                {entry.departmentName && (
                  <p className="text-xs opacity-60">{entry.departmentName}</p>
                )}
                {entry.reason && (
                  <p className="text-xs mt-1 opacity-70 italic">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}
                <p className="text-xs mt-1">
                  {new Date(entry.startDate).toLocaleDateString("vi-VN")} →{" "}
                  {new Date(entry.endDate).toLocaleDateString("vi-VN")} (
                  {entry.totalDays} ngày)
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {pending.slice(0, approved.length >= 2 ? 0 : 1).map((entry) => (
            <Tooltip key={entry.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 truncate cursor-default hover:bg-amber-200 transition-colors">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{entry.userName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="font-semibold">{entry.userName}</p>
                <p className="text-xs opacity-80">
                  {entry.leaveTypeName} · Chờ duyệt
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {entries.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-1 py-0.5 rounded text-[10px] bg-muted text-muted-foreground text-center cursor-default hover:bg-muted/80 transition-colors">
                  +{entries.length - 3} người khác
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                <p className="font-semibold mb-1">
                  Tất cả {entries.length} người nghỉ:
                </p>
                {entries.map((e) => (
                  <p key={e.id} className="text-xs opacity-80">
                    • {e.userName} ({e.leaveTypeName})
                  </p>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar Grid View
// ─────────────────────────────────────────────────────────────

function CalendarGridView({
  entries,
  year,
  month,
}: {
  entries: TeamLeaveEntry[];
  year: number;
  month: number;
}) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const calStart = new Date(firstDay);
  calStart.setDate(calStart.getDate() - calStart.getDay());

  const cells: Date[] = [];
  const cur = new Date(calStart);
  while (cells.length < 42) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getEntriesForDate = useCallback(
    (date: Date) =>
      entries.filter((e) =>
        dateInRange(date, isoToDate(e.startDate), isoToDate(e.endDate)),
      ),
    [entries],
  );

  return (
    <div className="overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-center text-xs font-semibold py-2 border-b border-r last:border-r-0",
              (i === 0 || i === 6) && "text-red-500",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const isCurrentMonth = date >= firstDay && date <= lastDay;
          const isToday = date.getTime() === today.getTime();
          const dayEntries = getEntriesForDate(date);

          return (
            <CalendarCell
              key={date.toISOString()}
              date={date}
              entries={dayEntries}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar Panel
// ─────────────────────────────────────────────────────────────

function SidebarPanel({
  departmentId,
  year,
  month,
  setMonth,
  setYear,
}: {
  departmentId: string | undefined;
  year: number;
  month: number;
  setMonth: (m: number) => void;
  setYear: (fn: (y: number) => number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 w-[250px] shrink-0">
      <TodayAbsenteesCard departmentId={departmentId} />

      {/* Quick year navigator */}
      <Card className="p-3 border-0 shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-sm font-semibold">Năm {year}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-4 gap-1">
            {MONTHS_VI.map((m, i) => (
              <Button
                key={m}
                onClick={() => setMonth(i + 1)}
                variant={month === i + 1 ? "default" : "ghost"}
                className={cn(
                  "py-1.5 rounded-md transition-colors",
                  month === i + 1
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
                size={"sm"}
              >
                T{i + 1}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <Button onClick={() => setYear((y) => y - 1)} size={"icon-xs"}>
              <ChevronLeft />
            </Button>
            <span className="text-xs font-bold">{year}</span>
            <Button onClick={() => setYear((y) => y + 1)} size={"icon-xs"}>
              <ChevronRight />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

interface TeamCalendarClientProps {
  initialDepartments: DepartmentOption[];
  userRole: string;
  userDepartmentId: string | null;
}

export function TeamCalendarClient({
  initialDepartments,
  userRole,
  userDepartmentId,
}: TeamCalendarClientProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [departmentId, setDepartmentId] = useState<string>(
    userRole === "DEPT_MANAGER" || userRole === "TEAM_LEADER"
      ? (userDepartmentId ?? "all")
      : "all",
  );
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const isDeptManager =
    userRole === "DEPT_MANAGER" || userRole === "TEAM_LEADER";

  const { data: departments = initialDepartments } = useQuery({
    queryKey: ["departments-for-calendar"],
    queryFn: getDepartmentsForFilter,
    initialData: initialDepartments,
    staleTime: 300_000,
  });

  const {
    data: entries = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["team-leave-calendar", year, month, departmentId],
    queryFn: () =>
      getTeamLeaveCalendar({
        year,
        month,
        departmentId: departmentId !== "all" ? departmentId : undefined,
      }),
    staleTime: 60_000,
  });

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  // Stats
  const approvedCount = entries.filter((e) => e.status === "APPROVED").length;
  const pendingCount = entries.filter((e) => e.status === "PENDING").length;
  const uniqueEmployees = new Set(entries.map((e) => e.userId)).size;

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col gap-2">
        {/* ─── Header ─── */}
        <section className="border-b">
          <header className="p-2 flex items-center gap-2 h-10">
            <h1 className="font-bold truncate">Lịch Nghỉ Phép Team</h1>
          </header>
        </section>

        {/* ─── Control bar ─── */}
        <div className="flex items-center justify-between gap-2 px-4">
          {/* Month navigation */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={goToPrevMonth}
              title="Tháng trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-sm font-bold min-w-[120px] text-center">
              {MONTHS_VI[month - 1]} {year}
            </h2>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={goToNextMonth}
              title="Tháng sau"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={goToToday}
              disabled={isCurrentMonth}
            >
              Hôm nay
            </Button>
            {isFetching && (
              <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Stats pills */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs bg-muted/60 rounded-full px-3 py-1">
                <span className="font-medium">{uniqueEmployees}</span>
                <span className="text-muted-foreground">nhân viên nghỉ</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 rounded-full px-3 py-1 dark:bg-red-950/20">
                <span className="size-1.5 rounded-full bg-red-500" />
                <span className="font-medium">{approvedCount}</span>
                <span>đã duyệt</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-600 rounded-full px-3 py-1 dark:bg-amber-950/20">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span className="font-medium">{pendingCount}</span>
                  <span>chờ duyệt</span>
                </div>
              )}
            </div>

            {/* Department filter */}
            {!isDeptManager && (
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-44 h-6! text-xs">
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View mode toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="icon-xs"
                className="rounded-none"
                onClick={() => setViewMode("calendar")}
                tooltip="Lịch"
              >
                <CalendarDays className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon-xs"
                className="rounded-none"
                onClick={() => setViewMode("list")}
                tooltip="Danh sách"
              >
                <LayoutList className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Main content area ─── */}
        <div className="min-h-0 flex-1 overflow-hidden border-t">
          <div className="h-full flex gap-0 overflow-hidden">
            {/* Calendar / List panel */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                  <RefreshCw className="size-4 animate-spin" />
                  Đang tải lịch...
                </div>
              ) : viewMode === "calendar" ? (
                <CalendarGridView entries={entries} year={year} month={month} />
              ) : (
                <ListView entries={entries} year={year} month={month} />
              )}
            </div>

            {/* Sidebar */}
            <div className="border-l overflow-y-auto p-2">
              <SidebarPanel
                departmentId={departmentId !== "all" ? departmentId : undefined}
                year={year}
                month={month}
                setMonth={setMonth}
                setYear={setYear}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

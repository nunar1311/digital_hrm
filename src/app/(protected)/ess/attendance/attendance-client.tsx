"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  type LucideIcon,
  ChevronLeft,
  ChevronRight,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getMyAttendanceHistory } from "../actions";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  earlyMinutes: number;
  shift: Shift | null;
}

export interface AttendanceSummary {
  standardDays: number;
  totalWorkDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  totalOtHours: number;
}

interface ESSAttendanceClientProps {
  initialData: {
    attendances: AttendanceRecord[];
    summary: AttendanceSummary | null;
  };
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = [
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

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function formatTime(dateStr: string | null) {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getDayOfWeek(dateStr: string) {
  return new Date(dateStr).getDay();
}

function isWeekend(dateStr: string) {
  const d = getDayOfWeek(dateStr);
  return d === 0 || d === 6;
}

function buildCalendarWeeks(attendances: AttendanceRecord[]) {
  const sorted = [...attendances].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  if (sorted.length === 0) return [];

  const weeks: (AttendanceRecord | null)[][] = [];
  let currentWeek: (AttendanceRecord | null)[] = [];

  const firstDayOfWeek = getDayOfWeek(sorted[0].date);
  if (firstDayOfWeek !== 1) {
    for (let i = 1; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
  }

  for (const record of sorted) {
    currentWeek.push(record);
    const dayOfWeek = getDayOfWeek(record.date);
    if (dayOfWeek === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

const DEFAULT_SUMMARY: AttendanceSummary = {
  standardDays: 0,
  totalWorkDays: 0,
  lateDays: 0,
  earlyLeaveDays: 0,
  leaveDays: 0,
  unpaidLeaveDays: 0,
  totalOtHours: 0,
};

const CALENDAR_STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-50 border-emerald-200",
  ABSENT: "bg-red-50 border-red-200",
  ON_LEAVE: "bg-blue-50 border-blue-200",
  HOLIDAY: "bg-purple-50 border-purple-200",
};

const CALENDAR_ICON_COLORS: Record<string, string> = {
  PRESENT: "text-emerald-600",
  ABSENT: "text-red-600",
  LATE: "text-amber-600",
  EARLY_LEAVE: "text-orange-600",
  LATE_AND_EARLY: "text-red-600",
  ON_LEAVE: "text-blue-600",
  HOLIDAY: "text-purple-600",
};

const LIST_ICON_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-600",
  ABSENT: "bg-red-100 text-red-600",
  LATE: "bg-amber-100 text-amber-600",
  LATE_AND_EARLY: "bg-amber-100 text-amber-600",
  ON_LEAVE: "bg-blue-100 text-blue-600",
  HOLIDAY: "bg-purple-100 text-purple-600",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: LucideIcon;
  }
> = {
  PRESENT: {
    label: "Có mặt",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  LATE: {
    label: "Đi trễ",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  EARLY_LEAVE: {
    label: "Về sớm",
    variant: "secondary",
    className: "bg-orange-100 text-orange-800",
    icon: Clock,
  },
  LATE_AND_EARLY: {
    label: "Trễ & Sớm",
    variant: "destructive",
    className: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  ABSENT: { label: "Vắng mặt", variant: "destructive", icon: XCircle },
  HALF_DAY: { label: "Nửa ngày", variant: "outline", icon: Clock },
  ON_LEAVE: {
    label: "Nghỉ phép",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800",
    icon: Calendar,
  },
  HOLIDAY: {
    label: "Ngày lễ",
    variant: "outline",
    className: "bg-purple-100 text-purple-800",
    icon: Calendar,
  },
};

function AttendanceCalendar({
  weeks,
  isLoading,
}: {
  weeks: (AttendanceRecord | null)[][];
  isLoading: boolean;
}) {
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  if (weeks.length === 0)
    return (
      <div className="text-center py-12">
        <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Không có dữ liệu chấm công</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {DAY_LABELS.map((day, i) => (
          <div
            key={i}
            className={cn(
              "text-center text-xs font-medium py-2",
              (i === 5 || i === 6) && "text-muted-foreground",
            )}
          >
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-2">
          {week.map((record, dayIndex) => {
            if (!record)
              return (
                <div key={`empty-${dayIndex}`} className="aspect-square" />
              );
            const weekend = isWeekend(record.date);
            const bgClass = CALENDAR_STATUS_COLORS[record.status] ?? "";
            const iconColor =
              CALENDAR_ICON_COLORS[record.status] ?? "text-muted-foreground";

            return (
              <div
                key={record.id}
                className={cn(
                  "aspect-square rounded-lg border p-2 flex flex-col items-center justify-center transition-all hover:shadow-md cursor-pointer",
                  weekend && "bg-muted/30",
                  bgClass,
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    weekend && "text-muted-foreground",
                  )}
                >
                  {new Date(record.date).getDate()}
                </span>
                <div className={cn("mt-1", iconColor)}>
                  {record.status === "PRESENT" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : record.status === "ABSENT" ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AttendanceList({
  records,
  isLoading,
}: {
  records: AttendanceRecord[];
  isLoading: boolean;
}) {
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  if (records.length === 0)
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không có dữ liệu</p>
      </div>
    );

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-3">
      {sorted.map((record) => {
        const status = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.PRESENT;
        const iconColor =
          LIST_ICON_COLORS[record.status] ?? "bg-muted text-muted-foreground";

        return (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", iconColor)}>
                {status.icon && <status.icon className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium">{formatDate(record.date)}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>Vào: {formatTime(record.checkIn)}</span>
                  <span>-</span>
                  <span>Ra: {formatTime(record.checkOut)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {record.shift && (
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Ca: {record.shift.name}
                </div>
              )}
              <Badge variant={status.variant} className={status.className}>
                {status.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ESSAttendanceClient({
  initialData,
  currentMonth: initialMonth,
  currentYear: initialYear,
}: ESSAttendanceClientProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", selectedMonth, selectedYear],
    queryFn: () => getMyAttendanceHistory(selectedMonth, selectedYear),
    initialData: initialData as unknown as Awaited<
      ReturnType<typeof getMyAttendanceHistory>
    >,
  });

  const attendances = data?.attendances ?? [];
  const summary = data?.summary ?? DEFAULT_SUMMARY;
  const weeks = buildCalendarWeeks(attendances);

  const changeMonth = (delta: number) => {
    setSelectedMonth((prev) => {
      let month = prev + delta;
      if (month < 1) {
        month = 12;
        setSelectedYear((y) => y - 1);
      } else if (month > 12) {
        month = 1;
        setSelectedYear((y) => y + 1);
      }
      return month;
    });
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="shrink-0 border-b bg-linear-to-r from-blue-50/50 to-primary/5">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CalendarCheck className="h-6 w-6 text-blue-600" />
                Chấm công
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem lịch sử chấm công và bảng công tháng
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Tải bảng công
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Month Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Ngày công",
              icon: CheckCircle2,
              color: "text-emerald-500",
              value: `${summary.totalWorkDays} / ${summary.standardDays}`,
              progress:
                summary.standardDays > 0
                  ? (summary.totalWorkDays / summary.standardDays) * 100
                  : 0,
            },
            {
              label: "Tỷ lệ đúng giờ",
              icon: Clock,
              color: "text-blue-500",
              value:
                summary.totalWorkDays > 0
                  ? `${Math.round(((summary.totalWorkDays - summary.lateDays) / summary.totalWorkDays) * 100)}%`
                  : "0%",
              progress:
                summary.totalWorkDays > 0
                  ? ((summary.totalWorkDays - summary.lateDays) /
                      summary.totalWorkDays) *
                    100
                  : 0,
            },
            {
              label: "Đi trễ",
              icon: Clock,
              color: "text-amber-500",
              value: `${summary.lateDays} ngày`,
              badge: summary.lateDays > 0 ? "Cần cải thiện" : undefined,
              badgeClass: "bg-amber-100 text-amber-800",
            },
            {
              label: "Tăng ca (OT)",
              icon: Clock,
              color: "text-purple-500",
              value: `${summary.totalOtHours}h`,
            },
          ].map((stat, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="h-2" />
                  )}
                  {stat.badge && (
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", stat.badgeClass)}
                    >
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử chấm công</CardTitle>
            <CardDescription>Nhấp vào ngày để xem chi tiết</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceCalendar weeks={weeks} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết chấm công</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceList records={attendances} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

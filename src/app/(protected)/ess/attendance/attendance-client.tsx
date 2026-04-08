"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyAttendanceHistory } from "../actions";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Settings,
  Search,
  ListFilter,
  ChevronDown,
  Sun,
  Moon,
  X,
  Timer,
  AlertCircle,
  Table as TableIcon,
} from "lucide-react";
import { useTimezone } from "@/hooks/use-timezone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

type AttendanceStatus =
  | "ALL"
  | "PRESENT"
  | "LATE"
  | "LATE_AND_EARLY"
  | "EARLY_LEAVE"
  | "ABSENT"
  | "ON_LEAVE"
  | "HOLIDAY";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PRESENT", label: "Có mặt" },
  { value: "LATE", label: "Đi trễ" },
  { value: "LATE_AND_EARLY", label: "Trễ & Sớm" },
  { value: "EARLY_LEAVE", label: "Về sớm" },
  { value: "ABSENT", label: "Vắng mặt" },
  { value: "ON_LEAVE", label: "Nghỉ phép" },
  { value: "HOLIDAY", label: "Ngày lễ" },
];

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: React.ElementType;
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

const DEFAULT_SUMMARY: AttendanceSummary = {
  standardDays: 0,
  totalWorkDays: 0,
  lateDays: 0,
  earlyLeaveDays: 0,
  leaveDays: 0,
  unpaidLeaveDays: 0,
  totalOtHours: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(dateStr: string | null, timezone: string) {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string, timezone: string) {
  // Parse date string directly (it's already in YYYY-MM-DD format from server)
  // Create date at noon to avoid timezone issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return localDate.toLocaleDateString("vi-VN", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getDayOfWeek(dateStr: string, timezone: string) {
  // Parse date string and use timezone for day calculation
  // Add 12 hours to avoid timezone edge cases (midnight crossing)
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  // Use Intl to get day of week in timezone
  const dayIndex = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  })
    .formatToParts(localDate)
    .find((p) => p.type === "weekday")?.value;
  // Map day names to numbers (0 = Sunday)
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[dayIndex || "Sun"] ?? 0;
}

function isWeekend(dateStr: string, timezone: string) {
  const d = getDayOfWeek(dateStr, timezone);
  return d === 0 || d === 6;
}

function calcTotalHours(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return null;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const hours =
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
  return hours.toFixed(1);
}

function buildCalendarWeeks(attendances: AttendanceRecord[], timezone: string) {
  const sorted = [...attendances].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  if (sorted.length === 0) return [];

  const weeks: (AttendanceRecord | null)[][] = [];
  let currentWeek: (AttendanceRecord | null)[] = [];

  const firstDay = getDayOfWeek(sorted[0].date, timezone);
  if (firstDay !== 1) {
    for (let i = 1; i < firstDay; i++) currentWeek.push(null);
  }

  for (const record of sorted) {
    currentWeek.push(record);
    if (getDayOfWeek(record.date, timezone) === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

// ─── Calendar View ───────────────────────────────────────────────────────────

const CALENDAR_BG: Record<string, string> = {
  PRESENT: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  ABSENT: "bg-red-50 border-red-200 hover:bg-red-100",
  ON_LEAVE: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  HOLIDAY: "bg-purple-50 border-purple-200 hover:bg-purple-100",
};

const CALENDAR_ICON_COLOR: Record<string, string> = {
  PRESENT: "text-emerald-600",
  ABSENT: "text-red-600",
  LATE: "text-amber-600",
  EARLY_LEAVE: "text-orange-600",
  LATE_AND_EARLY: "text-red-600",
  ON_LEAVE: "text-blue-600",
  HOLIDAY: "text-purple-600",
};

function AttendanceCalendarView({
  weeks,
  isLoading,
  onRecordClick,
  timezone,
}: {
  weeks: (AttendanceRecord | null)[][];
  isLoading: boolean;
  onRecordClick?: (record: AttendanceRecord) => void;
  timezone: string;
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
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DAY_LABELS.map((day, i) => (
          <div
            key={i}
            className={cn(
              "text-center text-[10px] sm:text-xs font-medium py-1 sm:py-2",
              (i === 5 || i === 6) && "text-muted-foreground",
            )}
          >
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 sm:gap-2">
          {week.map((record, di) => {
            if (!record)
              return (
                <div
                  key={`empty-${di}`}
                  className="aspect-square hidden sm:block"
                />
              );
            const weekend = isWeekend(record.date, timezone);
            const bgClass = CALENDAR_BG[record.status] ?? "bg-muted/30";
            const iconColor =
              CALENDAR_ICON_COLOR[record.status] ?? "text-muted-foreground";
            return (
              <div
                key={record.id}
                onClick={() => onRecordClick?.(record)}
                className={cn(
                  "aspect-square sm:aspect-square rounded-md sm:rounded-lg border p-1 sm:p-2 flex flex-col items-center justify-center transition-all hover:shadow-md cursor-pointer text-[10px] sm:text-xs",
                  weekend && "bg-muted/30",
                  bgClass,
                )}
              >
                <span
                  className={cn(
                    "font-medium",
                    weekend && "text-muted-foreground",
                  )}
                >
                  {new Date(record.date).getDate()}
                </span>
                <div className={cn("mt-0.5 sm:mt-1", iconColor)}>
                  {record.status === "PRESENT" ? (
                    <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                  ) : record.status === "ABSENT" ? (
                    <XCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                  ) : (
                    <Calendar className="h-2 w-2 sm:h-3 sm:w-3" />
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

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  progress,
  badge,
  badgeClass,
  subValue,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  progress?: number;
  badge?: string;
  badgeClass?: string;
  subValue?: string;
}) {
  return (
    <Card className="p-2">
      <CardHeader className="p-0">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", color)} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-1.5">
          <div className="text-xl font-bold">{value}</div>
          {subValue && (
            <div className="text-xs text-muted-foreground">{subValue}</div>
          )}
          {progress !== undefined && (
            <Progress value={progress} className="h-1.5" />
          )}
          {badge && (
            <Badge
              variant="secondary"
              className={cn("text-xs px-1.5 py-0", badgeClass)}
            >
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mobile Detection ─────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ESSAttendanceClient({
  initialData,
  currentMonth: initialMonth,
  currentYear: initialYear,
}: ESSAttendanceClientProps) {
  const queryClient = useQueryClient();
  const { timezone } = useTimezone();
  const isMobile = useIsMobile();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus>("ALL");
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    date: true,
    dayOfWeek: false,
    checkIn: true,
    checkOut: true,
    shift: false,
    status: true,
    lateMinutes: false,
    earlyMinutes: false,
    totalHours: false,
  });

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", selectedMonth, selectedYear],
    queryFn: () => getMyAttendanceHistory(selectedMonth, selectedYear),
    initialData: initialData as unknown as Awaited<
      ReturnType<typeof getMyAttendanceHistory>
    >,
  });

  useSocketEvents(
    ["attendance:check-in", "attendance:check-out", "attendance:updated"],
    () => queryClient.invalidateQueries({ queryKey: ["my-attendance"] }),
  );

  const allAttendances = useMemo(
    () => data?.attendances ?? [],
    [data?.attendances],
  );

  const summary = data?.summary ?? DEFAULT_SUMMARY;
  const filteredAttendances = useMemo(() => {
    let records = allAttendances;
    if (statusFilter !== "ALL")
      records = records.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      records = records.filter((r) => {
        const cfg = STATUS_CONFIG[r.status];
        return (
          formatDate(r.date, timezone).toLowerCase().includes(q) ||
          r.shift?.name?.toLowerCase().includes(q) ||
          cfg?.label.toLowerCase().includes(q) ||
          formatTime(r.checkIn, timezone).includes(q) ||
          formatTime(r.checkOut, timezone).includes(q)
        );
      });
    }
    return records;
  }, [allAttendances, statusFilter, search, timezone]);

  const weeks = useMemo(
    () => buildCalendarWeeks(allAttendances, timezone),
    [allAttendances, timezone],
  );

  const changeMonth = (delta: number) => {
    setSelectedMonth((prev) => {
      let month = prev + delta;
      let year = selectedYear;
      if (month < 1) {
        month = 12;
        year--;
      } else if (month > 12) {
        month = 1;
        year++;
      }
      setSelectedYear(year);
      return month;
    });
  };

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const toggleAll = useCallback(() => {
    setSelectedIds(
      selectedIds.size === filteredAttendances.length
        ? new Set()
        : new Set(filteredAttendances.map((e) => e.id)),
    );
  }, [selectedIds.size, filteredAttendances]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const columns = useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              filteredAttendances.length > 0 &&
              selectedIds.size === filteredAttendances.length
                ? true
                : selectedIds.size > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={toggleAll}
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleOne(row.original.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
            aria-label={`Chọn ngày ${row.original.date}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "date",
        header: "Ngày",
        cell: ({ row }) => {
          const weekend = isWeekend(row.original.date, timezone);
          return (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {formatDate(row.original.date, timezone)}
                </span>
                {weekend && (
                  <span className="text-xs text-muted-foreground">
                    Cuối tuần
                  </span>
                )}
              </div>
            </div>
          );
        },
        size: 160,
      },
      {
        accessorKey: "dayOfWeek",
        header: "Thứ",
        cell: ({ row }) => {
          const d = getDayOfWeek(row.original.date, timezone);
          return (
            <span
              className={cn(
                "text-sm",
                (d === 0 || d === 6) && "text-muted-foreground",
              )}
            >
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d]}
            </span>
          );
        },
        size: 60,
      },
      {
        accessorKey: "checkIn",
        header: "Giờ vào",
        cell: ({ row }) => {
          const isLate = row.original.lateMinutes > 0;
          return (
            <div className="flex items-center gap-1.5">
              <Sun
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isLate ? "text-amber-500" : "text-emerald-500",
                )}
              />
              <span
                className={cn(
                  "text-sm font-mono",
                  isLate && "text-amber-600 font-medium",
                )}
              >
                {formatTime(row.original.checkIn, timezone)}
              </span>
              {isLate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Trễ {row.original.lateMinutes} phút
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "checkOut",
        header: "Giờ ra",
        cell: ({ row }) => {
          const isEarly = row.original.earlyMinutes > 0;
          return (
            <div className="flex items-center gap-1.5">
              <Moon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isEarly ? "text-orange-500" : "text-slate-500",
                )}
              />
              <span
                className={cn(
                  "text-sm font-mono",
                  isEarly && "text-orange-600 font-medium",
                )}
              >
                {formatTime(row.original.checkOut, timezone)}
              </span>
              {isEarly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Sớm {row.original.earlyMinutes} phút
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "shift",
        header: "Ca làm",
        cell: ({ row }) => {
          const shift = row.original.shift;
          if (!shift) return <span className="text-muted-foreground">---</span>;
          return (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{shift.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {shift.startTime?.slice(0, 5)} – {shift.endTime?.slice(0, 5)}
                </span>
              </div>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg =
            STATUS_CONFIG[row.original.status] ?? STATUS_CONFIG.PRESENT;
          const Icon = cfg.icon;
          return (
            <Badge
              variant={cfg.variant}
              className={cn("gap-1 text-xs", cfg.className)}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </Badge>
          );
        },
        size: 130,
      },
      {
        accessorKey: "lateMinutes",
        header: "Trễ (phút)",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-sm font-mono",
              row.original.lateMinutes > 0
                ? "text-amber-600 font-medium"
                : "text-muted-foreground",
            )}
          >
            {row.original.lateMinutes > 0 ? row.original.lateMinutes : "—"}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "earlyMinutes",
        header: "Sớm (phút)",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-sm font-mono",
              row.original.earlyMinutes > 0
                ? "text-orange-600 font-medium"
                : "text-muted-foreground",
            )}
          >
            {row.original.earlyMinutes > 0 ? row.original.earlyMinutes : "—"}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "totalHours",
        header: "Tổng giờ",
        cell: ({ row }) => {
          const hours = calcTotalHours(
            row.original.checkIn,
            row.original.checkOut,
          );
          return (
            <span className="text-sm font-mono font-medium">
              {hours ? `${hours}h` : "—"}
            </span>
          );
        },
        size: 100,
      },
    ],
    [filteredAttendances, selectedIds, toggleAll, toggleOne, timezone],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredAttendances,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const onTimeRate =
    summary.totalWorkDays > 0
      ? Math.round(
          ((summary.totalWorkDays - summary.lateDays) / summary.totalWorkDays) *
            100,
        )
      : 0;

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 sm:px-4 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-1.5 text-sm sm:text-base">
              Chấm công
            </h1>
          </header>

          <div className="flex items-center justify-between gap-2 px-2 py-2">
            {/* Month Navigator */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs sm:text-sm font-medium px-1">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight />
              </Button>
              {!isMobile && (
                <Button
                  variant="outline"
                  size="xs"
                  title="Tháng hiện tại"
                  onClick={() => {
                    const today = new Date();
                    setSelectedMonth(today.getMonth() + 1);
                    setSelectedYear(today.getFullYear());
                  }}
                >
                  Tháng hiện tại
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="xs"
                  className={cn(
                    "rounded-none px-2 text-xs",
                    viewMode === "table" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon />
                  <span className="hidden lg:inline">Bảng</span>
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "secondary" : "ghost"}
                  size="xs"
                  className={cn(
                    "rounded-none px-2 text-xs border-l",
                    viewMode === "calendar" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar />
                  <span className="hidden lg:inline">Lịch</span>
                </Button>
              </div>
              {/* Mobile View Toggle */}
              <div className="flex sm:hidden items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon-xs"
                  className={cn(
                    "rounded-none",
                    viewMode === "table" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon />
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "secondary" : "ghost"}
                  size="icon-xs"
                  className={cn(
                    "rounded-none border-l",
                    viewMode === "calendar" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar />
                </Button>
              </div>

              <Separator
                orientation="vertical"
                className="h-4 hidden sm:block"
              />

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                    size="xs"
                    className={cn(
                      "px-1 sm:px-2",
                      statusFilter !== "ALL" &&
                        "bg-primary/10 border-primary text-primary hover:text-primary",
                    )}
                  >
                    <ListFilter className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label ?? "Trạng thái"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Trạng thái
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as AttendanceStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={statusFilter === opt.value}
                        onCheckedChange={() =>
                          setStatusFilter(opt.value as AttendanceStatus)
                        }
                        className="text-sm"
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <div className="relative flex items-center" ref={mergedSearchRef}>
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm kiếm..."
                  className={cn(
                    "h-6 sm:h-8 text-xs transition-all duration-300 ease-in-out pr-6",
                    searchExpanded
                      ? "w-32 sm:w-48 opacity-100 pl-3"
                      : "w-0 opacity-0 pl-0",
                  )}
                />
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleSearchToggle}
                  className={cn(
                    "absolute right-0.5 z-10",
                    searchExpanded && "[&_svg]:text-primary",
                  )}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>

              <Separator
                orientation="vertical"
                className="h-4 hidden sm:block"
              />

              <Button
                variant="outline"
                size="icon-xs"
                className="hidden sm:flex"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="xs" className="hidden md:flex">
                <Download className="h-3 w-3" />
                <span className="hidden lg:inline">Xuất Excel</span>
              </Button>
            </div>
          </div>

          <TableSettingsPanel
            className="top-10"
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            defaultVisibleColumns={{
              date: true,
              dayOfWeek: false,
              checkIn: true,
              checkOut: true,
              shift: false,
              status: true,
              lateMinutes: false,
              earlyMinutes: false,
              totalHours: false,
            }}
            columnOptions={[
              { key: "date", label: "Ngày", icon: Calendar },
              { key: "dayOfWeek", label: "Thứ", icon: Calendar },
              { key: "checkIn", label: "Giờ vào", icon: Sun },
              { key: "checkOut", label: "Giờ ra", icon: Moon },
              { key: "shift", label: "Ca làm", icon: Clock },
              { key: "status", label: "Trạng thái", icon: AlertCircle },
              { key: "lateMinutes", label: "Trễ (phút)", icon: Timer },
              { key: "earlyMinutes", label: "Sớm (phút)", icon: Timer },
              { key: "totalHours", label: "Tổng giờ", icon: Clock },
            ]}
            disabledColumnIndices={[]}
            hiddenColumnIndices={[]}
          />
        </section>

        {/* Stats Row */}
        <section className="px-2 py-2 grid grid-cols-2 lg:grid-cols-4 gap-2 border-b">
          <StatCard
            label="Ngày công"
            icon={CheckCircle2}
            color="text-emerald-500"
            value={`${summary.totalWorkDays} / ${summary.standardDays}`}
            progress={
              summary.standardDays > 0
                ? (summary.totalWorkDays / summary.standardDays) * 100
                : 0
            }
          />
          <StatCard
            label="Tỷ lệ đúng giờ"
            icon={Timer}
            color="text-blue-500"
            value={`${onTimeRate}%`}
            progress={onTimeRate}
          />
          <StatCard
            label="Đi trễ"
            icon={Clock}
            color="text-amber-500"
            value={`${summary.lateDays}`}
            badge={summary.lateDays > 0 ? "Cần cải thiện" : undefined}
            badgeClass="bg-amber-100 text-amber-800"
            subValue={isMobile ? undefined : "ngày"}
          />
          <StatCard
            label="Tăng ca (OT)"
            icon={Clock}
            color="text-purple-500"
            value={`${summary.totalOtHours}h`}
            subValue={
              isMobile
                ? `${summary.earlyLeaveDays} về sớm`
                : `Về sớm: ${summary.earlyLeaveDays} ngày`
            }
          />
        </section>

        {/* Content */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
              <span className="text-xs text-muted-foreground mr-1">
                Đã chọn{" "}
                <strong className="text-foreground">{selectedIds.size}</strong>{" "}
                bản ghi
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto h-6 w-6"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="h-full flex flex-col pb-8">
            {viewMode === "calendar" ? (
              <div className="p-2 sm:p-4 overflow-auto h-full">
                <AttendanceCalendarView
                  weeks={weeks}
                  isLoading={isLoading}
                  onRecordClick={setSelectedRecord}
                  timezone={timezone}
                />
              </div>
            ) : isMobile ? (
              /* Mobile Card List View */
              <div className="overflow-auto h-full">
                {isLoading ? (
                  <div className="p-2 space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredAttendances.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredAttendances.map((record) => (
                      <MobileAttendanceCard
                        key={record.id}
                        record={record}
                        onClick={() => setSelectedRecord(record)}
                        timezone={timezone}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <CalendarCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Không tìm thấy bản ghi nào.
                    </p>
                    {(search || statusFilter !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto h-full">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "h-7 px-2 select-none z-10 relative",
                              header.column.id === "actions" && "text-right",
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {columns.map((col, j) => (
                            <TableCell
                              key={j}
                              style={{ width: col.size }}
                              className="p-2"
                            >
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group/row cursor-default"
                          onClick={() => setSelectedRecord(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
                            <p>Không tìm thấy bản ghi nào.</p>
                            {(search || statusFilter !== "ALL") && (
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearch("");
                                  setStatusFilter("ALL");
                                }}
                              >
                                Xóa bộ lọc
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && filteredAttendances.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredAttendances.length}</strong> /{" "}
                  <strong>{allAttendances.length}</strong> bản ghi
                </p>
                {statusFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Đang lọc:{" "}
                    {
                      STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile Bottom Sheet - Detail */}
      <Sheet
        open={isMobile && !!selectedRecord}
        onOpenChange={(v) => !v && setSelectedRecord(null)}
      >
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
          <SheetHeader className="sr-only">
            <SheetTitle>Chi tiết chấm công</SheetTitle>
          </SheetHeader>
          {selectedRecord && (
            <div className="space-y-4 pt-4">
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {new Date(selectedRecord.date).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const cfg =
                        STATUS_CONFIG[selectedRecord.status] ??
                        STATUS_CONFIG.PRESENT;
                      const Icon = cfg.icon;
                      return (
                        <Badge
                          variant={cfg.variant}
                          className={cn("gap-1 text-xs", cfg.className)}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      );
                    })()}
                    {selectedRecord.shift && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedRecord.shift.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSelectedRecord(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Time Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">
                      Giờ vào
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatTime(selectedRecord.checkIn, timezone)}
                  </div>
                  {selectedRecord.lateMinutes > 0 && (
                    <div className="text-xs text-amber-600 mt-1">
                      Trễ {selectedRecord.lateMinutes} phút
                    </div>
                  )}
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-muted-foreground">
                      Giờ ra
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatTime(selectedRecord.checkOut, timezone)}
                  </div>
                  {selectedRecord.earlyMinutes > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      Sớm {selectedRecord.earlyMinutes} phút
                    </div>
                  )}
                </Card>
              </div>

              {/* Shift Details */}
              {selectedRecord.shift && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Ca làm việc
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {selectedRecord.shift.name}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {selectedRecord.shift.startTime?.slice(0, 5)} –{" "}
                        {selectedRecord.shift.endTime?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Total Hours */}
              {selectedRecord.checkIn && selectedRecord.checkOut && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng giờ làm
                    </span>
                    <span className="text-lg font-bold font-mono">
                      {calcTotalHours(
                        selectedRecord.checkIn,
                        selectedRecord.checkOut,
                      )}
                      h
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Desktop Dialog - Detail */}
      <Dialog
        open={!isMobile && !!selectedRecord}
        onOpenChange={(v) => !v && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết chấm công</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3">
              <DetailRow
                label="Ngày"
                value={new Date(selectedRecord.date).toLocaleDateString(
                  "vi-VN",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  },
                )}
              />
              <div className="h-px bg-border" />
              <DetailRow
                label={
                  <span className="flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Giờ vào
                  </span>
                }
                value={
                  <span
                    className={cn(
                      "font-mono",
                      selectedRecord.lateMinutes > 0 && "text-amber-600",
                    )}
                  >
                    {formatTime(selectedRecord.checkIn, timezone)}
                    {selectedRecord.lateMinutes > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Trễ {selectedRecord.lateMinutes} phút)
                      </span>
                    )}
                  </span>
                }
              />
              <DetailRow
                label={
                  <span className="flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5 text-slate-500" />
                    Giờ ra
                  </span>
                }
                value={
                  <span
                    className={cn(
                      "font-mono",
                      selectedRecord.earlyMinutes > 0 && "text-orange-600",
                    )}
                  >
                    {formatTime(selectedRecord.checkOut, timezone)}
                    {selectedRecord.earlyMinutes > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Sớm {selectedRecord.earlyMinutes} phút)
                      </span>
                    )}
                  </span>
                }
              />
              {selectedRecord.shift && (
                <>
                  <div className="h-px bg-border" />
                  <DetailRow
                    label={
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Ca làm
                      </span>
                    }
                    value={
                      <div className="text-right">
                        <span className="font-medium">
                          {selectedRecord.shift.name}
                        </span>
                        <div className="text-xs text-muted-foreground font-mono">
                          {selectedRecord.shift.startTime?.slice(0, 5)} –{" "}
                          {selectedRecord.shift.endTime?.slice(0, 5)}
                        </div>
                      </div>
                    }
                  />
                </>
              )}
              <div className="h-px bg-border" />
              <DetailRow
                label="Trạng thái"
                value={(() => {
                  const cfg =
                    STATUS_CONFIG[selectedRecord.status] ??
                    STATUS_CONFIG.PRESENT;
                  const Icon = cfg.icon;
                  return (
                    <Badge
                      variant={cfg.variant}
                      className={cn("gap-1 text-xs", cfg.className)}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              />
              {selectedRecord.checkIn && selectedRecord.checkOut && (
                <DetailRow
                  label="Tổng giờ làm"
                  value={
                    <span className="font-mono font-medium">
                      {calcTotalHours(
                        selectedRecord.checkIn,
                        selectedRecord.checkOut,
                      )}
                      h
                    </span>
                  }
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Mobile Attendance Card ────────────────────────────────────────────────────

function MobileAttendanceCard({
  record,
  onClick,
  timezone,
}: {
  record: AttendanceRecord;
  onClick?: () => void;
  timezone: string;
}) {
  const weekend = isWeekend(record.date, timezone);
  const cfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.PRESENT;
  const Icon = cfg.icon;
  const hours = calcTotalHours(record.checkIn, record.checkOut);

  return (
    <div
      onClick={onClick}
      className={cn(
        "px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
        weekend && "bg-muted/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Date Row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={cn(
                "text-sm font-semibold",
                weekend && "text-muted-foreground",
              )}
            >
              {formatDate(record.date, timezone)}
            </span>
            <Badge
              variant={cfg.variant}
              className={cn("gap-1 text-xs py-0 h-5", cfg.className)}
            >
              <Icon className="h-2.5 w-2.5" />
              {cfg.label}
            </Badge>
          </div>

          {/* Time Row */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Sun
                className={cn(
                  "h-3 w-3",
                  record.lateMinutes > 0
                    ? "text-amber-500"
                    : "text-emerald-500",
                )}
              />
              <span
                className={cn(
                  "font-mono text-xs",
                  record.lateMinutes > 0 && "text-amber-600 font-medium",
                )}
              >
                {formatTime(record.checkIn, timezone)}
              </span>
              {record.lateMinutes > 0 && (
                <span className="text-[10px] text-amber-500">
                  +{record.lateMinutes}p
                </span>
              )}
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-1">
              <Moon
                className={cn(
                  "h-3 w-3",
                  record.earlyMinutes > 0
                    ? "text-orange-500"
                    : "text-slate-500",
                )}
              />
              <span
                className={cn(
                  "font-mono text-xs",
                  record.earlyMinutes > 0 && "text-orange-600 font-medium",
                )}
              >
                {formatTime(record.checkOut, timezone)}
              </span>
              {record.earlyMinutes > 0 && (
                <span className="text-[10px] text-orange-500">
                  -{record.earlyMinutes}p
                </span>
              )}
            </div>
            {hours && (
              <span className="text-xs text-muted-foreground font-mono ml-auto">
                {hours}h
              </span>
            )}
          </div>

          {/* Shift Row */}
          {record.shift && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              <span>{record.shift.name}</span>
              <span className="font-mono text-[10px]">
                ({record.shift.startTime?.slice(0, 5)}–
                {record.shift.endTime?.slice(0, 5)})
              </span>
            </div>
          )}
        </div>

        <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  );
}

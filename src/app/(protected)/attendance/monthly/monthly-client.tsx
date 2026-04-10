"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMonthlyAttendance,
  calculateMonthlySummary,
  lockMonthlySummary,
  getAttendanceSummaries,
  exportMonthlyAttendance,
} from "../actions";
import type {
  MonthlyAttendanceData,
  AttendanceSummary,
  DepartmentBasic,
  MonthlyGridRow,
  AttendanceStatus,
} from "../types";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { MonthlyToolbar } from "./monthly-toolbar";
import { MonthlyGridTable } from "./monthly-grid-table";
import { MonthlySummaryTable } from "./monthly-summary-table";

const PAGE_SIZE = 20;

export function MonthlyClient({
  initialData,
  initialSummaries,
  initialDepartments,
  canManage,
}: {
  initialData: MonthlyAttendanceData;
  initialSummaries: AttendanceSummary[];
  initialDepartments: DepartmentBasic[];
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now],
  );
  const initialMonth = initialData?.month || now.getMonth() + 1;
  const initialYear = initialData?.year || now.getFullYear();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [departmentId, setDepartmentId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "summary">("grid");
  const [showWeekend, setShowWeekend] = useState(false);

  // ─── Infinite scroll state ───
  const [visibleGridCount, setVisibleGridCount] = useState(PAGE_SIZE);
  const [visibleSummaryCount, setVisibleSummaryCount] = useState(PAGE_SIZE);

  // ─── Queries ───
  const { data, isFetching: isFetchingData } = useQuery<MonthlyAttendanceData>({
    queryKey: ["attendance", "monthly", month, year, departmentId],
    queryFn: async () => {
      const res = await getMonthlyAttendance({
        month,
        year,
        departmentId: departmentId || undefined,
      });
      return JSON.parse(JSON.stringify(res)) as MonthlyAttendanceData;
    },
    initialData:
      month === initialMonth && year === initialYear && !departmentId
        ? initialData
        : undefined,
  });

  const {
    data: summaries = initialSummaries,
    isFetching: isFetchingSummaries,
  } = useQuery<AttendanceSummary[]>({
    queryKey: ["attendance", "summaries", month, year, departmentId],
    queryFn: async () => {
      const res = await getAttendanceSummaries({
        month,
        year,
        departmentId: departmentId || undefined,
      });
      return JSON.parse(JSON.stringify(res)) as AttendanceSummary[];
    },
    initialData:
      month === initialMonth && year === initialYear && !departmentId
        ? initialSummaries
        : undefined,
  });

  // ─── Real-time WebSocket Updates ───
  useSocketEvent("attendance:check-in", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "monthly"],
    });
  });

  useSocketEvent("attendance:check-out", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "monthly"],
    });
  });

  // Real-time update khi ngày lễ thay đổi
  useSocketEvent("holiday:updated", () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "monthly"],
    });
    queryClient.invalidateQueries({
      queryKey: ["attendance", "summaries"],
    });
  });

  // ─── Mutations ───
  const calculateMutation = useMutation({
    mutationFn: () => calculateMonthlySummary({ month, year }),
    onSuccess: () => {
      toast.success("Đã tính công tháng thành công");
      queryClient.invalidateQueries({
        queryKey: ["attendance", "summaries", month, year],
      });
    },
    onError: (err: Error) => toast.error(err.message || "Có lỗi xảy ra"),
  });

  const lockMutation = useMutation({
    mutationFn: () => lockMonthlySummary({ month, year }),
    onSuccess: () => {
      toast.success("Đã khóa bảng công tháng");
      queryClient.invalidateQueries({
        queryKey: ["attendance", "summaries", month, year],
      });
    },
    onError: (err: Error) => toast.error(err.message || "Có lỗi xảy ra"),
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportMonthlyAttendance({
        month,
        year,
        departmentId: departmentId || undefined,
      });

      if (!result || !result.csvContent || !result.fileName) {
        throw new Error("Không thể tạo file xuất");
      }

      // Create and download CSV file
      const blob = new Blob([result.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Xuất file thành công");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi xuất file",
      );
    } finally {
      setIsExporting(false);
    }
  }, [month, year, departmentId]);

  const isPending =
    calculateMutation.isPending ||
    lockMutation.isPending ||
    isFetchingData ||
    isFetchingSummaries;

  // ─── Handlers ───
  const handleMonthChange = (direction: number) => {
    let newMonth = month + direction;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
    setVisibleGridCount(PAGE_SIZE);
    setVisibleSummaryCount(PAGE_SIZE);
  };

  const handleDeptChange = (val: string) => {
    setDepartmentId(val);
    setVisibleGridCount(PAGE_SIZE);
    setVisibleSummaryCount(PAGE_SIZE);
  };

  const handleTodayClick = () => {
    const d = new Date();
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setVisibleGridCount(PAGE_SIZE);
    setVisibleSummaryCount(PAGE_SIZE);
  };

  const handleLock = () => {
    if (
      !window.confirm(
        `Bạn có chắc muốn khóa bảng công tháng ${month}/${year}? Thao tác này không thể hoàn tác.`,
      )
    )
      return;
    lockMutation.mutate();
  };

  // ─── Build grid data ───
  const gridData = useMemo((): MonthlyGridRow[] => {
    if (!data) return [];
    const { users, attendances, holidays, daysInMonth } = data;

    const holidayDates = new Set<string>();
    for (const h of holidays || []) {
      const start = new Date(h.date);
      const end = h.endDate ? new Date(h.endDate) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        holidayDates.add(d.toISOString().split("T")[0]);
      }
    }

    return (users || []).map((user) => {
      const userAttendances = (attendances || []).filter(
        (a) => a.userId === user.id,
      );
      const userSchedule = data.scheduledWorkDays?.[user.id] ?? [];
      const days: (AttendanceStatus | null)[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay();

        if (holidayDates.has(dateStr)) {
          days.push("HOLIDAY");
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
          days.push(null);
        } else {
          const att = userAttendances.find((a) => {
            const aDate = new Date(a.date);
            return (
              aDate.getUTCFullYear() === year &&
              aDate.getUTCMonth() === month - 1 &&
              aDate.getUTCDate() === d
            );
          });
          const isScheduledToWork = userSchedule.includes(d);
          days.push(
            att
              ? (att.status as AttendanceStatus)
              : isScheduledToWork && date < today
                ? "ABSENT"
                : null,
          );
        }
      }

      let workDays = 0,
        lateDays = 0,
        absentDays = 0;
      for (const s of days) {
        if (
          s === "PRESENT" ||
          s === "LATE" ||
          s === "EARLY_LEAVE" ||
          s === "LATE_AND_EARLY"
        )
          workDays++;
        if (s === "LATE" || s === "LATE_AND_EARLY") lateDays++;
        if (s === "ABSENT") absentDays++;
        if (s === "HALF_DAY") workDays += 0.5;
      }

      return {
        user,
        days,
        workDays,
        lateDays,
        absentDays,
      } as MonthlyGridRow;
    });
  }, [data, month, year, today]);

  const daysInMonth = data?.daysInMonth ?? new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ─── Infinite scroll slicing ───
  const visibleGridRows = useMemo(
    () => gridData.slice(0, visibleGridCount),
    [gridData, visibleGridCount],
  );
  const hasMoreGrid = visibleGridCount < gridData.length;
  const loadMoreGrid = useCallback(() => {
    setVisibleGridCount((prev) => Math.min(prev + PAGE_SIZE, gridData.length));
  }, [gridData.length]);

  const visibleSummaryRows = useMemo(
    () => summaries.slice(0, visibleSummaryCount),
    [summaries, visibleSummaryCount],
  );
  const hasMoreSummary = visibleSummaryCount < summaries.length;
  const loadMoreSummary = useCallback(() => {
    setVisibleSummaryCount((prev) =>
      Math.min(prev + PAGE_SIZE, summaries.length),
    );
  }, [summaries.length]);

  return (
    <div className="space-y-4">
      <MonthlyToolbar
        month={month}
        year={year}
        onMonthChange={handleMonthChange}
        onTodayClick={handleTodayClick}
        departments={initialDepartments}
        departmentId={departmentId}
        onDepartmentChange={handleDeptChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showWeekend={showWeekend}
        onShowWeekendChange={setShowWeekend}
        canManage={canManage}
        isPending={isPending}
        onCalculate={() => calculateMutation.mutate()}
        onLock={handleLock}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {viewMode === "grid" ? (
        <MonthlyGridTable
          rows={visibleGridRows}
          totalCount={gridData.length}
          daysArray={daysArray}
          month={month}
          year={year}
          today={today}
          showWeekend={showWeekend}
          hasMore={hasMoreGrid}
          loadMore={loadMoreGrid}
          isFetching={isFetchingData}
        />
      ) : (
        <MonthlySummaryTable
          rows={visibleSummaryRows}
          totalCount={summaries.length}
          month={month}
          year={year}
          hasMore={hasMoreSummary}
          loadMore={loadMoreSummary}
          isFetching={isFetchingSummaries}
        />
      )}
    </div>
  );
}

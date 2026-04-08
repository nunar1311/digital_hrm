import { useRef, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceSummary } from "../types";

interface MonthlySummaryTableProps {
  rows: AttendanceSummary[];
  totalCount: number;
  month: number;
  year: number;
  hasMore: boolean;
  loadMore: () => void;
  isFetching: boolean;
}

export function MonthlySummaryTable({
  rows,
  totalCount,
  month,
  year,
  hasMore,
  loadMore,
  isFetching,
}: MonthlySummaryTableProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("ProtectedPages");

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col px-2">
        <h3 className="text-lg font-bold">
          {t("attendanceMonthlySummaryTitle", { month, year })}
        </h3>
        <p className="text-sm text-muted-foreground">
          Bảng tổng hợp đã tính sẵn. Nhấn &quot;Tính công&quot; để cập nhật.
        </p>
      </div>

      <div className="h-[calc(100vh-15rem)] overflow-auto no-scrollbar **:data-[slot=table-container]:overflow-visible border-t">
        <Table className="min-w-max w-full">
          <TableHeader className="z-10 bg-background shadow-sm">
            <TableRow>
              <TableHead>{t("attendanceMonthlySummaryHeadEmployee")}</TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadActualWorkDays")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadStandardDays")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadLate")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadEarlyLeave")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadAbsent")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadLeave")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadHoliday")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadOtWeekday")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadOtWeekend")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadOtHoliday")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadTotalOt")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadTotalHours")}
              </TableHead>
              <TableHead className="text-center">
                {t("attendanceMonthlySummaryHeadLock")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <div>{s.user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.user?.employeeCode}
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">
                  {s.totalWorkDays}
                </TableCell>
                <TableCell className="text-center">{s.standardDays}</TableCell>
                <TableCell className="text-center text-yellow-600">
                  {s.lateDays}
                </TableCell>
                <TableCell className="text-center text-orange-600">
                  {s.earlyLeaveDays}
                </TableCell>
                <TableCell className="text-center text-red-600">
                  {s.absentDays}
                </TableCell>
                <TableCell className="text-center text-purple-600">
                  {s.leaveDays}
                </TableCell>
                <TableCell className="text-center text-indigo-600">
                  {s.holidayDays}
                </TableCell>
                <TableCell className="text-center">
                  {s.otHoursWeekday}h
                </TableCell>
                <TableCell className="text-center">
                  {s.otHoursWeekend}h
                </TableCell>
                <TableCell className="text-center">
                  {s.otHoursHoliday}h
                </TableCell>
                <TableCell className="text-center font-bold">
                  {s.totalOtHours}h
                </TableCell>
                <TableCell className="text-center">
                  {s.totalWorkHours}h
                </TableCell>
                <TableCell className="text-center">
                  {s.isLocked ? (
                    <Badge variant="default">
                      <Lock className="mr-1 h-3 w-3" />
                      {t("attendanceMonthlySummaryLocked")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("attendanceMonthlySummaryOpen")}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isFetching ? (
                    t("attendanceMonthlySummaryLoading")
                  ) : (
                      Chưa có dữ liệu tổng hợp. Nhấn &quot;Tính công&quot; để
                      tạo.
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Sentinel + count */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

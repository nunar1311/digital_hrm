import { useRef, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STATUS_CELL } from "./monthly-constants";
import type { MonthlyGridRow } from "../types";
import { cn } from "@/lib/utils";

interface MonthlyGridTableProps {
  rows: MonthlyGridRow[];
  totalCount: number;
  daysArray: number[];
  month: number;
  year: number;
  today: Date;
  showWeekend: boolean;
  hasMore: boolean;
  loadMore: () => void;
  isFetching: boolean;
}

export function MonthlyGridTable({
  rows,
  daysArray,
  month,
  year,
  today,
  showWeekend,
  hasMore,
  loadMore,
  isFetching,
}: MonthlyGridTableProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  const visibleDays = showWeekend
    ? daysArray
    : daysArray.filter((d) => {
        const date = new Date(year, month - 1, d);
        const day = date.getDay();
        return day !== 0 && day !== 6;
      });

  return (
    <div className="flex-1 relative h-full min-h-0 overflow-hidden">
      <TooltipProvider delayDuration={100}>
        <div className="relative flex flex-col h-[calc(100vh-11rem)] min-h-0 border-t overflow-auto">
          <Table>
            <TableHeader className="bg-background shadow-sm ">
              <TableRow>
                <TableHead className="bg-background min-w-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 border-r">
                  Nhân viên
                </TableHead>
                {visibleDays.map((d) => {
                  const date = new Date(year, month - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.getTime() === today.getTime();
                  return (
                    <TableHead
                      key={d}
                      className={cn(
                        "text-center min-w-[32px] px-1",
                        isWeekend ? "bg-muted/50" : "",
                        isToday
                          ? "bg-primary/20! font-bold! text-primary!"
                          : "",
                      )}
                    >
                      {d}
                    </TableHead>
                  );
                })}
                <TableHead className="text-center min-w-[50px] bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                  Công
                </TableHead>
                <TableHead className="text-center min-w-[50px] bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                  Muộn
                </TableHead>
                <TableHead className="text-center min-w-[50px] bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                  Vắng
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.user.id}>
                  <TableCell className="bg-background font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r">
                    <div>{row.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.user.employeeCode}
                    </div>
                  </TableCell>
                  {visibleDays.map((d) => {
                    const idx = d - 1;
                    const status = row.days[idx];
                    const date = new Date(year, month - 1, d);
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;
                    const isToday = date.getTime() === today.getTime();
                    const cell = status ? STATUS_CELL[status] : null;
                    return (
                      <TableCell
                        key={d}
                        className={`text-center px-1 py-1 ${isWeekend ? "bg-muted/50" : ""} ${isToday ? "bg-primary/10" : ""}`}
                      >
                        {cell ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex cursor-default h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${cell.className}`}
                              >
                                {cell.symbol}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {cell.label} - {date.toLocaleDateString("vi-VN")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className=" text-center font-bold bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.workDays}
                  </TableCell>
                  <TableCell className=" text-center text-yellow-600 bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.lateDays}
                  </TableCell>
                  <TableCell className=" text-center text-red-600 bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.absentDays}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visibleDays.length + 4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {isFetching
                      ? "Đang tải dữ liệu..."
                      : "Không có dữ liệu chấm công."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>
      {/* Sentinel + count */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

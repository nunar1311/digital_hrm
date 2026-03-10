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
    totalCount: _totalCount,
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
        <div>
            <div className="overflow-x-auto">
                <TooltipProvider delayDuration={100}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 z-10 bg-background min-w-40">
                                    Nhân viên
                                </TableHead>
                                {visibleDays.map((d) => {
                                    const date = new Date(
                                        year,
                                        month - 1,
                                        d,
                                    );
                                    const isWeekend =
                                        date.getDay() === 0 ||
                                        date.getDay() === 6;
                                    const isToday =
                                        date.getTime() ===
                                        today.getTime();
                                    return (
                                        <TableHead
                                            key={d}
                                            className={`text-center min-w-[32px] px-1 ${isWeekend ? "bg-muted/50" : ""} ${isToday ? "bg-primary/10 font-bold text-primary" : ""}`}
                                        >
                                            {d}
                                        </TableHead>
                                    );
                                })}
                                <TableHead className="text-center min-w-[50px]">
                                    Công
                                </TableHead>
                                <TableHead className="text-center min-w-[50px]">
                                    Muộn
                                </TableHead>
                                <TableHead className="text-center min-w-[50px]">
                                    Vắng
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.user.id}>
                                    <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                        <div>{row.user.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.user.employeeCode}
                                        </div>
                                    </TableCell>
                                    {visibleDays.map((d) => {
                                        const idx = d - 1;
                                        const status = row.days[idx];
                                        const date = new Date(
                                            year,
                                            month - 1,
                                            d,
                                        );
                                        const isWeekend =
                                            date.getDay() === 0 ||
                                            date.getDay() === 6;
                                        const isToday =
                                            date.getTime() ===
                                            today.getTime();
                                        const cell = status
                                            ? STATUS_CELL[status]
                                            : null;
                                        return (
                                            <TableCell
                                                key={d}
                                                className={`text-center px-1 py-1 ${isWeekend ? "bg-muted/50" : ""} ${isToday ? "bg-primary/5" : ""}`}
                                            >
                                                {cell ? (
                                                    <Tooltip>
                                                        <TooltipTrigger
                                                            asChild
                                                        >
                                                            <span
                                                                className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${cell.className}`}
                                                            >
                                                                {
                                                                    cell.symbol
                                                                }
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {
                                                                cell.label
                                                            }{" "}
                                                            -{" "}
                                                            {date.toLocaleDateString(
                                                                "vi-VN",
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-muted-foreground/30">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-center font-bold">
                                        {row.workDays}
                                    </TableCell>
                                    <TableCell className="text-center text-yellow-600">
                                        {row.lateDays}
                                    </TableCell>
                                    <TableCell className="text-center text-red-600">
                                        {row.absentDays}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            visibleDays.length + 4
                                        }
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
                </TooltipProvider>
            </div>
            {/* Sentinel + count */}
            <div ref={sentinelRef} className="h-1" />
        </div>
    );
}

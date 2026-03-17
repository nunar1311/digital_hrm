"use client";

import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Trash2,
    Settings2,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Shift } from "../types";
import type { ViewMode, ShiftColor } from "./shifts-constants";

interface ShiftNavigationProps {
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;
    rangeLabel: string;
    goToday: () => void;
    goPrev: () => void;
    goNext: () => void;
    shifts: Shift[];
    shiftColorMap: Map<string, ShiftColor>;
    canManage: boolean;
    onEditShift: (shift: Shift) => void;
    onDeleteShift: (shift: Shift) => void;
    onManageShifts: () => void;
    totalAssignments?: number;
    inactiveCount: number;
}

export function ShiftNavigation({
    viewMode,
    setViewMode,
    rangeLabel,
    goToday,
    goPrev,
    goNext,
    shifts,
    shiftColorMap,
    canManage,
    onEditShift,
    onDeleteShift,
    onManageShifts,
    inactiveCount,
}: ShiftNavigationProps) {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between ">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={goToday}
                    >
                        Hôm nay
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Quay về hôm nay</p>
                </TooltipContent>
            </Tooltip>
            {/* View mode toggle */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="xs"
                        className="focus-visible:ring-0  text-xs"
                    >
                        {viewMode === "day"
                            ? "Ngày"
                            : viewMode === "week"
                              ? "Tuần"
                              : "Tháng"}
                        <ChevronDown className="size-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs">
                            Chế độ xem
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => setViewMode("day")}
                        >
                            Ngày
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setViewMode("week")}
                        >
                            Tuần
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setViewMode("month")}
                        >
                            Tháng
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Date navigation */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={goPrev}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {viewMode === "day"
                            ? "Ngày trước"
                            : viewMode === "week"
                              ? "Tuần trước"
                              : "Tháng trước"}
                    </p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={goNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {viewMode === "day"
                            ? "Ngày sau"
                            : viewMode === "week"
                              ? "Tuần sau"
                              : "Tháng sau"}
                    </p>
                </TooltipContent>
            </Tooltip>

            <span className="ml-1 min-w-50 text-sm font-semibold">
                {rangeLabel}
            </span>

            {/* Shift legend */}
            {/* <div className="flex flex-wrap items-center gap-2">
                {shifts
                    .filter((s) => s.isActive)
                    .slice(0, 5) // Show up to 5 active shifts
                    .map((s) => {
                        const color = shiftColorMap.get(s.id);
                        return (
                            <div
                                key={s.id}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={cn(
                                        "h-2.5 w-2.5 rounded-full",
                                        color?.dot,
                                    )}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {s.name}
                                </span>
                                {canManage && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onEditShift(s)
                                                }
                                            >
                                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                                Sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    onDeleteShift(s)
                                                }
                                            >
                                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                Xóa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        );
                    })}

                {canManage && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs text-muted-foreground"
                        onClick={onManageShifts}
                    >
                        <Settings2 className="h-3 w-3" />
                        Quản lý ca
                        {inactiveCount > 0 && (
                            <Badge
                                variant="outline"
                                className="ml-1 h-4 px-1 text-[10px]"
                            >
                                {inactiveCount} tắt
                            </Badge>
                        )}
                    </Button>
                )}
            </div> */}
        </div>
    );
}

"use client";

import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Trash2,
    Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Shift } from "../types";
import type { ViewMode, ShiftColor } from "./shifts-constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* View mode toggle */}
            <Select
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
            >
                <SelectTrigger size="sm" className="min-w-32">
                    <SelectValue placeholder="Chế độ xem" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day">Ngày</SelectItem>
                    <SelectItem value="week">Tuần</SelectItem>
                    <SelectItem value="month">Tháng</SelectItem>
                </SelectContent>
            </Select>

            {/* Date navigation */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToday}>
                    Hôm nay
                </Button>
                <div className="flex items-center rounded-md border">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={goPrev}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Separator
                        orientation="vertical"
                        className="h-5"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={goNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <span className="ml-1 min-w-50 text-sm font-semibold">
                    {rangeLabel}
                </span>
            </div>

            {/* Shift legend */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Active shifts */}
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
                {/* Manage shifts button */}
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
            </div>
        </div>
    );
}

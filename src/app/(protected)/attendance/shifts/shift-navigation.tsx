"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function ShiftNavigation({
    viewMode,
    setViewMode,
    rangeLabel,
    goToday,
    goPrev,
    goNext,
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
        </div>
    );
}

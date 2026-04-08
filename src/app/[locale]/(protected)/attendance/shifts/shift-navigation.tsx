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
import type { ViewMode } from "./shifts-constants";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ProtectedPages");

    return (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between ">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={goToday}
                    >
                        {t("attendanceShiftsToday")}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("attendanceShiftsBackToToday")}</p>
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
                            ? t("attendanceShiftsViewDay")
                            : viewMode === "week"
                              ? t("attendanceShiftsViewWeek")
                              : t("attendanceShiftsViewMonth")}
                        <ChevronDown className="size-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs">
                            {t("attendanceShiftsViewMode")}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => setViewMode("day")}
                        >
                            {t("attendanceShiftsViewDay")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setViewMode("week")}
                        >
                            {t("attendanceShiftsViewWeek")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setViewMode("month")}
                        >
                            {t("attendanceShiftsViewMonth")}
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
                            ? t("attendanceShiftsPrevDay")
                            : viewMode === "week"
                              ? t("attendanceShiftsPrevWeek")
                              : t("attendanceShiftsPrevMonth")}
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
                            ? t("attendanceShiftsNextDay")
                            : viewMode === "week"
                              ? t("attendanceShiftsNextWeek")
                              : t("attendanceShiftsNextMonth")}
                    </p>
                </TooltipContent>
            </Tooltip>

            <span className="ml-1 min-w-50 text-sm font-semibold">
                {rangeLabel}
            </span>
        </div>
    );
}

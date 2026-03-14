"use client";

import { useMemo } from "react";
import {
    format,
    parseISO,
    isSameMonth,
    isToday,
    setHours,
    setMinutes,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InterviewResponse } from "@/app/(protected)/recruitment/types";
import {
    getStatusColor,
    getInterviewTypeIcon,
    WEEKDAY_LABELS,
    DAY_HOURS,
} from "./calendar-utils";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

interface CalendarGridProps {
    viewMode: ViewMode;
    currentDate: Date;
    interviews: InterviewResponse[];
    isLoading: boolean;
    onDateClick: (date: Date) => void;
    onInterviewClick: (interview: InterviewResponse) => void;
}

export function CalendarGrid({
    viewMode,
    currentDate,
    interviews,
    isLoading,
    onDateClick,
    onInterviewClick,
}: CalendarGridProps) {
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, {
            weekStartsOn: 1,
        });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
        });
    }, [currentDate]);

    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentDate, {
            weekStartsOn: 1,
        });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }, [currentDate]);

    const getInterviewsForDay = (day: Date) => {
        return interviews.filter((interview: InterviewResponse) => {
            const interviewDate = parseISO(interview.scheduledDate);
            return (
                interviewDate.getFullYear() === day.getFullYear() &&
                interviewDate.getMonth() === day.getMonth() &&
                interviewDate.getDate() === day.getDate()
            );
        });
    };

    const InterviewTooltipContent = ({
        interview,
    }: {
        interview: InterviewResponse;
    }) => (
        <div className="space-y-2 w-56">
            <div className="font-semibold">
                {interview.candidateName}
            </div>
            <div className="text-sm text-muted-foreground">
                {interview.jobPostingTitle}
            </div>
            <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                {interview.scheduledTime} - {interview.duration} phút
            </div>
            <div className="flex items-center gap-2 text-xs">
                Vòng {interview.round}
            </div>
            <Badge
                variant={
                    interview.status === "SCHEDULED"
                        ? "default"
                        : interview.status === "COMPLETED"
                          ? "secondary"
                          : "destructive"
                }
                className="text-xs"
            >
                {interview.status}
            </Badge>
        </div>
    );

    const renderMonthView = () => (
        <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day) => {
                const dayInterviews = getInterviewsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            "min-h-[140px] border-r border-b last:border-r-0 p-1 transition-colors hover:bg-muted/20 cursor-pointer",
                            !isCurrentMonth && "bg-muted/20",
                            isCurrentDay && "bg-primary/5",
                        )}
                        onClick={() => onDateClick(day)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span
                                className={cn(
                                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                                    isCurrentDay
                                        ? "bg-primary text-primary-foreground"
                                        : !isCurrentMonth
                                          ? "text-muted-foreground/50"
                                          : "",
                                )}
                            >
                                {format(day, "d")}
                            </span>
                            {dayInterviews.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] h-5 px-1.5"
                                >
                                    {dayInterviews.length}
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-1 max-h-[90px] overflow-y-auto">
                            {dayInterviews
                                .slice(0, 4)
                                .map(
                                    (
                                        interview: InterviewResponse,
                                    ) => (
                                        <TooltipProvider
                                            key={interview.id}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger
                                                    asChild
                                                >
                                                    <div
                                                        className={cn(
                                                            "text-[10px] p-1 rounded cursor-pointer truncate transition-all hover:scale-[1.02]",
                                                            getStatusColor(
                                                                interview.status,
                                                            ),
                                                            "text-white",
                                                        )}
                                                        onClick={(
                                                            e,
                                                        ) => {
                                                            e.stopPropagation();
                                                            onInterviewClick(
                                                                interview,
                                                            );
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getInterviewTypeIcon(
                                                                interview.type,
                                                            )}
                                                            <span className="truncate font-medium">
                                                                {
                                                                    interview.candidateName
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-[9px] opacity-90">
                                                            {
                                                                interview.scheduledTime
                                                            }
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="w-64">
                                                    <InterviewTooltipContent
                                                        interview={
                                                            interview
                                                        }
                                                    />
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ),
                                )}
                            {dayInterviews.length > 4 && (
                                <div className="text-[10px] text-muted-foreground text-center py-0.5">
                                    +{dayInterviews.length - 4} phỏng
                                    vấn
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderWeekView = () => (
        <div className="grid grid-cols-8 flex-1 overflow-auto no-scrollbar">
            <div className="border-r">
                {DAY_HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="h-16 border-b text-xs text-muted-foreground px-1 py-1"
                    >
                        {format(
                            setMinutes(setHours(new Date(), hour), 0),
                            "HH:mm",
                        )}
                    </div>
                ))}
            </div>
            {weekDays.map((day) => {
                const dayInterviews = getInterviewsForDay(day);
                return (
                    <div key={day.toISOString()} className="border-r">
                        <div
                            className={cn(
                                "py-2 text-center text-sm font-medium border-b",
                                isToday(day)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground",
                            )}
                        >
                            <div className="text-xs">
                                {format(day, "EEE", { locale: vi })}
                            </div>
                            <div
                                className={cn(
                                    "text-lg font-semibold",
                                    isToday(day) && "text-primary",
                                )}
                            >
                                {format(day, "d")}
                            </div>
                        </div>
                        {DAY_HOURS.map((hour) => {
                            const hourInterviews =
                                dayInterviews.filter(
                                    (i: InterviewResponse) =>
                                        parseInt(
                                            i.scheduledTime.split(
                                                ":",
                                            )[0],
                                        ) === hour,
                                );
                            return (
                                <div
                                    key={hour}
                                    className="h-16 border-b p-0.5 hover:bg-muted/20 transition-colors"
                                >
                                    {hourInterviews.map(
                                        (
                                            interview: InterviewResponse,
                                        ) => (
                                            <TooltipProvider
                                                key={interview.id}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger
                                                        asChild
                                                    >
                                                        <div
                                                            className={cn(
                                                                "text-[10px] p-1 rounded cursor-pointer truncate mb-0.5 transition-all hover:scale-[1.02]",
                                                                getStatusColor(
                                                                    interview.status,
                                                                ),
                                                                "text-white",
                                                            )}
                                                            onClick={() =>
                                                                onInterviewClick(
                                                                    interview,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {getInterviewTypeIcon(
                                                                    interview.type,
                                                                )}
                                                                <span className="truncate font-medium">
                                                                    {
                                                                        interview.candidateName
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <InterviewTooltipContent
                                                            interview={
                                                                interview
                                                            }
                                                        />
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ),
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );

    const renderDayView = () => (
        <div className="grid grid-cols-[60px_1fr] flex-1 overflow-auto no-scrollbar">
            <div className="border-r">
                {DAY_HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="h-20 border-b text-xs text-muted-foreground px-2 py-2"
                    >
                        {format(
                            setMinutes(setHours(new Date(), hour), 0),
                            "HH:mm",
                        )}
                    </div>
                ))}
            </div>
            <div className="relative">
                {DAY_HOURS.map((hour) => {
                    const hourInterviews = getInterviewsForDay(
                        currentDate,
                    ).filter(
                        (i: InterviewResponse) =>
                            parseInt(
                                i.scheduledTime.split(":")[0],
                            ) === hour,
                    );
                    return (
                        <div
                            key={hour}
                            className="h-20 border-b hover:bg-muted/10 transition-colors"
                        >
                            {hourInterviews.map(
                                (interview: InterviewResponse) => (
                                    <TooltipProvider
                                        key={interview.id}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "absolute left-1 right-1 p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-10",
                                                        getStatusColor(
                                                            interview.status,
                                                        ),
                                                        "text-white",
                                                    )}
                                                    style={{
                                                        top: "4px",
                                                        height: `${Math.max(interview.duration - 8, 30)}px`,
                                                    }}
                                                    onClick={() =>
                                                        onInterviewClick(
                                                            interview,
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {getInterviewTypeIcon(
                                                            interview.type,
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold truncate">
                                                                {
                                                                    interview.candidateName
                                                                }
                                                            </div>
                                                            <div className="text-xs opacity-90 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {
                                                                    interview.scheduledTime
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    interview.duration
                                                                }{" "}
                                                                phút
                                                            </div>
                                                            <div className="text-xs opacity-90 truncate">
                                                                {
                                                                    interview.jobPostingTitle
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <InterviewTooltipContent
                                                    interview={
                                                        interview
                                                    }
                                                />
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ),
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderCalendarHeader = () => {
        if (viewMode === "month") {
            return (
                <div className="grid grid-cols-7 border-b">
                    {WEEKDAY_LABELS.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 bg-muted/30"
                        >
                            {day}
                        </div>
                    ))}
                </div>
            );
        }
        if (viewMode === "week") {
            return (
                <div className="grid grid-cols-8 border-b">
                    <div className="w-12 border-r bg-muted/30" />
                    {weekDays.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "py-2 text-center text-sm font-medium border-r last:border-r-0",
                                isToday(day)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground",
                            )}
                        >
                            <div className="text-xs">
                                {format(day, "EEE", { locale: vi })}
                            </div>
                            <div
                                className={cn(
                                    "text-lg font-semibold",
                                    isToday(day) && "text-primary",
                                )}
                            >
                                {format(day, "d")}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return (
            <div className="py-2 px-4 border-b bg-muted/30">
                <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                        {format(currentDate, "EEEE", { locale: vi })}
                    </div>
                    <div
                        className={cn(
                            "text-3xl font-bold",
                            isToday(currentDate) && "text-primary",
                        )}
                    >
                        {format(currentDate, "d MMMM yyyy", {
                            locale: vi,
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card className="flex-1 overflow-hidden shadow-sm">
                <CardContent className="p-0 h-full flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex-1 overflow-hidden shadow-sm py-0">
            <CardContent className="p-0 h-full overflow-auto no-scrollbar">
                {renderCalendarHeader()}
                {viewMode === "month" && renderMonthView()}
                {viewMode === "week" && renderWeekView()}
                {viewMode === "day" && renderDayView()}
            </CardContent>
        </Card>
    );
}

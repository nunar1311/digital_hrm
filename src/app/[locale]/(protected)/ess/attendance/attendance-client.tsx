"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Coffee,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getMyAttendanceHistory } from "../actions";

type AttendanceQueryResult = Awaited<ReturnType<typeof getMyAttendanceHistory>>;

type AttendanceRecord = AttendanceQueryResult["attendances"][number];

type AttendanceSummary = NonNullable<AttendanceQueryResult["summary"]>;

interface ESSAttendanceClientProps {
    initialData: AttendanceQueryResult;
    currentMonth: number;
    currentYear: number;
}

const statusConfig: Record<string, { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string; icon: React.ComponentType<{ className?: string }> }> = {
    PRESENT: { labelKey: "essAttendanceStatusPresent", variant: "default", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    LATE: { labelKey: "essAttendanceStatusLate", variant: "secondary", className: "bg-amber-100 text-amber-800", icon: Clock },
    EARLY_LEAVE: { labelKey: "essAttendanceStatusEarlyLeave", variant: "secondary", className: "bg-orange-100 text-orange-800", icon: Clock },
    LATE_AND_EARLY: { labelKey: "essAttendanceStatusLateAndEarly", variant: "destructive", className: "bg-red-100 text-red-800", icon: AlertCircle },
    ABSENT: { labelKey: "essAttendanceStatusAbsent", variant: "destructive", icon: XCircle },
    HALF_DAY: { labelKey: "essAttendanceStatusHalfDay", variant: "outline", icon: Coffee },
    ON_LEAVE: { labelKey: "essAttendanceStatusOnLeave", variant: "secondary", className: "bg-blue-100 text-blue-800", icon: Calendar },
    HOLIDAY: { labelKey: "essAttendanceStatusHoliday", variant: "outline", className: "bg-purple-100 text-purple-800", icon: Calendar },
};

function formatTime(dateStr: string | null) {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
    });
}

function getDayOfWeek(dateStr: string) {
    return new Date(dateStr).getDay();
}

const MONTH_KEYS = [
    "essAttendanceMonth1", "essAttendanceMonth2", "essAttendanceMonth3", "essAttendanceMonth4", "essAttendanceMonth5", "essAttendanceMonth6",
    "essAttendanceMonth7", "essAttendanceMonth8", "essAttendanceMonth9", "essAttendanceMonth10", "essAttendanceMonth11", "essAttendanceMonth12"
] as const;

const WEEKDAY_KEYS = [
    "essAttendanceWeekdayMon",
    "essAttendanceWeekdayTue",
    "essAttendanceWeekdayWed",
    "essAttendanceWeekdayThu",
    "essAttendanceWeekdayFri",
    "essAttendanceWeekdaySat",
    "essAttendanceWeekdaySun",
] as const;

export function ESSAttendanceClient({ initialData, currentMonth: initialMonth, currentYear: initialYear }: ESSAttendanceClientProps) {
    const t = useTranslations("ProtectedPages");
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedYear, setSelectedYear] = useState(initialYear);

    const { data, isLoading } = useQuery({
        queryKey: ["my-attendance", selectedMonth, selectedYear],
        queryFn: () => getMyAttendanceHistory(selectedMonth, selectedYear),
        initialData: initialData,
    });

    const attendances = data?.attendances || [];
    const summary = data?.summary || {
        standardDays: 0,
        totalWorkDays: 0,
        lateDays: 0,
        earlyLeaveDays: 0,
        leaveDays: 0,
        unpaidLeaveDays: 0,
        totalOtHours: 0,
    };

    // Group by week
    const weeks: AttendanceRecord[][] = [];
    let currentWeek: AttendanceRecord[] = [];
    
    // Sort by date
    const sortedAttendances = [...attendances].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedAttendances.forEach((record, index) => {
        const dayOfWeek = getDayOfWeek(record.date);
        
        if (index === 0 && dayOfWeek !== 1) {
            // Pad start of week if needed
            for (let i = 1; i < dayOfWeek; i++) {
                currentWeek.push({} as AttendanceRecord);
            }
        }
        
        currentWeek.push(record);
        
        if (dayOfWeek === 0 || index === sortedAttendances.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    // Stats
    const onTimeDays = summary.totalWorkDays - summary.lateDays;
    const punctualityRate = summary.totalWorkDays > 0 
        ? Math.round((onTimeDays / summary.totalWorkDays) * 100) 
        : 0;

    const changeMonth = (delta: number) => {
        let newMonth = selectedMonth + delta;
        let newYear = selectedYear;
        
        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        } else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-blue-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <CalendarCheck className="h-6 w-6 text-blue-600" />
                                {t("essAttendanceTitle")}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("essAttendanceDescription")}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            {t("essAttendanceDownloadTimesheet")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Month Selector */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">
                                    {t(MONTH_KEYS[selectedMonth - 1])} {selectedYear}
                                </h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                {t("essAttendanceStatsWorkDays")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold">{summary.totalWorkDays}</div>
                                <p className="text-xs text-muted-foreground">
                                    / {summary.standardDays} {t("essAttendanceStatsStandardDays")}
                                </p>
                                <Progress 
                                    value={summary.standardDays > 0 ? (summary.totalWorkDays / summary.standardDays) * 100 : 0} 
                                    className="h-2" 
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                {t("essAttendanceStatsPunctualityRate")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold">{punctualityRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    {onTimeDays} / {summary.totalWorkDays} {t("essAttendanceStatsOnTimeDays")}
                                </p>
                                <Progress value={punctualityRate} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                {t("essAttendanceStatsLate")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold">{summary.lateDays}</div>
                                <p className="text-xs text-muted-foreground">
                                    {t("essAttendanceStatsLateDaysInMonth")}
                                </p>
                                {summary.lateDays > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                        {t("essAttendanceNeedImprove")}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                {t("essAttendanceStatsOt")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold">{summary.totalOtHours}h</div>
                                <p className="text-xs text-muted-foreground">
                                    {t("essAttendanceStatsOtHoursInMonth")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Calendar */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("essAttendanceHistoryTitle")}</CardTitle>
                        <CardDescription>
                            {t("essAttendanceHistoryDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : attendances.length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">
                                    {t("essAttendanceEmptyMonth")}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Week days header */}
                                <div className="grid grid-cols-7 gap-2">
                                    {WEEKDAY_KEYS.map((dayKey, i) => (
                                        <div key={i} className={cn(
                                            "text-center text-xs font-medium py-2",
                                            (i === 5 || i === 6) && "text-muted-foreground"
                                        )}>
                                            {t(dayKey)}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7 gap-2">
                                        {/* Fill empty cells at start of week */}
                                        {weekIndex === 0 && week.length < 7 && (
                                            <>
                                                {Array.from({ length: 7 - week.length }).map((_, i) => (
                                                    <div key={`empty-start-${i}`} className="aspect-square" />
                                                ))}
                                            </>
                                        )}
                                        
                                        {week.map((record, dayIndex) => {
                                            if (!record.id) {
                                                return <div key={`empty-${dayIndex}`} className="aspect-square" />;
                                            }
                                            
                                            const status = statusConfig[record.status] || statusConfig.PRESENT;
                                            const StatusIcon = status.icon;
                                            const dayOfWeek = getDayOfWeek(record.date);
                                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                            return (
                                                <div
                                                    key={record.id}
                                                    className={cn(
                                                        "aspect-square rounded-lg border p-2 flex flex-col items-center justify-center transition-all hover:shadow-md cursor-pointer",
                                                        isWeekend && "bg-muted/30",
                                                        record.status === "PRESENT" && "bg-emerald-50 border-emerald-200",
                                                        record.status === "ABSENT" && "bg-red-50 border-red-200",
                                                        record.status === "ON_LEAVE" && "bg-blue-50 border-blue-200",
                                                        record.status === "HOLIDAY" && "bg-purple-50 border-purple-200",
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-xs font-medium",
                                                        isWeekend && "text-muted-foreground"
                                                    )}>
                                                        {new Date(record.date).getDate()}
                                                    </span>
                                                    <div className={cn(
                                                        "mt-1",
                                                        record.status && status.className?.includes("text-emerald") && "text-emerald-600",
                                                        record.status && status.className?.includes("text-red") && "text-red-600",
                                                        record.status && status.className?.includes("text-amber") && "text-amber-600",
                                                    )}>
                                                        {record.status === "PRESENT" ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : record.status === "ABSENT" ? (
                                                            <XCircle className="h-3 w-3" />
                                                        ) : record.status === "ON_LEAVE" || record.status === "HOLIDAY" ? (
                                                            <Calendar className="h-3 w-3" />
                                                        ) : (
                                                            <Clock className="h-3 w-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance List */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("essAttendanceDetailTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : attendances.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">{t("essAttendanceEmpty")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedAttendances.slice().reverse().map((record) => {
                                    const status = statusConfig[record.status] || statusConfig.PRESENT;
                                    const StatusIcon = status.icon;
                                    
                                    return (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    record.status === "PRESENT" && "bg-emerald-100 text-emerald-600",
                                                    record.status === "ABSENT" && "bg-red-100 text-red-600",
                                                    record.status?.includes("LATE") && "bg-amber-100 text-amber-600",
                                                    record.status === "ON_LEAVE" && "bg-blue-100 text-blue-600",
                                                    record.status === "HOLIDAY" && "bg-purple-100 text-purple-600",
                                                )}>
                                                    <StatusIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{formatDate(record.date)}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <span>{t("essAttendanceCheckIn")}: {formatTime(record.checkIn)}</span>
                                                        <span>-</span>
                                                        <span>{t("essAttendanceCheckOut")}: {formatTime(record.checkOut)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {record.shift && (
                                                    <div className="text-sm text-muted-foreground hidden sm:block">
                                                        {t("essAttendanceShift")}: {record.shift.name}
                                                    </div>
                                                )}
                                                <Badge variant={status.variant} className={status.className}>
                                                    {t(status.labelKey)}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

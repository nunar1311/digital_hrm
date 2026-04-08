"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    CalendarDays,
    CalendarCheck,
    Clock,
    FileText,
    Wallet,
    ChevronRight,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Sun,
    Moon,
    TrendingUp,
    Bell,
    LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Profile {
    fullName?: string;
    name?: string;
    employeeCode: string;
    department?: { name: string };
    position?: { name: string };
    avatar?: string;
}

interface LeaveBalance {
    id: string;
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    carriedForward: number;
    policyYear: number;
    leaveType: {
        id: string;
        name: string;
        description: string | null;
        isPaidLeave: boolean;
    };
}

interface AttendanceSummary {
    standardDays: number;
    totalWorkDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
    totalOtHours: number;
}

interface TodayShift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface TodayAttendance {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    shift: TodayShift | null;
}

interface Holiday {
    id: string;
    name: string;
    date: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    type: string;
}

interface PendingRequests {
    leaveRequests: number;
    profileRequests: number;
    adminRequests: number;
    total: number;
}

interface ESSDashboardData {
    profile: Profile;
    leaveBalances: LeaveBalance[];
    attendanceSummary: AttendanceSummary;
    todayShift: TodayShift | null;
    todayAttendance: TodayAttendance | null;
    upcomingHolidays: Holiday[];
    announcements: Announcement[];
    pendingRequests: PendingRequests;
}

interface ESSClientProps {
    initialData: ESSDashboardData;
}

function formatTime(timeStr: string) {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
}

function getGreeting(t: ReturnType<typeof useTranslations>) {
    const hour = new Date().getHours();
    if (hour < 12) return t("essQuickInfoGreetingMorning");
    if (hour < 18) return t("essQuickInfoGreetingAfternoon");
    return t("essQuickInfoGreetingEvening");
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const statusConfig: Record<string, { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    PRESENT: { labelKey: "essQuickInfoStatusCheckedIn", variant: "secondary", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
    ABSENT: { labelKey: "essQuickInfoStatusAbsent", variant: "destructive" },
    LATE: { labelKey: "essQuickInfoStatusLate", variant: "outline", className: "text-orange-600" },
};

// Quick Actions Data
const quickActions: { titleKey: string; descriptionKey: string; href: string; icon: LucideIcon; color: string }[] = [
    {
        titleKey: "essQuickInfoActionLeaveTitle",
        descriptionKey: "essQuickInfoActionLeaveDescription",
        href: "/ess/leave",
        icon: CalendarDays,
        color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
    },
    {
        titleKey: "essQuickInfoActionTimesheetTitle",
        descriptionKey: "essQuickInfoActionTimesheetDescription",
        href: "/ess/attendance",
        icon: CalendarCheck,
        color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
    },
    {
        titleKey: "essClientActionAdminTitle",
        descriptionKey: "essClientActionAdminDescription",
        href: "/ess/requests",
        icon: FileText,
        color: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20",
    },
    {
        titleKey: "essMenuPayslipTitle",
        descriptionKey: "essClientActionPayslipDescription",
        href: "/ess/payroll",
        icon: Wallet,
        color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
    },
];

export function ESSClient({ initialData }: ESSClientProps) {
    const t = useTranslations("ProtectedPages");
    const userName = initialData.profile.fullName || initialData.profile.name || t("essQuickInfoEmployeeFallback");
    const greeting = getGreeting(t);
    const currentStatus = initialData.todayAttendance?.status
        ? statusConfig[initialData.todayAttendance.status] || { labelKey: "essQuickInfoStatusUnknown", variant: "outline" as const }
        : { labelKey: "essQuickInfoStatusNotCheckedIn", variant: "outline" as const };

    const workProgress = initialData.attendanceSummary.standardDays > 0
        ? (initialData.attendanceSummary.totalWorkDays / initialData.attendanceSummary.standardDays) * 100
        : 0;

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Welcome Header - Full Width Banner */}
                <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                    <div className="relative p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20">
                                    <AvatarImage src={initialData.profile.avatar} alt={userName} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">
                                        {greeting}, <span className="text-primary">{userName}</span>
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-muted-foreground text-sm">
                                        <Badge variant="outline" className="font-normal">
                                            {initialData.profile.employeeCode}
                                        </Badge>
                                        <span className="text-muted-foreground/50">•</span>
                                        <span>{initialData.profile.department?.name || t("essQuickInfoNoDepartment")}</span>
                                        <span className="text-muted-foreground/50">•</span>
                                        <span>{initialData.profile.position?.name || t("essQuickInfoNoPosition")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">
                                        {new Date().toLocaleDateString("vi-VN", { weekday: "long" })}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {new Date().toLocaleDateString("vi-VN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </div>
                                </div>
                                <Clock className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - 4 Columns */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Today's Shift */}
                    <Card className="group hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                {initialData.todayShift ? (
                                    <Sun className="h-4 w-4 text-orange-500" />
                                ) : (
                                    <Moon className="h-4 w-4 text-slate-500" />
                                )}
                                {t("essQuickInfoTodayShift")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {initialData.todayShift ? (
                                <div className="space-y-1">
                                    <div className="font-semibold text-lg">{initialData.todayShift.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(initialData.todayShift.startTime)} - {formatTime(initialData.todayShift.endTime)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">{t("essQuickInfoNoShiftAssigned")}</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Attendance Status */}
                    <Card className="group hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                {t("essQuickInfoTodayStatus")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Badge variant={currentStatus.variant} className={currentStatus.className}>
                                    {t(currentStatus.labelKey)}
                                </Badge>
                                {initialData.todayAttendance && (
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{t("essQuickInfoCheckIn")}:</span>
                                            <span>{initialData.todayAttendance.checkIn
                                                ? new Date(initialData.todayAttendance.checkIn).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                                                : "--:--"
                                            }</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{t("essQuickInfoCheckOut")}:</span>
                                            <span>{initialData.todayAttendance.checkOut
                                                ? new Date(initialData.todayAttendance.checkOut).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                                                : "--:--"
                                            }</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Work Progress */}
                    <Card className="group hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                {t("essQuickInfoMonthlyWork")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">{initialData.attendanceSummary.totalWorkDays}</span>
                                    <span className="text-sm text-muted-foreground">/ {initialData.attendanceSummary.standardDays} {t("essQuickInfoDayUnit")}</span>
                                </div>
                                <Progress value={workProgress} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{t("essQuickInfoProgress")}: {Math.round(workProgress)}%</span>
                                    {initialData.attendanceSummary.lateDays > 0 && (
                                        <span className="text-orange-600">{initialData.attendanceSummary.lateDays} {t("essQuickInfoLateDays")}</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card className={cn(
                        "group hover:shadow-md transition-all duration-200",
                        initialData.pendingRequests.total > 0 && "border-orange-200 bg-orange-50/50"
                    )}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Bell className="h-4 w-4 text-orange-500" />
                                {t("essQuickInfoPendingRequests")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {initialData.pendingRequests.total > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-orange-600">{initialData.pendingRequests.total}</span>
                                        <span className="text-sm text-muted-foreground">{t("essQuickInfoRequestUnit")}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 text-xs">
                                        {initialData.pendingRequests.leaveRequests > 0 && (
                                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                                                {initialData.pendingRequests.leaveRequests} {t("essQuickInfoLeaveRequestUnit")}
                                            </Badge>
                                        )}
                                        {initialData.pendingRequests.adminRequests > 0 && (
                                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                                                {initialData.pendingRequests.adminRequests} {t("essQuickInfoHrAdminUnit")}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-sm">{t("essQuickInfoNoRequest")}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions - Full Width Strip */}
                <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-blue-600" />
                                {t("essQuickInfoQuickActions")}
                            </CardTitle>
                            <Link href="/ess/my-requests">
                                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                                    {t("essClientViewAllRequests")}
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={action.href} href={action.href}>
                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white hover:bg-white/80 border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all duration-200 group cursor-pointer">
                                            <div className={cn("p-2.5 rounded-lg", action.color)}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                                    {t(action.titleKey)}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {t(action.descriptionKey)}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Two Column Layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Leave Balance */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-blue-600" />
                                    {t("essQuickInfoLeaveBalanceTitle")}
                                </CardTitle>
                                <CardDescription>
                                    {t("essQuickInfoYear")} {new Date().getFullYear()} • {initialData.leaveBalances.length} {t("essQuickInfoLeaveTypes")}
                                </CardDescription>
                            </div>
                            <Link href="/ess/leave">
                                <Button variant="ghost" size="sm" className="text-xs gap-1">
                                    {t("essQuickInfoViewAll")}
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {initialData.leaveBalances.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-8 text-center">
                                    <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                    {t("essQuickInfoNoLeaveBalance")}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {initialData.leaveBalances.slice(0, 4).map((balance) => {
                                        const remaining = Math.max(0, balance.totalDays - balance.usedDays - balance.pendingDays);
                                        const usagePercent = balance.totalDays > 0
                                            ? ((balance.usedDays + balance.pendingDays) / balance.totalDays) * 100
                                            : 0;
                                        return (
                                            <div key={balance.id} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{balance.leaveType.name}</span>
                                                        {balance.leaveType.isPaidLeave && (
                                                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                                                {t("essQuickInfoPaid")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {remaining} / {balance.totalDays} {t("essQuickInfoDayUnit")}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={100 - usagePercent}
                                                    className="h-2"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{t("essQuickInfoUsed")}: {balance.usedDays} {t("essQuickInfoDayUnit")}</span>
                                                    {balance.pendingDays > 0 && (
                                                        <span className="text-orange-600 font-medium">
                                                            {t("essQuickInfoPending")}: {balance.pendingDays} {t("essQuickInfoDayUnit")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column - Holidays & Announcements */}
                    <div className="space-y-6">
                        {/* Upcoming Holidays */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    {t("essQuickInfoUpcomingHolidays")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {initialData.upcomingHolidays.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        {t("essQuickInfoNoHolidayIn30Days")}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {initialData.upcomingHolidays.slice(0, 3).map((holiday) => (
                                            <div
                                                key={holiday.id}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
                                                    <CalendarDays className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{holiday.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(holiday.date).toLocaleDateString("vi-VN", {
                                                            weekday: "long",
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Announcements */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-amber-500" />
                                    {t("essQuickInfoNewAnnouncements")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {initialData.announcements.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        {t("essQuickInfoNoAnnouncement")}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {initialData.announcements.slice(0, 3).map((ann) => (
                                            <div
                                                key={ann.id}
                                                className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm">{ann.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {ann.content}
                                                        </p>
                                                    </div>
                                                    {ann.type === "WARNING" && (
                                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 shrink-0">
                                                            {t("essQuickInfoImportant")}
                                                        </Badge>
                                                    )}
                                                    {ann.type === "INFO" && (
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            {t("essQuickInfoAnnouncement")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(ann.date).toLocaleDateString("vi-VN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

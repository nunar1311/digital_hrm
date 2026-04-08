"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Minus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceStats } from "@/app/[locale]/(protected)/attendance/actions";
import type { AttendanceStats } from "@/app/[locale]/(protected)/attendance/types";

interface AttendanceStatsCardProps {
  periodType: "week" | "month";
}

export function AttendanceStatsCard({ periodType }: AttendanceStatsCardProps) {
  const t = useTranslations("ProtectedPages");
  const periodShort =
    periodType === "week"
      ? t("attendanceStatsCardPeriodWeek")
      : t("attendanceStatsCardPeriodMonth");
  const periodCurrent =
    periodType === "week"
      ? t("attendanceStatsCardPeriodCurrentWeek")
      : t("attendanceStatsCardPeriodCurrentMonth");

  const { data: stats, isLoading } = useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats", periodType],
    queryFn: async () => {
      const res = await getAttendanceStats(periodType);
      return res as AttendanceStats;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("attendanceStatsCardTitleWithPeriod", { period: periodShort })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("attendanceStatsCardTitleWithPeriod", { period: periodShort })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("attendanceStatsCardNoData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("attendanceStatsCardTitleWithPeriod", { period: periodCurrent })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 border border-green-100 dark:border-green-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                {t("attendanceStatsCardOnTimeRate")}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {t("attendanceStatsCardWorkDaysSummary", {
                  present: stats.presentDays,
                  total: stats.totalDays,
                })}
              </p>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.onTimeRate}%
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-green-100 dark:bg-green-900/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(stats.onTimeRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 p-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-green-700 dark:text-green-400">
                {t("attendanceStatsCardOnTime")}
              </p>
              <p className="font-semibold">{stats.presentDays}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 p-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {t("attendanceStatsCardLate")}
              </p>
              <p className="font-semibold">{stats.lateDays}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-orange-50 dark:bg-orange-950/30 p-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-orange-700 dark:text-orange-400">
                {t("attendanceStatsCardEarlyLeave")}
              </p>
              <p className="font-semibold">{stats.earlyLeaveDays}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-red-700 dark:text-red-400">
                {t("attendanceStatsCardAbsent")}
              </p>
              <p className="font-semibold">{stats.absentDays}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-950/30 p-2 text-sm">
          <div className="flex items-center gap-2">
            <Minus className="h-3 w-3 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {t("attendanceStatsCardOnLeave")}
            </span>
          </div>
          <span className="font-medium">
            {t("attendanceStatsCardDaysValue", { days: stats.onLeaveDays })}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-950/30 p-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {t("attendanceStatsCardHoliday")}
            </span>
          </div>
          <span className="font-medium">
            {t("attendanceStatsCardDaysValue", { days: stats.holidayDays })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}


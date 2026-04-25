"use client";

import CardToolbar from "./card-toolbar";
import { UserCheck, UserMinus, Clock, CalendarOff } from "lucide-react";
import type { TodayAttendanceSummary } from "@/app/(protected)/dashboard/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CardTimesheetSummaryProps {
  summaryData: TodayAttendanceSummary;
}

export default function CardTimesheetSummary({
  summaryData,
}: CardTimesheetSummaryProps) {
  const router = useRouter();
  const totalCount =
    summaryData.present +
    summaryData.late +
    summaryData.absent +
    summaryData.leave;

  return (
    <CardToolbar title="Tổng hợp công hôm nay" onRefresh={() => { router.refresh(); }}>
      <div className="flex flex-col h-[calc(100%-16px)] w-full p-4 justify-around gap-4 bg-card">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Có mặt */}
          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-primary/20 rounded-full text-primary">
                <UserCheck className="w-5 h-5" />
              </span>
              <span className="font-semibold text-sm text-foreground">
                Đi làm
              </span>
            </div>
            <span className="text-3xl font-bold text-primary">
              {summaryData.present}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              / {totalCount} nhân sự
            </span>
          </div>

          {/* Đi muộn */}
          <div className="flex flex-col items-center justify-center bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                <Clock className="w-5 h-5" />
              </span>
              <span className="font-semibold text-sm text-foreground">
                Đi muộn
              </span>
            </div>
            <span className="text-3xl font-bold text-amber-500">
              {summaryData.late}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              / {totalCount} nhân sự
            </span>
          </div>

          {/* Vắng mặt */}
          <div className="flex flex-col items-center justify-center bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                <UserMinus className="w-5 h-5" />
              </span>
              <span className="font-semibold text-sm text-foreground">
                Vắng mặt
              </span>
            </div>
            <span className="text-3xl font-bold text-rose-500">
              {summaryData.absent}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              / {totalCount} nhân sự
            </span>
          </div>

          {/* Nghỉ phép */}
          <div className="flex flex-col items-center justify-center bg-teal-500/10 rounded-xl p-4 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-teal-500/20 rounded-full text-teal-500">
                <CalendarOff className="w-5 h-5" />
              </span>
              <span className="font-semibold text-sm text-foreground">
                Nghỉ phép
              </span>
            </div>
            <span className="text-3xl font-bold text-teal-500">
              {summaryData.leave}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              / {totalCount} nhân sự
            </span>
          </div>
        </div>
      </div>
    </CardToolbar>
  );
}

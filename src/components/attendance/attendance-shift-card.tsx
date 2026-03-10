import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertCircle } from "lucide-react";
import type { ShiftBasic } from "@/app/(protected)/attendance/types";

interface AttendanceShiftCardProps {
    shift?: ShiftBasic | null;
    todayShifts?: ShiftBasic[];
    hasShiftToday?: boolean;
}

export function AttendanceShiftCard({
    shift,
    todayShifts = [],
    hasShiftToday = true,
}: AttendanceShiftCardProps) {
    if (!hasShiftToday) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5" /> Thông
                        tin ca làm việc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Chưa có ca làm việc
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Bạn chưa được phân ca cho ngày hôm
                                nay. Liên hệ quản lý để được hỗ trợ.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" /> Thông tin ca
                    làm việc
                    {todayShifts.length > 1 && (
                        <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                        >
                            {todayShifts.length} ca hôm nay
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Active shift detail */}
                {shift && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Ca hiện tại:
                            </span>
                            <span className="font-semibold">
                                {shift.name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Thời gian:
                            </span>
                            <span>
                                {shift.startTime} - {shift.endTime}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Nghỉ trưa:
                            </span>
                            <span>{shift.breakMinutes} phút</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Cho phép muộn:
                            </span>
                            <span>{shift.lateThreshold} phút</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Cho phép sớm:
                            </span>
                            <span>{shift.earlyThreshold} phút</span>
                        </div>
                    </div>
                )}

                {/* Other shifts today */}
                {todayShifts.length > 1 && (
                    <div className="space-y-2 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Tất cả ca hôm nay
                        </p>
                        <div className="space-y-1.5">
                            {todayShifts.map((s) => (
                                <div
                                    key={s.id}
                                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                                        s.id === shift?.id
                                            ? "bg-primary/10 font-medium text-primary"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <span>{s.name}</span>
                                    <span className="tabular-nums">
                                        {s.startTime} - {s.endTime}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

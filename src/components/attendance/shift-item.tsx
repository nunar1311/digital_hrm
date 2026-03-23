"use client";

import { Clock, Star } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/app/(protected)/attendance/types";

interface ShiftItemProps {
    shift: Shift;
    onEdit: () => void;
    shiftColor: string;
}

function computeWorkHours(
    startTime: string,
    endTime: string,
    breakMinutes: number,
): { hours: number; minutes: number } | null {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    let totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes -= breakMinutes;
    if (totalMinutes <= 0) return null;
    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
    };
}

export function ShiftItem({ shift, onEdit, shiftColor }: ShiftItemProps) {
    const workHours = computeWorkHours(
        shift.startTime,
        shift.endTime,
        shift.breakMinutes,
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    onClick={onEdit}
                    className={`
                        group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer
                        transition-colors hover:bg-muted/80
                        ${!shift.isActive ? "opacity-50" : ""}
                    `}
                >
                    <div
                        className={`size-2 rounded-full shrink-0 ${shiftColor}`}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span
                                className={`text-xs font-medium truncate ${!shift.isActive ? "line-through" : ""}`}
                            >
                                {shift.name}
                            </span>
                            {shift.isDefault && (
                                <Star className="size-2.5 text-amber-500 shrink-0 fill-amber-500" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5 shrink-0" />
                            <span>
                                {shift.startTime}–{shift.endTime}
                            </span>
                            {workHours && (
                                <span className="shrink-0">
                                    · {workHours.hours}h
                                    {workHours.minutes > 0
                                        ? ` ${workHours.minutes}p`
                                        : ""}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 shrink-0 font-mono"
                    >
                        {shift.code}
                    </Badge>
                </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                    <p className="font-medium">{shift.name}</p>
                    <p className="text-xs text-muted-foreground">
                        Mã: {shift.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Giờ: {shift.startTime} – {shift.endTime}
                    </p>
                    {workHours && (
                        <p className="text-xs text-muted-foreground">
                            Thời gian làm: {workHours.hours}h{" "}
                            {workHours.minutes > 0
                                ? `${workHours.minutes}p`
                                : ""}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Nghỉ: {shift.breakMinutes}p
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Trễ cho phép: {shift.lateThreshold}p · Sớm cho phép:{" "}
                        {shift.earlyThreshold}p
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {shift.isDefault ? "Ca mặc định" : ""}
                        {shift.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

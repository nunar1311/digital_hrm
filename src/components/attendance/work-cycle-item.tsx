"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { RefreshCcwDot, Moon } from "lucide-react";
import type { WorkCycle } from "@/app/(protected)/attendance/types";

interface WorkCycleItemProps {
    workCycle: WorkCycle;
    onEdit: () => void;
}

const CYCLE_COLORS = [
    "text-green-600 dark:text-green-400",
    "text-blue-600 dark:text-blue-400",
    "text-purple-600 dark:text-purple-400",
    "text-amber-600 dark:text-amber-400",
    "text-rose-600 dark:text-rose-400",
    "text-cyan-600 dark:text-cyan-400",
    "text-orange-600 dark:text-orange-400",
    "text-emerald-600 dark:text-emerald-400",
];

function getCycleColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return CYCLE_COLORS[hash % CYCLE_COLORS.length];
}

function getCycleSummary(workCycle: WorkCycle): {
    workDays: number;
    offDays: number;
    shiftNames: string[];
} {
    const shiftNames: string[] = [];
    let workDays = 0;
    let offDays = 0;

    for (const entry of workCycle.entries) {
        if (entry.isDayOff) {
            offDays++;
        } else {
            workDays++;
            if (entry.shift && !shiftNames.includes(entry.shift.name)) {
                shiftNames.push(entry.shift.name);
            }
        }
    }

    return { workDays, offDays, shiftNames };
}

export function WorkCycleItem({
    workCycle,
    onEdit,
}: WorkCycleItemProps) {
    const { workDays, offDays, shiftNames } = getCycleSummary(workCycle);
    const color = getCycleColor(workCycle.id);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    onClick={onEdit}
                    className={`
                        group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer
                        transition-colors hover:bg-muted/80
                        ${!workCycle.isActive ? "opacity-50" : ""}
                    `}
                >
                    <RefreshCcwDot
                        className={`size-3.5 shrink-0 ${color}`}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span
                                className={`text-xs font-medium truncate ${!workCycle.isActive ? "line-through" : ""}`}
                            >
                                {workCycle.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>{workCycle.totalDays} ngày</span>
                            <span>·</span>
                            <span className="text-green-600 dark:text-green-400">
                                {workDays} ngày làm
                            </span>
                            {offDays > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Moon className="size-2.5" />
                                        {offDays} nghỉ
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 shrink-0 ${color}`}
                    >
                        {workDays}/{workCycle.totalDays}
                    </Badge>
                </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                    <p className="font-medium">{workCycle.name}</p>
                    {workCycle.description && (
                        <p className="text-xs text-muted-foreground">
                            {workCycle.description}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Chu kỳ: {workCycle.totalDays} ngày
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Ngày làm: {workDays} · Ngày nghỉ: {offDays}
                    </p>
                    {shiftNames.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Ca: {shiftNames.join(", ")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {workCycle.isActive
                            ? "Đang hoạt động"
                            : "Đã vô hiệu hóa"}
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

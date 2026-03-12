"use client";

import { X, Check, RefreshCw } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ShiftAssignment } from "../types";
import type { ShiftColor } from "./shifts-constants";

interface ShiftCardProps {
    assignment: ShiftAssignment;
    color: ShiftColor | undefined;
    canManage: boolean;
    onRemove: () => void;
}

export function ShiftCard({
    assignment,
    color,
    canManage,
    onRemove,
}: ShiftCardProps) {
    const s = assignment.shift;
    if (!s) return null;

    const isCycle = !!assignment.workCycleId;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "group/card relative flex flex-col rounded-md border px-2 py-1 text-[11px] leading-tight transition-shadow hover:shadow-sm",
                        color?.bg,
                        color?.border,
                        color?.text,
                    )}
                >
                    <span className="font-semibold">
                        {s.startTime} - {s.endTime}
                    </span>
                    <span className="truncate opacity-80">
                        {s.name}
                    </span>

                    {/* Delete button (appears on hover) */}
                    {canManage && (
                        <button
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow-sm transition-opacity group-hover/card:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    )}

                    {/* Status icon */}
                    <div className="absolute bottom-0.5 right-1 flex items-center gap-0.5">
                        {isCycle ? (
                            <RefreshCw className="h-3 w-3 opacity-50" />
                        ) : (
                            <Check className="h-3 w-3 opacity-50" />
                        )}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top">
                <p className="font-medium">{s.name}</p>
                <p>
                    {s.startTime} – {s.endTime} ({s.breakMinutes} phút
                    nghỉ)
                </p>
                {isCycle && assignment.workCycle && (
                    <p className="text-xs opacity-75">
                        Chu kỳ: {assignment.workCycle.name}
                    </p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

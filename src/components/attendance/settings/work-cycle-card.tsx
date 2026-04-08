"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WorkCycle } from "@/app/[locale]/(protected)/attendance/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { WEEKDAY_SHORT, WEEKDAY_FULL } from "./work-cycles-constants";

interface WorkCycleCardProps {
    cycle: WorkCycle;
    onEdit: (cycle: WorkCycle) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
}

export function WorkCycleCard({
    cycle,
    onEdit,
    onDelete,
    onToggleActive,
}: WorkCycleCardProps) {
    const t = useTranslations("ProtectedPages");

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                            {cycle.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                            {t("attendanceWorkCycleCardTotalDays", {
                                days: cycle.totalDays,
                            })}
                        </Badge>
                        <Badge
                            variant={
                                cycle.isActive
                                    ? "default"
                                    : "secondary"
                            }
                            className="text-xs"
                        >
                            {cycle.isActive
                                ? t("attendanceWorkCycleCardActive")
                                : t("attendanceWorkCycleCardPaused")}
                        </Badge>
                    </div>
                    {cycle.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {cycle.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={cycle.isActive}
                        onCheckedChange={(v) =>
                            onToggleActive(cycle.id, v)
                        }
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(cycle)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(cycle.id)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
            {/* Visual cycle preview */}
            <div className="flex flex-wrap gap-1.5">
                {cycle.entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={`flex flex-col items-center rounded-md px-2 py-1 text-xs border ${
                            entry.isDayOff
                                ? "bg-muted text-muted-foreground border-muted"
                                : "bg-primary/10 text-primary border-primary/20"
                        }`}
                        title={
                            entry.isDayOff
                                ? `${WEEKDAY_FULL[entry.dayIndex % 7]}: ${t("attendanceWorkCycleCardOffDay")}`
                                : `${WEEKDAY_FULL[entry.dayIndex % 7]}: ${entry.shift?.name ?? "?"}`
                        }
                    >
                        <span className="font-medium">
                            {WEEKDAY_SHORT[entry.dayIndex % 7]}
                        </span>
                        <span className="truncate max-w-15">
                            {entry.isDayOff
                                ? t("attendanceWorkCycleCardOffDay")
                                : (entry.shift?.code ?? "—")}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}


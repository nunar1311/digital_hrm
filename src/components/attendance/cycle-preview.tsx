import { useTranslations } from "next-intl";
import { WorkCycle } from "@/app/[locale]/(protected)/attendance/types";
import { cn } from "@/lib/utils";

interface CyclePreviewProps {
    cycle: WorkCycle;
    compact?: boolean;
}

export function CyclePreview({
    cycle,
    compact = true,
}: CyclePreviewProps) {
    const t = useTranslations("ProtectedPages");

    if (!cycle) return null;

    const weekdayShort = [
        t("attendanceShiftsWeekdayMonShort"),
        t("attendanceShiftsWeekdayTueShort"),
        t("attendanceShiftsWeekdayWedShort"),
        t("attendanceShiftsWeekdayThuShort"),
        t("attendanceShiftsWeekdayFriShort"),
        t("attendanceShiftsWeekdaySatShort"),
        t("attendanceShiftsWeekdaySunShort"),
    ];

    if (compact) {
        return (
            <div className="rounded-md border bg-muted/50 p-2 text-xs">
                <p className="mb-1.5 font-medium">
                    {t("attendanceShiftsCycleTemplate", {
                        days: cycle.totalDays,
                    })}
                </p>
                <div className="flex flex-wrap gap-1">
                    {cycle.entries.slice(0, 7).map((entry) => (
                        <span
                            key={entry.id}
                            className={cn(
                                "rounded px-1.5 py-0.5",
                                entry.isDayOff
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-primary",
                            )}
                        >
                            {entry.isDayOff
                                ? t("attendanceShiftsDayOff")
                                : (entry.shift?.name?.slice(0, 3) ??
                                  t("attendanceShiftsNotAvailable"))}
                        </span>
                    ))}
                    {cycle.entries.length > 7 && (
                        <span className="text-muted-foreground">
                            +{cycle.entries.length - 7}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-2 text-sm font-medium">
                {t("attendanceShiftsCycleTemplate", {
                    days: cycle.totalDays,
                })}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {cycle.entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={cn(
                            "rounded px-2 py-1 text-xs font-medium",
                            entry.isDayOff
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary",
                        )}
                    >
                        {weekdayShort[entry.dayIndex % 7]} -{" "}
                        {entry.isDayOff
                            ? t("attendanceShiftsDayOff")
                            : (entry.shift?.name ??
                              t("attendanceShiftsNotAvailable"))}
                    </div>
                ))}
            </div>
        </div>
    );
}


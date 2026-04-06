import { WorkCycle } from "@/app/(protected)/attendance/types";
import { WEEKDAY_SHORT } from "./settings/work-cycles-constants";
import { cn } from "@/lib/utils";

interface CyclePreviewProps {
    cycle: WorkCycle;
    compact?: boolean;
}

export function CyclePreview({
    cycle,
    compact = true,
}: CyclePreviewProps) {
    if (!cycle) return null;

    if (compact) {
        return (
            <div className="rounded-md border bg-muted/50 p-2 text-xs">
                <p className="mb-1.5 font-medium">
                    Mẫu chu kỳ ({cycle.totalDays} ngày):
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
                                ? "Nghỉ"
                                : (entry.shift?.name?.slice(0, 3) ??
                                  "N/A")}
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
                Mẫu chu kỳ ({cycle.totalDays} ngày):
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
                        {WEEKDAY_SHORT[entry.dayIndex % 7]} -{" "}
                        {entry.isDayOff
                            ? "Nghỉ"
                            : (entry.shift?.name ?? "N/A")}
                    </div>
                ))}
            </div>
        </div>
    );
}

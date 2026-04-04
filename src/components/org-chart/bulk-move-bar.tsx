"use client";

import { useState } from "react";
import { X, ArrowRight, Users, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DepartmentNode } from "@/types/org-chart";

interface BulkMoveBarProps {
    selectedEmployeeIds: Set<string>;
    allDepartments: DepartmentNode[];
    onMove: (employeeIds: string[], targetDeptId: string) => void;
    onClear: () => void;
    isPending?: boolean;
}

export function BulkMoveBar({
    selectedEmployeeIds,
    allDepartments,
    onMove,
    onClear,
    isPending,
}: BulkMoveBarProps) {
    const [targetDeptId, setTargetDeptId] = useState<string>("");
    const [expanded, setExpanded] = useState(false);
    const isMobile = useIsMobile();

    const handleMove = () => {
        if (!targetDeptId) {
            toast.error("Vui lòng chọn phòng ban đích");
            return;
        }
        const ids = Array.from(selectedEmployeeIds);
        const target = allDepartments.find((d) => d.id === targetDeptId);
        if (!target) return;

        onMove(ids, targetDeptId);
        setTargetDeptId("");
        setExpanded(false);
        toast.success(`Đã chuyển ${ids.length} nhân viên sang "${target.name}"`);
    };

    // On mobile: collapsed pill → tap to expand
    if (isMobile && !expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className={cn(
                    "fixed bottom-6 left-4 z-50",
                    "bg-card border rounded-full shadow-2xl",
                    "flex items-center gap-2 px-4 py-3",
                    "transition-all duration-300 ease-out",
                    "dark:bg-card/95 dark:backdrop-blur-md",
                    "active:scale-95",
                )}
            >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">
                    {selectedEmployeeIds.size} nhân viên
                </span>
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                    <Menu className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            </button>
        );
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 left-4 right-4 z-50",
                "sm:left-1/2 sm:-translate-x-1/2 sm:right-auto",
                "bg-card border rounded-2xl shadow-2xl px-4 py-3",
                "flex flex-col gap-3",
                "sm:flex-row sm:items-center sm:gap-3 sm:w-[480px] sm:min-w-0",
                "transition-all duration-300 ease-out",
                "dark:bg-card/95 dark:backdrop-blur-md",
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                        {selectedEmployeeIds.size} nhân viên được chọn
                    </span>
                </div>
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded(false)}
                        className="h-8 w-8 shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

                <select
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                    className="flex-1 h-9 sm:h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    disabled={isPending}
                >
                    <option value="">Chọn phòng ban đích...</option>
                    {allDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                        </option>
                    ))}
                </select>

                <Button
                    size="sm"
                    onClick={handleMove}
                    disabled={!targetDeptId || isPending}
                    className="shrink-0"
                >
                    {isPending ? "Đang chuyển..." : "Chuyển"}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    className="h-8 w-8 shrink-0 hidden sm:flex"
                    title="Hủy chọn"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

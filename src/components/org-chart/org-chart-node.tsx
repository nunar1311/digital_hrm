"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import type { DepartmentNode } from "@/types/org-chart";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    ChevronDown,
    ChevronRight,
    Users,
    Briefcase,
    Building2,
    GripVertical,
} from "lucide-react";
import { DEPARTMENT_ICONS } from "./icon-picker";
import { EmployeePopover } from "./employee-popover";
import { NODE_CONFIG } from "./org-chart-constants";
import type { ChartCardStyle } from "./org-chart-constants";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OrgChartNodeProps {
    node: DepartmentNode;
    isExpanded: boolean;
    isHighlighted: boolean;
    isDimmed: boolean;
    searchQuery: string;
    hasChildren: boolean;
    themeBorderClass?: string;
    cardStyle?: ChartCardStyle;
    onToggle: () => void;
    onSelect: () => void;
    onDropEmployee: (
        employeeId: string,
        targetDeptId: string,
    ) => void;
    onDropDepartment: (
        draggedDeptId: string,
        targetDeptId: string,
    ) => void;
    isLocked?: boolean;
    onMoveStart?: (
        nodeId: string,
        clientX: number,
        clientY: number,
    ) => void;
}

export function OrgChartNode({
    node,
    isExpanded,
    isHighlighted,
    isDimmed,
    searchQuery,
    hasChildren,
    themeBorderClass,
    cardStyle = "default",
    onToggle,
    onSelect,
    onDropEmployee,
    onDropDepartment,
    isLocked,
    onMoveStart,
}: OrgChartNodeProps) {
    const t = useTranslations("ProtectedPages");
    const [isDragOver, setIsDragOver] = useState(false);
    const pointerStartRef = useRef<{ x: number; y: number } | null>(
        null,
    );

    const handleNodeMouseDown = (e: React.MouseEvent) => {
        if (isLocked) return;
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("[draggable]"))
            return;
        e.stopPropagation();
        pointerStartRef.current = {
            x: e.clientX,
            y: e.clientY,
        };
        onMoveStart?.(node.id, e.clientX, e.clientY);
    };

    const handleNodeClick = (e: React.MouseEvent) => {
        if (pointerStartRef.current) {
            const dx = e.clientX - pointerStartRef.current.x;
            const dy = e.clientY - pointerStartRef.current.y;
            pointerStartRef.current = null;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                return; // Was a drag, not a click
            }
        }
        onSelect();
    };

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const managerInitials = useMemo(() => {
        if (!node.manager?.name) return "?";
        return node.manager.name
            .split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
    }, [node.manager?.name]);

    const highlightText = (text: string) => {
        if (!searchQuery.trim()) return text;
        const q = searchQuery.toLowerCase();
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-yellow-300/80 dark:bg-yellow-500/40 rounded-sm px-0.5">
                    {text.slice(idx, idx + searchQuery.length)}
                </mark>
                {text.slice(idx + searchQuery.length)}
            </>
        );
    };

    // Drop zone handlers
    const handleDragOver = (e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        setIsDragOver(false);
        const empId = e.dataTransfer.getData("employeeId");
        const fromDept = e.dataTransfer.getData("fromDepartmentId");
        const draggedDeptId = e.dataTransfer.getData("departmentId");

        if (empId && fromDept !== node.id) {
            onDropEmployee(empId, node.id);
        } else if (draggedDeptId && draggedDeptId !== node.id) {
            onDropDepartment(draggedDeptId, node.id);
        }
    };

    return (
        <div
            data-interactive
            data-dept-id={node.id}
            className={cn(
                "group relative w-70 rounded-xl border-2 bg-card shadow-sm",
                "transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5",
                themeBorderClass && !isHighlighted && !isDragOver && themeBorderClass,
                cardStyle === "bordered" && "border-border shadow-md",
                isHighlighted && "ring-2 ring-primary/60 border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]",
                isDimmed && "opacity-35 scale-[0.97]",
                isDragOver && "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/30 scale-[1.03]",
                !themeBorderClass && !isHighlighted && !isDragOver && "border-transparent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
            )}
            onClick={handleNodeClick}
            onMouseDown={handleNodeMouseDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Color bar */}
            <div
                className={cn(
                    "absolute -top-0.5 left-3 right-3 h-0.75 rounded-full",
                    node.status === "ACTIVE" && "bg-primary",
                )}
            />

            <div className={cn("pt-5", cardStyle === "compact" ? "p-3 pt-4" : "p-4")}>
                {/* Department name & code */}
                <div className="flex items-start gap-2.5 mb-3">
                    <div className="rounded-lg bg-primary/15 p-2 shrink-0">
                        {(() => {
                            const DeptIcon =
                                node.logo &&
                                DEPARTMENT_ICONS[node.logo]
                                    ? DEPARTMENT_ICONS[node.logo].icon
                                    : Building2;
                            return (
                                <DeptIcon className="h-4 w-4 text-primary" />
                            );
                        })()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm leading-tight truncate">
                            {highlightText(node.name)}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                            {highlightText(node.code)}
                        </p>
                    </div>
                </div>

                {/* Manager */}
                <div className="flex items-center gap-2.5 mb-3 p-2 rounded-lg bg-muted/60">
                    <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage
                            src={node.manager?.image ?? undefined}
                        />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {managerInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                            {node.manager ? (
                                highlightText(node.manager.name)
                            ) : (
                                <span className="italic text-muted-foreground">
                                    Chưa phân công
                                </span>
                            )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {node.manager?.position ??
                                t("orgChartNoManager")}
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-semibold text-foreground">
                            {node.employeeCount}
                        </span>
                        <span>nhân viên</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span className="font-semibold text-foreground">
                            {node.positionCount}
                        </span>
                        <span>vị trí</span>
                    </div>
                </div>

                {/* Employee chips (draggable) - show first 3 with popover for more */}
                {node.employees && node.employees.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap gap-1 items-center">
                        {node.employees.slice(0, NODE_CONFIG.CHIP_DISPLAY_LIMIT).map((emp) => (
                            <div
                                key={emp.id}
                                draggable={!isLocked}
                                onDragStart={(e) => {
                                    if (isLocked) {
                                        e.preventDefault();
                                        return;
                                    }
                                    e.stopPropagation();
                                    e.dataTransfer.setData(
                                        "employeeId",
                                        emp.id,
                                    );
                                    e.dataTransfer.setData(
                                        "employeeName",
                                        emp.name,
                                    );
                                    e.dataTransfer.setData(
                                        "fromDepartmentId",
                                        node.id,
                                    );
                                    e.dataTransfer.effectAllowed =
                                        "move";
                                }}
                                className="flex items-center gap-1 bg-muted/80 hover:bg-muted rounded-full pl-1 pr-2 py-0.5 text-[10px] cursor-grab active:cursor-grabbing transition-colors group/emp hover:scale-105 hover:shadow-md"
                                title={t("orgChartDragEmployeeToDept", {
                                    name: emp.name,
                                })}
                            >
                                <GripVertical className="h-2.5 w-2.5 text-muted-foreground/50 group-hover/emp:text-muted-foreground" />
                                <span className="font-medium truncate max-w-20">
                                    {emp.name
                                        .split(" ")
                                        .slice(-2)
                                        .join(" ")}
                                </span>
                            </div>
                        ))}
                        {node.employees.length > NODE_CONFIG.CHIP_DISPLAY_LIMIT && (
                            <EmployeePopover
                                employees={node.employees}
                                trigger={
                                    <span className="text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 cursor-pointer hover:bg-muted hover:scale-105 transition-all">
                                        +{node.employees.length - NODE_CONFIG.CHIP_DISPLAY_LIMIT}
                                    </span>
                                }
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Expand/Collapse button */}
            {hasChildren && (
                <button
                    className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-10 rounded-full border-2 border-background bg-card shadow-md h-7 w-7 min-w-fit flex items-center justify-center hover:bg-muted"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    <div className="flex items-center justify-center gap-1 size-6">
                        {isExpanded ? (
                            <ChevronDown className="size-3.5" />
                        ) : (
                            <ChevronRight className="size-3.5" />
                        )}
                    </div>
                    {hasChildren && !isExpanded && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold shadow-sm text-center">
                            {node.children.length}
                        </span>
                    )}
                </button>
            )}

            {/* Drag over indicator */}
            {isDragOver && (
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-blue-500 bg-blue-500/5 pointer-events-none flex items-center justify-center">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Thả vào đây
                    </p>
                </div>
            )}
        </div>
    );
}

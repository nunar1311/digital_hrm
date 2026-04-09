"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import type { DepartmentNode } from "@/types/org-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  onDropEmployee: (employeeId: string, targetDeptId: string) => void;
  onDropDepartment: (draggedDeptId: string, targetDeptId: string) => void;
  isLocked?: boolean;
  onMoveStart?: (nodeId: string, clientX: number, clientY: number) => void;
  selectedEmployees?: Set<string>;
  onToggleEmployee?: (employeeId: string) => void;
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
  selectedEmployees,
  onToggleEmployee,
}: OrgChartNodeProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

  const handleNodeMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[draggable]")) return;
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
        "group relative w-[260px] sm:w-70 rounded-xl border-2 bg-card shadow-sm",
        "transition-all duration-200 cursor-pointer select-none",
        isMobile ? "hover:-translate-y-0" : "hover:-translate-y-0.5",
        themeBorderClass && !isHighlighted && !isDragOver && themeBorderClass,
        cardStyle === "bordered" && "border-border shadow-md",
        isHighlighted &&
          "ring-2 ring-primary/60 border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]",
        isDimmed && "opacity-35 scale-[0.97]",
        isDragOver &&
          "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/30 scale-[1.03]",
        !themeBorderClass &&
          !isHighlighted &&
          !isDragOver &&
          "border-transparent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
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

      {/* Structural drag handle */}
      {!isLocked && (
        <div
          className="absolute top-1 right-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1.5"
          draggable
          title="Kéo & thả để chuyển đổi cấp phòng ban"
          onDragStart={(e) => {
            if (isLocked) {
              e.preventDefault();
              return;
            }
            e.stopPropagation();
            e.dataTransfer.setData("departmentId", node.id);
            e.dataTransfer.effectAllowed = "move";
            
            // Create a drag image so it looks like we're dragging the node
            const target = e.target as HTMLElement;
            const nodeElement = target.closest('[data-dept-id]') as HTMLElement;
            if (nodeElement) {
                e.dataTransfer.setDragImage(nodeElement, 20, 20);
            }
          }}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "pt-5",
          isMobile
            ? "p-2.5 pt-4"
            : cardStyle === "compact"
              ? "p-3 pt-4"
              : "p-4",
        )}
      >
        {/* Department name & code */}
        <div className="flex items-start gap-2 mb-2 sm:mb-3">
          <div className="rounded-lg bg-primary/15 p-1.5 sm:p-2 shrink-0">
            {(() => {
              const DeptIcon =
                node.logo && DEPARTMENT_ICONS[node.logo]
                  ? DEPARTMENT_ICONS[node.logo].icon
                  : Building2;
              return (
                <DeptIcon
                  className={cn(
                    "text-primary",
                    isMobile ? "h-3.5 w-3.5" : "h-4 w-4",
                  )}
                />
              );
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-bold leading-tight truncate",
                isMobile ? "text-xs" : "text-sm",
              )}
            >
              {highlightText(node.name)}
            </h3>
            <p
              className={cn(
                "text-muted-foreground font-mono",
                isMobile ? "text-[10px]" : "text-xs",
              )}
            >
              {highlightText(node.code)}
            </p>
          </div>
        </div>

        {/* Manager */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-lg bg-muted/60">
          <Avatar
            className={cn(
              "border-2 border-background",
              isMobile ? "h-7 w-7" : "h-8 w-8",
            )}
          >
            <AvatarImage src={node.manager?.image ?? undefined} />
            <AvatarFallback
              className={cn(
                "font-bold bg-primary/10 text-primary",
                isMobile ? "text-[10px]" : "text-xs",
              )}
            >
              {managerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-semibold truncate",
                isMobile ? "text-[11px]" : "text-xs",
              )}
            >
              {node.manager ? (
                highlightText(node.manager.name)
              ) : (
                <span className="italic text-muted-foreground">
                  Chưa phân công
                </span>
              )}
            </p>
            <p
              className={cn(
                "text-muted-foreground truncate",
                isMobile ? "text-[9px]" : "text-[10px]",
              )}
            >
              {node.manager?.position ?? "Chưa có quản lý"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          className={cn(
            "flex items-center gap-2 sm:gap-3 text-muted-foreground",
            isMobile ? "text-[10px]" : "text-[11px]",
          )}
        >
          <div className="flex items-center gap-1">
            <Users className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
            <span className="font-semibold text-foreground">
              {node.employeeCount}
            </span>
            <span className="hidden sm:inline">nhân viên</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
            <span className="font-semibold text-foreground">
              {node.positionCount}
            </span>
            <span className="hidden sm:inline">vị trí</span>
          </div>
        </div>

        {/* Employee chips - hide on mobile to save space */}
        {node.employees && node.employees.length > 0 && !isMobile && (
          <div className="mt-3 pt-3 border-t border-dashed flex flex-col gap-1 items-center">
            {node.employees
              //   .slice(0, NODE_CONFIG.CHIP_DISPLAY_LIMIT)
              .map((emp) => {
                const isSelected = selectedEmployees?.has(emp.id);
                return (
                  <div
                    key={emp.id}
                    draggable={!isLocked}
                    onDragStart={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                        return;
                      }
                      e.stopPropagation();
                      e.dataTransfer.setData("employeeId", emp.id);
                      e.dataTransfer.setData("employeeName", emp.name);
                      e.dataTransfer.setData("fromDepartmentId", node.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(e) => {
                      if (e.shiftKey && onToggleEmployee) {
                        e.stopPropagation();
                        onToggleEmployee(emp.id);
                      }
                    }}
                    className={cn(
                      "flex items-center w-full gap-1 bg-muted/80 hover:bg-muted rounded-lg pl-1 pr-2 py-0.5  cursor-grab active:cursor-grabbing transition-colors group/emp hover:scale-105 hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-primary/10",
                    )}
                    title={
                      isSelected
                        ? `${emp.name} - Đã chọn (Shift+click để bỏ chọn)`
                        : `${emp.name} - Shift+click để chọn nhiều`
                    }
                  >
                    <GripVertical className="size-3 text-muted-foreground/50 group-hover/emp:text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium truncate">
                        {emp.name} - {emp.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {emp.position}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center ml-0.5">
                        {selectedEmployees?.size}
                      </span>
                    )}
                  </div>
                );
              })}
            {node.employees.length > NODE_CONFIG.CHIP_DISPLAY_LIMIT && (
              <EmployeePopover employees={node.employees} />
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse button - larger on mobile for touch */}
      {hasChildren && (
        <button
          className={cn(
            "absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-10 rounded-full border-2 border-background bg-card shadow-md flex items-center justify-center hover:bg-muted",
            isMobile ? "h-9 w-9 min-w-fit px-2" : "h-7 w-7",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center gap-1",
              isMobile ? "size-7" : "size-6",
            )}
          >
            {isExpanded ? (
              <ChevronDown className={isMobile ? "size-4" : "size-3.5"} />
            ) : (
              <ChevronRight className={isMobile ? "size-4" : "size-3.5"} />
            )}
          </div>
          {hasChildren && !isExpanded && (
            <span
              className={cn(
                "bg-primary text-primary-foreground rounded-full font-bold shadow-sm text-center",
                isMobile
                  ? "px-1.5 py-0.5 text-[10px]"
                  : "px-1.5 py-0.5 text-xs",
              )}
            >
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

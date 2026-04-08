"use client";

import { memo } from "react";
import { GripVertical, Edit2, Trash2, Check, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  type OnboardingTemplateDB,
} from "@/types/onboarding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORY_COLORS: Record<string, string> = {
  EQUIPMENT: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNT: "bg-blue-100 text-blue-700 border-blue-200",
  TRAINING: "bg-purple-100 text-purple-700 border-purple-200",
  DOCUMENTS: "bg-green-100 text-green-700 border-green-200",
  GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
};

type TaskType = OnboardingTemplateDB["tasks"] extends (infer T)[] | undefined
  ? T
  : never;

interface SortableTaskItemProps {
  task: TaskType;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRequired: () => void;
}

function SortableTaskItemInner({
  task,
  index,
  onEdit,
  onDelete,
  onToggleRequired,
}: SortableTaskItemProps) {
  console.log("[SortableTaskItem] render:", task.title);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors",
        isDragging && "opacity-50 shadow-lg z-50 bg-white",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        title="Kéo để sắp xếp"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{task.title}</span>
          {task.isRequired && (
            <Badge variant="destructive" className="text-xs">
              Bắt buộc
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {task.assigneeRole && (
            <Badge variant="outline" className="text-xs">
              {ASSIGNEE_ROLE_LABELS[
                task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS
              ] || task.assigneeRole}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Hạn: {task.dueDays} ngày
          </span>
          <Badge
            className={cn(
              "text-xs border",
              CATEGORY_COLORS[task.category] || CATEGORY_COLORS.GENERAL,
            )}
          >
            {CATEGORY_LABELS[task.category as keyof typeof CATEGORY_LABELS] ||
              task.category}
          </Badge>
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onToggleRequired}>
              <Check className="text-green-500" />
              {task.isRequired ? "Bỏ bắt buộc" : "Đặt bắt buộc"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const SortableTaskItem = memo(SortableTaskItemInner);

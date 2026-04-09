"use client";

import { Trash2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmployeesBatchActionsBarProps {
  count: number;
  onDelete: () => void;
  onMoveDepartment: () => void;
  onClearSelection: () => void;
}

export function EmployeesBatchActionsBar({
  count,
  onDelete,
  onMoveDepartment,
  onClearSelection,
}: EmployeesBatchActionsBarProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
      <span className="text-xs text-muted-foreground mr-1">
        Đã chọn <strong className="text-foreground">{count}</strong> nhân viên
      </span>
      <Button
        variant={"destructive"}
        size={"xs"}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Xóa
      </Button>
      <Button
        variant={"outline"}
        size={"xs"}
        onClick={onMoveDepartment}
      >
        <ArrowRight className="h-3 w-3 mr-1" />
        Chuyển phòng ban
      </Button>
      <Button
        variant="ghost"
        size={"icon-xs"}
        className="ml-auto h-6 w-6"
        onClick={onClearSelection}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Clock,
  MoreHorizontal,
  Pen,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/app/(protected)/attendance/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShiftItemProps {
  shift: Shift;
  onEdit: () => void;
  onDelete?: () => void;
  shiftColor: string;
}

function computeWorkHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): { hours: number; minutes: number } | null {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  totalMinutes -= breakMinutes;
  if (totalMinutes <= 0) return null;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function ShiftItem({
  shift,
  onEdit,
  onDelete,
  shiftColor,
}: ShiftItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const workHours = computeWorkHours(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
                        group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer
                        transition-colors hover:bg-muted/80
                        ${!shift.isActive ? "opacity-50" : ""}
                    `}
          >
            <div className={`size-2 rounded-full shrink-0 ${shiftColor}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-xs font-medium truncate flex items-center gap-1 ${!shift.isActive ? "line-through" : ""}`}
                >
                  {shift.name}{" "}
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 shrink-0 font-mono"
                  >
                    {shift.code}
                  </Badge>
                </span>
                {shift.isDefault && (
                  <Star className="size-2.5 text-amber-500 shrink-0 fill-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="size-2.5 shrink-0" />
                <span>
                  {shift.startTime}–{shift.endTime}
                </span>
                {workHours && (
                  <span className="shrink-0">
                    · {workHours.hours}h
                    {workHours.minutes > 0 ? ` ${workHours.minutes}p` : ""}
                  </span>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <Pen />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  variant="destructive"
                >
                  <Trash2 />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{shift.name}</p>
            <p className="text-xs text-muted-foreground">Mã: {shift.code}</p>
            <p className="text-xs text-muted-foreground">
              Giờ: {shift.startTime} – {shift.endTime}
            </p>
            {workHours && (
              <p className="text-xs text-muted-foreground">
                Thời gian làm: {workHours.hours}h{" "}
                {workHours.minutes > 0 ? `${workHours.minutes}p` : ""}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Nghỉ: {shift.breakMinutes}p
            </p>
            <p className="text-xs text-muted-foreground">
              Trễ cho phép: {shift.lateThreshold}p · Sớm cho phép:{" "}
              {shift.earlyThreshold}p
            </p>
            <p className="text-xs text-muted-foreground">
              {shift.isDefault ? "Ca mặc định" : ""}
              {shift.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ca làm việc "{shift.name}"? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

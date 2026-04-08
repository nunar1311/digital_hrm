"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  MoreHorizontal,
  Pen,
  Star,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/app/[locale]/(protected)/attendance/types";
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
  const t = useTranslations("ProtectedPages");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const workHours = computeWorkHours(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
  );
  const minuteSuffix = t("attendanceShiftItemMinuteSuffix");
  const defaultLabel = t("attendanceShiftItemDefault");
  const activeLabel = t("attendanceShiftItemActive");
  const inactiveLabel = t("attendanceShiftItemInactive");
  const statusText = shift.isActive ? activeLabel : inactiveLabel;

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
                  {shift.startTime} - {shift.endTime}
                </span>
                {workHours && (
                  <span className="shrink-0">
                    · {workHours.hours}h
                    {workHours.minutes > 0
                      ? ` ${workHours.minutes}${minuteSuffix}`
                      : ""}
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
                  {t("attendanceShiftItemEdit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  variant="destructive"
                >
                  <Trash2 />
                  {t("attendanceShiftItemDelete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{shift.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("attendanceShiftItemCodeLabel", { code: shift.code })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("attendanceShiftItemTimeLabel", {
                start: shift.startTime,
                end: shift.endTime,
              })}
            </p>
            {workHours && (
              <p className="text-xs text-muted-foreground">
                {t("attendanceShiftItemWorkDurationLabel")} {workHours.hours}h
                {workHours.minutes > 0 ? ` ${workHours.minutes}${minuteSuffix}` : ""}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("attendanceShiftItemBreakLabel")} {shift.breakMinutes}
              {minuteSuffix}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("attendanceShiftItemAllowanceLabel", {
                late: shift.lateThreshold,
                early: shift.earlyThreshold,
                minuteSuffix,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {shift.isDefault ? `${defaultLabel} · ` : ""}
              {statusText}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("attendanceShiftItemDeleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("attendanceShiftItemDeleteConfirmDescription", {
                name: shift.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("attendanceShiftItemCancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              {t("attendanceShiftItemDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { RefreshCcwDot, Moon, MoreHorizontal, Pen } from "lucide-react";
import type { WorkCycle } from "@/app/[locale]/(protected)/attendance/types";
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

interface WorkCycleItemProps {
  workCycle: WorkCycle;
  onEdit: () => void;
  onDelete?: () => void;
}

const CYCLE_COLORS = [
  "text-green-600 dark:text-green-400",
  "text-blue-600 dark:text-blue-400",
  "text-purple-600 dark:text-purple-400",
  "text-amber-600 dark:text-amber-400",
  "text-rose-600 dark:text-rose-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-orange-600 dark:text-orange-400",
  "text-emerald-600 dark:text-emerald-400",
];

function getCycleColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CYCLE_COLORS[hash % CYCLE_COLORS.length];
}

function getCycleSummary(workCycle: WorkCycle): {
  workDays: number;
  offDays: number;
  shiftNames: string[];
} {
  const shiftNames: string[] = [];
  let workDays = 0;
  let offDays = 0;

  for (const entry of workCycle.entries) {
    if (entry.isDayOff) {
      offDays++;
    } else {
      workDays++;
      if (entry.shift && !shiftNames.includes(entry.shift.name)) {
        shiftNames.push(entry.shift.name);
      }
    }
  }

  return { workDays, offDays, shiftNames };
}

export function WorkCycleItem({
  workCycle,
  onEdit,
  onDelete,
}: WorkCycleItemProps) {
  const t = useTranslations("ProtectedPages");
  const { workDays, offDays, shiftNames } = getCycleSummary(workCycle);
  const color = getCycleColor(workCycle.id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const daySuffix = t("attendanceWorkCycleItemDaySuffix");
  const activeLabel = t("attendanceWorkCycleItemActive");
  const inactiveLabel = t("attendanceWorkCycleItemInactive");

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
                        group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer
                        transition-colors hover:bg-muted/80
                        ${!workCycle.isActive ? "opacity-50" : ""}
                    `}
          >
            <RefreshCcwDot className={`size-3.5 shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-xs font-medium truncate ${!workCycle.isActive ? "line-through" : ""} flex items-center gap-x-1`}
                >
                  {workCycle.name}{" "}
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 shrink-0 ${color}`}
                  >
                    {workDays}/{workCycle.totalDays}
                  </Badge>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>
                  {workCycle.totalDays} {daySuffix}
                </span>
                <span>·</span>
                <span className="text-green-600 dark:text-green-400">
                  {t("attendanceWorkCycleItemWorkDays", {
                    days: workDays,
                    daySuffix,
                  })}
                </span>
                {offDays > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Moon className="size-2.5" />
                      {t("attendanceWorkCycleItemOffDays", {
                        days: offDays,
                        daySuffix,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"icon-xs"} variant={"ghost"}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <Pen /> {t("attendanceWorkCycleItemEdit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  {t("attendanceWorkCycleItemDelete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{workCycle.name}</p>
            {workCycle.description && (
              <p className="text-xs text-muted-foreground">
                {workCycle.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("attendanceWorkCycleItemCycleLabel", {
                days: workCycle.totalDays,
                daySuffix,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("attendanceWorkCycleItemSummary", {
                workDays,
                offDays,
                daySuffix,
              })}
            </p>
            {shiftNames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("attendanceWorkCycleItemShiftsLabel", {
                  shifts: shiftNames.join(", "),
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {workCycle.isActive ? activeLabel : inactiveLabel}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("attendanceWorkCycleItemDeleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("attendanceWorkCycleItemDeleteConfirmDescription", {
                name: workCycle.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("attendanceWorkCycleItemCancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              {t("attendanceWorkCycleItemDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


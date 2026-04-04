"use client";

import { memo, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Shift, UserBasic, DepartmentBasic, WorkCycle } from "../types";
import { useShiftsData } from "./use-shifts-data";
import { ShiftNavigation } from "./shift-navigation";
import { ShiftSearchBar } from "./shift-search-bar";
import { ShiftCalendarGrid } from "./shift-calendar-grid";
import {
  ShiftFormDialog,
  AssignCycleDialog,
  DeleteShiftDialog,
  DeleteAssignmentDialog,
} from "./shift-dialogs";
import { AssignCycleDeptDialog } from "./assign-cycle-dept-dialog";
import { AssignDialog } from "./assign-shift-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ─── Main Component ───

export const ShiftsClient = memo(function ShiftsClient({
  initialShifts,
  initialWorkCycles,
  users,
  departments,
  canManage,
}: {
  initialShifts: Shift[];
  initialWorkCycles: WorkCycle[];
  users: UserBasic[];
  departments: DepartmentBasic[];
  canManage: boolean;
}) {
  const data = useShiftsData({
    initialShifts,
    initialWorkCycles,
    users,
    departments,
    canManage,
  });

  const { setDeleteAssignmentId } = data;

  const onRemoveAssignment = useCallback(
    (id: string) => setDeleteAssignmentId(id),
    [setDeleteAssignmentId],
  );

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col gap-2">
        {/* ─── Header ─── */} {/* Header */}
        <section className="border-b">
          <header className="p-2 flex items-center gap-2 h-10">
            <Link href="/attendance">
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7"
                tooltip={"Quay lại"}
              >
                <ArrowLeft />
              </Button>
            </Link>
            <h1 className="font-bold truncate">Quản lý ca làm việc</h1>
          </header>
        </section>
        <div className="flex items-center justify-between gap-2 px-4">
          <ShiftNavigation
            viewMode={data.viewMode}
            setViewMode={data.setViewMode}
            rangeLabel={data.rangeLabel}
            goToday={data.goToday}
            goPrev={data.goPrev}
            goNext={data.goNext}
          />
          {/* ─── Search ─── */}
          <ShiftSearchBar
            searchQuery={data.searchQuery}
            onSearchChange={data.handleSearchChange}
            totalCount={data.totalCount}
            debouncedSearch={data.debouncedSearch}
            departments={departments}
            departmentIds={data.departmentIds}
            onDepartmentChange={data.setDepartmentIds}
            onRefresh={data.refreshUsers}
          />
        </div>
        {/* ─── Navigation ─── */}
        {/* ─── Calendar Grid ─── */}
        <div className="min-h-0 flex-1 overflow-hidden border-t">
          <ShiftCalendarGrid
            visibleDays={data.visibleDays}
            sortedUsers={data.calendarData.sortedUsers}
            userAssignments={data.calendarData.userAssignments}
            shifts={data.shifts}
            shiftColorMap={data.shiftColorMap}
            canManage={canManage}
            isPending={data.isPending}
            isFetchingAssignments={data.isFetchingAssignments}
            isFetchingNextPage={data.isFetchingNextPage}
            debouncedSearch={data.debouncedSearch}
            onQuickAssign={data.handleQuickAssign}
            onRemoveAssignment={onRemoveAssignment}
            hasMore={data.hasMore}
            loadMore={data.loadMore}
            viewMode={data.viewMode}
            workCycles={data.workCycles}
            totalCount={data.totalCount}
            loadedCount={data.loadedCount}
          />
        </div>
        {/* ─── Dialogs ─── */}
        <ShiftFormDialog
          open={data.isShiftDialogOpen}
          onOpenChange={data.setIsShiftDialogOpen}
          editingShift={data.editingShift}
          onSubmit={data.handleShiftSubmit}
          isPending={data.isPending}
        />
        <AssignDialog
          open={data.assignDialogOpen}
          onOpenChange={data.setAssignDialogOpen}
          users={users}
          shifts={data.shifts}
          onSubmit={data.handleAssign}
          isPending={data.isPending}
        />
        <DeleteShiftDialog
          deleteTarget={data.deleteTarget}
          onClose={(open) => {
            if (!open) data.setDeleteTarget(null);
          }}
          onConfirm={data.handleDeleteShift}
          isPending={data.isPending}
        />
        <DeleteAssignmentDialog
          deleteAssignmentId={data.deleteAssignmentId}
          onClose={(open) => {
            if (!open) data.setDeleteAssignmentId(null);
          }}
          onConfirm={data.removeAssignMutation.mutate}
          isPending={data.removeAssignMutation.isPending}
        />
        <AssignCycleDialog
          open={data.cycleDialogOpen}
          onOpenChange={data.setCycleDialogOpen}
          users={users}
          workCycles={data.workCycles}
          onSubmit={data.handleAssignCycle}
          isPending={data.isPending}
          defaultUserId={data.assignCycleUserId || undefined}
          defaultStartDate={data.assignCycleDate || undefined}
        />
        <AssignCycleDeptDialog
          open={data.cycleDeptDialogOpen}
          onOpenChange={data.setCycleDeptDialogOpen}
          departments={departments}
          workCycles={data.workCycles}
          onSubmit={data.handleAssignCycleDept}
          isPending={data.isPending}
        />
      </div>
    </TooltipProvider>
  );
});

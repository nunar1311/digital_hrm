"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import type {
    Shift,
    UserBasic,
    DepartmentBasic,
    WorkCycle,
} from "../types";
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
import { format } from "date-fns";
import { AssignCycleDeptDialog } from "./assign-cycle-dept-dialog";
import { AssignDialog } from "./assign-shift-dialog";

// ─── Main Component ───

export function ShiftsClient({
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

    return (
        <TooltipProvider>
            <div className="flex h-full flex-col gap-2">
                {/* ─── Header ─── */} {/* Header */}
                <section className="border-b">
                    <header className="p-2 flex items-center h-10">
                        <h1 className="font-bold truncate">
                            Quản lý ca làm việc
                        </h1>
                    </header>
                </section>
                {/* {canManage && (
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={data.openCreateShift}
                                    >
                                        <Plus className=" h-4 w-4" />
                                        Tạo ca
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Tạo ca làm việc mới</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            data.setCycleDialogOpen(
                                                true,
                                            );
                                        }}
                                    >
                                        <Plus className=" h-4 w-4" />
                                        Gán chu kỳ
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Gán ca theo chu kỳ cho nhân
                                        viên
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            data.setCycleDeptDialogOpen(
                                                true,
                                            );
                                        }}
                                    >
                                        <Plus className=" h-4 w-4" />
                                        Gán chu kỳ phòng ban
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Gán ca theo chu kỳ cho phòng
                                        ban
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={"/attendance/settings"}
                                        className={buttonVariants({
                                            size: "sm",
                                        })}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                        Cài đặt
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cài đặt ca làm việc</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )} */}
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
                        totalCount={data.filteredUsers.length}
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
                        calendarData={data.calendarData}
                        shifts={data.shifts}
                        shiftColorMap={data.shiftColorMap}
                        canManage={canManage}
                        isPending={data.isPending}
                        debouncedSearch={data.debouncedSearch}
                        quickAssignCell={data.quickAssignCell}
                        setQuickAssignCell={data.setQuickAssignCell}
                        onQuickAssign={data.handleQuickAssign}
                        onRemoveAssignment={
                            data.setDeleteAssignmentId
                        }
                        getUserShiftCount={data.getUserShiftCount}
                        hasMore={data.hasMore}
                        loadMore={data.loadMore}
                        viewMode={data.viewMode}
                        workCycles={data.workCycles}
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
                    onClose={() => data.setDeleteTarget(null)}
                    onConfirm={data.handleDeleteShift}
                    isPending={data.isPending}
                />
                <DeleteAssignmentDialog
                    deleteAssignmentId={data.deleteAssignmentId}
                    onClose={() => data.setDeleteAssignmentId(null)}
                    onConfirm={() => {
                        if (data.deleteAssignmentId)
                            data.removeAssignMutation.mutate(
                                data.deleteAssignmentId,
                            );
                    }}
                    isPending={data.removeAssignMutation.isPending}
                />
                <AssignCycleDialog
                    open={data.cycleDialogOpen}
                    onOpenChange={data.setCycleDialogOpen}
                    users={users}
                    workCycles={data.workCycles}
                    onSubmit={data.handleAssignCycle}
                    isPending={data.isPending}
                    defaultUserId={
                        data.assignCycleUserId || undefined
                    }
                    defaultStartDate={
                        data.assignCycleDate
                            ? format(
                                  data.assignCycleDate,
                                  "yyyy-MM-dd",
                              )
                            : undefined
                    }
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
}

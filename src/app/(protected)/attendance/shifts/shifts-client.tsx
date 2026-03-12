"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
    ShiftManageDialog,
} from "./shift-dialogs";
import Link from "next/link";
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
    const [manageOpen, setManageOpen] = useState(false);
    const data = useShiftsData({
        initialShifts,
        initialWorkCycles,
        users,
        departments,
        canManage,
    });

    return (
        <TooltipProvider>
            <div className="flex h-full flex-col gap-4">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 md:px-6 md:pt-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Quản lý phân ca
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Lịch phân ca làm việc cho nhân viên
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={data.openCreateShift}
                            >
                                <Plus className=" h-4 w-4" />
                                Tạo ca
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    data.setCycleDialogOpen(true);
                                }}
                            >
                                <Plus className=" h-4 w-4" />
                                Gán chu kỳ
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    data.setCycleDeptDialogOpen(true);
                                }}
                            >
                                <Plus className=" h-4 w-4" />
                                Gán chu kỳ phòng ban
                            </Button>
                            <Link
                                href={"/attendance/settings"}
                                className={buttonVariants({
                                    size: "sm",
                                })}
                            >
                                <Settings2 className="h-4 w-4" />
                                Cài đặt
                            </Link>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 px-4">
                    <ShiftNavigation
                        viewMode={data.viewMode}
                        setViewMode={data.setViewMode}
                        rangeLabel={data.rangeLabel}
                        goToday={data.goToday}
                        goPrev={data.goPrev}
                        goNext={data.goNext}
                        shifts={data.shifts}
                        shiftColorMap={data.shiftColorMap}
                        canManage={canManage}
                        onEditShift={data.openEditShift}
                        onDeleteShift={data.setDeleteTarget}
                        totalAssignments={data.stats.totalAssignments}
                        onManageShifts={() => setManageOpen(true)}
                        inactiveCount={
                            data.shifts.filter((s) => !s.isActive)
                                .length
                        }
                    />
                    {/* ─── Search ─── */}
                    <ShiftSearchBar
                        searchQuery={data.searchQuery}
                        onSearchChange={data.handleSearchChange}
                        totalCount={data.filteredUsers.length}
                        debouncedSearch={data.debouncedSearch}
                        departments={departments}
                        departmentId={data.departmentId}
                        onDepartmentChange={data.setDepartmentId}
                    />
                </div>
                {/* ─── Navigation ─── */}

                {/* ─── Calendar Grid ─── */}
                <div className="min-h-0 flex-1 overflow-hidden border">
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

                <ShiftManageDialog
                    open={manageOpen}
                    onOpenChange={setManageOpen}
                    shifts={data.shifts}
                    onEditShift={data.openEditShift}
                    onDeleteShift={data.setDeleteTarget}
                />

                <AssignCycleDialog
                    open={data.cycleDialogOpen}
                    onOpenChange={data.setCycleDialogOpen}
                    users={users}
                    workCycles={data.workCycles}
                    onSubmit={data.handleAssignCycle}
                    isPending={data.isPending}
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

"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    CalendarClock,
    ChevronDown,
    ChevronRight,
    Plus,
    RefreshCcwDot,
    Users,
    Loader2,
    Search,
    Calendar,
    CalendarCheck,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback, useRef, useState } from "react";
import { useSidebarShiftsData } from "@/hooks/use-sidebar-shifts-data";
import { useSidebarWorkCyclesData } from "@/hooks/use-sidebar-work-cycles-data";
import { useSidebarAssignData } from "@/hooks/use-sidebar-assign-data";
import { ShiftItem } from "./shift-item";
import { WorkCycleItem } from "./work-cycle-item";
import { ShiftFormDialog } from "./shift-form-dialog";
import { WorkCycleFormDialog } from "@/components/attendance/settings/work-cycle-form-dialog";
import {
    type WorkCycleFormValues,
    type CycleEntryDraft,
} from "@/components/attendance/settings/work-cycles-constants";
import {
    createWorkCycle,
    updateWorkCycle,
} from "@/app/(protected)/attendance/actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssignCycleUserDialog } from "./assign-cycle-user-dialog";
import { AssignCycleDeptDialog } from "./assign-cycle-dept-dialog";
import { AssignShiftDialog } from "./assign-shift-dialog";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import Link from "next/link";
import { WorkCycle } from "@/app/(protected)/attendance/types";

const SHIFT_COLORS = [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-rose-500",
    "bg-lime-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-slate-500",
    "bg-stone-500",
    "bg-neutral-500",
    "bg-zinc-500",
];

function getShiftColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return SHIFT_COLORS[hash % SHIFT_COLORS.length];
}

// ─── Main Sidebar Component ─────────────────────────────────────────
const AttendanceSidebar = () => {
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const isShifts = pathname.startsWith("/attendance/shifts");

    // ── Shifts data ──
    const {
        shifts,
        isLoading: shiftsLoading,
        handleCreateShift,
        handleEditShift,
        handleDeleteShift,
        createDialogOpen,
        setCreateDialogOpen,
        editDialogOpen,
        setEditDialogOpen,
        editingShift,
    } = useSidebarShiftsData();

    // ── Work Cycles data ──
    const {
        workCycles,
        isLoading: cyclesLoading,
        handleCreateWorkCycle,
        handleEditWorkCycle,
        handleDeleteWorkCycle,
        editDialogOpen: editCycleDialogOpen,
        setEditDialogOpen: setEditCycleDialogOpen,
        editingWorkCycle,
        createDialogOpen: createCycleDialogOpen,
        setCreateDialogOpen: setCreateCycleDialogOpen,
    } = useSidebarWorkCyclesData();

    // ── Assignment data & dialogs ──
    const {
        users,
        departments,
        assignCycleUserOpen,
        assignCycleDeptOpen,
        assignShiftOpen,
        setAssignCycleUserOpen,
        setAssignCycleDeptOpen,
        setAssignShiftOpen,
        defaultUserId,
        defaultStartDate,
    } = useSidebarAssignData();

    // ── Work cycle mutations ──
    const [isCycleSaving, setIsCycleSaving] = useState(false);

    const handleCycleFormSubmit = async (
        values: WorkCycleFormValues,
        entries: CycleEntryDraft[],
    ) => {
        setIsCycleSaving(true);
        const payload = {
            ...values,
            entries: entries.map((e) => ({
                dayIndex: e.dayIndex,
                shiftId: e.isDayOff ? null : e.shiftId,
                isDayOff: e.isDayOff,
            })),
        };

        const previousCyclesSidebar = queryClient.getQueryData([
            "attendance",
            "work-cycles-sidebar",
        ]);
        const previousCycles = queryClient.getQueryData([
            "attendance",
            "workCycles",
        ]);

        const tempId = `temp-${Date.now()}`;
        const optimisticCycle = {
            id: editingWorkCycle ? editingWorkCycle.id : tempId,
            isActive: editingWorkCycle
                ? editingWorkCycle.isActive
                : true,
            ...payload,
            entries: entries.map((e) => ({
                ...e,
                shift: e.shiftId
                    ? shifts.find((s) => s.id === e.shiftId)
                    : null,
            })),
        };

        const updater = (old: WorkCycle[]) => {
            if (!old) return old;
            if (editingWorkCycle) {
                return old.map((c: WorkCycle) =>
                    c.id === editingWorkCycle.id
                        ? optimisticCycle
                        : c,
                );
            }
            return [...old, optimisticCycle];
        };

        queryClient.setQueryData(
            ["attendance", "work-cycles-sidebar"],
            updater,
        );
        queryClient.setQueryData(
            ["attendance", "workCycles"],
            updater,
        );

        setCreateCycleDialogOpen(false);
        setEditCycleDialogOpen(false);

        try {
            if (editingWorkCycle) {
                await updateWorkCycle(editingWorkCycle.id, payload);
                toast.success("Cập nhật chu kỳ thành công");
            } else {
                await createWorkCycle(payload);
                toast.success("Tạo chu kỳ mới thành công");
            }
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || "Có lỗi xảy ra");
            if (previousCyclesSidebar)
                queryClient.setQueryData(
                    ["attendance", "work-cycles-sidebar"],
                    previousCyclesSidebar,
                );
            if (previousCycles)
                queryClient.setQueryData(
                    ["attendance", "workCycles"],
                    previousCycles,
                );
        } finally {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "work-cycles-sidebar"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "workCycles"],
            });
            setIsCycleSaving(false);
        }
    };

    const [showInactiveShifts, setShowInactiveShifts] =
        useState(false);
    const [showInactiveCycles, setShowInactiveCycles] =
        useState(false);

    const [searchShifts, setSearchShifts] = useState("");
    const [searchShiftsExpanded, setSearchShiftsExpanded] =
        useState(false);

    const [searchCycles, setSearchCycles] = useState("");
    const [searchCyclesExpanded, setSearchCyclesExpanded] =
        useState(false);

    const searchShiftsRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchCyclesRef = useRef<HTMLInputElement>(null);
    const searchCyclesContainerRef = useRef<HTMLDivElement>(null);

    const clickOutsideShiftsRef = useClickOutside(() => {
        if (searchShiftsExpanded) {
            if (searchShifts.trim()) {
                setSearchShifts("");
            }
            setSearchShiftsExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(
        searchContainerRef,
        clickOutsideShiftsRef,
    );

    const clickOutsideCyclesRef = useClickOutside(() => {
        if (searchCyclesExpanded) {
            if (searchCycles.trim()) {
                setSearchCycles("");
            }
            setSearchCyclesExpanded(false);
        }
    });
    const mergedCyclesSearchRef = useMergedRef(
        searchCyclesContainerRef,
        clickOutsideCyclesRef,
    );

    const handleSearchShifts = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (!searchShiftsExpanded) {
                setSearchShiftsExpanded(!searchShiftsExpanded);
                setTimeout(
                    () => searchShiftsRef.current?.focus(),
                    50,
                );
            } else {
                if (searchShifts.trim()) {
                    setSearchShifts("");
                }
                setSearchShiftsExpanded(false);
            }
        },
        [searchShiftsExpanded, searchShifts],
    );

    const handleSearchCycles = useCallback(() => {
        if (!searchCyclesExpanded) {
            setSearchCyclesExpanded(true);
            setTimeout(() => searchCyclesRef.current?.focus(), 50);
        } else {
            if (searchCycles.trim()) {
                setSearchCycles("");
            }
            setSearchCyclesExpanded(false);
        }
    }, [searchCyclesExpanded, searchCycles]);

    const activeShifts = shifts.filter((s) => s.isActive);
    const inactiveShifts = shifts.filter((s) => !s.isActive);
    const displayShifts = showInactiveShifts
        ? [...activeShifts, ...inactiveShifts]
        : activeShifts;

    const filteredShifts = searchShifts.trim()
        ? displayShifts.filter(
              (s) =>
                  s.name
                      .toLowerCase()
                      .includes(searchShifts.toLowerCase()) ||
                  s.code
                      ?.toLowerCase()
                      .includes(searchShifts.toLowerCase()),
          )
        : displayShifts;

    const activeCycles = workCycles.filter((c) => c.isActive);
    const inactiveCycles = workCycles.filter((c) => !c.isActive);
    const displayCycles = showInactiveCycles
        ? [...activeCycles, ...inactiveCycles]
        : activeCycles;

    const filteredCycles = searchCycles.trim()
        ? displayCycles.filter((c) =>
              c.name
                  .toLowerCase()
                  .includes(searchCycles.toLowerCase()),
          )
        : displayCycles;

    const cycleDialogOpen =
        createCycleDialogOpen || editCycleDialogOpen;
    const setCycleDialogOpen = (open: boolean) => {
        if (!open) {
            setCreateCycleDialogOpen(false);
            setEditCycleDialogOpen(false);
        }
    };

    const sidebarWorkSchedule = [
        {
            title: "Lịch làm việc",
            icon: Calendar,
            isActive: true,
            children: [
                {
                    title: "Thiết lập ngày lễ",
                    icon: Calendar,
                    url: "/attendance/holidays",
                },
                {
                    title: "Ca làm việc",
                    icon: Calendar,
                    url: "/attendance/shifts",
                },
            ],
        },
        {
            title: "Quản lý chấm công",
            icon: CalendarCheck,
            isActive: true,
            children: [
                {
                    title: "Quy trình duyệt",
                    url: "/attendance/approval-process",
                },
                {
                    title: "Yêu cầu điều chỉnh",
                    url: "/attendance/approval-process?tab=requests",
                },
            ],
        },
    ];

    return (
        <>
            <Sidebar
                collapsible="offcanvas"
                className="absolute h-full! group/sidebar"
            >
                <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                    <h2 className="text-base font-bold">
                        {isShifts
                            ? "Lịch làm việc"
                            : "Chấm công và nghỉ phép"}
                    </h2>

                    <div className="flex items-center gap-0.5">
                        <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                            <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                        </div>
                        {isShifts && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-0.5 px-1.5! h-7"
                                    >
                                        <Plus />
                                        <ChevronDown className="text-muted-foreground/50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-52"
                                >
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            Tạo mới
                                        </DropdownMenuLabel>

                                        <DropdownMenuItem
                                            onClick={() => {
                                                setCreateDialogOpen(
                                                    true,
                                                );
                                            }}
                                        >
                                            <CalendarClock />
                                            Ca làm việc
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setCreateCycleDialogOpen(
                                                    true,
                                                );
                                            }}
                                        >
                                            <RefreshCcwDot />
                                            Chu kì làm việc
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            Gán ca làm việc
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setAssignShiftOpen(
                                                    true,
                                                );
                                            }}
                                        >
                                            <Users />
                                            Gán ca nhân viên
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setAssignCycleUserOpen(
                                                    true,
                                                );
                                            }}
                                        >
                                            <RefreshCcwDot />
                                            Gán chu kì nhân viên
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setAssignCycleDeptOpen(
                                                    true,
                                                );
                                            }}
                                        >
                                            <RefreshCcwDot />
                                            Gán chu kì phòng ban
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="gap-3 px-2">
                        {isShifts ? (
                            <SidebarMenu>
                                {/* ── Ca làm việc ── */}
                                <Collapsible defaultOpen asChild>
                                    <SidebarMenuItem className="relative">
                                        <div className="flex items-center flex-1">
                                            <CollapsibleTrigger
                                                asChild
                                            >
                                                <SidebarMenuButton className="h-7 data-[state=open]:[&_svg]:rotate-90! mb-1 flex-1">
                                                    <p className="text-xs font-medium">
                                                        Ca làm việc
                                                    </p>
                                                    <ChevronRight className="size-3.5!" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </div>
                                        <div
                                            ref={mergedSearchRef}
                                            className={cn(
                                                "relative flex items-center transition-opacity duration-100",
                                                searchShiftsExpanded
                                                    ? "opacity-100"
                                                    : "opacity-0 pointer-events-none",
                                            )}
                                        >
                                            <Input
                                                ref={searchShiftsRef}
                                                value={searchShifts}
                                                onClick={(
                                                    e: React.MouseEvent<HTMLInputElement>,
                                                ) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onKeyDown={(
                                                    e: React.KeyboardEvent<HTMLInputElement>,
                                                ) => {
                                                    e.stopPropagation();
                                                    if (
                                                        e.key ===
                                                        "Escape"
                                                    ) {
                                                        setSearchShifts(
                                                            "",
                                                        );
                                                        setSearchShiftsExpanded(
                                                            false,
                                                        );
                                                    }
                                                }}
                                                onChange={(e) =>
                                                    setSearchShifts(
                                                        e.target
                                                            .value,
                                                    )
                                                }
                                                placeholder="Tìm kiếm ca..."
                                                className="h-6 z-10 pr-4 pl-2 text-xs w-59 absolute right-0 -top-7.5 bg-background dark:bg-background"
                                            />
                                        </div>
                                        <div
                                            onClick={
                                                handleSearchShifts
                                            }
                                            className={cn(
                                                buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon-xs",
                                                    className:
                                                        "size-5",
                                                }),
                                                "absolute right-1 top-1 rounded cursor-pointer hover:bg-accent transition-colors z-20",
                                                !searchShiftsExpanded &&
                                                    "[&_svg]:hover:text-primary",
                                            )}
                                        >
                                            <Search className="size-3.5!" />
                                        </div>
                                        <CollapsibleContent>
                                            <div className="space-y-0.5 border rounded-lg">
                                                {shiftsLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : filteredShifts.length ===
                                                  0 ? (
                                                    <div className="py-3 px-2">
                                                        <p className="text-xs text-muted-foreground text-center">
                                                            {searchShifts.trim()
                                                                ? "Không tìm thấy ca phù hợp"
                                                                : "Chưa có ca nào"}
                                                        </p>
                                                        {!searchShifts.trim() && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full mt-2 h-6 text-xs"
                                                                onClick={
                                                                    handleCreateShift
                                                                }
                                                            >
                                                                <Plus className="size-3!" />
                                                                Tạo ca
                                                                đầu
                                                                tiên
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ScrollArea className="max-h-[200px] overflow-y-auto no-scrollbar">
                                                            {filteredShifts.map(
                                                                (
                                                                    shift,
                                                                ) => (
                                                                    <ShiftItem
                                                                        key={
                                                                            shift.id
                                                                        }
                                                                        shift={
                                                                            shift
                                                                        }
                                                                        shiftColor={getShiftColor(
                                                                            shift.id,
                                                                        )}
                                                                        onEdit={() =>
                                                                            handleEditShift(
                                                                                shift,
                                                                            )
                                                                        }
                                                                        onDelete={() =>
                                                                            handleDeleteShift(
                                                                                shift,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </ScrollArea>
                                                        {inactiveShifts.length >
                                                            0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full mt-1 h-6 text-[10px] text-muted-foreground"
                                                                onClick={() =>
                                                                    setShowInactiveShifts(
                                                                        (
                                                                            v,
                                                                        ) =>
                                                                            !v,
                                                                    )
                                                                }
                                                            >
                                                                {showInactiveShifts
                                                                    ? "Ẩn ca đã tắt"
                                                                    : `Hiện ${inactiveShifts.length} ca đã tắt`}
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>

                                {/* ── Chu kì làm việc ── */}
                                <Collapsible defaultOpen asChild>
                                    <SidebarMenuItem className="relative">
                                        <div className="flex items-center flex-1">
                                            <CollapsibleTrigger
                                                asChild
                                            >
                                                <SidebarMenuButton className="h-7 text-xs font-medium data-[state=open]:[&_svg]:rotate-90! mb-1 flex-1">
                                                    <p className="text-xs font-medium">
                                                        Chu kì làm
                                                        việc
                                                    </p>
                                                    <ChevronRight className="size-3.5!" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </div>
                                        <div
                                            ref={
                                                mergedCyclesSearchRef
                                            }
                                            className={cn(
                                                "relative flex items-center transition-opacity duration-100",
                                                searchCyclesExpanded
                                                    ? "opacity-100"
                                                    : "opacity-0 pointer-events-none",
                                            )}
                                        >
                                            <Input
                                                ref={searchCyclesRef}
                                                value={searchCycles}
                                                onClick={(
                                                    e: React.MouseEvent<HTMLInputElement>,
                                                ) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onKeyDown={(
                                                    e: React.KeyboardEvent<HTMLInputElement>,
                                                ) => {
                                                    e.stopPropagation();
                                                    if (
                                                        e.key ===
                                                        "Escape"
                                                    ) {
                                                        setSearchCycles(
                                                            "",
                                                        );
                                                        setSearchCyclesExpanded(
                                                            false,
                                                        );
                                                    }
                                                }}
                                                onChange={(e) =>
                                                    setSearchCycles(
                                                        e.target
                                                            .value,
                                                    )
                                                }
                                                placeholder="Tìm kiếm chu kỳ..."
                                                className="h-6 z-10 pr-4 pl-2 text-xs w-59 absolute right-0 -top-7.5 bg-background dark:bg-background"
                                            />
                                        </div>
                                        <div
                                            onClick={
                                                handleSearchCycles
                                            }
                                            className={cn(
                                                buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon-xs",
                                                    className:
                                                        "size-5",
                                                }),
                                                "absolute right-1 top-1 rounded cursor-pointer hover:bg-accent transition-colors z-20",
                                                !searchCyclesExpanded &&
                                                    "[&_svg]:hover:text-primary",
                                            )}
                                        >
                                            <Search className="size-3.5!" />
                                        </div>
                                        <CollapsibleContent>
                                            <div className="space-y-0.5 border rounded-lg">
                                                {cyclesLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : filteredCycles.length ===
                                                  0 ? (
                                                    <div className="py-3 px-2">
                                                        <p className="text-xs text-muted-foreground text-center">
                                                            {searchCycles.trim()
                                                                ? "Không tìm thấy chu kỳ phù hợp"
                                                                : "Chưa có chu kỳ nào"}
                                                        </p>
                                                        {!searchCycles.trim() && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full mt-2 h-6 text-xs"
                                                                onClick={
                                                                    handleCreateWorkCycle
                                                                }
                                                            >
                                                                <Plus className="size-3!" />
                                                                Tạo
                                                                chu kỳ
                                                                đầu
                                                                tiên
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ScrollArea className="max-h-[280px]">
                                                            {filteredCycles.map(
                                                                (
                                                                    cycle,
                                                                ) => (
                                                                    <WorkCycleItem
                                                                        key={
                                                                            cycle.id
                                                                        }
                                                                        workCycle={
                                                                            cycle
                                                                        }
                                                                        onEdit={() =>
                                                                            handleEditWorkCycle(
                                                                                cycle,
                                                                            )
                                                                        }
                                                                        onDelete={() =>
                                                                            handleDeleteWorkCycle(
                                                                                cycle,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </ScrollArea>
                                                        {inactiveCycles.length >
                                                            0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full mt-1 h-6 text-[10px] text-muted-foreground"
                                                                onClick={() =>
                                                                    setShowInactiveCycles(
                                                                        (
                                                                            v,
                                                                        ) =>
                                                                            !v,
                                                                    )
                                                                }
                                                            >
                                                                {showInactiveCycles
                                                                    ? "Ẩn chu kỳ đã tắt"
                                                                    : `Hiện ${inactiveCycles.length} chu kỳ đã tắt`}
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        ) : (
                            <SidebarMenu>
                                {sidebarWorkSchedule.map((item) => (
                                    <Collapsible
                                        key={item.title}
                                        asChild
                                        defaultOpen={item.isActive}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger
                                                asChild
                                            >
                                                <SidebarMenuButton
                                                    tooltip={
                                                        item.title
                                                    }
                                                >
                                                    <Calendar className="size-4" />
                                                    <span>
                                                        {item.title}
                                                    </span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.children.map(
                                                        (child) => (
                                                            <SidebarMenuSubItem
                                                                key={
                                                                    child.title
                                                                }
                                                            >
                                                                <SidebarMenuButton
                                                                    isActive={
                                                                        child.url ===
                                                                        pathname
                                                                    }
                                                                    tooltip={
                                                                        child.title
                                                                    }
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={
                                                                            child.url
                                                                        }
                                                                    >
                                                                        {
                                                                            child.title
                                                                        }
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            </SidebarMenuSubItem>
                                                        ),
                                                    )}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ))}
                            </SidebarMenu>
                        )}
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            {/* ── Shift Form Dialog ── */}
            <ShiftFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                editingShift={null}
            />
            <ShiftFormDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                editingShift={editingShift}
            />

            {/* ── Work Cycle Form Dialog ── */}
            <WorkCycleFormDialog
                open={cycleDialogOpen}
                onOpenChange={setCycleDialogOpen}
                editCycle={editingWorkCycle}
                shifts={shifts}
                onSubmit={handleCycleFormSubmit}
                isSaving={isCycleSaving}
            />

            {/* ── Assignment Dialogs ── */}
            <AssignShiftDialog
                open={assignShiftOpen}
                onOpenChange={setAssignShiftOpen}
                users={users}
                shifts={shifts}
            />

            <AssignCycleUserDialog
                open={assignCycleUserOpen}
                onOpenChange={setAssignCycleUserOpen}
                users={users}
                workCycles={workCycles}
                defaultUserId={defaultUserId ?? ""}
                defaultStartDate={defaultStartDate ?? undefined}
            />

            <AssignCycleDeptDialog
                open={assignCycleDeptOpen}
                onOpenChange={setAssignCycleDeptOpen}
                departments={departments}
                workCycles={workCycles}
            />
        </>
    );
};

export default AttendanceSidebar;

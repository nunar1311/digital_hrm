"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Users,
    UserPlus,
    CalendarOff,
    TrendingDown,
    TrendingUp,
    Banknote,
    Calendar,
    Cake,
    ScrollText,
    CheckCircle2,
    GripVertical,
    EyeOff,
    Settings,
    X,
    RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "./actions";
import {
    useDashboardPreferences,
    type DashboardItemId,
} from "@/hooks/use-dashboard-preferences";
import { Button } from "@/components/ui/button";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { DocEmptyStateCard, PendingApprovalsCard, QuickActions } from "@/components/dashboard";
import { formatCurrency } from "../assets/constants";

const DashboardCharts = dynamic(
    () => import("@/components/dashboard/dashboard-charts"),
    {
        ssr: false,
        loading: () => (
            <Skeleton className="w-full h-[600px] rounded-lg mt-6" />
        ),
    },
);

interface DashboardData {
    kpiData: {
        totalEmployees: number;
        newHiresThisMonth: number;
        turnoverRate: number;
        totalPayroll: number;
        currentMonthPayroll: number;
        avgSalary: number;
    };
    departmentDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    monthlyHeadcount: Array<{
        month: string;
        employees: number;
        newHires: number;
        resigned: number;
    }>;
    todayAttendance: {
        present: number;
        late: number;
        absent: number;
        onLeave: number;
        total: number;
    };
    genderDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    ageDistribution: Array<{
        range: string;
        value: number;
        color: string;
    }>;
    seniorityDistribution: Array<{
        range: string;
        value: number;
        color: string;
    }>;
    payrollSummary: Array<{
        month: string;
        totalPayroll: number;
        avgSalary: number;
    }>;
    upcomingEvents: Array<{
        type: "birthday" | "contract" | "probation" | "anniversary";
        name: string;
        date: string;
        description: string;
    }>;
}

async function getDashboardDataQueryFn(): Promise<DashboardData> {
    return getDashboardData();
}

const KPI_IDS: DashboardItemId[] = [
    "kpi-total",
    "kpi-new",
    "kpi-absent",
    "kpi-turnover",
    "kpi-payroll",
];

export default function DashboardPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["dashboard-data"],
        queryFn: getDashboardDataQueryFn,
    });

    const {
        preferences,
        isLoaded,
        toggleVisibility,
        reorderItems,
        resetToDefault,
    } = useDashboardPreferences();
    const [isCustomizing, setIsCustomizing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            // Get the current order from preferences
            const currentItems = [...preferences.items];
            const oldIndex = currentItems.indexOf(active.id as DashboardItemId);
            const newIndex = currentItems.indexOf(over.id as DashboardItemId);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Apply the reorder directly
                const newItems = arrayMove(currentItems, oldIndex, newIndex);
                reorderItems(newItems);
            }
        }
    };

    const isVisible = (id: DashboardItemId) =>
        !preferences.hiddenItems.includes(id);

    // Extract KPIs in their current order from preferences
    // This ensures we respect the saved order while keeping SortableContext stable
    const kpiOrderFromPrefs = preferences.items.filter(id => KPI_IDS.includes(id));
    const displayKpis = kpiOrderFromPrefs.length === 5 ? kpiOrderFromPrefs : KPI_IDS;

    if (isLoading || !isLoaded) {
        return (
            <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-3rem)] overflow-auto no-scrollbar">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-32 rounded-lg"
                        />
                    ))}
                </div>
                <Skeleton className="h-[600px] rounded-lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
                <p className="text-muted-foreground">
                    Không thể tải dữ liệu
                </p>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const {
        kpiData,
        departmentDistribution,
        monthlyHeadcount,
        todayAttendance,
        genderDistribution,
        ageDistribution,
        seniorityDistribution,
        payrollSummary,
        upcomingEvents,
    } = data;
    const totalPayroll = kpiData.totalPayroll;

    return (
        <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-3rem)] overflow-auto no-scrollbar">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Tổng quan
                    </h1>
                    <p className="text-muted-foreground">
                        Báo cáo và thống kê nhân sự tổng quát
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isCustomizing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetToDefault}
                            className="gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Mặc định
                        </Button>
                    )}
                    <Button
                        variant={
                            isCustomizing ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                            setIsCustomizing(!isCustomizing)
                        }
                        className="gap-2"
                    >
                        {isCustomizing ? (
                            <>
                                <X className="h-4 w-4" />
                                Xong
                            </>
                        ) : (
                            <>
                                <Settings className="h-4 w-4" />
                                Tùy chỉnh
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={displayKpis}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {displayKpis.map((kpiId) => (
                            <KPICard
                                key={kpiId}
                                id={kpiId}
                                kpiData={kpiData}
                                todayAttendance={todayAttendance}
                                isCustomizing={isCustomizing}
                                isVisible={isVisible(kpiId)}
                                onToggleVisibility={toggleVisibility}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Quick Actions, Pending Approvals & Docs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <QuickActions />
                <PendingApprovalsCard />
                <DocEmptyStateCard
                    title="Docs"
                    emptyMessage="There are no Docs in this location yet."
                    actionLabel="Add a Doc"
                    onAction={() => {}}
                />
            </div>

            {/* Lazy Loaded Charts */}
            <DashboardCharts
                departmentDistribution={departmentDistribution}
                monthlyHeadcount={monthlyHeadcount}
                genderDistribution={genderDistribution}
                ageDistribution={ageDistribution}
                seniorityDistribution={seniorityDistribution}
                payrollSummary={payrollSummary}
                totalPayroll={totalPayroll}
                upcomingEventsSlot={
                    <Card className="col-span-1 border shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-primary" />
                                Sự kiện sắp tới
                            </CardTitle>
                            <CardDescription>
                                Trong 30 ngày tới
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <div className="space-y-4 pr-2">
                                {upcomingEvents.map((event, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start pb-4 border-b last:border-0 last:pb-0"
                                    >
                                        <div
                                            className={`mt-0.5 p-2 rounded-full mr-3 shrink-0 ${
                                                event.type ===
                                                "birthday"
                                                    ? "bg-pink-100 text-pink-500"
                                                    : event.type ===
                                                        "contract"
                                                      ? "bg-amber-100 text-amber-500"
                                                      : event.type ===
                                                          "probation"
                                                        ? "bg-blue-100 text-blue-500"
                                                        : "bg-green-100 text-green-500"
                                            }`}
                                        >
                                            {event.type ===
                                                "birthday" && (
                                                <Cake className="w-4 h-4" />
                                            )}
                                            {event.type ===
                                                "contract" && (
                                                <ScrollText className="w-4 h-4" />
                                            )}
                                            {event.type ===
                                                "probation" && (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            {event.type ===
                                                "anniversary" && (
                                                <Users className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none mb-1 text-foreground">
                                                {event.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {event.description}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-normal"
                                            >
                                                {new Date(
                                                    event.date,
                                                ).toLocaleDateString(
                                                    "vi-VN",
                                                    {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                    },
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                }
                isCustomizing={isCustomizing}
                hiddenItems={preferences.hiddenItems}
                onToggleVisibility={toggleVisibility}
            />
        </div>
    );
}

function KPICard({
    id,
    kpiData,
    todayAttendance,
    isCustomizing,
    isVisible,
    onToggleVisibility,
}: {
    id: DashboardItemId;
    kpiData: DashboardData["kpiData"];
    todayAttendance: DashboardData["todayAttendance"];
    isCustomizing: boolean;
    isVisible: boolean;
    onToggleVisibility: (id: DashboardItemId) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: !isCustomizing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getKpiContent = () => {
        switch (id) {
            case "kpi-total":
                return {
                    title: "Tổng nhân sự",
                    icon: Users,
                    value: kpiData.totalEmployees,
                    description: "Đang hoạt động trên hệ thống",
                    trend: "+5",
                    trendPositive: true,
                };
            case "kpi-new":
                return {
                    title: "Nhân sự mới (Tháng này)",
                    icon: UserPlus,
                    value: kpiData.newHiresThisMonth,
                    description: "Tuyển mới trong tháng",
                    trend: "+2",
                    trendPositive: true,
                };
            case "kpi-absent":
                return {
                    title: "Vắng mặt hôm nay",
                    icon: CalendarOff,
                    value:
                        todayAttendance.absent +
                        todayAttendance.onLeave,
                    description: `${todayAttendance.onLeave} nghỉ phép, ${todayAttendance.absent} không phép`,
                    trend: "-1",
                    trendPositive: true,
                };
            case "kpi-turnover":
                return {
                    title: "Tỉ lệ nghỉ việc (YTD)",
                    icon: TrendingDown,
                    value: `${kpiData.turnoverRate}%`,
                    description: "Tỷ lệ nghỉ việc từ đầu năm",
                    trend: "-0.5%",
                    trendPositive: true,
                };
            case "kpi-payroll":
                return {
                    title: "Chi phí lương (Tháng này)",
                    icon: Banknote,
                    value: formatCurrency(kpiData.currentMonthPayroll),
                    description: "Dự kiến chi phí tháng",
                    trend: "+3%",
                    trendPositive: false,
                };
            default:
                return null;
        }
    };

    const content = getKpiContent();
    if (!content) return null;

    const Icon = content.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative",
                isDragging && "z-50 opacity-80",
                !isVisible && "hidden",
            )}
        >
            {isCustomizing && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(id);
                        }}
                    >
                        <EyeOff className="h-3 w-3" />
                    </Button>
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-3 w-3" />
                    </div>
                </div>
            )}
            <Card
                className={cn(
                    "h-full transition-all duration-200",
                    isCustomizing &&
                        "border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60",
                )}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {content.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-bold">
                            {content.value}
                        </div>
                        {content.trend && (
                            <div className={cn(
                                "flex items-center text-xs font-medium",
                                content.trendPositive ? "text-green-600" : "text-red-600"
                            )}>
                                {content.trendPositive ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {content.trend}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {content.description}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import {
    getEmployees,
    type GetEmployeesParams,
    type GetEmployeesResult,
} from "@/app/[locale]/(protected)/employees/actions";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface DashboardStats {
    totalEmployees: number;
    totalEmployeesWorking: number;
    newEmployees: number;
    resignedEmployees: number;
    totalPercentage: number;
    workingPercentage: number;
    newPercentage: number;
    resignedPercentage: number;
}

export interface TodayAttendanceSummary {
    present: number;
    late: number;
    absent: number;
    leave: number;
}

// â”€â”€â”€ getDashboardStats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getDashboardStats(): Promise<DashboardStats> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const now = new Date();
    const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
    );
    const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
    );

    // Base condition: only employees (who have employeeCode)
    const baseWhere = { employeeCode: { not: null } } as const;

    const [
        totalEmployees,
        totalEmployeesWorking,
        newEmployees,
        resignedEmployees,
        prevTotalEmployees,
        prevWorking,
        prevNew,
        prevResigned,
    ] = await Promise.all([
        // Current counts
        prisma.user.count({ where: baseWhere }),
        prisma.user.count({
            where: { ...baseWhere, employeeStatus: "ACTIVE" },
        }),
        prisma.user.count({
            where: {
                ...baseWhere,
                hireDate: { gte: startOfMonth },
            },
        }),
        prisma.user.count({
            where: {
                ...baseWhere,
                employeeStatus: "TERMINATED",
            },
        }),
        // Previous month counts (for percentage comparison)
        prisma.user.count({
            where: {
                ...baseWhere,
                createdAt: { lt: startOfMonth },
            },
        }),
        prisma.user.count({
            where: {
                ...baseWhere,
                employeeStatus: "ACTIVE",
                createdAt: { lt: startOfMonth },
            },
        }),
        prisma.user.count({
            where: {
                ...baseWhere,
                hireDate: { gte: startOfPrevMonth, lt: startOfMonth },
            },
        }),
        prisma.user.count({
            where: {
                ...baseWhere,
                employeeStatus: "TERMINATED",
                createdAt: { lt: startOfMonth },
            },
        }),
    ]);

    const pct = (current: number, previous: number) =>
        previous === 0
            ? current > 0
                ? 100
                : 0
            : ((current - previous) / previous) * 100;

    return {
        totalEmployees,
        totalEmployeesWorking,
        newEmployees,
        resignedEmployees,
        totalPercentage: pct(totalEmployees, prevTotalEmployees),
        workingPercentage: pct(totalEmployeesWorking, prevWorking),
        newPercentage: pct(newEmployees, prevNew),
        resignedPercentage: pct(resignedEmployees, prevResigned),
    };
}

// â”€â”€â”€ getDashboardEmployees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getDashboardEmployees(
    params: GetEmployeesParams,
): Promise<GetEmployeesResult> {
    await requirePermission(Permission.DASHBOARD_VIEW);
    return getEmployees(params);
}

// â”€â”€â”€ Types: Chart Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AttendanceTrendItem {
    month: string; // "Th01", "Th02", ...
    onTime: number;
    late: number;
}

export interface DepartmentDistributionItem {
    department: string;
    count: number;
    fill: string;
}

export interface TurnoverTrendItem {
    month: string;
    turnoverRate: number;
}

export interface GenderDistributionItem {
    gender: string;
    count: number;
    fill: string;
}

// â”€â”€â”€ getAttendanceTrend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MONTH_LABELS = [
    "Th01",
    "Th02",
    "Th03",
    "Th04",
    "Th05",
    "Th06",
    "Th07",
    "Th08",
    "Th09",
    "Th10",
    "Th11",
    "Th12",
];

export async function getAttendanceTrend(): Promise<
    AttendanceTrendItem[]
> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const now = new Date();

    // Build 12 months range (current month + 11 previous)
    const months: { start: Date; end: Date; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
        const start = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1,
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth() - i + 1,
            1,
        );
        months.push({
            start,
            end,
            label: MONTH_LABELS[start.getMonth()]!,
        });
    }

    // Parallel queries for all months
    const results = await Promise.all(
        months.map(async ({ start, end, label }) => {
            const [onTime, late] = await Promise.all([
                prisma.attendance.count({
                    where: {
                        date: { gte: start, lt: end },
                        status: "PRESENT",
                        lateMinutes: 0,
                    },
                }),
                prisma.attendance.count({
                    where: {
                        date: { gte: start, lt: end },
                        status: "PRESENT",
                        lateMinutes: { gt: 0 },
                    },
                }),
            ]);
            return { month: label, onTime, late };
        }),
    );

    return results;
}

// â”€â”€â”€ getTodayAttendanceSummary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getTodayAttendanceSummary(): Promise<TodayAttendanceSummary> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [present, late, leave, totalActive] = await Promise.all([
        prisma.attendance.count({
            where: { date: { gte: today, lt: tomorrow }, status: "PRESENT", lateMinutes: 0 },
        }),
        prisma.attendance.count({
            where: { date: { gte: today, lt: tomorrow }, status: "PRESENT", lateMinutes: { gt: 0 } },
        }),
        prisma.attendance.count({
            where: { date: { gte: today, lt: tomorrow }, status: { in: ["LEAVE", "UNPAID_LEAVE"] } },
        }),
        prisma.user.count({
            where: { employeeCode: { not: null }, employeeStatus: "ACTIVE" },
        }),
    ]);

    // calculate absent based on total active minus those accounted for.
    // this is a simplified metric for the dashboard summary.
    const absent = Math.max(0, totalActive - (present + late + leave));

    return {
        present,
        late,
        leave,
        absent,
    };
}

// â”€â”€â”€ getDepartmentDistribution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
];

export async function getDepartmentDistribution(): Promise<
    DepartmentDistributionItem[]
> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const departments = await prisma.department.findMany({
        where: { status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    users: {
                        where: {
                            employeeCode: { not: null },
                            employeeStatus: { not: "TERMINATED" },
                        },
                    },
                },
            },
        },
        orderBy: { sortOrder: "asc" },
    });

    // Also count employees without department
    const noDeptCount = await prisma.user.count({
        where: {
            employeeCode: { not: null },
            employeeStatus: { not: "TERMINATED" },
            departmentId: null,
        },
    });

    const items: DepartmentDistributionItem[] = departments
        .map((dept, i) => ({
            department: dept.name,
            count: dept._count.users,
            fill: CHART_COLORS[i % CHART_COLORS.length]!,
        }))
        .filter((item) => item.count > 0);

    if (noDeptCount > 0) {
        items.push({
            department: "ChÆ°a phÃ¢n bá»•",
            count: noDeptCount,
            fill: "var(--chart-0)",
        });
    }

    return items;
}

// â”€â”€â”€ getTurnoverRateTrend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getTurnoverRateTrend(): Promise<TurnoverTrendItem[]> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const now = new Date();

    // Build 12 months range (current month + 11 previous)
    const months: { start: Date; end: Date; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        months.push({
            start,
            end,
            label: MONTH_LABELS[start.getMonth()]!,
        });
    }

    const baseWhere = { employeeCode: { not: null } } as const;

    const results = await Promise.all(
        months.map(async ({ start, end, label }) => {
            // Count employees who resigned in this month
            const resignedCount = await prisma.user.count({
                where: {
                    ...baseWhere,
                    employeeStatus: "TERMINATED",
                    resignDate: { gte: start, lt: end },
                },
            });

            // Count average active employees during this month
            // (Active at start of month + Active at end of month) / 2
            // Simplification: Employees who joined before the end of the month and didn't resign before the start
            const activeCountStart = await prisma.user.count({
                where: {
                    ...baseWhere,
                    hireDate: { lt: start },
                    OR: [
                        { employeeStatus: "ACTIVE" },
                        { resignDate: { gte: start } },
                    ],
                },
            });

            const activeCountEnd = await prisma.user.count({
                where: {
                    ...baseWhere,
                    hireDate: { lt: end },
                    OR: [
                        { employeeStatus: "ACTIVE" },
                        { resignDate: { gte: end } },
                    ],
                },
            });

            const averageActiveCount = (activeCountStart + activeCountEnd) / 2;

            // Turnover Rate formula: (Resigned Count / Average Active Count) * 100
            const turnoverRate =
                averageActiveCount > 0
                    ? Number(((resignedCount / averageActiveCount) * 100).toFixed(2))
                    : 0;

            return { month: label, turnoverRate };
        }),
    );

    return results;
}

// â”€â”€â”€ getGenderDistribution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getGenderDistribution(): Promise<GenderDistributionItem[]> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const baseWhere = {
        employeeCode: { not: null },
        employeeStatus: { not: "TERMINATED" },
    } as const;

    const [maleCount, femaleCount, otherCount, unknownCount] = await Promise.all([
        prisma.user.count({ where: { ...baseWhere, gender: "MALE" } }),
        prisma.user.count({ where: { ...baseWhere, gender: "FEMALE" } }),
        prisma.user.count({ where: { ...baseWhere, gender: "OTHER" } }),
        prisma.user.count({ where: { ...baseWhere, gender: null } }),
    ]);

    const items: GenderDistributionItem[] = [];

    if (maleCount > 0)
        items.push({
            gender: "Nam",
            count: maleCount,
            fill: "var(--chart-1)",
        });

    if (femaleCount > 0)
        items.push({
            gender: "Ná»¯",
            count: femaleCount,
            fill: "var(--chart-2)",
        });

    if (otherCount > 0)
        items.push({
            gender: "KhÃ¡c",
            count: otherCount,
            fill: "var(--chart-3)",
        });

    if (unknownCount > 0)
        items.push({
            gender: "ChÆ°a xÃ¡c Ä‘á»‹nh",
            count: unknownCount,
            fill: "var(--chart-4)",
        });

    return items;
}


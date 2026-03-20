"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import {
    getEmployees,
    type GetEmployeesParams,
    type GetEmployeesResult,
} from "@/app/(protected)/employees/actions";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── getDashboardStats ───────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
    await requirePermission(Permission.DASHBOARD_VIEW);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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
        previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

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

// ─── getDashboardEmployees ───────────────────────────────────────────────────

export async function getDashboardEmployees(
    params: GetEmployeesParams,
): Promise<GetEmployeesResult> {
    await requirePermission(Permission.DASHBOARD_VIEW);
    return getEmployees(params);
}

// ─── Types: Chart Data ───────────────────────────────────────────────────────

export interface AttendanceTrendItem {
    month: string;       // "Th01", "Th02", ...
    onTime: number;
    late: number;
}

export interface DepartmentDistributionItem {
    department: string;
    count: number;
    fill: string;
}

// ─── getAttendanceTrend ──────────────────────────────────────────────────────

const MONTH_LABELS = [
    "Th01", "Th02", "Th03", "Th04", "Th05", "Th06",
    "Th07", "Th08", "Th09", "Th10", "Th11", "Th12",
];

export async function getAttendanceTrend(): Promise<AttendanceTrendItem[]> {
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

// ─── getDepartmentDistribution ───────────────────────────────────────────────

const CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

export async function getDepartmentDistribution(): Promise<DepartmentDistributionItem[]> {
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
            department: "Chưa phân bổ",
            count: noDeptCount,
            fill: "var(--chart-5)",
        });
    }

    return items;
}


"use server";

import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { LeaveBalanceQueryParams, UpdateLeaveBalanceData } from "./types";

// ============================================================
// LeaveBalance - Số dư ngày nghỉ
// ============================================================

export async function getLeaveBalances(params: LeaveBalanceQueryParams = {}) {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    const {
        year = new Date().getFullYear(),
        leaveTypeId,
        departmentId,
        employeeStatus,
        search,
        page = 1,
        pageSize = 20,
    } = params;

    const where: {
        policyYear: number;
        leaveTypeId?: string;
        user?: {
            OR?: Array<{
                fullName?: { contains: string; mode: "insensitive" };
                name?: { contains: string; mode: "insensitive" };
                email?: { contains: string; mode: "insensitive" };
                employeeCode?: { contains: string; mode: "insensitive" };
            }>;
            departmentId?: string;
            employeeStatus?: string;
        };
    } = {
        policyYear: year,
    };

    if (leaveTypeId) {
        where.leaveTypeId = leaveTypeId;
    }

    if (search || departmentId || employeeStatus) {
        where.user = {
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { employeeCode: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(departmentId && { departmentId }),
            ...(employeeStatus && { employeeStatus }),
        };
    }

    const [data, total] = await Promise.all([
        prisma.leaveBalance.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        name: true,
                        email: true,
                        avatar: true,
                        department: {
                            select: { id: true, name: true },
                        },
                        position: {
                            select: { id: true, name: true },
                        },
                        employmentType: true,
                    },
                },
                leaveType: true,
            },
            orderBy: [
                { user: { fullName: "asc" } },
                { leaveType: { name: "asc" } },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.leaveBalance.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export async function getLeaveBalanceById(id: string) {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    return prisma.leaveBalance.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    name: true,
                    email: true,
                    avatar: true,
                    department: {
                        select: { id: true, name: true },
                    },
                },
            },
            leaveType: true,
        },
    });
}

export async function updateLeaveBalance(id: string, data: UpdateLeaveBalanceData) {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    const balance = await prisma.leaveBalance.findUnique({
        where: { id },
        include: { user: true, leaveType: true },
    });

    if (!balance) {
        throw new Error("Không tìm thấy số dư ngày nghỉ");
    }

    await prisma.leaveBalance.update({
        where: { id },
        data: {
            totalDays: data.totalDays ?? undefined,
            usedDays: data.usedDays ?? undefined,
        },
    });

    revalidatePath("/attendance/leave-summary");
    return { success: true };
}

// ============================================================
// Import/Export
// ============================================================

export async function importLeaveBalances(data: {
    year: number;
    balances: Array<{
        userId: string;
        leaveTypeId: string;
        totalDays: number;
        usedDays: number;
    }>;
}) {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
    };

    for (const item of data.balances) {
        try {
            await prisma.leaveBalance.upsert({
                where: {
                    userId_leaveTypeId_policyYear: {
                        userId: item.userId,
                        leaveTypeId: item.leaveTypeId,
                        policyYear: data.year,
                    },
                },
                update: {
                    totalDays: item.totalDays,
                    usedDays: item.usedDays,
                },
                create: {
                    userId: item.userId,
                    leaveTypeId: item.leaveTypeId,
                    policyYear: data.year,
                    totalDays: item.totalDays,
                    usedDays: item.usedDays,
                    pendingDays: 0,
                },
            });

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push(
                `Lỗi import cho userId ${item.userId}: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    revalidatePath("/attendance/leave-summary");
    return results;
}

// ============================================================
// Export
// ============================================================

export async function exportLeaveBalances(params: LeaveBalanceQueryParams = {}) {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    const {
        year = new Date().getFullYear(),
        leaveTypeId,
        departmentId,
        search,
    } = params;

    const where: {
        policyYear: number;
        leaveTypeId?: string;
        user?: {
            OR?: Array<{
                fullName?: { contains: string; mode: "insensitive" };
                name?: { contains: string; mode: "insensitive" };
                email?: { contains: string; mode: "insensitive" };
                employeeCode?: { contains: string; mode: "insensitive" };
            }>;
            departmentId?: string;
        };
    } = {
        policyYear: year,
    };

    if (leaveTypeId) {
        where.leaveTypeId = leaveTypeId;
    }

    if (search || departmentId) {
        where.user = {
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { employeeCode: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(departmentId && { departmentId }),
        };
    }

    const data = await prisma.leaveBalance.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    name: true,
                    employeeCode: true,
                    email: true,
                    department: {
                        select: { id: true, name: true },
                    },
                    position: {
                        select: { id: true, name: true },
                    },
                },
            },
            leaveType: {
                select: { id: true, name: true },
            },
        },
        orderBy: [
            { user: { fullName: "asc" } },
            { leaveType: { name: "asc" } },
        ],
    });

    return data;
}

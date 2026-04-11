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
                username?: { contains: string; mode: "insensitive" };
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
                    { username: { contains: search, mode: "insensitive" } },
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
                username?: { contains: string; mode: "insensitive" };
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
                    { username: { contains: search, mode: "insensitive" } },
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
                    username: true,
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

// ============================================================
// KHỞI TẠO PHÉP NĂM - Tính thâm niên tự động
// ============================================================

export async function initializeLeaveBalances(year: number): Promise<{
    initialized: number;
    skipped: number;
    errors: string[];
}> {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    // Lấy các loại phép có tính thâm niên hoặc tất cả loại đang active
    const leaveTypes = await prisma.leaveType.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            defaultDays: true,
            applySeniorityBonus: true,
        },
    });

    // Lấy quy tắc thâm niên đang active, sort theo minYears DESC
    const seniorityRules = await prisma.leaveSeniorityRule.findMany({
        where: { isActive: true },
        orderBy: { minYears: "desc" },
    });

    // Lấy tất cả nhân viên đang active có ngày vào làm
    const employees = await prisma.user.findMany({
        where: {
            employeeStatus: "ACTIVE",
            hireDate: { not: null },
        },
        select: { id: true, fullName: true, hireDate: true },
    });

    const results = { initialized: 0, skipped: 0, errors: [] as string[] };
    const referenceDate = new Date(year, 0, 1); // 01/01 của năm đang xét

    for (const emp of employees) {
        for (const lt of leaveTypes) {
            try {
                // Tính thâm niên (số năm công tác tính đến 01/01 của năm đang xét)
                let seniorityDays = 0;
                if (lt.applySeniorityBonus && emp.hireDate) {
                    const yearsWorked = Math.floor(
                        (referenceDate.getTime() - new Date(emp.hireDate).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                    );

                    // Tìm quy tắc phù hợp nhất (ưu tiên minYears lớn nhất mà yearsWorked >= minYears)
                    const matchedRule = seniorityRules.find(
                        (r) =>
                            yearsWorked >= r.minYears &&
                            (r.maxYears === null || yearsWorked <= r.maxYears)
                    );
                    if (matchedRule) {
                        seniorityDays = matchedRule.bonusDays;
                    }
                }

                const totalDays = lt.defaultDays + seniorityDays;

                // Upsert LeaveBalance (bảo toàn usedDays và pendingDays nếu đã tồn tại)
                await prisma.leaveBalance.upsert({
                    where: {
                        userId_leaveTypeId_policyYear: {
                            userId: emp.id,
                            leaveTypeId: lt.id,
                            policyYear: year,
                        },
                    },
                    update: {
                        totalDays,
                        seniorityDays,
                    },
                    create: {
                        userId: emp.id,
                        leaveTypeId: lt.id,
                        policyYear: year,
                        totalDays,
                        seniorityDays,
                        usedDays: 0,
                        pendingDays: 0,
                        carryOverDays: 0,
                    },
                });

                results.initialized++;
            } catch (err) {
                results.errors.push(
                    `${emp.fullName ?? emp.id} / ${lt.name}: ${(err as Error).message}`
                );
            }
        }
    }

    revalidatePath("/attendance/leave-summary");
    return results;
}

// ============================================================
// CHỐT PHÉP CUỐI NĂM - Carry-over sang năm mới
// ============================================================

export async function runYearEndCarryOver(
    fromYear: number,
    toYear: number
): Promise<{
    processed: number;
    skipped: number;
    totalCarriedOver: number;
    errors: string[];
}> {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    // Lấy loại phép có cấu hình carry-over (maxCarryOverDays != null)
    const leaveTypesWithCarryOver = await prisma.leaveType.findMany({
        where: {
            isActive: true,
            maxCarryOverDays: { not: null },
        },
        select: { id: true, name: true, defaultDays: true, maxCarryOverDays: true },
    });

    if (leaveTypesWithCarryOver.length === 0) {
        return { processed: 0, skipped: 0, totalCarriedOver: 0, errors: [] };
    }

    const results = {
        processed: 0,
        skipped: 0,
        totalCarriedOver: 0,
        errors: [] as string[],
    };

    for (const lt of leaveTypesWithCarryOver) {
        // Lấy tất cả balance của năm fromYear cho loại phép này
        const balances = await prisma.leaveBalance.findMany({
            where: {
                leaveTypeId: lt.id,
                policyYear: fromYear,
            },
            include: {
                user: { select: { id: true, hireDate: true } },
            },
        });

        for (const bal of balances) {
            try {
                const remaining = Math.max(
                    0,
                    bal.totalDays - bal.usedDays - bal.pendingDays
                );

                // Tính số ngày được chuyển (tối đa maxCarryOverDays)
                const carryOver =
                    lt.maxCarryOverDays === 0
                        ? remaining
                        : Math.min(remaining, lt.maxCarryOverDays!);

                if (carryOver <= 0) {
                    results.skipped++;
                    continue;
                }

                // Upsert LeaveBalance cho năm toYear với carryOverDays
                await prisma.leaveBalance.upsert({
                    where: {
                        userId_leaveTypeId_policyYear: {
                            userId: bal.userId,
                            leaveTypeId: lt.id,
                            policyYear: toYear,
                        },
                    },
                    update: {
                        carryOverDays: carryOver,
                        totalDays: { increment: carryOver },
                    },
                    create: {
                        userId: bal.userId,
                        leaveTypeId: lt.id,
                        policyYear: toYear,
                        totalDays: lt.defaultDays + carryOver,
                        carryOverDays: carryOver,
                        seniorityDays: 0,
                        usedDays: 0,
                        pendingDays: 0,
                    },
                });

                results.processed++;
                results.totalCarriedOver += carryOver;
            } catch (err) {
                results.errors.push(
                    `userId ${bal.userId} / ${lt.name}: ${(err as Error).message}`
                );
            }
        }
    }

    revalidatePath("/attendance/leave-summary");
    return results;
}

// ============================================================
// SENIORITY RULES - CRUD
// ============================================================

export async function getSeniorityRules() {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    return prisma.leaveSeniorityRule.findMany({
        orderBy: { minYears: "asc" },
    });
}

export async function upsertSeniorityRule(data: {
    id?: string;
    minYears: number;
    maxYears?: number | null;
    bonusDays: number;
    isActive?: boolean;
}) {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    if (data.id) {
        return prisma.leaveSeniorityRule.update({
            where: { id: data.id },
            data: {
                minYears: data.minYears,
                maxYears: data.maxYears ?? null,
                bonusDays: data.bonusDays,
                isActive: data.isActive ?? true,
            },
        });
    }

    return prisma.leaveSeniorityRule.create({
        data: {
            minYears: data.minYears,
            maxYears: data.maxYears ?? null,
            bonusDays: data.bonusDays,
            isActive: data.isActive ?? true,
        },
    });
}

export async function deleteSeniorityRule(id: string) {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);
    return prisma.leaveSeniorityRule.delete({ where: { id } });
}

// ============================================================
// LEAVE TYPE - Cập nhật cấu hình thâm niên và carry-over
// ============================================================

export async function updateLeaveTypeConfig(
    leaveTypeId: string,
    data: {
        applySeniorityBonus?: boolean;
        maxCarryOverDays?: number | null;
    }
) {
    await requirePermission(Permission.LEAVE_POLICY_MANAGE);

    await prisma.leaveType.update({
        where: { id: leaveTypeId },
        data: {
            applySeniorityBonus: data.applySeniorityBonus,
            maxCarryOverDays: data.maxCarryOverDays,
        },
    });

    revalidatePath("/attendance/leave-summary");
    return { success: true };
}

export async function getAllLeaveTypesWithConfig() {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    return prisma.leaveType.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            defaultDays: true,
            isPaidLeave: true,
            applySeniorityBonus: true,
            maxCarryOverDays: true,
        },
        orderBy: { sortOrder: "asc" },
    });
}

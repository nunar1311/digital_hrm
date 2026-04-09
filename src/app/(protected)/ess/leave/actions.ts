"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

import { emitToAll } from "@/lib/socket/server";
import { SOCKET_EVENTS } from "@/lib/socket";
import { LeaveRequestInput, leaveRequestSchema } from "./types";

// ============================================================
// HELPER: Tính số ngày làm việc (loại trừ Thứ 7, CN, ngày lễ)
// ============================================================

const VIETNAM_HOLIDAYS: Record<number, number[]> = {
    2026: [
        // Tết Dương lịch
        1,
        // Tết Nguyên Đán 2026 (Mùng 1 - Mùng 10)
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
        // Giỗ Tổ Hùng Vương
        7,
        // Ngày Giải phóng Miền Nam
        30,
        // Quốc khánh
        1,
        // Ngày Noel
        25,
    ],
    2025: [
        1,
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
        7,
        30,
        1,
        25,
    ],
    2024: [
        1,
        8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
        18,
        30,
        2,
        25,
    ],
};

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const year = startDate.getFullYear();
    const holidays = VIETNAM_HOLIDAYS[year] || [];

    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        if (!isWeekend(current)) {
            const month = current.getMonth();
            const day = current.getDate();
            if (!holidays.includes(day) || current.getMonth() !== month) {
                const isHoliday = holidays.some((h) => {
                    const holidayDate = new Date(year, month, h);
                    return holidayDate.getTime() === current.getTime();
                });
                if (!isHoliday) {
                    count++;
                }
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

// ============================================================
// GET LEAVE TYPES FOR CURRENT USER
// ============================================================

export async function getMyLeaveTypes() {
    const session = await requireAuth();
    const currentYear = new Date().getFullYear();

    // Lấy tất cả loại nghỉ đang active
    const leaveTypes = await prisma.leaveType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            name: true,
            description: true,
            isPaidLeave: true,
            defaultDays: true,
        },
    });

    // Lấy số dư phép năm nay
    const balances = await prisma.leaveBalance.findMany({
        where: {
            userId: session.user.id,
            leaveTypeId: { in: leaveTypes.map((lt) => lt.id) },
            policyYear: currentYear,
        },
    });

    // Lấy quản lý trực tiếp
    const manager = await prisma.user.findUnique({
        where: { id: (session.user as { managerId?: string }).managerId || "" },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            position: { select: { name: true } },
        },
    });

    return {
        leaveTypes: leaveTypes.map((lt) => {
            const balance = balances.find((b) => b.leaveTypeId === lt.id);
            return {
                id: lt.id,
                name: lt.name,
                description: lt.description,
                isPaidLeave: lt.isPaidLeave,
                defaultDays: lt.defaultDays,
                balance: balance ? {
                    totalDays: balance.totalDays,
                    usedDays: balance.usedDays,
                    pendingDays: balance.pendingDays,
                    available: balance.totalDays - balance.usedDays - balance.pendingDays,
                } : null,
            };
        }),
        manager,
        currentYear,
    };
}

// ============================================================
// GET MY LEAVE REQUESTS
// ============================================================

export type LeaveRequestWithDetails = Awaited<ReturnType<typeof getMyLeaveRequests>>["items"][number];

export async function getMyLeaveRequests(params: {
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ALL";
    year?: number;
    page?: number;
    pageSize?: number;
} = {}) {
    const session = await requireAuth();
    const { status = "ALL", year = new Date().getFullYear(), page = 1, pageSize = 20 } = params;

    const where: Record<string, unknown> & { userId: string } = {
        userId: session.user.id,
    };

    if (status !== "ALL") {
        where.status = status;
    }

    if (year) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

        // Include every leave request that overlaps the selected year.
        where.startDate = { lte: endOfYear };
        where.endDate = { gte: startOfYear };
    }

    const [requests, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            include: {
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        isPaidLeave: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.leaveRequest.count({ where }),
    ]);

    // Lấy thông tin người duyệt
    const approverIds = requests
        .map((r) => r.approvedBy)
        .filter((id): id is string => Boolean(id));

    const approvers =
        approverIds.length > 0
            ? await prisma.user.findMany({
                  where: { id: { in: approverIds } },
                  select: { id: true, name: true, avatar: true },
              })
            : [];

    const approverMap = new Map(approvers.map((u) => [u.id, u]));

    const items = requests.map((req) => ({
        id: req.id,
        leaveTypeId: req.leaveTypeId,
        startDate: req.startDate.toISOString(),
        endDate: req.endDate.toISOString(),
        totalDays: req.totalDays,
        reason: req.reason,
        status: req.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
        documentUrl: req.documentUrl,
        approvedAt: req.approvedAt?.toISOString() ?? null,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt.toISOString(),
        leaveType: req.leaveType ?? null,
        approvedByUser: req.approvedBy ? approverMap.get(req.approvedBy) ?? null : null,
    }));

    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

// ============================================================
// GET MY LEAVE BALANCES
// ============================================================

export async function getMyLeaveBalances(year = new Date().getFullYear()) {
    const session = await requireAuth();
    const targetYear = year;

    const balances = await prisma.leaveBalance.findMany({
        where: {
            userId: session.user.id,
            policyYear: targetYear,
        },
        include: {
            leaveType: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    isPaidLeave: true,
                },
            },
        },
        orderBy: {
            leaveType: { name: "asc" },
        },
    });

    return balances.map((b) => ({
        id: b.id,
        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveType.name,
        isPaidLeave: b.leaveType.isPaidLeave,
        totalDays: b.totalDays,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
        available: b.totalDays - b.usedDays - b.pendingDays,
        policyYear: b.policyYear,
    }));
}

// ============================================================
// CREATE LEAVE REQUEST
// ============================================================

export async function createLeaveRequest(data: LeaveRequestInput) {
    const session = await requireAuth();

    // Validate input
    const validated = leaveRequestSchema.parse(data);

    // Kiểm tra ngày
    if (validated.startDate > validated.endDate) {
        throw new Error("Ngày bắt đầu phải trước ngày kết thúc");
    }

    // Lấy loại nghỉ phép
    const leaveType = await prisma.leaveType.findUnique({
        where: { id: validated.leaveTypeId },
    });

    if (!leaveType) {
        throw new Error("Không tìm thấy loại nghỉ phép");
    }

    // Tính số ngày nghỉ (chỉ đếm ngày làm việc, loại trừ Thứ 7, CN, ngày lễ)
    const startDateObj = new Date(validated.startDate);
    const endDateObj = new Date(validated.endDate);
    const totalDays = calculateWorkingDays(startDateObj, endDateObj);

    if (totalDays <= 0) {
        throw new Error("Không có ngày làm việc nào trong khoảng đã chọn");
    }

    // Kiểm tra trùng ngày
    const overlapping = await prisma.leaveRequest.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ["PENDING", "APPROVED"] },
            startDate: { lte: endDateObj },
            endDate: { gte: startDateObj },
        },
    });
    if (overlapping) {
        throw new Error(
            "Bạn đã có yêu cầu nghỉ phép trùng ngày (đang chờ duyệt hoặc đã duyệt). Vui lòng kiểm tra lại."
        );
    }

    const currentYear = new Date().getFullYear();

    // Sử dụng transaction để tránh race condition
    const result = await prisma.$transaction(async (tx) => {
        let balance = await tx.leaveBalance.findUnique({
            where: {
                userId_leaveTypeId_policyYear: {
                    userId: session.user.id,
                    leaveTypeId: validated.leaveTypeId,
                    policyYear: currentYear,
                },
            },
        });

        // Tự động tạo LeaveBalance nếu chưa có
        if (!balance) {
            const defaultDays = leaveType.defaultDays;

            if (totalDays > defaultDays) {
                throw new Error(`Số ngày nghỉ khả dụng không đủ. Bạn chỉ còn ${defaultDays} ngày`);
            }

            balance = await tx.leaveBalance.create({
                data: {
                    userId: session.user.id,
                    leaveTypeId: validated.leaveTypeId,
                    policyYear: currentYear,
                    totalDays: defaultDays,
                    usedDays: 0,
                    pendingDays: totalDays,
                },
            });
        } else {
            // Kiểm tra số dư trước khi cập nhật
            const available = balance.totalDays - balance.usedDays - balance.pendingDays;
            if (totalDays > available) {
                throw new Error(`Số ngày nghỉ khả dụng không đủ. Bạn chỉ còn ${available} ngày`);
            }

            // Cập nhật pendingDays
            await tx.leaveBalance.update({
                where: { id: balance.id },
                data: {
                    pendingDays: { increment: totalDays },
                },
            });
        }

        // Tạo đơn nghỉ phép
        const leaveRequest = await tx.leaveRequest.create({
            data: {
                userId: session.user.id,
                leaveTypeId: validated.leaveTypeId,
                leaveBalanceId: balance.id,
                startDate: validated.startDate,
                endDate: validated.endDate,
                totalDays,
                reason: validated.reason,
                documentUrl: validated.documentUrl,
                status: "PENDING",
            },
            include: {
                leaveType: true,
            },
        });

        return leaveRequest;
    });

    // Thông báo qua socket
    emitToAll(SOCKET_EVENTS.DATA_UPDATED, {
        entity: "leave-request",
        action: "create",
        data: result,
    });

    revalidatePath("/ess/leave");
    revalidatePath("/attendance/leave-summary");
    revalidatePath("/attendance/leave-requests");

    return {
        ...result,
        leaveType: result.leaveType ?? null,
    };
}

// ============================================================
// CANCEL LEAVE REQUEST
// ============================================================

export async function cancelLeaveRequest(requestId: string) {
    const session = await requireAuth();

    const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
    });

    if (!leaveRequest) {
        throw new Error("Không tìm thấy yêu cầu nghỉ phép");
    }

    if (leaveRequest.userId !== session.user.id) {
        throw new Error("Bạn không có quyền hủy yêu cầu này");
    }

    if (leaveRequest.status !== "PENDING") {
        throw new Error("Chỉ có thể hủy yêu cầu đang chờ duyệt");
    }

    // Hoàn lại pendingDays
    const currentYear = new Date().getFullYear();
    await prisma.$transaction(async (tx) => {
        if (leaveRequest.leaveBalanceId) {
            await tx.leaveBalance.update({
                where: {
                    userId_leaveTypeId_policyYear: {
                        userId: session.user.id,
                        leaveTypeId: leaveRequest.leaveTypeId,
                        policyYear: currentYear,
                    },
                },
                data: {
                    pendingDays: { decrement: leaveRequest.totalDays },
                },
            });
        }

        await tx.leaveRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED" },
        });
    });

    revalidatePath("/ess/leave");
    revalidatePath("/attendance/leave-summary");
    revalidatePath("/attendance/leave-requests");
}

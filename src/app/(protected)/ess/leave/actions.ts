"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

import { emitToAll } from "@/lib/socket/server";
import { SOCKET_EVENTS } from "@/lib/socket";
import { LeaveRequestInput, leaveRequestSchema } from "./types";


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
        where.OR = [
            {
                startDate: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31),
                },
            },
            {
                endDate: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31),
                },
            },
        ];
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

export async function getMyLeaveBalances() {
    const session = await requireAuth();
    const currentYear = new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
        where: {
            userId: session.user.id,
            policyYear: currentYear,
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

    // Tính số ngày nghỉ
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);
    const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Kiểm tra trùng ngày
    const overlapping = await prisma.leaveRequest.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ["PENDING", "APPROVED"] },
            startDate: { lte: endDate },
            endDate: { gte: startDate },
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
        await tx.leaveBalance.updateMany({
            where: {
                userId: session.user.id,
                leaveTypeId: leaveRequest.leaveTypeId,
                policyYear: currentYear,
            },
            data: {
                pendingDays: { decrement: leaveRequest.totalDays },
            },
        });

        await tx.leaveRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED" },
        });
    });

    revalidatePath("/ess/leave");
    revalidatePath("/attendance/leave-summary");
    revalidatePath("/attendance/leave-requests");
}

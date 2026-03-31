"use server";

import { requirePermission, requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LeaveRequestQueryInput } from "./types";


// ============================================================
// QUERY — Lấy đơn nghỉ phép cần duyệt
// ============================================================

export async function getLeaveRequestsForApproval(
    params: LeaveRequestQueryInput = {
        status: "PENDING",
        page: 1,
        pageSize: 20,
    }
) {
    const session = await requireAuth();
    const userRole = session.user.hrmRole;

    const {
        search,
        status = "ALL",
        leaveTypeId,
        departmentId,
        year = new Date().getFullYear(),
        page = 1,
        pageSize = 20,
    } = params;

    // Build base where
    const where: Record<string, unknown> = {};

    // Status filter
    if (status !== "ALL") {
        where.status = status;
    }

    // Year filter (by startDate or endDate)
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    where.OR = [
        { startDate: { gte: yearStart, lte: yearEnd } },
        { endDate: { gte: yearStart, lte: yearEnd } },
    ];

    // Leave type filter
    if (leaveTypeId) {
        where.leaveTypeId = leaveTypeId;
    }

    // Search filter
    if (search) {
        where.user = {
            OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { employeeCode: { contains: search, mode: "insensitive" } },
            ],
        };
    }

    // Department filter (join via user)
    if (departmentId) {
        where.user = {
            ...((where.user as Record<string, unknown>) || {}),
            departmentId,
        };
    }

    // Role-based: DEPT_MANAGER / TEAM_LEADER chỉ thấy đơn trong phòng/team
    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        const managerDeptId = (session.user as { departmentId?: string }).departmentId;
        where.user = {
            ...((where.user as Record<string, unknown>) || {}),
            departmentId: managerDeptId,
        };
    }

    const [data, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        name: true,
                        email: true,
                        avatar: true,
                        employeeCode: true,
                        department: {
                            select: { id: true, name: true },
                        },
                        position: {
                            select: { id: true, name: true },
                        },
                    },
                },
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
    const approverIds = data
        .map((r) => r.approvedBy)
        .filter((id): id is string => Boolean(id));
    const approvers =
        approverIds.length > 0
            ? new Map(
                  (
                      await prisma.user.findMany({
                          where: { id: { in: approverIds } },
                          select: { id: true, fullName: true, name: true },
                      })
                  ).map((u) => [u.id, u])
              )
            : new Map<string, { id: string; fullName: string | null; name: string }>();

    const items = data.map((req) => ({
        id: req.id,
        userId: req.userId,
        user: req.user,
        leaveTypeId: req.leaveTypeId,
        leaveType: req.leaveType ?? null,
        startDate: req.startDate.toISOString(),
        endDate: req.endDate.toISOString(),
        totalDays: req.totalDays,
        reason: req.reason,
        status: req.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
        documentUrl: req.documentUrl,
        approvedBy: req.approvedBy,
        approvedByUser: req.approvedBy ? approvers.get(req.approvedBy) ?? null : null,
        approvedAt: req.approvedAt?.toISOString() ?? null,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
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
// QUERY — Lấy thống kê đơn nghỉ phép
// ============================================================

export async function getLeaveRequestStats(year = new Date().getFullYear()) {
    const session = await requireAuth();
    const userRole = session.user.hrmRole;

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const baseWhere: Record<string, unknown> = {
        OR: [
            { startDate: { gte: yearStart, lte: yearEnd } },
            { endDate: { gte: yearStart, lte: yearEnd } },
        ],
    };

    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        const managerDeptId = (session.user as { departmentId?: string }).departmentId;
        baseWhere.user = { departmentId: managerDeptId };
    }

    const [pending, approved, rejected, cancelled, total] =
        await Promise.all([
            prisma.leaveRequest.count({
                where: { ...baseWhere, status: "PENDING" },
            }),
            prisma.leaveRequest.count({
                where: { ...baseWhere, status: "APPROVED" },
            }),
            prisma.leaveRequest.count({
                where: { ...baseWhere, status: "REJECTED" },
            }),
            prisma.leaveRequest.count({
                where: { ...baseWhere, status: "CANCELLED" },
            }),
            prisma.leaveRequest.count({ where: baseWhere }),
        ]);

    return { pending, approved, rejected, cancelled, total };
}

// ============================================================
// ACTION — Duyệt đơn nghỉ phép
// ============================================================

export async function approveLeaveRequest(requestId: string) {
    const session = await requireAuth();
    const userRole = session.user.hrmRole;

    // Check permission
    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        await requirePermission(Permission.LEAVE_APPROVE_TEAM);
    } else if (
        userRole === "HR_MANAGER" ||
        userRole === "HR_STAFF" ||
        userRole === "SUPER_ADMIN" ||
        userRole === "DIRECTOR"
    ) {
        await requirePermission(Permission.LEAVE_APPROVE_ALL);
    } else {
        throw new Error("Bạn không có quyền duyệt đơn nghỉ phép");
    }

    const request = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: {
            user: { select: { departmentId: true, id: true } },
            leaveBalance: true,
        },
    });

    if (!request) {
        throw new Error("Không tìm thấy đơn nghỉ phép");
    }

    if (request.status !== "PENDING") {
        throw new Error("Đơn nghỉ phép không ở trạng thái chờ duyệt");
    }

    // Role-based: dept_manager chỉ duyệt được đơn trong phòng mình
    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        const managerDeptId = (session.user as { departmentId?: string }).departmentId;
        if (request.user.departmentId !== managerDeptId) {
            throw new Error("Bạn không có quyền duyệt đơn này");
        }
    }

    // Update balance: chuyển pendingDays → usedDays
    await prisma.$transaction(async (tx) => {
        if (request.leaveBalanceId && request.leaveBalance) {
            await tx.leaveBalance.update({
                where: { id: request.leaveBalanceId },
                data: {
                    pendingDays: { decrement: request.totalDays },
                    usedDays: { increment: request.totalDays },
                },
            });
        }

        await tx.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                approvedBy: session.user.id,
                approvedAt: new Date(),
            },
        });
    });

    revalidatePath("/attendance/leave-requests");
    revalidatePath("/ess/leave");
    revalidatePath("/attendance/leave-summary");

    return { success: true, message: "Đã duyệt đơn nghỉ phép" };
}

// ============================================================
// ACTION — Từ chối đơn nghỉ phép
// ============================================================

export async function rejectLeaveRequest(
    requestId: string,
    data: { reason: string }
) {
    if (!data.reason?.trim()) {
        throw new Error("Phải nhập lý do từ chối");
    }

    const session = await requireAuth();
    const userRole = session.user.hrmRole;

    // Check permission
    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        await requirePermission(Permission.LEAVE_APPROVE_TEAM);
    } else if (
        userRole === "HR_MANAGER" ||
        userRole === "HR_STAFF" ||
        userRole === "SUPER_ADMIN" ||
        userRole === "DIRECTOR"
    ) {
        await requirePermission(Permission.LEAVE_APPROVE_ALL);
    } else {
        throw new Error("Bạn không có quyền từ chối đơn nghỉ phép");
    }

    const request = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: { user: { select: { departmentId: true } } },
    });

    if (!request) {
        throw new Error("Không tìm thấy đơn nghỉ phép");
    }

    if (request.status !== "PENDING") {
        throw new Error("Đơn nghỉ phép không ở trạng thái chờ duyệt");
    }

    // Role-based
    if (
        userRole === "DEPT_MANAGER" ||
        userRole === "TEAM_LEADER"
    ) {
        const managerDeptId = (session.user as { departmentId?: string }).departmentId;
        if (request.user.departmentId !== managerDeptId) {
            throw new Error("Bạn không có quyền từ chối đơn này");
        }
    }

    const currentYear = new Date().getFullYear();

    // Hoàn lại pendingDays và cập nhật trạng thái
    await prisma.$transaction(async (tx) => {
        if (request.leaveBalanceId) {
            await tx.leaveBalance.updateMany({
                where: {
                    userId: request.userId,
                    leaveTypeId: request.leaveTypeId,
                    policyYear: currentYear,
                },
                data: {
                    pendingDays: { decrement: request.totalDays },
                },
            });
        }

        await tx.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                approvedBy: session.user.id,
                approvedAt: new Date(),
                rejectionReason: data.reason,
            },
        });
    });

    revalidatePath("/attendance/leave-requests");
    revalidatePath("/ess/leave");
    revalidatePath("/attendance/leave-summary");

    return { success: true, message: "Đã từ chối đơn nghỉ phép" };
}

// ============================================================
// QUERY — Lấy danh sách loại nghỉ phép (cho filter)
// ============================================================

export async function getLeaveTypesForFilter() {
    await requirePermission(Permission.LEAVE_VIEW_ALL);

    const types = await prisma.leaveType.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return types;
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import type {
    AdminRequestListItem,
    AdminRequestDetail,
    AdminRequestFilters,
    AdminRequestStats,
    ApproveAdminRequestData,
    RejectAdminRequestData,
} from "./types";

// ─── HELPERS ────────────────────────────────────────────────────────────────

const RESIGNATION_TYPES_LIST = ["RESIGNATION_LETTER"];

function parseRequestType(type: string): string {
    return type;
}

// ─── GET STATS ─────────────────────────────────────────────────────────────

export async function getAdminRequestStats(): Promise<AdminRequestStats> {
    await requirePermission(Permission.ADMIN_REQUEST_VIEW);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pending, approved, rejected, cancelled, thisMonth] = await Promise.all([
        prisma.administrativeRequest.count(),
        prisma.administrativeRequest.count({ where: { status: "PENDING" } }),
        prisma.administrativeRequest.count({ where: { status: "APPROVED" } }),
        prisma.administrativeRequest.count({ where: { status: "REJECTED" } }),
        prisma.administrativeRequest.count({ where: { status: "CANCELLED" } }),
        prisma.administrativeRequest.count({
            where: { createdAt: { gte: startOfMonth } },
        }),
    ]);

    return { total, pending, approved, rejected, cancelled, thisMonth };
}

// ─── GET LIST ───────────────────────────────────────────────────────────────

export async function getAdminRequests(
    filters?: AdminRequestFilters
): Promise<AdminRequestListItem[]> {
    await requirePermission(Permission.ADMIN_REQUEST_VIEW);

    const where: Record<string, unknown> = {};

    if (filters?.status && filters.status !== "ALL") {
        where.status = filters.status;
    }

    if (filters?.type && filters.type !== "ALL") {
        where.type = filters.type;
    }

    if (filters?.departmentId) {
        where.user = { departmentId: filters.departmentId };
    }

    if (filters?.search) {
        where.user = {
            ...((where.user as Record<string, unknown>) || {}),
            OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
                { username: { contains: filters.search, mode: "insensitive" } },
            ],
        };
    }

    if (filters?.fromDate) {
        where.createdAt = {
            ...((where.createdAt as Record<string, unknown>) || {}),
            gte: new Date(filters.fromDate),
        };
    }

    if (filters?.toDate) {
        where.createdAt = {
            ...((where.createdAt as Record<string, unknown>) || {}),
            lte: new Date(filters.toDate + "T23:59:59.999Z"),
        };
    }

    const requests = await prisma.administrativeRequest.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    image: true,
                    department: { select: { id: true, name: true } },
                    position: { select: { id: true, name: true } },
                    manager: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return requests as unknown as AdminRequestListItem[];
}

// ─── GET BY ID ─────────────────────────────────────────────────────────────

export async function getAdminRequestById(
    id: string
): Promise<AdminRequestDetail | null> {
    await requirePermission(Permission.ADMIN_REQUEST_VIEW);

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    image: true,
                    department: { select: { id: true, name: true } },
                    position: { select: { id: true, name: true } },
                    manager: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!request) return null;

    // Get reviewer info if exists
    let reviewerInfo = null;
    if (request.reviewedBy) {
        const reviewer = await prisma.user.findUnique({
            where: { id: request.reviewedBy },
            select: { id: true, name: true, email: true },
        });
        reviewerInfo = reviewer;
    }

    return {
        ...(request as unknown as AdminRequestListItem),
        reviewedByUser: reviewerInfo,
    };
}

// ─── APPROVE ────────────────────────────────────────────────────────────────

export async function approveAdminRequest(
    id: string,
    data?: ApproveAdminRequestData
) {
    await requirePermission(Permission.ADMIN_REQUEST_APPROVE);
    const session = await requireAuth();

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!request) {
        throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.status !== "PENDING") {
        throw new Error("Yêu cầu đã được xử lý");
    }

    // Update request status
    await prisma.administrativeRequest.update({
        where: { id },
        data: {
            status: "APPROVED",
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            responseAttachment: data?.responseAttachment,
        },
    });

    // Nếu là đơn nghỉ việc → tự động tạo Offboarding
    if (RESIGNATION_TYPES_LIST.includes(request.type)) {
        await autoCreateOffboarding(request.userId, request.description);
    }

    revalidatePath("/attendance/admin-requests");
    revalidatePath("/ess/requests");

    return { success: true, message: "Đã duyệt yêu cầu" };
}

// ─── REJECT ────────────────────────────────────────────────────────────────

export async function rejectAdminRequest(
    id: string,
    data: RejectAdminRequestData
) {
    await requirePermission(Permission.ADMIN_REQUEST_APPROVE);
    const session = await requireAuth();

    if (!data.reason || data.reason.trim() === "") {
        throw new Error("Vui lòng nhập lý do từ chối");
    }

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
    });

    if (!request) {
        throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.status !== "PENDING") {
        throw new Error("Yêu cầu đã được xử lý");
    }

    await prisma.administrativeRequest.update({
        where: { id },
        data: {
            status: "REJECTED",
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            rejectReason: data.reason,
        },
    });

    revalidatePath("/attendance/admin-requests");
    revalidatePath("/ess/requests");

    return { success: true, message: "Đã từ chối yêu cầu" };
}

// ─── AUTO CREATE OFFBOARDING ───────────────────────────────────────────────

async function autoCreateOffboarding(userId: string, requestDescription: string) {
    // Calculate last work date (30 days from now as default for resignation notice period)
    const resignDate = new Date();
    const lastWorkDate = new Date();
    lastWorkDate.setDate(lastWorkDate.getDate() + 30);

    // Get user's assigned assets
    const userAssets = await prisma.assetAssignment.findMany({
        where: {
            userId: userId,
            status: "ASSIGNED",
        },
        include: { asset: true },
    });

    // Default checklist tasks
    const defaultTasks = [
        {
            title: "Bàn giao công việc",
            description: "Chuyển giao công việc cho người thay thế",
            category: "GENERAL",
            assigneeRole: "DEPT_MANAGER",
            dueDays: 7,
        },
        {
            title: "Thu hồi tài sản",
            description: "Thu hồi laptop, thẻ, chìa khóa",
            category: "ASSET",
            assigneeRole: "IT_ADMIN",
            dueDays: 3,
        },
        {
            title: "Khóa tài khoản",
            description: "Vô hiệu hóa email, hệ thống",
            category: "ACCOUNT",
            assigneeRole: "IT_ADMIN",
            dueDays: 1,
        },
        {
            title: "Thanh toán lương",
            description: "Tính và thanh toán lương cuối",
            category: "FINANCIAL",
            assigneeRole: "ACCOUNTANT",
            dueDays: 5,
        },
        {
            title: "Exit interview",
            description: "Phỏng vấn nghỉ việc",
            category: "INTERVIEW",
            assigneeRole: "HR_STAFF",
            dueDays: 3,
        },
    ];

    const offboarding = await prisma.offboarding.create({
        data: {
            userId: userId,
            resignDate: resignDate,
            lastWorkDate: lastWorkDate,
            reason: "VOLUNTARY",
            reasonDetail: requestDescription || undefined,
            status: "PROCESSING",
            checklist: {
                create: defaultTasks.map((task) => ({
                    taskTitle: task.title,
                    taskDescription: task.description,
                    category: task.category,
                    assigneeRole: task.assigneeRole,
                    dueDate: new Date(
                        lastWorkDate.getTime() - task.dueDays * 24 * 60 * 60 * 1000
                    ),
                })),
            },
            assets: {
                create: userAssets.map((assignment) => ({
                    assetId: assignment.assetId,
                    assetName: assignment.asset.name,
                    assetCode: assignment.asset.code,
                    category: assignment.asset.category,
                    status: "PENDING",
                })),
            },
        },
    });

    revalidatePath("/offboarding");

    return offboarding;
}

// ─── CANCEL (Employee self-cancel) ────────────────────────────────────────

export async function cancelAdminRequest(id: string) {
    await requireAuth();

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
    });

    if (!request) {
        throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.status !== "PENDING") {
        throw new Error("Chỉ có thể hủy yêu cầu đang chờ");
    }

    await prisma.administrativeRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/ess/requests");

    return { success: true, message: "Đã hủy yêu cầu" };
}

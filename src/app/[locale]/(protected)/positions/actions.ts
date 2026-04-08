"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { getIO, emitToAll } from "@/lib/socket/server";
import type {
    PositionDetail,
    GetPositionsParams,
    GetPositionsResult,
    PositionListItem,
} from "./types";
import { CreatePositionInput, createPositionSchema, UpdatePositionInput, updatePositionSchema } from "./schemas";
import z from "zod";

// =============================================
// QUERY FUNCTIONS
// =============================================

/**
 * Lấy danh sách chức vụ với pagination, search, filter, sort
 */
export async function getPositions(
    params: GetPositionsParams,
): Promise<GetPositionsResult> {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    const {
        page = 1,
        pageSize = 20,
        search,
        departmentId,
        authority,
        status = "ALL",
        sortBy = "level",
        sortOrder = "asc",
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
        ];
    }

    if (departmentId && departmentId !== "ALL") {
        where.departmentId = departmentId;
    }

    if (authority && authority !== "ALL") {
        where.authority = authority;
    }

    if (status !== "ALL") {
        where.status = status;
    }

    const validSortFields = ["name", "code", "level", "status", "authority"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "level";

    const [positions, total] = await Promise.all([
        prisma.position.findMany({
            where,
            select: {
                id: true,
                name: true,
                code: true,
                authority: true,
                departmentId: true,
                level: true,
                parentId: true,
                status: true,
                sortOrder: true,
                department: { select: { id: true, name: true } },
                parent: { select: { id: true, name: true, code: true } },
                _count: { select: { users: true } },
            },
            orderBy: { [sortField]: sortOrder },
            skip,
            take: pageSize,
        }),
        prisma.position.count({ where }),
    ]);

    const items: PositionListItem[] = positions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        authority: p.authority,
        departmentId: p.departmentId,
        departmentName: p.department?.name ?? null,
        level: p.level,
        parentId: p.parentId,
        parentName: p.parent?.name ?? null,
        status: p.status,
        sortOrder: p.sortOrder,
        userCount: p._count.users,
        description: null,
        minSalary: null,
        maxSalary: null,
    }));

    return {
        positions: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: skip + items.length < total,
    };
}

/**
 * Lấy chi tiết một chức vụ
 */
export async function getPositionById(id: string): Promise<PositionDetail | null> {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    const position = await prisma.position.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            parent: { select: { id: true, name: true, code: true } },
            children: {
                select: { id: true, name: true, code: true, authority: true },
                orderBy: { level: "asc" },
            },
            users: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    image: true,
                    department: { select: { id: true, name: true } },
                },
                where: { employeeStatus: { not: "RESIGNED" } },
                orderBy: { name: "asc" },
            },
        },
    });

    if (!position) return null;

    return {
        id: position.id,
        name: position.name,
        code: position.code,
        authority: position.authority,
        departmentId: position.departmentId,
        departmentName: position.department?.name ?? null,
        level: position.level,
        parentId: position.parentId,
        parentName: position.parent?.name ?? null,
        status: position.status,
        sortOrder: position.sortOrder,
        userCount: position.users.length,
        description: position.description,
        minSalary: position.minSalary ? position.minSalary.toString() : null,
        maxSalary: position.maxSalary ? position.maxSalary.toString() : null,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
        children: position.children,
        users: position.users.map((u) => ({
            id: u.id,
            name: u.name,
            employeeCode: u.employeeCode,
            image: u.image,
            departmentName: u.department?.name ?? null,
        })),
    };
}

/**
 * Lấy tất cả chức vụ (dropdown) - không phân trang
 */
export async function getAllPositions(params?: {
    departmentId?: string;
    status?: string;
}): Promise<{ id: string; name: string; code: string; authority: string; level: number }[]> {
    const where: Record<string, unknown> = {};
    if (params?.departmentId) where.departmentId = params.departmentId;
    if (params?.status) where.status = params.status;
    else where.status = "ACTIVE";

    return prisma.position.findMany({
        where,
        select: {
            id: true,
            name: true,
            code: true,
            authority: true,
            level: true,
        },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });
}

// =============================================
// MUTATION FUNCTIONS
// =============================================

/**
 * Tạo chức vụ mới
 */
export async function createPosition(
    data: CreatePositionInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_CREATE);
        const validated = createPositionSchema.parse(data);

        // Check unique code
        const existing = await prisma.position.findUnique({
            where: { code: validated.code },
        });
        if (existing) {
            return { success: false, error: "Mã chức vụ đã tồn tại" };
        }

        const position = await prisma.position.create({
            data: {
                name: validated.name,
                code: validated.code,
                authority: validated.authority,
                departmentId: validated.departmentId,
                level: validated.level,
                description: validated.description,
                parentId: validated.parentId,
                status: validated.status,
                sortOrder: validated.sortOrder,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "CREATE",
                entity: "Position",
                entityId: position.id,
                newData: validated,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");
        revalidatePath("/employees");

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (io as any).emit("position:created", { id: position.id, name: position.name });
            }
        } catch (_) {
            // Socket not available
        }

        return { success: true, id: position.id };
    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.issues[0]?.message || "Dữ liệu không hợp lệ" };
        }
        console.error("createPosition error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi tạo chức vụ" };
    }
}

/**
 * Cập nhật chức vụ
 */
export async function updatePosition(
    id: string,
    data: UpdatePositionInput,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_EDIT);
        const validated = updatePositionSchema.parse(data);

        // Check unique code (if changed)
        if (validated.code) {
            const existing = await prisma.position.findFirst({
                where: { code: validated.code, NOT: { id } },
            });
            if (existing) {
                return { success: false, error: "Mã chức vụ đã tồn tại" };
            }
        }

        const position = await prisma.position.update({
            where: { id },
            data: {
                ...(validated.name !== undefined && { name: validated.name }),
                ...(validated.code !== undefined && { code: validated.code }),
                ...(validated.authority !== undefined && { authority: validated.authority }),
                ...(validated.departmentId !== undefined && { departmentId: validated.departmentId }),
                ...(validated.level !== undefined && { level: validated.level }),
                ...(validated.description !== undefined && { description: validated.description }),
                ...(validated.parentId !== undefined && { parentId: validated.parentId }),
                ...(validated.status !== undefined && { status: validated.status }),
                ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "UPDATE",
                entity: "Position",
                entityId: id,
                newData: validated,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");
        revalidatePath(`/positions/${id}`);
        revalidatePath("/employees");

        try {
            const io = getIO();
            if (io) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (io as any).emit("position:updated", { id: position.id, name: position.name });
            }
        } catch (_) {
            // Socket not available
        }

        return { success: true };
    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.issues[0]?.message || "Dữ liệu không hợp lệ" };
        }
        console.error("updatePosition error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi cập nhật chức vụ" };
    }
}

/**
 * Xóa chức vụ (soft delete bằng cách đổi status = INACTIVE)
 */
export async function deletePosition(
    id: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_DELETE);

        // Check if position has users
        const position = await prisma.position.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });

        if (!position) {
            return { success: false, error: "Chức vụ không tồn tại" };
        }

        if (position._count.users > 0) {
            return {
                success: false,
                error: `Chức vụ đang có ${position._count.users} nhân viên. Vui lòng chuyển nhân viên sang chức vụ khác trước khi xóa.`,
            };
        }

        // Soft delete
        await prisma.position.update({
            where: { id },
            data: { status: "INACTIVE" },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "DELETE",
                entity: "Position",
                entityId: id,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");

        try {
            const io = getIO();
            if (io) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (io as any).emit("position:deleted", { id });
            }
        } catch (_) {
            // Socket not available
        }

        return { success: true };
    } catch (err) {
        console.error("deletePosition error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi xóa chức vụ" };
    }
}

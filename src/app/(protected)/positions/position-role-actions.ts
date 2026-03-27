"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { POSITION_ROLE_SUGGESTIONS } from "./schemas";

/**
 * Lấy role mapping của một position
 */
export async function getPositionRoleMapping(positionId: string) {
    const mapping = await prisma.positionRoleMapping.findUnique({
        where: { positionId },
        include: {
            position: {
                select: { id: true, name: true, code: true, authority: true },
            },
        },
    });

    if (!mapping) return null;

    const role = await prisma.role.findUnique({
        where: { key: mapping.roleKey },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });

    return {
        id: mapping.id,
        positionId: mapping.positionId,
        roleKey: mapping.roleKey,
        roleName: role?.name ?? mapping.roleKey,
        roleType: role?.roleType ?? "CUSTOM",
        permissions: role?.rolePermissions.map((rp) => rp.permissionKey) ?? [],
        isDefault: mapping.isDefault,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt,
    };
}

/**
 * Lấy tất cả position kèm role mapping
 */
export async function getPositionsWithRoles() {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    const positions = await prisma.position.findMany({
        where: { status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            code: true,
            authority: true,
            level: true,
            department: { select: { id: true, name: true } },
            roleMapping: {
                include: {
                    position: {
                        select: { id: true, name: true, authority: true },
                    },
                },
            },
        },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    const roles = await prisma.role.findMany({
        where: { isActive: true },
        select: { id: true, key: true, name: true, roleType: true },
        orderBy: { createdAt: "asc" },
    });

    return positions.map((pos) => ({
        id: pos.id,
        name: pos.name,
        code: pos.code,
        authority: pos.authority,
        level: pos.level,
        departmentName: pos.department?.name ?? null,
        mappedRoleKey: pos.roleMapping?.roleKey ?? null,
        mappedRoleName: null,
        suggestedRoleKey: POSITION_ROLE_SUGGESTIONS[pos.authority] ?? null,
        hasMapping: !!pos.roleMapping,
        isDefaultMapping: pos.roleMapping?.isDefault ?? false,
        roles,
    }));
}

/**
 * Gán role cho position
 */
export async function setPositionRoleMapping(
    positionId: string,
    roleKey: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_EDIT);

        const position = await prisma.position.findUnique({
            where: { id: positionId },
        });
        if (!position) {
            return { success: false, error: "Chức vụ không tồn tại" };
        }

        const role = await prisma.role.findUnique({
            where: { key: roleKey },
        });
        if (!role) {
            return { success: false, error: "Vai trò không tồn tại" };
        }

        await prisma.positionRoleMapping.upsert({
            where: { positionId },
            create: {
                positionId,
                roleKey,
                isDefault: true,
            },
            update: {
                roleKey,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "UPDATE",
                entity: "PositionRoleMapping",
                entityId: positionId,
                newData: { positionId, roleKey },
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");
        revalidatePath(`/positions/${positionId}`);

        return { success: true };
    } catch (err) {
        console.error("setPositionRoleMapping error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi gán vai trò cho chức vụ" };
    }
}

/**
 * Gỡ role mapping khỏi position
 */
export async function removePositionRoleMapping(
    positionId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_EDIT);

        await prisma.positionRoleMapping.delete({
            where: { positionId },
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "DELETE",
                entity: "PositionRoleMapping",
                entityId: positionId,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");
        revalidatePath(`/positions/${positionId}`);

        return { success: true };
    } catch (err) {
        console.error("removePositionRoleMapping error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi gỡ vai trò khỏi chức vụ" };
    }
}

/**
 * Seed tự động role mapping cho tất cả positions đang ACTIVE
 */
export async function seedAllPositionRoleMappings(): Promise<{
    success: true;
    seeded: number;
    skipped: number;
} | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_EDIT);

        const positions = await prisma.position.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, authority: true },
        });

        let seeded = 0;
        let skipped = 0;

        for (const pos of positions) {
            const suggestedRoleKey = POSITION_ROLE_SUGGESTIONS[pos.authority];
            if (!suggestedRoleKey) {
                skipped++;
                continue;
            }

            const role = await prisma.role.findFirst({
                where: { key: suggestedRoleKey, isActive: true },
            });
            if (!role) {
                skipped++;
                continue;
            }

            await prisma.positionRoleMapping.upsert({
                where: { positionId: pos.id },
                create: {
                    positionId: pos.id,
                    roleKey: role.key,
                    isDefault: true,
                },
                update: {},
            });

            seeded++;
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "CREATE",
                entity: "PositionRoleMapping",
                entityId: "BATCH_SEED",
                newData: { seeded, skipped, total: positions.length },
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath("/positions");

        return { success: true, seeded, skipped };
    } catch (err) {
        console.error("seedAllPositionRoleMappings error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi seed role mapping" };
    }
}

/**
 * Lấy role được suggest cho một position dựa trên authority
 */
export async function getSuggestedRoleForPosition(authority: string) {
    return POSITION_ROLE_SUGGESTIONS[authority] ?? null;
}

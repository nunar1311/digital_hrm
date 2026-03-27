"use server";

import { requirePermission, extractRole } from "@/lib/auth-session";
import { Permission, Role, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { getUserPermissions } from "@/lib/rbac/check-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { emitToAll } from "@/lib/socket/server";

// ─────────────────────────────────────────────
// SYSTEM SETTINGS
// ─────────────────────────────────────────────

const DEFAULT_SETTINGS: Record<string, { value: string; group: string }> = {
    "company.name": { value: "Digital HRM", group: "general" },
    "company.address": { value: "", group: "general" },
    "company.phone": { value: "", group: "general" },
    "company.email": { value: "", group: "general" },
    "company.taxCode": { value: "", group: "general" },
    "company.logo": { value: "", group: "general" },
    "system.timezone": { value: "Asia/Ho_Chi_Minh", group: "general" },
    "system.weekStartDay": { value: "1", group: "general" }, // 0=CN, 1=T2
    "system.dateFormat": { value: "dd/MM/yyyy", group: "general" },
    "system.standardWorkHours": { value: "8", group: "general" },
    "system.standardWorkDays": { value: "22", group: "general" },
};

export async function getSystemSettings() {
    await requirePermission(Permission.SETTINGS_VIEW);

    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};

    // Fill defaults
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
        map[key] = def.value;
    }
    // Override with DB values
    for (const s of settings) {
        map[s.key] = s.value;
    }

    return map;
}

export async function getTimezone(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: "system.timezone" },
    });
    return setting?.value ?? DEFAULT_SETTINGS["system.timezone"].value;
}

const updateSettingsSchema = z.record(z.string(), z.string());

// Helper function to get timezone label
const getTimezoneLabel = (value: string): string => {
    const timezoneLabels: Record<string, string> = {
        "Asia/Ho_Chi_Minh": "Việt Nam (GMT+7)",
        "Asia/Bangkok": "Thái Lan (GMT+7)",
        "Asia/Singapore": "Singapore (GMT+8)",
        "Asia/Hong_Kong": "Hồng Kông (GMT+8)",
        "Asia/Shanghai": "Trung Quốc (GMT+8)",
        "Asia/Tokyo": "Nhật Bản (GMT+9)",
        "Asia/Seoul": "Hàn Quốc (GMT+9)",
        "Asia/Jakarta": "Indonesia (GMT+7)",
        "Asia/Manila": "Philippines (GMT+8)",
        "Asia/Kuala_Lumpur": "Malaysia (GMT+8)",
        "Asia/Dubai": "UAE (GMT+4)",
        "Asia/Kolkata": "Ấn Độ (GMT+5:30)",
        "Asia/Karachi": "Pakistan (GMT+5)",
        "Europe/London": "Anh (GMT+0)",
        "Europe/Paris": "Pháp (GMT+1)",
        "Europe/Berlin": "Đức (GMT+1)",
        "Europe/Moscow": "Nga (GMT+3)",
        "America/New_York": "Mỹ - New York (GMT-5)",
        "America/Los_Angeles": "Mỹ - Los Angeles (GMT-8)",
        "America/Chicago": "Mỹ - Chicago (GMT-6)",
        "America/Denver": "Mỹ - Denver (GMT-7)",
        "America/Toronto": "Canada - Toronto (GMT-5)",
        "America/Vancouver": "Canada - Vancouver (GMT-8)",
        "Australia/Sydney": "Úc - Sydney (GMT+11)",
        "Australia/Melbourne": "Úc - Melbourne (GMT+11)",
        "Pacific/Auckland": "New Zealand (GMT+13)",
        "UTC": "UTC (GMT+0)",
    };
    return timezoneLabels[value] || value;
};

export async function updateSystemSettings(data: Record<string, string>) {
    const session = await requirePermission(Permission.SETTINGS_SYSTEM);
    const validated = updateSettingsSchema.parse(data);

    const oldSettings = await prisma.systemSetting.findMany();
    const oldMap: Record<string, string> = {};
    for (const s of oldSettings) {
        oldMap[s.key] = s.value;
    }

    // Check if timezone changed
    const oldTimezone = oldMap["system.timezone"] ?? DEFAULT_SETTINGS["system.timezone"].value;
    const newTimezone = validated["system.timezone"];
    const timezoneChanged = oldTimezone !== newTimezone;

    // Upsert each setting
    for (const [key, value] of Object.entries(validated)) {
        const group = DEFAULT_SETTINGS[key]?.group ?? "general";
        await prisma.systemSetting.upsert({
            where: { key },
            create: { key, value, group },
            update: { value },
        });
    }

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "SystemSetting",
            oldData: oldMap,
            newData: validated,
        },
    });

    // Create notification for timezone change
    if (timezoneChanged && newTimezone) {
        const { NOTIFICATION_TYPES } = await import("@/lib/types/notification");
        
        // Get timezone labels using helper function
        const oldTimezoneLabel = getTimezoneLabel(oldTimezone);
        const newTimezoneLabel = getTimezoneLabel(newTimezone);

        // Notify all users about timezone change
        const allUsers = await prisma.user.findMany({
            select: { id: true },
        });

        // Create notifications for all users
        const notifications = allUsers.map((user) => ({
            userId: user.id,
            type: NOTIFICATION_TYPES.SETTINGS,
            title: "Múi giờ hệ thống đã thay đổi",
            content: `Múi giờ đã được thay đổi từ "${oldTimezoneLabel}" sang "${newTimezoneLabel}" bởi ${session.user.name}.`,
            link: "/settings/preferences",
            priority: "NORMAL" as const,
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications,
            });
        }
    }

    emitToAll("settings:updated", {
        group: "general",
        changes: validated,
    });

    revalidatePath("/settings");
    return { success: true, timezoneChanged };
}

// ─────────────────────────────────────────────
// ROLES - Vai trò cố định + tùy chỉnh (từ DB)
// ─────────────────────────────────────────────

export async function getRolesAndPermissions() {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    // Lấy tất cả vai trò từ DB
    const dbRoles = await prisma.role.findMany({
        where: { isActive: true },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    const permissions = Object.values(Permission);

    // Map DB roles (cả FIXED và CUSTOM) vào rolePermissionsMap
    const rolePermissionsMap: Record<string, string[]> = {};

    // Thêm fixed roles từ code (để đảm bảo hệ thống luôn có đủ roles)
    const fixedRoles = Object.values(Role) as string[];
    for (const role of fixedRoles) {
        rolePermissionsMap[role] = (
            ROLE_PERMISSIONS[role as Role] ?? []
        ).map((p) => p as string);
    }

    // Thêm custom roles từ DB (đè lên fixed nếu trùng key)
    for (const r of dbRoles) {
        if (r.roleType === "CUSTOM") {
            rolePermissionsMap[r.key] = r.rolePermissions.map(
                (rp) => rp.permissionKey,
            );
        }
    }

    return {
        roles: [...fixedRoles, ...dbRoles.filter((r) => r.roleType === "CUSTOM").map((r) => r.key)],
        permissions,
        rolePermissionsMap,
        dbRoles: dbRoles.map((r) => ({
            id: r.id,
            key: r.key,
            name: r.name,
            description: r.description,
            roleType: r.roleType,
            isActive: r.isActive,
            permissions: r.rolePermissions.map((rp) => rp.permissionKey),
            permissionLabels: r.rolePermissions.map((rp) => rp.permission.label),
            createdBy: r.createdBy,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        })),
    };
}

const updateUserRoleSchema = z.object({
    userId: z.string().min(1),
    newRole: z.nativeEnum(Role),
});

export async function updateUserRole(data: { userId: string; newRole: string }) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);
    const sessionRole = extractRole(session);

    // Only SUPER_ADMIN and IT_ADMIN can manage roles
    if (sessionRole !== Role.SUPER_ADMIN && sessionRole !== Role.IT_ADMIN) {
        throw new Error("FORBIDDEN");
    }

    const validated = updateUserRoleSchema.parse(data);

    // Cannot change own role
    if (validated.userId === session.user.id) {
        throw new Error("Không thể thay đổi vai trò của chính mình");
    }

    const user = await prisma.user.findUnique({
        where: { id: validated.userId },
        select: { id: true, name: true, hrmRole: true },
    });
    if (!user) {
        throw new Error("Không tìm thấy người dùng");
    }

    // Non-SUPER_ADMIN cannot assign SUPER_ADMIN role
    if (sessionRole !== Role.SUPER_ADMIN && validated.newRole === Role.SUPER_ADMIN) {
        throw new Error("Chỉ Super Admin mới có thể gán vai trò Super Admin");
    }

    // Non-SUPER_ADMIN cannot change another SUPER_ADMIN's role
    if (sessionRole !== Role.SUPER_ADMIN && user.hrmRole === Role.SUPER_ADMIN) {
        throw new Error("Không thể thay đổi vai trò của Super Admin");
    }

    const oldRole = user.hrmRole;

    await prisma.user.update({
        where: { id: validated.userId },
        data: { hrmRole: validated.newRole },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "UserRole",
            entityId: validated.userId,
            oldData: { role: oldRole },
            newData: { role: validated.newRole },
        },
    });

    emitToAll("settings:role-updated", {
        userId: validated.userId,
        userName: user.name,
        newRole: validated.newRole,
        updatedBy: session.user.name,
    });

    revalidatePath("/settings/roles");
    return { success: true };
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

export async function getAuditLogs(params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
}) {
    await requirePermission(Permission.SETTINGS_AUDIT_LOG);

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    const where: Record<string, unknown> = {};
    if (params?.userId) {
        where.userId = params.userId;
    }
    if (params?.action) {
        where.action = params.action;
    }
    if (params?.entity) {
        where.entity = params.entity;
    }
    if (params?.startDate || params?.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (params?.startDate) {
            dateFilter.gte = new Date(params.startDate);
        }
        if (params?.endDate) {
            const endDate = new Date(params.endDate);
            endDate.setHours(23, 59, 59, 999);
            dateFilter.lte = endDate;
        }
        where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs: JSON.parse(JSON.stringify(logs)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export async function getAuditLogFilters() {
    await requirePermission(Permission.SETTINGS_AUDIT_LOG);

    const [actions, entities, users] = await Promise.all([
        prisma.auditLog.findMany({
            select: { action: true },
            distinct: ["action"],
            orderBy: { action: "asc" },
        }),
        prisma.auditLog.findMany({
            select: { entity: true },
            distinct: ["entity"],
            orderBy: { entity: "asc" },
        }),
        prisma.auditLog.findMany({
            select: { userId: true, userName: true },
            distinct: ["userId"],
            orderBy: { userName: "asc" },
        }),
    ]);

    return {
        actions: actions.map((a) => a.action),
        entities: entities.map((e) => e.entity),
        users: users.map((u) => ({ id: u.userId, name: u.userName })),
    };
}

// ─────────────────────────────────────────────
// HELPER: Create audit log from other modules
// ─────────────────────────────────────────────

export async function createAuditLog(data: {
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.auditLog.create({
        data: {
            userId: data.userId,
            userName: data.userName,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId ?? null,
            oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : null,
            newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : null,
            ipAddress: data.ipAddress ?? null,
            userAgent: data.userAgent ?? null,
        },
    });
}

// ─────────────────────────────────────────────
// ROLES CRUD (từ DB - cả FIXED và CUSTOM)
// ─────────────────────────────────────────────

export async function getAllRoles() {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const roles = await prisma.role.findMany({
        where: { isActive: true },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
            _count: {
                select: { userAssignments: true },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    return roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        roleType: role.roleType,
        permissions: role.rolePermissions.map((rp) => rp.permissionKey),
        permissionLabels: role.rolePermissions.map((rp) => rp.permission.label),
        userCount: role._count.userAssignments,
        createdBy: role.createdBy,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
    }));
}

export async function getRoleById(id: string) {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const role = await prisma.role.findUnique({
        where: { id },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });

    if (!role) return null;

    return {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        roleType: role.roleType,
        permissions: role.rolePermissions.map((rp) => rp.permissionKey),
        createdBy: role.createdBy,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
    };
}

export async function getRoleByKey(key: string) {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const role = await prisma.role.findUnique({
        where: { key },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });

    if (!role) return null;

    return {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        roleType: role.roleType,
        permissions: role.rolePermissions.map((rp) => rp.permissionKey),
        createdBy: role.createdBy,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
    };
}

const createRoleSchema = z.object({
    name: z
        .string()
        .min(2, "Tên vai trò phải có ít nhất 2 ký tự")
        .max(100, "Tên vai trò không được quá 100 ký tự"),
    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),
    permissions: z
        .array(z.string())
        .min(1, "Phải chọn ít nhất 1 quyền"),
});

export async function createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
}) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);
    const validated = createRoleSchema.parse(data);

    // Tạo key tự động từ tên (slugify)
    const key =
        validated.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "") +
        "_" +
        Date.now().toString(36);

    // Kiểm tra tên không trùng role khác
    const existingByName = await prisma.role.findFirst({
        where: {
            OR: [
                { name: validated.name },
                { key },
            ],
        },
    });
    if (existingByName) {
        throw new Error("Tên hoặc mã vai trò đã tồn tại");
    }

    // Upsert PermissionKey nếu chưa có
    const { getPermissionLabel, getPermissionGroupLabel } = await import(
        "@/lib/rbac/db-permissions"
    );
    await Promise.all(
        validated.permissions.map((permKey) =>
            prisma.permissionKey.upsert({
                where: { key: permKey },
                create: {
                    key: permKey,
                    label: getPermissionLabel(permKey),
                    group: getPermissionGroupLabel(permKey),
                },
                update: {},
            }),
        ),
    );

    const role = await prisma.role.create({
        data: {
            key,
            name: validated.name,
            description: validated.description,
            roleType: "CUSTOM",
            createdBy: session.user.id,
            rolePermissions: {
                create: validated.permissions.map((permKey) => ({
                    permissionKey: permKey,
                })),
            },
        },
        include: {
            rolePermissions: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "CREATE",
            entity: "Role",
            entityId: role.id,
            newData: {
                key: role.key,
                name: role.name,
                description: role.description,
                permissions: validated.permissions,
            },
        },
    });

    emitToAll("settings:custom-role-updated", { action: "create" });
    revalidatePath("/settings/roles");

    return { success: true, id: role.id, key: role.key };
}

const updateRoleSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(2, "Tên vai trò phải có ít nhất 2 ký tự")
        .max(100, "Tên vai trò không được quá 100 ký tự")
        .optional(),
    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),
    permissions: z
        .array(z.string())
        .min(1, "Phải chọn ít nhất 1 quyền")
        .optional(),
    isActive: z.boolean().optional(),
});

export async function updateRole(data: {
    id: string;
    name?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
}) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);
    const validated = updateRoleSchema.parse(data);

    const existing = await prisma.role.findUnique({
        where: { id: validated.id },
        include: { rolePermissions: true },
    });
    if (!existing) {
        throw new Error("Không tìm thấy vai trò");
    }

    // Không cho sửa vai trò cố định
    if (existing.roleType === "FIXED") {
        throw new Error("Không thể chỉnh sửa vai trò cố định");
    }

    const oldData = {
        name: existing.name,
        description: existing.description,
        permissions: existing.rolePermissions.map((rp) => rp.permissionKey),
    };

    // Cập nhật permissions nếu có
    if (validated.permissions) {
        await prisma.rolePermission.deleteMany({
            where: { roleId: validated.id },
        });

        const { getPermissionLabel, getPermissionGroupLabel } = await import(
            "@/lib/rbac/db-permissions"
        );
        await Promise.all(
            validated.permissions.map(async (permKey) => {
                await prisma.permissionKey.upsert({
                    where: { key: permKey },
                    create: {
                        key: permKey,
                        label: getPermissionLabel(permKey),
                        group: getPermissionGroupLabel(permKey),
                    },
                    update: {},
                });

                return prisma.rolePermission.create({
                    data: {
                        roleId: validated.id,
                        permissionKey: permKey,
                    },
                });
            }),
        );
    }

    // Cập nhật thông tin vai trò
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
        updateData.description = validated.description;
    if (validated.isActive !== undefined)
        updateData.isActive = validated.isActive;

    if (Object.keys(updateData).length > 0) {
        await prisma.role.update({
            where: { id: validated.id },
            data: updateData,
        });
    }

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "Role",
            entityId: validated.id,
            oldData,
            newData: validated,
        },
    });

    emitToAll("settings:custom-role-updated", { action: "update", id: validated.id });
    revalidatePath("/settings/roles");

    return { success: true };
}

export async function deleteRole(id: string) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const existing = await prisma.role.findUnique({
        where: { id },
        include: {
            rolePermissions: true,
            _count: { select: { userAssignments: true } },
        },
    });
    if (!existing) {
        throw new Error("Không tìm thấy vai trò");
    }

    // Không cho xóa vai trò cố định
    if (existing.roleType === "FIXED") {
        throw new Error("Không thể xóa vai trò cố định");
    }

    // Không cho xóa nếu đang có người dùng
    if (existing._count.userAssignments > 0) {
        throw new Error(
            `Vai trò đang được gán cho ${existing._count.userAssignments} người dùng. Vui lòng gỡ vai trò trước khi xóa.`,
        );
    }

    await prisma.role.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "DELETE",
            entity: "Role",
            entityId: id,
            oldData: {
                key: existing.key,
                name: existing.name,
                description: existing.description,
                permissions: existing.rolePermissions.map((rp) => rp.permissionKey),
            },
        },
    });

    emitToAll("settings:custom-role-updated", { action: "delete", id });
    revalidatePath("/settings/roles");

    return { success: true };
}

// ─────────────────────────────────────────────
// USER ↔ ROLE ASSIGNMENTS
// ─────────────────────────────────────────────

export async function assignUserRole(data: {
    userId: string;
    roleId: string;
}) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    });
    if (!user) throw new Error("Không tìm thấy người dùng");

    const role = await prisma.role.findUnique({
        where: { id: data.roleId },
    });
    if (!role) throw new Error("Không tìm thấy vai trò");

    await prisma.userCustomRoleAssignment.upsert({
        where: {
            userId_roleId: {
                userId: data.userId,
                roleId: data.roleId,
            },
        },
        create: {
            userId: data.userId,
            roleId: data.roleId,
        },
        update: {},
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "ASSIGN",
            entity: "UserRoleAssignment",
            entityId: data.userId,
            newData: { roleId: data.roleId, roleName: role.name },
        },
    });

    emitToAll("settings:role-assignment-updated", { userId: data.userId });
    revalidatePath("/settings/roles");

    return { success: true };
}

export async function removeUserRole(data: {
    userId: string;
    roleId: string;
}) {
    const session = await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const role = await prisma.role.findUnique({
        where: { id: data.roleId },
    });

    await prisma.userCustomRoleAssignment.deleteMany({
        where: {
            userId: data.userId,
            roleId: data.roleId,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UNASSIGN",
            entity: "UserRoleAssignment",
            entityId: data.userId,
            oldData: { roleId: data.roleId, roleName: role?.name },
        },
    });

    emitToAll("settings:role-assignment-updated", { userId: data.userId });
    revalidatePath("/settings/roles");

    return { success: true };
}

export async function getUserRoles(userId: string) {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const assignments = await prisma.userCustomRoleAssignment.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    return assignments.map((a) => ({
        id: a.role.id,
        key: a.role.key,
        name: a.role.name,
        description: a.role.description,
        roleType: a.role.roleType,
        permissions: a.role.rolePermissions.map((rp) => rp.permissionKey),
        assignedAt: a.assignedAt.toISOString(),
    }));
}

export async function getUsersWithRoles(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
}) {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    const where: Record<string, unknown> = {};
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
        ];
    }
    if (params?.roleId) {
        where.roleAssignments = {
            some: { roleId: params.roleId },
        };
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                hrmRole: true,
                roleAssignments: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: true,
                            },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            hrmRole: u.hrmRole,
            roles: u.roleAssignments.map((a) => ({
                id: a.role.id,
                key: a.role.key,
                name: a.role.name,
                roleType: a.role.roleType,
                permissionCount: a.role.rolePermissions.length,
            })),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

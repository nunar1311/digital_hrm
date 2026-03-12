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

export async function updateSystemSettings(data: Record<string, string>) {
    const session = await requirePermission(Permission.SETTINGS_SYSTEM);
    const validated = updateSettingsSchema.parse(data);

    const oldSettings = await prisma.systemSetting.findMany();
    const oldMap: Record<string, string> = {};
    for (const s of oldSettings) {
        oldMap[s.key] = s.value;
    }

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

    emitToAll("settings:updated", {
        group: "general",
        changes: validated,
    });

    revalidatePath("/settings");
    return { success: true };
}

// ─────────────────────────────────────────────
// ROLES & PERMISSIONS
// ─────────────────────────────────────────────

export async function getRolesAndPermissions() {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const roles = Object.values(Role);
    const permissions = Object.values(Permission);

    const rolePermissionsMap: Record<string, string[]> = {};
    for (const role of roles) {
        rolePermissionsMap[role] = ROLE_PERMISSIONS[role].map((p) => p as string);
    }

    return { roles, permissions, rolePermissionsMap };
}

export async function getUsersWithRoles(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
}) {
    await requirePermission(Permission.SETTINGS_ROLES_MANAGE);

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const search = params?.search?.trim();
    const roleFilter = params?.role;

    const where: Record<string, unknown> = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { employeeCode: { contains: search, mode: "insensitive" } },
        ];
    }
    if (roleFilter) {
        where.hrmRole = roleFilter;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                employeeCode: true,
                hrmRole: true,
                departmentId: true,
                position: true,
            },
            orderBy: { name: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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

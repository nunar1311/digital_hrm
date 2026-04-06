import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Role, Permission } from "@/lib/rbac/permissions";
import {
    hasAnyPermission,
    hasAnyPermissionWithCustom,
    getUserEffectivePermissions,
} from "@/lib/rbac/check-access";
import { prisma } from "@/lib/prisma";

/**
 * Lấy session phía server (Server Components, Route Handlers)
 */
export async function getServerSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session;
}

/**
 * Lấy session, redirect nếu chưa đăng nhập
 */
export async function requireAuth() {
    const session = await getServerSession();
    if (!session) {
        throw new Error("UNAUTHORIZED");
    }
    return session;
}

/**
 * Lấy HRM Role từ session
 */
export function extractRole(session: {
    user: { hrmRole?: string };
}): Role {
    return (session.user.hrmRole as Role) ?? Role.EMPLOYEE;
}

/**
 * Lấy custom permissions của user (từ DB)
 * Chỉ gọi khi cần thiết, không block main permission check
 */
export async function getUserCustomPermissions(
    userId: string,
): Promise<string[]> {
    try {
        const assignments = await prisma.userCustomRoleAssignment.findMany({
            where: { userId },
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                select: { permissionKey: true },
                            },
                        },
                    },
                },
            });

            const perms = new Set<string>();
            for (const a of assignments) {
                for (const rp of a.role.rolePermissions) {
                perms.add(rp.permissionKey);
            }
        }
        return Array.from(perms);
    } catch {
        return [];
    }
}

/**
 * Lấy tất cả effective permissions của user (fixed role + custom roles)
 */
export async function getUserAllPermissions(
    userId: string,
    role: Role,
): Promise<Permission[]> {
    const customPerms = await getUserCustomPermissions(userId);
    return getUserEffectivePermissions(role, customPerms);
}

/**
 * Kiểm tra quyền phía server, throw nếu không có quyền
 */
export async function requirePermission(
    ...permissions: Permission[]
) {
    const session = await requireAuth();
    const role = extractRole(session);

    if (role === Role.SUPER_ADMIN) return session;

    const customPerms = await getUserCustomPermissions(session.user.id);

    if (!hasAnyPermissionWithCustom(role, permissions, customPerms)) {
        throw new Error("FORBIDDEN");
    }

    return session;
}

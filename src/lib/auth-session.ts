import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Role, Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";

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
 * Kiểm tra quyền phía server, throw nếu không có quyền
 */
export async function requirePermission(
    ...permissions: Permission[]
) {
    const session = await requireAuth();
    const role = extractRole(session);

    if (role === Role.SUPER_ADMIN) return session;

    if (!hasAnyPermission(role, permissions)) {
        throw new Error("FORBIDDEN");
    }

    return session;
}

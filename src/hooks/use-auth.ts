"use client";

import { useSession } from "@/lib/auth-client";
import { Role, Permission } from "@/lib/rbac/permissions";
import {
    hasPermission,
    hasAnyPermission,
} from "@/lib/rbac/check-access";

export function useAuth() {
    const { data: session, isPending, error } = useSession();

    const user = session?.user ?? null;
    const role: Role = (user?.hrmRole as Role) ?? Role.EMPLOYEE;
    const isAuthenticated = !!user;

    return {
        user,
        session,
        role,
        isAuthenticated,
        isPending,
        error,

        // Permission helpers
        can: (permission: Permission) =>
            hasPermission(role, permission),
        canAny: (permissions: Permission[]) =>
            hasAnyPermission(role, permissions),

        // Role helpers
        hasRole: (r: Role) => role === r,
        isAdmin: role === Role.SUPER_ADMIN,
        isHR: [Role.HR_MANAGER, Role.HR_STAFF].includes(role),
        isManager: [
            Role.DIRECTOR,
            Role.DEPT_MANAGER,
            Role.HR_MANAGER,
        ].includes(role),
    };
}

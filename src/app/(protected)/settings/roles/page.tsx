import type { Metadata } from "next";
import { requirePermission, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission, Role } from "@/lib/rbac/permissions";
import {
    getRolesAndPermissions,
    getUsersWithRoles,
} from "../preferences/actions";
import { RolesClient } from "./roles-client";

export const metadata: Metadata = {
    title: "Phân quyền vai trò",
};

export default async function RolesPage() {
    const session = await requirePermission(
        Permission.SETTINGS_ROLES_MANAGE,
    );
    const role = extractRole(session);
    const canManage =
        role === Role.SUPER_ADMIN || role === Role.IT_ADMIN;

    const [rolesData, usersData] = await Promise.all([
        getRolesAndPermissions(),
        getUsersWithRoles({ page: 1, pageSize: 5 }),
    ]);

    return (
        <RolesClient
            initialRolesData={rolesData}
            initialUsersData={JSON.parse(JSON.stringify(usersData))}
            canManage={canManage}
            currentUserId={session.user.id}
        />
    );
}

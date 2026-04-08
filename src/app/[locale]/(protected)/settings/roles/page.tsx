import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePermission, extractRole } from "@/lib/auth-session";
import { Permission, Role } from "@/lib/rbac/permissions";
import {
    getRolesAndPermissions,
    getUsersWithRoles,
} from "../preferences/actions";
import { RolesClient } from "./roles-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("settingsRolesMetadataTitle")} | Digital HRM`,
    };
}

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

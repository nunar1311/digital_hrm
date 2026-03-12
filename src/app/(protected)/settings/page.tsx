import type { Metadata } from "next";
import { requirePermission, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { getSystemSettings } from "./actions";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
    title: "Cài đặt hệ thống",
};

export default async function SettingsPage() {
    const session = await requirePermission(Permission.SETTINGS_VIEW);
    const role = extractRole(session);
    const canEdit = hasAnyPermission(role, [
        Permission.SETTINGS_SYSTEM,
    ]);
    const settings = await getSystemSettings();

    return (
        <SettingsClient
            initialSettings={settings}
            canEdit={canEdit}
        />
    );
}

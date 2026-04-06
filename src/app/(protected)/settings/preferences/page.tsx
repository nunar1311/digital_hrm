import { extractRole, requirePermission } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import React from "react";
import { getSystemSettings } from "./actions";
import { SettingsClient } from "./settings-client";

const Page = async () => {
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
};

export default Page;

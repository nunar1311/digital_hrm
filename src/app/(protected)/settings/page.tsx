import type { Metadata } from "next";
import { requirePermission, extractRole } from "@/lib/auth-session";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { getSystemSettings } from "./preferences/actions";
import { SettingsClient } from "./preferences/settings-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Cài đặt hệ thống",
};

export default async function SettingsPage() {
    await requirePermission(Permission.SETTINGS_VIEW);

    return redirect("/settings/preferences");
}

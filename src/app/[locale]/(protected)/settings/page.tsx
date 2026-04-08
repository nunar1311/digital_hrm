import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("settingsMetadataTitle")} | Digital HRM`,
    };
}

export default async function SettingsPage() {
    await requirePermission(Permission.SETTINGS_VIEW);

    return redirect("/settings/preferences");
}

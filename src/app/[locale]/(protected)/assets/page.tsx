import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { AssetsClient } from "./assets-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("assetsMetadataTitle")} | Digital HRM`,
    };
}

export default async function AssetsPage() {
    await requirePermission(
        Permission.ASSET_VIEW_SELF,
        Permission.ASSET_VIEW_ALL,
    );

    return <AssetsClient />;
}

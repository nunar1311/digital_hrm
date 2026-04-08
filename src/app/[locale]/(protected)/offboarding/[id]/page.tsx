import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { getOffboardingById } from "../actions";
import { OffboardingDetailClient } from "../offboarding-detail-client";
import { hasAnyPermission } from "@/lib/rbac/check-access";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("offboardingDetailMetadataTitle")} | Digital HRM`,
        description: t("offboardingDetailMetadataDescription"),
    };
}

export default async function OffboardingDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const session = await requireAuth();
    const role = extractRole(session);
    const { id } = await params;

    const offboarding = await getOffboardingById(id);

    if (!offboarding) {
        notFound();
    }

    const canManage = hasAnyPermission(role, [Permission.OFFBOARDING_MANAGE]);

    return (
        <OffboardingDetailClient
            initialDetail={offboarding}
            canManage={canManage}
        />
    );
}

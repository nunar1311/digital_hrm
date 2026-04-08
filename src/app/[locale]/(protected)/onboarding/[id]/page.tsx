import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("onboardingDetailMetadataTitle")} | Digital HRM`,
    };
}

export default async function OnboardingDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                {t("onboardingDetailTitle", { id })}
            </h1>
            {/* TODO: Onboarding progress, checklist tracking */}
        </div>
    );
}

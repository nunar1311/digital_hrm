import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("performanceMetadataTitle")} | Digital HRM`,
    };
}

export default async function PerformancePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                {t("performanceTitle")}
            </h1>
            {/* TODO: KPI/OKR setup, 360 review, performance cycles */}
        </div>
    );
}

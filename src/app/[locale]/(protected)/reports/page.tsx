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
        title: `${t("reportsMetadataTitle")} | Digital HRM`,
    };
}

export default async function ReportsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                {t("reportsTitle")}
            </h1>
            {/* TODO: HR analytics, turnover, headcount, payroll charts */}
        </div>
    );
}

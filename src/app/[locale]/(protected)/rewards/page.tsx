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
        title: `${t("rewardsMetadataTitle")} | Digital HRM`,
    };
}

export default async function RewardsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                {t("rewardsTitle")}
            </h1>
            {/* TODO: Rewards, discipline management, honor board */}
        </div>
    );
}

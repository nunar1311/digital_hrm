import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PositionsClient from "./positions-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("positionsMetadataTitle")} | Digital HRM`,
    };
}

export default function PositionsPage() {
    return <PositionsClient />;
}

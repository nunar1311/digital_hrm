import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DepartmentsClient } from "./departments-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("departmentsMetadataTitle")} | Digital HRM`,
    };
}

export default async function DepartmentsPage() {
    return <DepartmentsClient />;
}

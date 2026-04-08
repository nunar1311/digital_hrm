import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDepartmentTree } from "./actions";
import { OrgChartView } from "@/components/org-chart/org-chart-view";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("orgChartMetadataTitle")} | Digital HRM`,
    };
}

export default async function OrgChartPage() {
    const data = await getDepartmentTree();

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <OrgChartView data={data} />
        </div>
    );
}

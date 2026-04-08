import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSRequestsClient } from "./requests-client";
import { getMyAdministrativeRequests } from "../actions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("essRequestsMetadataTitle")} | Digital HRM`,
        description: t("essRequestsMetadataDescription"),
    };
}

export default async function ESSRequestsPage() {
    const requests = await getMyAdministrativeRequests();

    return <ESSRequestsClient initialRequests={requests} />;
}

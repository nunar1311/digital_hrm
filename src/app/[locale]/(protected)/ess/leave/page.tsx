import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSLeaveClient } from "./leave-client";
import { getMyLeaveBalances, getMyLeaveRequests } from "./actions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("essLeaveMetadataTitle")} | Digital HRM`,
        description: t("essLeaveMetadataDescription"),
    };
}

export default async function ESSLeavePage() {
    const [balancesData, requestsData] = await Promise.all([
        getMyLeaveBalances(),
        getMyLeaveRequests({ pageSize: 10 }),
    ]);

    return (
        <ESSLeaveClient
            initialBalances={balancesData}
            initialRequests={requestsData}
        />
    );
}

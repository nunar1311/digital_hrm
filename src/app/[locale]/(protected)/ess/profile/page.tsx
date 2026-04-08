import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSProfileClient } from "./profile-client";
import { getEmployeeProfile } from "../actions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("essProfileMetadataTitle")} | Digital HRM`,
        description: t("essProfileMetadataDescription"),
    };
}

export default async function ESSProfilePage() {
    const profile = await getEmployeeProfile();

    return <ESSProfileClient initialProfile={profile} />;
}

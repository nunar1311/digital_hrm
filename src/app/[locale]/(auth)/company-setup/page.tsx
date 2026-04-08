import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CompanySetupForm } from "./company-setup-form";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth" });

    return {
        title: `${t("companySetupMetadataTitle")} | Digital HRM`,
    };
}

export default function CompanySetupPage() {
    return (
        <div className="mx-auto flex h-screen w-3xl items-center justify-center">
            <CompanySetupForm />
        </div>
    );
}

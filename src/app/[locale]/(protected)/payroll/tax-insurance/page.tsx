import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayrollConfigs } from "../actions";
import TaxInsuranceClient from "./tax-insurance-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("payrollTaxInsuranceMetadataTitle")} | Digital HRM`,
        description: t("payrollTaxInsuranceMetadataDescription"),
    };
}

export default async function TaxInsurancePage() {
    const configs = await getPayrollConfigs();
    return <TaxInsuranceClient initialData={configs} />;
}

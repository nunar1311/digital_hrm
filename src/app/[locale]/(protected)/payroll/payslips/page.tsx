import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayslips } from "../actions";
import PayslipsClient from "./payslips-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("payrollPayslipsMetadataTitle")} | Digital HRM`,
        description: t("payrollPayslipsMetadataDescription"),
    };
}

export default async function PayslipsPage() {
    const payslips = await getPayslips({});

    return <PayslipsClient initialData={payslips} />;
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayrollRecords, getDepartmentsForPayroll } from "./actions";
import PayrollClient from "./payroll-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("payrollMetadataTitle")} | Digital HRM`,
        description: t("payrollMetadataDescription"),
    };
}

export default async function PayrollPage() {
    const [records, departments] = await Promise.all([
        getPayrollRecords(),
        getDepartmentsForPayroll(),
    ]);

    return (
        <PayrollClient
            initialRecords={records}
            departments={departments}
        />
    );
}

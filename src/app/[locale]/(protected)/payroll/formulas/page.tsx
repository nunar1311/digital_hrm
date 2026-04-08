import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllSalaryComponentTypes } from "../actions";
import FormulasClient from "./formulas-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ProtectedPages" });

    return {
        title: `${t("payrollFormulasMetadataTitle")} | Digital HRM`,
        description: t("payrollFormulasMetadataDescription"),
    };
}

export default async function FormulasPage() {
    const componentTypes = await getAllSalaryComponentTypes();

    return <FormulasClient initialData={componentTypes} />;
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayrollRecord } from "@/app/[locale]/(protected)/payroll/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProtectedPages" });

  return {
    title: `${t("payrollDetailMetadataTitle")} | Digital HRM`,
    description: t("payrollDetailMetadataDescription"),
  };
}

interface PayrollDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PayrollDetailPage({
  params,
}: PayrollDetailPageProps) {
  const { id } = await params;

  const record = await getPayrollRecord(id);

  if (!record) {
    notFound();
  }

  return <div></div>;
}


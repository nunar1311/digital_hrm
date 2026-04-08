import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ESSClient } from "./ess/ess-client";
import { getESSDashboardData } from "./ess/actions";
import { requireAuth } from "@/lib/auth-session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProtectedPages" });

  return {
    title: `${t("employeePortalMetadataTitle")} | Digital HRM`,
    description: t("employeePortalMetadataDescription"),
  };
}

export default async function HomePage() {
  await requireAuth();

  const dashboardData = await getESSDashboardData();

  return <ESSClient initialData={JSON.parse(JSON.stringify(dashboardData))} />;
}

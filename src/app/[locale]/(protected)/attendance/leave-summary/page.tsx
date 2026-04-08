import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LeaveSummaryClient } from "./leave-summary-client";
import { getLeaveBalances } from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProtectedPages" });

  return {
    title: `${t("attendanceLeaveSummaryMetadataTitle")} | Digital HRM`,
    description: t("attendanceLeaveSummaryMetadataDescription"),
  };
}

export default async function LeaveSummaryPage() {
  await requirePermission(Permission.LEAVE_VIEW_ALL);

  const balancesData = await getLeaveBalances({
    year: new Date().getFullYear(),
  });

  return (
    <LeaveSummaryClient
      initialData={JSON.parse(JSON.stringify(balancesData))}
    />
  );
}

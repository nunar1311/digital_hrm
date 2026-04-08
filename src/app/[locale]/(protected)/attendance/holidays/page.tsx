import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HolidaysClient from "./holidays-client";
import { getHolidayCalendars } from "./actions";
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
    title: `${t("holidaysMetadataTitle")} | Digital HRM`,
    description: t("holidaysMetadataDescription"),
  };
}

export default async function HolidaysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProtectedPages" });

  await requirePermission(Permission.HOLIDAY_VIEW);

  const calendars = await getHolidayCalendars();

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        <div className="shrink-0 flex items-center justify-between h-10 p-2 border-b">
          <h1 className="font-bold">{t("holidaysTitle")}</h1>
        </div>
        <HolidaysClient initialData={calendars} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ESSClient } from "./ess/ess-client";
import { getESSDashboardData } from "./ess/actions";
import { requireAuth } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Cổng nhân viên",
  description: "Cổng thông tin cho nhân viên",
};

export default async function HomePage() {
  await requireAuth();

  const dashboardData = await getESSDashboardData();

  return <ESSClient initialData={JSON.parse(JSON.stringify(dashboardData))} />;
}

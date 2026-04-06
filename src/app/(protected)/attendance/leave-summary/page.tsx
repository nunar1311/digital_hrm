import { Metadata } from "next";
import { LeaveSummaryClient } from "./leave-summary-client";
import { getLeaveBalances } from "./actions";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "Tổng hợp số dư | Digital HRM",
  description: "Tổng hợp số dư ngày nghỉ của nhân viên",
};

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

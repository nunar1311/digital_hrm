import type { Metadata } from "next";
import { extractRole, requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { OffboardingClient } from "./offboarding-client";
import { getOffboardings, getOffboardingStats } from "./actions";

export const metadata: Metadata = {
  title: "Thôi việc | Digital HRM",
  description: "Quản lý quy trình offboarding, bàn giao và chốt nghỉ việc",
};

export default async function OffboardingPage() {
  const session = await requirePermission(Permission.OFFBOARDING_VIEW);
  const role = extractRole(session);

  const [offboardings, stats] = await Promise.all([
    getOffboardings(),
    getOffboardingStats(),
  ]);

  const canManage = hasAnyPermission(role, [Permission.OFFBOARDING_MANAGE]);

  return (
    <OffboardingClient
      initialOffboardings={JSON.parse(JSON.stringify(offboardings))}
      initialStats={stats}
      canManage={canManage}
    />
  );
}

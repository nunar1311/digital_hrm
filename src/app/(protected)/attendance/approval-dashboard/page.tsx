import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import { ApproverDashboardClient } from "./approver-dashboard-client";
import { extractRole, requireAuth } from "@/lib/auth-session";

export default async function ApproverDashboardPage() {
  const session = await requireAuth();

  const canApprove = hasPermission(
    extractRole(session),
    Permission.ATTENDANCE_APPROVAL_APPROVE,
  );

  if (!canApprove) {
    redirect("/attendance");
  }

  return <ApproverDashboardClient currentUserId={session.user.id} />;
}

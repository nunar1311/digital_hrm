import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { LeaveApprovalSetupClient } from "./leave-approval-setup-client";

export default async function LeaveApprovalSetupPage() {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <LeaveApprovalSetupClient />
      </div>
    </div>
  );
}

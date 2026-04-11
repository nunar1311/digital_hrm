import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { LeavePolicyClient } from "./leave-policy-client";

export default async function LeavePolicyPage() {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <LeavePolicyClient />
      </div>
    </div>
  );
}

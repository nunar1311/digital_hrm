import { extractRole, requireAuth } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { getDepartmentsForFilter } from "./actions";
import { TeamCalendarClient } from "./team-calendar-client";
import { hasPermission } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";

const ALLOWED_ROLES = [
  "DEPT_MANAGER",
  "TEAM_LEADER",
  "HR_MANAGER",
  "HR_STAFF",
  "SUPER_ADMIN",
  "DIRECTOR",
];

export default async function TeamCalendarPage() {
  const session = await requireAuth();
  const userRole = (session.user as { hrmRole?: string }).hrmRole ?? "";
  const userDepartmentId =
    (session.user as { departmentId?: string }).departmentId ?? null;

  const canApprove = hasPermission(
    extractRole(session),
    Permission.ATTENDANCE_APPROVAL_APPROVE,
  );

  if (!canApprove) {
    redirect("/");
  }

  const departments = await getDepartmentsForFilter();

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <TeamCalendarClient
          initialDepartments={departments}
          userRole={userRole}
          userDepartmentId={userDepartmentId}
        />
      </div>
    </div>
  );
}

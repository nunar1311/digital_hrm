import type { Metadata } from "next";
import { requirePermission, extractRole } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { FlightRiskClient } from "./flight-risk-client";
import { getDepartmentList } from "./actions";

export const metadata: Metadata = {
  title: "Phát hiện nghỉ việc",
  description: "Phát hiện nhân sự có dấu hiệu nghỉ việc bằng thuật toán Sliding Window",
};

export default async function FlightRiskPage() {
  const session = await requirePermission(Permission.ATTENDANCE_VIEW_ALL);
  const role = extractRole(session);
  const canManage = hasAnyPermission(role, [Permission.ATTENDANCE_VIEW_ALL]);
  const departments = await getDepartmentList();

  return (
    <FlightRiskClient
      departments={JSON.parse(JSON.stringify(departments))}
      canManage={canManage}
    />
  );
}

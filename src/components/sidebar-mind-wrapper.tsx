"use client";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";
import SidebarMind from "./sidebar-mind";

export function SidebarMindWrapper() {
  const { canAny } = useAuth();

  // Chỉ hiển thị sidebar cho người dùng có quyền quản trị HR
  // (HR Manager, HR Staff, Director, Dept Manager, Super Admin, IT Admin)
  // Không hiển thị cho nhân viên thường (EMPLOYEE, TEAM_LEADER)
  const canViewAdminSidebar = canAny([
    Permission.DASHBOARD_VIEW,
    Permission.EMPLOYEE_VIEW_ALL,
    Permission.DEPT_VIEW,
    Permission.ATTENDANCE_VIEW_ALL,
    Permission.SETTINGS_VIEW,
  ]);

  if (!canViewAdminSidebar) {
    return null;
  }

  return <SidebarMind />;
}

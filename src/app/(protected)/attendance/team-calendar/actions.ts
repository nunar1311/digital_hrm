"use server";

import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export interface TeamLeaveEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  username: string | null;
  departmentId: string | null;
  departmentName: string | null;
  positionName: string | null;
  leaveTypeName: string;
  leaveTypeIsPaid: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: "PENDING" | "APPROVED";
}

export interface DepartmentOption {
  id: string;
  name: string;
}

// ============================================================
// Lấy lịch nghỉ của team (chỉ APPROVED + PENDING) theo tháng
// ============================================================

export async function getTeamLeaveCalendar(params: {
  year: number;
  month: number; // 1-12
  departmentId?: string;
}): Promise<TeamLeaveEntry[]> {
  const session = await requireAuth();
  const userRole = (session.user as { hrmRole?: string }).hrmRole;

  // Chỉ Manager, HR, Director mới được xem
  const allowedRoles = [
    "DEPT_MANAGER",
    "TEAM_LEADER",
    "HR_MANAGER",
    "HR_STAFF",
    "SUPER_ADMIN",
    "DIRECTOR",
  ];

  if (!allowedRoles.includes(userRole ?? "")) {
    throw new Error("Bạn không có quyền xem lịch team");
  }

  const { year, month, departmentId } = params;
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999); // last millisecond of month

  const where: Record<string, unknown> = {
    status: { in: ["APPROVED", "PENDING"] },
    // Đơn overlap với khoảng thời gian
    startDate: { lte: periodEnd },
    endDate: { gte: periodStart },
  };

  // Role-based: Dept Manager / Team Leader chỉ thấy đơn trong phòng mình
  if (userRole === "DEPT_MANAGER" || userRole === "TEAM_LEADER") {
    const managerDeptId = (session.user as { departmentId?: string })
      .departmentId;
    where.user = { departmentId: managerDeptId };
  } else if (departmentId) {
    where.user = { departmentId };
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          name: true,
          avatar: true,
          username: true,
          department: { select: { id: true, name: true } },
          position: { select: { name: true } },
        },
      },
      leaveType: { select: { name: true, isPaidLeave: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.fullName || r.user.name || "N/A",
    userAvatar: r.user.avatar,
    username: r.user.username,
    departmentId: r.user.department?.id ?? null,
    departmentName: r.user.department?.name ?? null,
    positionName: r.user.position?.name ?? null,
    leaveTypeName: r.leaveType.name,
    leaveTypeIsPaid: r.leaveType.isPaidLeave,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    totalDays: r.totalDays,
    reason: r.reason,
    status: r.status as "PENDING" | "APPROVED",
  }));
}

// ============================================================
// Lấy danh sách phòng ban để filter
// ============================================================

export async function getDepartmentsForFilter(): Promise<DepartmentOption[]> {
  await requireAuth();

  const depts = await prisma.department.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return depts;
}

// ============================================================
// Lấy thống kê: ai đang vắng mặt hôm nay trong team
// ============================================================

export async function getTodayAbsentees(departmentId?: string): Promise<{
  total: number;
  approved: number;
  pending: number;
  employees: Array<{
    userId: string;
    userName: string;
    userAvatar: string | null;
    departmentName: string | null;
    leaveTypeName: string;
    status: "PENDING" | "APPROVED";
    totalDays: number;
  }>;
}> {
  const session = await requireAuth();
  const userRole = (session.user as { hrmRole?: string }).hrmRole;

  const allowedRoles = [
    "DEPT_MANAGER",
    "TEAM_LEADER",
    "HR_MANAGER",
    "HR_STAFF",
    "SUPER_ADMIN",
    "DIRECTOR",
  ];

  if (!allowedRoles.includes(userRole ?? "")) {
    throw new Error("Bạn không có quyền xem lịch team");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    status: { in: ["APPROVED", "PENDING"] },
    startDate: { lte: todayEnd },
    endDate: { gte: today },
  };

  if (userRole === "DEPT_MANAGER" || userRole === "TEAM_LEADER") {
    const managerDeptId = (session.user as { departmentId?: string })
      .departmentId;
    where.user = { departmentId: managerDeptId };
  } else if (departmentId) {
    where.user = { departmentId };
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          name: true,
          avatar: true,
          department: { select: { name: true } },
        },
      },
      leaveType: { select: { name: true } },
    },
  });

  const employees = requests.map((r) => ({
    userId: r.userId,
    userName: r.user.fullName || r.user.name || "N/A",
    userAvatar: r.user.avatar,
    departmentName: r.user.department?.name ?? null,
    leaveTypeName: r.leaveType.name,
    status: r.status as "PENDING" | "APPROVED",
    totalDays: r.totalDays,
  }));

  return {
    total: employees.length,
    approved: employees.filter((e) => e.status === "APPROVED").length,
    pending: employees.filter((e) => e.status === "PENDING").length,
    employees,
  };
}

"use server";

import { requirePermission, requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ApprovalStep } from "../approval-process/types";
import { emitToAll } from "@/lib/socket/server";
import { SOCKET_EVENTS } from "@/lib/socket/types";


// ─── Types for approval chain state ───────────────────────────────────────────

export interface ApprovalStepRecord {
  stepOrder: number;
  stepType: "APPROVER" | "CONDITION";
  approverType?: string; // "DIRECT_MANAGER" | "MANAGER_LEVEL" | "DEPT_HEAD" | "CUSTOM_LIST"
  approverIds?: string[];
  approverNames?: string[];
  approvalMethod?: "ALL_MUST_APPROVE" | "FIRST_APPROVES";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  actedBy?: string;
  actedByName?: string;
  actedAt?: string;
  comment?: string;
}

export interface LeaveApprovalProcessData {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  skipDuplicateApprover: boolean;
  skipSelfApprover: boolean;
  sendEmailReminder: boolean;
  steps: ApprovalStep[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── CRUD: LeaveApprovalProcess ────────────────────────────────────────────────

export async function getLeaveApprovalProcesses(): Promise<
  LeaveApprovalProcessData[]
> {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  const processes = await prisma.leaveApprovalProcess.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return processes.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isActive: p.isActive,
    isDefault: p.isDefault,
    skipDuplicateApprover: p.skipDuplicateApprover,
    skipSelfApprover: p.skipSelfApprover,
    sendEmailReminder: p.sendEmailReminder,
    steps: (p.steps as ApprovalStep[] | null) ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function createLeaveApprovalProcess(data: {
  name: string;
  description?: string;
  isDefault?: boolean;
  skipDuplicateApprover?: boolean;
  skipSelfApprover?: boolean;
  steps?: ApprovalStep[];
}): Promise<LeaveApprovalProcessData> {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  // Nếu set isDefault, bỏ default của process khác
  if (data.isDefault) {
    await prisma.leaveApprovalProcess.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const process = await prisma.leaveApprovalProcess.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      isDefault: data.isDefault ?? false,
      skipDuplicateApprover: data.skipDuplicateApprover ?? true,
      skipSelfApprover: data.skipSelfApprover ?? true,
      steps: data.steps ? JSON.parse(JSON.stringify(data.steps)) : null,
    },
  });

  revalidatePath("/attendance/leave-approval-setup");
  return {
    id: process.id,
    name: process.name,
    description: process.description,
    isActive: process.isActive,
    isDefault: process.isDefault,
    skipDuplicateApprover: process.skipDuplicateApprover,
    skipSelfApprover: process.skipSelfApprover,
    sendEmailReminder: process.sendEmailReminder,
    steps: (process.steps as ApprovalStep[] | null) ?? null,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
  };
}

export async function updateLeaveApprovalProcess(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    isDefault?: boolean;
    skipDuplicateApprover?: boolean;
    skipSelfApprover?: boolean;
    sendEmailReminder?: boolean;
    steps?: ApprovalStep[];
  }
): Promise<void> {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  if (data.isDefault) {
    await prisma.leaveApprovalProcess.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  await prisma.leaveApprovalProcess.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.skipDuplicateApprover !== undefined && {
        skipDuplicateApprover: data.skipDuplicateApprover,
      }),
      ...(data.skipSelfApprover !== undefined && {
        skipSelfApprover: data.skipSelfApprover,
      }),
      ...(data.sendEmailReminder !== undefined && {
        sendEmailReminder: data.sendEmailReminder,
      }),
      ...(data.steps !== undefined && {
        steps: JSON.parse(JSON.stringify(data.steps)),
      }),
    },
  });

  revalidatePath("/attendance/leave-approval-setup");
}

export async function deleteLeaveApprovalProcess(id: string): Promise<void> {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  // Unlink any leave requests using this process
  await prisma.leaveRequest.updateMany({
    where: { leaveApprovalProcessId: id },
    data: { leaveApprovalProcessId: null },
  });

  await prisma.leaveApprovalProcess.delete({ where: { id } });
  revalidatePath("/attendance/leave-approval-setup");
}

// ─── Helper: Resolve approvers for a step ─────────────────────────────────────

async function resolveApprovers(
  step: ApprovalStep,
  userId: string,
  skipSelf: boolean
): Promise<{ id: string; fullName: string | null; name: string }[]> {
  if (step.stepType !== "APPROVER") return [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { managerId: true, departmentId: true },
  });

  switch (step.approverType) {
    case "DIRECT_MANAGER": {
      if (!user?.managerId) return [];
      const manager = await prisma.user.findUnique({
        where: { id: user.managerId },
        select: { id: true, fullName: true, name: true },
      });
      if (!manager) return [];
      if (skipSelf && manager.id === userId) return [];
      return [manager];
    }

    case "DEPT_HEAD": {
      if (!user?.departmentId) return [];
      const dept = await prisma.department.findUnique({
        where: { id: user.departmentId },
        select: { managerId: true },
      });
      if (!dept?.managerId) return [];
      const head = await prisma.user.findUnique({
        where: { id: dept.managerId },
        select: { id: true, fullName: true, name: true },
      });
      if (!head) return [];
      if (skipSelf && head.id === userId) return [];
      return [head];
    }

    case "CUSTOM_LIST": {
      if (!step.customApproverIds?.length) return [];
      const approvers = await prisma.user.findMany({
        where: { id: { in: step.customApproverIds } },
        select: { id: true, fullName: true, name: true },
      });
      if (skipSelf) return approvers.filter((a) => a.id !== userId);
      return approvers;
    }

    default:
      return [];
  }
}

// ─── Helper: Xoá ca làm việc vào ngày nghỉ ────────────────────────────────────

async function handleOverlappingShifts(
  tx: any, // Prisma.TransactionClient
  userId: string,
  leaveStartRaw: Date | string,
  leaveEndRaw: Date | string
) {
  const leaveStart = new Date(leaveStartRaw);
  leaveStart.setHours(0, 0, 0, 0);
  const leaveEnd = new Date(leaveEndRaw);
  leaveEnd.setHours(23, 59, 59, 999);

  const overlaps = await tx.shiftAssignment.findMany({
    where: {
      userId,
      startDate: { lte: leaveEnd },
      OR: [{ endDate: null }, { endDate: { gte: leaveStart } }],
    },
  });

  for (const a of overlaps) {
    const aStart = new Date(a.startDate);
    aStart.setHours(0, 0, 0, 0);
    const aEnd = a.endDate ? new Date(a.endDate) : null;
    if (aEnd) aEnd.setHours(23, 59, 59, 999);

    // Case 1: Lịch làm việc nằm gọn TRONG khoảng nghỉ -> Xoá
    if (aStart >= leaveStart && aEnd !== null && aEnd <= leaveEnd) {
      await tx.shiftAssignment.delete({ where: { id: a.id } });
    }
    // Case 2: Lịch bao trùm cả khoảng nghỉ -> Tách thành 2 khoảng lịch
    else if (aStart < leaveStart && (aEnd === null || aEnd > leaveEnd)) {
      const newEnd1 = new Date(leaveStart);
      newEnd1.setDate(newEnd1.getDate() - 1);
      
      await tx.shiftAssignment.update({
        where: { id: a.id },
        data: { endDate: newEnd1 },
      });

      const newStart2 = new Date(leaveEnd);
      newStart2.setDate(newStart2.getDate() + 1);
      
      await tx.shiftAssignment.create({
        data: {
          userId,
          shiftId: a.shiftId,
          startDate: newStart2,
          endDate: a.endDate,
          workCycleId: a.workCycleId,
          cycleStartDate: a.cycleStartDate,
        },
      });
    }
    // Case 3: Lịch bắt đầu TRƯỚC ngày nghỉ và kết thúc TRONG ngày nghỉ -> Rút ngắn ngày kết thúc
    else if (aStart < leaveStart && aEnd !== null && aEnd <= leaveEnd) {
      const newEnd1 = new Date(leaveStart);
      newEnd1.setDate(newEnd1.getDate() - 1);
      await tx.shiftAssignment.update({
        where: { id: a.id },
        data: { endDate: newEnd1 },
      });
    }
    // Case 4: Lịch bắt đầu TRONG ngày nghỉ và kết thúc SAU ngày nghỉ -> Dời ngày bắt đầu
    else if (aStart >= leaveStart && (aEnd === null || aEnd > leaveEnd)) {
      const newStart2 = new Date(leaveEnd);
      newStart2.setDate(newStart2.getDate() + 1);
      await tx.shiftAssignment.update({
        where: { id: a.id },
        data: { startDate: newStart2 },
      });
    }
  }
}

// ─── Multi-step approveLeaveRequest ──────────────────────────────────────────

export async function approveLeaveRequestMultiStep(requestId: string): Promise<{
  success: boolean;
  message: string;
  isFullyApproved: boolean;
  nextStep?: number;
}> {
  const session = await requireAuth();
  const userRole = session.user.hrmRole;

  if (
    userRole === "DEPT_MANAGER" ||
    userRole === "TEAM_LEADER"
  ) {
    await requirePermission(Permission.LEAVE_APPROVE_TEAM);
  } else if (
    userRole === "HR_MANAGER" ||
    userRole === "HR_STAFF" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "DIRECTOR"
  ) {
    await requirePermission(Permission.LEAVE_APPROVE_ALL);
  } else {
    throw new Error("Bạn không có quyền duyệt đơn nghỉ phép");
  }

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, departmentId: true, managerId: true } },
      leaveBalance: true,
      leaveApprovalProcess: true,
    },
  });

  if (!request) throw new Error("Không tìm thấy đơn nghỉ phép");
  if (request.status !== "PENDING")
    throw new Error("Đơn không ở trạng thái chờ duyệt");

  const currentUserId = session.user.id;
  const approverName =
    (session.user as { fullName?: string }).fullName ||
    session.user.name ||
    "N/A";

  // ── Case 1: Không có quy trình đa cấp → duyệt ngay ──────────────────────
  if (!request.leaveApprovalProcess) {
    // Role-based dept check
    if (userRole === "DEPT_MANAGER" || userRole === "TEAM_LEADER") {
      const managerDeptId = (session.user as { departmentId?: string })
        .departmentId;
      if (request.user.departmentId !== managerDeptId) {
        throw new Error("Bạn không có quyền duyệt đơn này");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (request.leaveBalanceId && request.leaveBalance) {
        await tx.leaveBalance.update({
          where: { id: request.leaveBalanceId },
          data: {
            pendingDays: { decrement: request.totalDays },
            usedDays: { increment: request.totalDays },
          },
        });
      }

      await handleOverlappingShifts(tx, request.userId, request.startDate, request.endDate);

      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedBy: currentUserId,
          approvedAt: new Date(),
        },
      });
    });

    revalidatePath("/attendance/leave-requests");
    revalidatePath("/ess/leave");
    return { success: true, message: "Đã duyệt đơn nghỉ phép", isFullyApproved: true };
  }

  // ── Case 2: Có quy trình đa cấp ──────────────────────────────────────────
  const process = request.leaveApprovalProcess;
  const steps = (process.steps as ApprovalStep[] | null) ?? [];

  // Init approvalChain nếu chưa có
  let chain: ApprovalStepRecord[] = [];

  if (
    !request.approvalChain ||
    ((request.approvalChain as unknown) as ApprovalStepRecord[]).length === 0
  ) {
    // Build chain from process steps
    chain = await Promise.all(
      steps
        .filter((s) => s.stepType === "APPROVER")
        .map(async (s, idx) => {
          const resolvedApprovers = await resolveApprovers(
            s,
            request.userId,
            process.skipSelfApprover
          );
          return {
            stepOrder: idx + 1,
            stepType: "APPROVER" as const,
            approverType: s.approverType,
            approverIds: resolvedApprovers.map((a) => a.id),
            approverNames: resolvedApprovers.map(
              (a) => a.fullName || a.name
            ),
            approvalMethod: s.approvalMethod ?? "FIRST_APPROVES",
            status: "PENDING" as const,
          };
        })
    );
  } else {
    chain = (request.approvalChain as unknown) as ApprovalStepRecord[];
  }

  const stepIndex = request.currentStep; // 0-based index into chain
  const currentStepRecord = chain[stepIndex];

  if (!currentStepRecord) {
    throw new Error("Không tìm thấy bước duyệt hiện tại");
  }

  // Check user is authorized to act on this step
  if (
    currentStepRecord.approverIds &&
    currentStepRecord.approverIds.length > 0 &&
    !currentStepRecord.approverIds.includes(currentUserId)
  ) {
    // Allow HR/Director/SuperAdmin to bypass
    if (
      userRole !== "HR_MANAGER" &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "DIRECTOR"
    ) {
      throw new Error(
        `Bạn không phải người duyệt ở bước ${stepIndex + 1}. Người duyệt là: ${currentStepRecord.approverNames?.join(", ") ?? "N/A"}`
      );
    }
  }

  // Mark current step as APPROVED
  chain[stepIndex] = {
    ...currentStepRecord,
    status: "APPROVED",
    actedBy: currentUserId,
    actedByName: approverName,
    actedAt: new Date().toISOString(),
  };

  const nextStepIndex = stepIndex + 1;
  const isLastStep = nextStepIndex >= chain.length;

  await prisma.$transaction(async (tx) => {
    if (isLastStep) {
      // Fully approved
      if (request.leaveBalanceId && request.leaveBalance) {
        await tx.leaveBalance.update({
          where: { id: request.leaveBalanceId },
          data: {
            pendingDays: { decrement: request.totalDays },
            usedDays: { increment: request.totalDays },
          },
        });
      }

      await handleOverlappingShifts(tx, request.userId, request.startDate, request.endDate);

      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedBy: currentUserId,
          approvedAt: new Date(),
          approvalChain: JSON.parse(JSON.stringify(chain)),
          currentStep: nextStepIndex,
        },
      });
    } else {
      // Advance to next step
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          approvalChain: JSON.parse(JSON.stringify(chain)),
          currentStep: nextStepIndex,
        },
      });
    }
  });

  revalidatePath("/attendance/leave-requests");
  revalidatePath("/ess/leave");
  revalidatePath("/attendance/leave-summary");

  // Phát sự kiện để cập nhật Client
  emitToAll(SOCKET_EVENTS.DATA_UPDATED, {
    entity: "leave-request",
    action: isLastStep ? "approve-fully" : "approve-step",
    data: { id: requestId },
  });

  if (isLastStep) {
    return {
      success: true,
      message: "Đã duyệt đơn nghỉ phép (hoàn tất tất cả các bước)",
      isFullyApproved: true,
    };
  }

  return {
    success: true,
    message: `Đã duyệt bước ${stepIndex + 1}/${chain.length}. Chờ bước tiếp theo.`,
    isFullyApproved: false,
    nextStep: nextStepIndex + 1,
  };
}

// ─── Reject with chain update ─────────────────────────────────────────────────

export async function rejectLeaveRequestMultiStep(
  requestId: string,
  data: { reason: string }
): Promise<{ success: boolean; message: string }> {
  if (!data.reason?.trim()) throw new Error("Phải nhập lý do từ chối");

  const session = await requireAuth();
  const userRole = session.user.hrmRole;

  if (
    userRole === "DEPT_MANAGER" ||
    userRole === "TEAM_LEADER"
  ) {
    await requirePermission(Permission.LEAVE_APPROVE_TEAM);
  } else if (
    userRole === "HR_MANAGER" ||
    userRole === "HR_STAFF" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "DIRECTOR"
  ) {
    await requirePermission(Permission.LEAVE_APPROVE_ALL);
  } else {
    throw new Error("Bạn không có quyền từ chối đơn nghỉ phép");
  }

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { departmentId: true } },
    },
  });

  if (!request) throw new Error("Không tìm thấy đơn nghỉ phép");
  if (request.status !== "PENDING")
    throw new Error("Đơn không ở trạng thái chờ duyệt");

  const currentUserId = session.user.id;
  const approverName =
    (session.user as { fullName?: string }).fullName ||
    session.user.name ||
    "N/A";

  let chain = ((request.approvalChain as unknown) as ApprovalStepRecord[] | null) ?? [];
  const stepIndex = request.currentStep;

  if (chain.length > 0 && stepIndex < chain.length) {
    chain[stepIndex] = {
      ...chain[stepIndex],
      status: "REJECTED",
      actedBy: currentUserId,
      actedByName: approverName,
      actedAt: new Date().toISOString(),
      comment: data.reason,
    };
  }

  const currentYear = new Date().getFullYear();

  await prisma.$transaction(async (tx) => {
    if (request.leaveBalanceId) {
      await tx.leaveBalance.update({
        where: {
          userId_leaveTypeId_policyYear: {
            userId: request.userId,
            leaveTypeId: request.leaveTypeId,
            policyYear: currentYear,
          },
        },
        data: { pendingDays: { decrement: request.totalDays } },
      });
    }

    await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedBy: currentUserId,
        approvedAt: new Date(),
        rejectionReason: data.reason,
        ...(chain.length > 0 && {
          approvalChain: JSON.parse(JSON.stringify(chain)),
        }),
      },
    });
  });

  revalidatePath("/attendance/leave-requests");
  revalidatePath("/ess/leave");
  revalidatePath("/attendance/leave-summary");

  // Phát sự kiện để cập nhật Client
  emitToAll(SOCKET_EVENTS.DATA_UPDATED, {
    entity: "leave-request",
    action: "reject",
    data: { id: requestId },
  });

  return { success: true, message: "Đã từ chối đơn nghỉ phép" };
}

// ─── Auto-assign approval process to new leave requests ──────────────────────

export async function initApprovalChainForRequest(
  requestId: string
): Promise<void> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true } } },
  });
  if (!request || request.approvalChain) return;

  // Find default process
  const defaultProcess = await prisma.leaveApprovalProcess.findFirst({
    where: { isDefault: true, isActive: true },
  });
  if (!defaultProcess) return;

  const steps = (defaultProcess.steps as ApprovalStep[] | null) ?? [];
  const chain: ApprovalStepRecord[] = await Promise.all(
    steps
      .filter((s) => s.stepType === "APPROVER")
      .map(async (s, idx) => {
        const resolvedApprovers = await resolveApprovers(
          s,
          request.userId,
          defaultProcess.skipSelfApprover
        );
        return {
          stepOrder: idx + 1,
          stepType: "APPROVER" as const,
          approverType: s.approverType,
          approverIds: resolvedApprovers.map((a) => a.id),
          approverNames: resolvedApprovers.map((a) => a.fullName || a.name),
          approvalMethod: s.approvalMethod ?? "FIRST_APPROVES",
          status: "PENDING" as const,
        };
      })
  );

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      leaveApprovalProcessId: defaultProcess.id,
      approvalChain: JSON.parse(JSON.stringify(chain)),
      currentStep: 0,
    },
  });
}

// ─── Get users for approver selection ─────────────────────────────────────────

export async function getUsersForApproverSelection() {
  await requirePermission(Permission.LEAVE_POLICY_MANAGE);

  return prisma.user.findMany({
    where: { employeeStatus: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
      avatar: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });
}

"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { sendTemplatedEmail } from "@/lib/email";
import { createNotification, createNotificationsForUsers } from "@/lib/notification";
import { NOTIFICATION_TYPES } from "@/lib/types/notification";
import { auth } from "@/lib/auth";
import type {
  OnboardingListParams,
  OnboardingWithProgress,
  HireCandidateData,
  CreateOnboardingData,
  UpdateOnboardingData,
  UpdateChecklistData,
  CreateTemplateData,
  CreateTaskData,
  UpdateTemplateData,
} from "@/types/onboarding";
import type { OnboardingPage } from "./types";

// ─── Utility ────────────────────────────────────────────────────────────────

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `EMP-${year}${random}`;
}

function generateSecurePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ─── Onboarding List ────────────────────────────────────────────────────────

export async function getOnboardings(
  params: OnboardingListParams
): Promise<OnboardingPage> {
  await requirePermission(Permission.ONBOARDING_VIEW);

  const {
    search,
    departmentId,
    status,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.OnboardingWhereInput = {};

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  if (departmentId) {
    where.user = { ...((where.user as object) || {}), departmentId };
  }

  if (status) {
    where.status = status;
  }

  const orderBy: Prisma.OnboardingOrderByWithRelationInput = {};
  if (sortBy === "employeeName") {
    orderBy.user = { name: sortOrder };
  } else if (sortBy === "department") {
    orderBy.user = { department: { name: sortOrder } };
  } else if (sortBy === "startDate") {
    orderBy.startDate = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [onboardings, total] = await Promise.all([
    prisma.onboarding.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
          },
        },
        template: {
          select: { id: true, name: true },
        },
        checklist: {
          select: { isCompleted: true },
        },
      },
    }),
    prisma.onboarding.count({ where }),
  ]);

  const data: OnboardingWithProgress[] = onboardings.map((o) => {
    const totalCount = o.checklist.length;
    const completedCount = o.checklist.filter((c) => c.isCompleted).length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return {
      ...o,
      progress,
      completedCount,
      totalCount,
    } as OnboardingWithProgress;
  });

  const items = data.map((o) => ({
    id: o.id,
    userId: o.userId,
    user: o.user,
    startDate: o.startDate instanceof Date ? o.startDate.toISOString() : o.startDate,
    completedDate: o.completedDate instanceof Date ? o.completedDate.toISOString() : o.completedDate,
    status: o.status,
    notes: o.notes,
    progress: o.progress,
    completedCount: o.completedCount,
    totalCount: o.totalCount,
    template: o.template,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Onboarding Detail ──────────────────────────────────────────────────────

export async function getOnboardingDetail(id: string) {
  await requirePermission(Permission.ONBOARDING_VIEW);

  const onboarding = await prisma.onboarding.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          employeeCode: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
      },
      template: {
        include: { tasks: { orderBy: { sortOrder: "asc" } } },
      },
      checklist: {
        orderBy: { dueDate: "asc" },
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
      },
    },
  });

  if (!onboarding) return null;

  const checklistByCategory: Record<string, typeof onboarding.checklist> = {};
  for (const item of onboarding.checklist) {
    if (!checklistByCategory[item.category]) {
      checklistByCategory[item.category] = [];
    }
    checklistByCategory[item.category].push(item);
  }

  const totalCount = onboarding.checklist.length;
  const completedCount = onboarding.checklist.filter((c) => c.isCompleted).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    ...onboarding,
    progress,
    completedCount,
    totalCount,
    checklistByCategory,
  };
}

// ─── Create Onboarding ──────────────────────────────────────────────────────

export async function createOnboarding(data: CreateOnboardingData) {
  const session = await requirePermission(Permission.ONBOARDING_MANAGE);

  // Get default template if not specified
  let templateId = data.templateId;
  if (!templateId) {
    const defaultTemplate = await prisma.onboardingTemplate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    templateId = defaultTemplate?.id;
  }

  // Get template tasks
  const templateTasks = templateId
    ? await prisma.onboardingTask.findMany({
        where: { templateId },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  // Create onboarding with checklist
  const startDate = new Date(data.startDate);

  const onboarding = await prisma.onboarding.create({
    data: {
      userId: data.userId,
      templateId,
      startDate,
      status: "PENDING",
      notes: data.notes,
      createdBy: session.user.id,
      checklist: {
        create: templateTasks.map((task) => ({
          taskTitle: task.title,
          taskDescription: task.description,
          category: task.category,
          assigneeRole: task.assigneeRole,
          dueDate: new Date(startDate.getTime() + task.dueDays * 24 * 60 * 60 * 1000),
          isCompleted: false,
        })),
      },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, employeeCode: true },
      },
      checklist: true,
    },
  });

  // Notify assignee roles
  const assigneeRoleCounts: Record<string, number> = {};
  for (const item of onboarding.checklist) {
    if (item.assigneeRole) {
      assigneeRoleCounts[item.assigneeRole] = (assigneeRoleCounts[item.assigneeRole] || 0) + 1;
    }
  }

  for (const [role, count] of Object.entries(assigneeRoleCounts)) {
    const users = await prisma.user.findMany({
      where: { hrmRole: { in: [role, "HR_MANAGER", "SUPER_ADMIN"] } },
      select: { id: true, email: true },
    });

    await createNotificationsForUsers(users.map((u) => u.id), {
      type: NOTIFICATION_TYPES.ONBOARDING,
      title: "Có nhân viên mới cần tiếp nhận",
      content: `${onboarding.user?.name} (${onboarding.user?.employeeCode}) vừa được thêm vào onboarding. Có ${count} việc cần làm cho vai trò ${role}.`,
      link: `/onboarding`,
      priority: "NORMAL",
    });
  }

  revalidatePath("/onboarding");
  return onboarding;
}

// ─── Update Onboarding ─────────────────────────────────────────────────────

export async function updateOnboarding(id: string, data: UpdateOnboardingData) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  const updateData: Prisma.OnboardingUpdateInput = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "COMPLETED") {
      updateData.completedDate = new Date();
    }
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  const onboarding = await prisma.onboarding.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Notify employee when onboarding completed
  if (data.status === "COMPLETED" && onboarding.user) {
    await createNotification({
      userId: onboarding.user.id,
      type: NOTIFICATION_TYPES.ONBOARDING,
      title: "Hoàn thành tiếp nhận",
      content: `Quá trình tiếp nhận của bạn đã hoàn thành. Chào mừng đến với công ty!`,
      link: `/ess`,
      priority: "NORMAL",
    });
  }

  revalidatePath("/onboarding");
  return onboarding;
}

// ─── Update Checklist Item ─────────────────────────────────────────────────

export async function updateChecklistItem(id: string, data: UpdateChecklistData) {
  await requirePermission(Permission.ONBOARDING_VIEW);

  const session = await requireAuth();

  const updateData: Prisma.OnboardingChecklistUpdateInput = {};
  if (data.isCompleted !== undefined) {
    updateData.isCompleted = data.isCompleted;
    if (data.isCompleted) {
      updateData.completedBy = session.user.id;
      updateData.completedAt = new Date();
    } else {
      updateData.completedBy = Prisma.DbNull;
      updateData.completedAt = Prisma.DbNull;
    }
  }
  if (data.assigneeId !== undefined) {
    updateData.assignee = data.assigneeId ? { connect: { id: data.assigneeId } } : { disconnect: true };
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  const item = await prisma.onboardingChecklist.update({
    where: { id },
    data: updateData,
    include: {
      onboarding: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      assignee: { select: { id: true, name: true } },
    },
  });

  // Check if all required items are completed
  if (data.isCompleted) {
    const allChecklist = await prisma.onboardingChecklist.findMany({
      where: { onboardingId: item.onboardingId },
    });
    const allDone = allChecklist.every((c) => c.isCompleted);
    if (allDone) {
      await prisma.onboarding.update({
        where: { id: item.onboardingId },
        data: { status: "COMPLETED", completedDate: new Date() },
      });
    }
  }

  revalidatePath("/onboarding");
  return item;
}

// ─── Delete Onboarding ──────────────────────────────────────────────────────

export async function deleteOnboarding(id: string) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  await prisma.onboarding.delete({ where: { id } });

  revalidatePath("/onboarding");
  return { success: true };
}

// ─── Hire Candidate ─────────────────────────────────────────────────────────

export async function hireCandidate(data: HireCandidateData) {
  const session = await requirePermission(Permission.RECRUITMENT_MANAGE);

  // Get candidate info
  const candidate = await prisma.candidate.findUnique({
    where: { id: data.candidateId },
    include: { jobPosting: { select: { title: true } } },
  });

  if (!candidate) {
    throw new Error("Không tìm thấy ứng viên");
  }

  if (candidate.stage === "HIRED") {
    throw new Error("Ứng viên đã được tuyển trước đó");
  }

  // Generate credentials
  const employeeCode = generateEmployeeCode();
  const tempPassword = generateSecurePassword();
  const username = `EMP${Date.now().toString().slice(-6)}`;

  // Get department & position info
  const [department, position] = await Promise.all([
    prisma.department.findUnique({ where: { id: data.departmentId } }),
    prisma.position.findUnique({ where: { id: data.positionId } }),
  ]);

  // Create user account via better-auth
  let newUserId: string;
  try {
    const userResult = await auth.api.signUpEmail({
      body: {
        name: candidate.name,
        email: candidate.email,
        password: tempPassword,
        employeeCode,
        departmentId: data.departmentId,
        position: position?.name,
        hrmRole: "EMPLOYEE",
        username,
      },
    });
    newUserId = userResult.user.id;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("email already")) {
      throw new Error("Email đã được sử dụng bởi tài khoản khác");
    }
    throw error;
  }

  // Update candidate to HIRED
  await prisma.candidate.update({
    where: { id: data.candidateId },
    data: {
      stage: "HIRED",
      hiredDate: data.hireDate,
      hiredSalary: data.salary ? new Prisma.Decimal(data.salary) : Prisma.DbNull,
    },
  });

  // Update user with hire info
  await prisma.user.update({
    where: { id: newUserId },
    data: {
      hireDate: data.hireDate,
      employmentType: data.employmentType || "FULL_TIME",
      probationEnd: data.probationEndDate,
      phone: candidate.phone,
      dateOfBirth: candidate.dateOfBirth,
      gender: candidate.gender,
      address: candidate.address,
    },
  });

  // Create salary record if provided
  if (data.salary) {
    await prisma.salary.create({
      data: {
        userId: newUserId,
        baseSalary: new Prisma.Decimal(data.salary),
        effectiveDate: data.hireDate,
      },
    });
  }

  // Get default onboarding template
  const defaultTemplate = await prisma.onboardingTemplate.findFirst({
    where: { isActive: true },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });

  // Create onboarding if requested
  let onboardingId: string | null = null;
  if (data.startOnboarding && defaultTemplate) {
    const onboarding = await prisma.onboarding.create({
      data: {
        userId: newUserId,
        templateId: defaultTemplate.id,
        candidateId: data.candidateId,
        startDate: data.hireDate,
        status: "IN_PROGRESS",
        createdBy: session.user.id,
        checklist: {
          create: defaultTemplate.tasks.map((task) => ({
            taskTitle: task.title,
            taskDescription: task.description,
            category: task.category,
            assigneeRole: task.assigneeRole,
            dueDate: new Date(new Date(data.hireDate).getTime() + task.dueDays * 24 * 60 * 60 * 1000),
            isCompleted: false,
          })),
        },
      },
    });
    onboardingId = onboarding.id;
  }

  // Send welcome email if requested
  if (data.sendWelcomeEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const variables: Record<string, string> = {
      employeeName: candidate.name,
      email: candidate.email,
      password: tempPassword,
      loginUrl: `${appUrl}/login`,
      startDate: new Date(data.hireDate).toLocaleDateString("vi-VN"),
      employeeCode,
      department: department?.name || "",
      position: position?.name || "",
    };

    if (onboardingId) {
      variables.welcomeGuideUrl = `${appUrl}/onboarding/welcome/${onboardingId}`;
    }

    await sendTemplatedEmail(candidate.email, "WELCOME", variables);
  }

  // Notify HR team
  const hrUsers = await prisma.user.findMany({
    where: { hrmRole: { in: ["HR_MANAGER", "HR_STAFF", "SUPER_ADMIN"] } },
    select: { id: true },
  });

  await createNotificationsForUsers(hrUsers.map((u) => u.id), {
    type: NOTIFICATION_TYPES.RECRUITMENT,
    title: "Ứng viên được tuyển",
    content: `${candidate.name} đã được tuyển vào vị trí ${position?.name || "N/A"} tại ${department?.name || "N/A"}. Mã nhân viên: ${employeeCode}.`,
    link: onboardingId ? `/onboarding` : `/employees/${newUserId}`,
    priority: "HIGH",
  });

  // Notify IT/Admin about onboarding tasks
  if (data.startOnboarding) {
    const itUsers = await prisma.user.findMany({
      where: { hrmRole: { in: ["IT_ADMIN", "ADMIN"] } },
      select: { id: true },
    });

    await createNotificationsForUsers(itUsers.map((u) => u.id), {
      type: NOTIFICATION_TYPES.ONBOARDING,
      title: "Nhân viên mới cần chuẩn bị",
      content: `${candidate.name} sẽ bắt đầu làm việc từ ngày ${new Date(data.hireDate).toLocaleDateString("vi-VN")}. Vui lòng chuẩn bị laptop, email, thẻ ra vào.`,
      link: `/onboarding`,
      priority: "HIGH",
    });
  }

  revalidatePath("/onboarding");
  revalidatePath("/employees");
  revalidatePath("/recruitment/candidates");

  return {
    success: true,
    userId: newUserId,
    employeeCode,
    onboardingId,
    tempPassword,
  };
}

// ─── Template Management ────────────────────────────────────────────────────

export async function getOnboardingTemplates() {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  return await prisma.onboardingTemplate.findMany({
    where: { isActive: true },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { onboardings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOnboardingTemplateById(id: string) {
  await requirePermission(Permission.ONBOARDING_VIEW);

  return await prisma.onboardingTemplate.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { onboardings: true } },
    },
  });
}

export async function createOnboardingTemplate(data: CreateTemplateData) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  const template = await prisma.onboardingTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: true,
      tasks: data.tasks
        ? {
            create: data.tasks.map((t, idx) => ({
              title: t.title,
              description: t.description,
              category: t.category || "GENERAL",
              assigneeRole: t.assigneeRole,
              dueDays: t.dueDays || 3,
              sortOrder: t.sortOrder ?? idx,
              isRequired: t.isRequired ?? true,
            })),
          }
        : undefined,
    },
    include: { tasks: true },
  });

  revalidatePath("/onboarding/settings");
  return template;
}

export async function updateOnboardingTemplate(id: string, data: UpdateTemplateData) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  const template = await prisma.onboardingTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/onboarding/settings");
  return template;
}

export async function deleteOnboardingTemplate(id: string) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  // Check if template is in use
  const usageCount = await prisma.onboarding.count({
    where: { templateId: id },
  });

  if (usageCount > 0) {
    // Soft delete - just deactivate
    await prisma.onboardingTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    // Hard delete if not in use
    await prisma.onboardingTemplate.delete({ where: { id } });
  }

  revalidatePath("/onboarding/settings");
  return { success: true };
}

export async function addTaskToTemplate(templateId: string, task: CreateTaskData) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  // Get max sortOrder
  const maxOrder = await prisma.onboardingTask.aggregate({
    where: { templateId },
    _max: { sortOrder: true },
  });

  const newTask = await prisma.onboardingTask.create({
    data: {
      templateId,
      title: task.title,
      description: task.description,
      category: task.category || "GENERAL",
      assigneeRole: task.assigneeRole,
      dueDays: task.dueDays || 3,
      sortOrder: task.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      isRequired: task.isRequired ?? true,
    },
  });

  revalidatePath("/onboarding/settings");
  return newTask;
}

export async function updateTemplateTask(taskId: string, data: Partial<CreateTaskData>) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  const updateData: Prisma.OnboardingTaskUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.assigneeRole !== undefined) updateData.assigneeRole = data.assigneeRole;
  if (data.dueDays !== undefined) updateData.dueDays = data.dueDays;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;

  const task = await prisma.onboardingTask.update({
    where: { id: taskId },
    data: updateData,
  });

  revalidatePath("/onboarding/settings");
  return task;
}

export async function deleteTemplateTask(taskId: string) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  await prisma.onboardingTask.delete({ where: { id: taskId } });

  revalidatePath("/onboarding/settings");
  return { success: true };
}

export async function reorderTemplateTasks(taskOrders: { id: string; sortOrder: number }[]) {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  await Promise.all(
    taskOrders.map((t) =>
      prisma.onboardingTask.update({
        where: { id: t.id },
        data: { sortOrder: t.sortOrder },
      })
    )
  );

  revalidatePath("/onboarding/settings");
  return { success: true };
}

// ─── Welcome Portal Data ────────────────────────────────────────────────────

export async function getWelcomePortalData(onboardingId: string) {
  const session = await requireAuth();

  const onboarding = await prisma.onboarding.findUnique({
    where: { id: onboardingId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          employeeCode: true,
          hireDate: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      checklist: {
        orderBy: { dueDate: "asc" },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });

  if (!onboarding) return null;

  // Verify user can access this onboarding
  if (onboarding.userId !== session.user.id) {
    await requirePermission(Permission.ONBOARDING_VIEW);
  }

  const checklistByCategory: Record<string, typeof onboarding.checklist> = {};
  for (const item of onboarding.checklist) {
    if (!checklistByCategory[item.category]) {
      checklistByCategory[item.category] = [];
    }
    checklistByCategory[item.category].push(item);
  }

  const completedTasks = onboarding.checklist.filter((c) => c.isCompleted).length;
  const totalTasks = onboarding.checklist.length;

  // Collect assigned users
  const assignedUserIds = [...new Set(onboarding.checklist.map((c) => c.assigneeId).filter(Boolean))];
  const assignedUsers = await prisma.user.findMany({
    where: { id: { in: assignedUserIds as string[] } },
    select: { id: true, name: true, email: true, image: true },
  });

  return {
    onboarding,
    checklistByCategory,
    completedTasks,
    totalTasks,
    assignedUsers: Object.fromEntries(assignedUsers.map((u) => [u.id, u])),
  };
}

// ─── Get available employees (for creating onboarding) ─────────────────────

export async function getEmployeesForOnboarding() {
  await requirePermission(Permission.ONBOARDING_MANAGE);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await prisma.user.findMany({
    where: {
      employeeStatus: "ACTIVE",
      hireDate: { gte: sevenDaysAgo },
      // Exclude users who already have onboarding
      NOT: {
        onboardings: {
          some: {
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      employeeCode: true,
      hireDate: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
    orderBy: { hireDate: "desc" },
  });
}

// ─── Get candidates ready to hire ─────────────────────────────────────────

export async function getCandidatesForHire() {
  await requirePermission(Permission.RECRUITMENT_MANAGE);

  return await prisma.candidate.findMany({
    where: {
      stage: { in: ["INTERVIEW", "OFFER"] },
    },
    include: {
      jobPosting: {
        select: { id: true, title: true, department: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Onboarding Stats ────────────────────────────────────────────────────────

export async function getOnboardingStats() {
  await requirePermission(Permission.ONBOARDING_VIEW);

  const [pending, inProgress, completed, cancelled, total] =
    await Promise.all([
      prisma.onboarding.count({ where: { status: "PENDING" } }),
      prisma.onboarding.count({ where: { status: "IN_PROGRESS" } }),
      prisma.onboarding.count({ where: { status: "COMPLETED" } }),
      prisma.onboarding.count({ where: { status: "CANCELLED" } }),
      prisma.onboarding.count({}),
    ]);

  return { pending, inProgress, completed, cancelled, total };
}

// ─── Export types for client usage ─────────────────────────────────────────
export type { OnboardingWithProgress } from "@/types/onboarding";
export type { CreateTemplateData, CreateTaskData } from "@/types/onboarding";

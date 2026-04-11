"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { extractRole } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

// ─── HELPER: GET USERS ──────────────────────────────────────────────────

export async function getUsers(departmentId?: string): Promise<UserItem[]> {
    await requireAuth();
    const users = await prisma.user.findMany({
        where: departmentId ? { departmentId } : undefined,
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            username: true,
            departmentId: true,
            position: true,
            email: true,
        },
    });
    return users as unknown as UserItem[];
}

// ─── TYPES ────────────────────────────────────────────────────────────────

import type { OffboardingListItem, OffboardingDetailData, OffboardingTemplate } from "./types";

interface UserItem {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
    departmentId: string | null;
    position: string | null;
}

// ─── OFFBOARDING TEMPLATES ───────────────────────────────────────────────

export async function getOffboardingTemplates(): Promise<OffboardingTemplate[]> {
    await requirePermission(Permission.OFFBOARDING_VIEW);

    const templates = await prisma.offboardingTemplate.findMany({
        where: { isActive: true },
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    return templates as unknown as OffboardingTemplate[];
}

export async function createOffboardingTemplate(data: {
    name: string;
    description?: string;
    tasks: {
        title: string;
        description?: string;
        category?: string;
        assigneeRole?: string;
        dueDays?: number;
        isRequired?: boolean;
    }[];
}) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const { tasks, ...templateData } = data;

    const template = await prisma.offboardingTemplate.create({
        data: {
            ...templateData,
            tasks: {
                create: tasks.map((task, index) => ({
                    ...task,
                    category: task.category || "GENERAL",
                    dueDays: task.dueDays || 7,
                    sortOrder: index,
                    isRequired: task.isRequired ?? true,
                })),
            },
        },
        include: { tasks: true },
    });

    revalidatePath("/offboarding");
    return template;
}

export async function updateOffboardingTemplate(
    id: string,
    data: {
        name?: string;
        description?: string;
        isActive?: boolean;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const template = await prisma.offboardingTemplate.update({
        where: { id },
        data,
    });

    revalidatePath("/offboarding");
    return template;
}

export async function deleteOffboardingTemplate(id: string) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    await prisma.offboardingTemplate.delete({
        where: { id },
    });

    revalidatePath("/offboarding");
}

// ─── OFFBOARDING LIST ───────────────────────────────────────────────────

export async function getOffboardings(params?: {
    status?: string;
    search?: string;
}): Promise<OffboardingListItem[]> {
    const session = await requireAuth();
    const role = extractRole(session);

    const canManage = hasAnyPermission(role, [
        Permission.OFFBOARDING_MANAGE,
    ]);

    const where: Record<string, unknown> = {};

    if (params?.status) {
        where.status = params.status;
    }

    if (params?.search) {
        where.user = {
            OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                { username: { contains: params.search, mode: "insensitive" } },
                { email: { contains: params.search, mode: "insensitive" } },
            ],
        };
    }

    const result = await prisma.offboarding.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    departmentId: true,
                    position: true,
                    image: true,
                },
            },
            template: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    checklist: true,
                    assets: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return result as unknown as OffboardingListItem[];
}

export async function getOffboardingById(id: string): Promise<OffboardingDetailData | null> {
    await requirePermission(Permission.OFFBOARDING_VIEW);

    const offboarding = await prisma.offboarding.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    departmentId: true,
                    position: true,
                    image: true,
                },
            },
            template: {
                select: {
                    id: true,
                    name: true,
                },
            },
            checklist: {
                orderBy: [
                    { isCompleted: "asc" },
                    { category: "asc" },
                ],
            },
            assets: true,
        },
    });

    return offboarding as unknown as OffboardingDetailData | null;
}

export async function getMyOffboardings(): Promise<OffboardingListItem[]> {
    const session = await requireAuth();

    const result = await prisma.offboarding.findMany({
        where: { userId: session.user.id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    departmentId: true,
                    position: true,
                    image: true,
                },
            },
            template: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    checklist: true,
                    assets: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return result as unknown as OffboardingListItem[];
}

// ─── CREATE OFFBOARDING ─────────────────────────────────────────────────

export async function createOffboarding(data: {
    userId: string;
    templateId?: string;
    resignDate: Date;
    lastWorkDate: Date;
    reason: string;
    reasonDetail?: string;
}) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);
    const session = await requireAuth();

    // Get template tasks if template is selected
    let templateTasks: {
        title: string;
        description: string | null;
        category: string;
        assigneeRole: string | null;
        dueDays: number;
    }[] = [];

    if (data.templateId) {
        const template = await prisma.offboardingTemplate.findUnique({
            where: { id: data.templateId },
            include: { tasks: true },
        });
        if (template) {
            templateTasks = template.tasks.map((task) => ({
                title: task.title,
                description: task.description,
                category: task.category,
                assigneeRole: task.assigneeRole,
                dueDays: task.dueDays,
            }));
        }
    } else {
        // Default tasks
        templateTasks = [
            { title: "Bàn giao công việc", description: "Chuyển giao công việc cho người thay thế", category: "GENERAL", assigneeRole: "DEPT_MANAGER", dueDays: 7 },
            { title: "Thu hồi tài sản", description: "Thu hồi laptop, thẻ, chìa khóa", category: "ASSET", assigneeRole: "IT_ADMIN", dueDays: 3 },
            { title: "Khóa tài khoản", description: "Vô hiệu hóa email, hệ thống", category: "ACCOUNT", assigneeRole: "IT_ADMIN", dueDays: 1 },
            { title: "Thanh toán lương", description: "Tính và thanh toán lương cuối", category: "FINANCIAL", assigneeRole: "ACCOUNTANT", dueDays: 5 },
            { title: "Exit interview", description: "Phỏng vấn nghỉ việc", category: "INTERVIEW", assigneeRole: "HR_STAFF", dueDays: 3 },
        ];
    }

    // Get user's assigned assets
    const userAssets = await prisma.assetAssignment.findMany({
        where: {
            userId: data.userId,
            status: "ASSIGNED",
        },
        include: { asset: true },
    });

    const offboarding = await prisma.offboarding.create({
        data: {
            userId: data.userId,
            templateId: data.templateId,
            resignDate: data.resignDate,
            lastWorkDate: data.lastWorkDate,
            reason: data.reason,
            reasonDetail: data.reasonDetail,
            createdBy: session.user.id,
            checklist: {
                create: templateTasks.map((task) => ({
                    taskTitle: task.title,
                    taskDescription: task.description,
                    category: task.category,
                    assigneeRole: task.assigneeRole,
                    dueDate: new Date(data.lastWorkDate.getTime() - task.dueDays * 24 * 60 * 60 * 1000),
                })),
            },
            assets: {
                create: userAssets.map((assignment) => ({
                    assetId: assignment.assetId,
                    assetName: assignment.asset.name,
                    assetCode: assignment.asset.code,
                    category: assignment.asset.category,
                    status: "PENDING",
                })),
            },
        },
    });

    revalidatePath("/offboarding");
    return offboarding;
}

// ─── UPDATE OFFBOARDING ─────────────────────────────────────────────────

export async function updateOffboarding(
    id: string,
    data: {
        resignDate?: Date;
        lastWorkDate?: Date;
        reason?: string;
        reasonDetail?: string;
        status?: string;
        exitInterview?: string;
        interviewDate?: Date;
        finalSalary?: number;
        unusedLeaveDays?: number;
        unusedLeaveAmount?: number;
        severancePay?: number;
        otherAllowances?: number;
        totalFinalPayment?: number;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const updateData: Record<string, unknown> = { ...data };

    if (data.status === "COMPLETED") {
        const completedOffboarding = await prisma.$transaction(async (tx) => {
            const current = await tx.offboarding.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    lastWorkDate: true,
                    checklist: {
                        select: {
                            id: true,
                            isCompleted: true,
                        },
                    },
                    assets: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
            });

            if (!current) {
                throw new Error("Không tìm thấy quy trình offboarding");
            }

            const hasIncompleteChecklist = current.checklist.some((item) => !item.isCompleted);
            if (hasIncompleteChecklist) {
                throw new Error("Vui lòng hoàn tất toàn bộ checklist bàn giao trước khi chốt offboarding.");
            }

            const hasPendingAssets = current.assets.some((asset) => asset.status === "PENDING");
            if (hasPendingAssets) {
                throw new Error("Vui lòng xử lý toàn bộ tài sản trước khi chốt offboarding.");
            }

            const updatedOffboarding = await tx.offboarding.update({
                where: { id },
                data: {
                    ...updateData,
                    completedAt: new Date(),
                },
            });

            await tx.user.update({
                where: { id: current.userId },
                data: {
                    employeeStatus: "RESIGNED",
                    resignDate: current.lastWorkDate,
                    banned: true,
                    banReason: "OFFBOARDING_COMPLETED",
                    banExpires: null,
                },
            });

            await tx.session.deleteMany({
                where: { userId: current.userId },
            });

            return updatedOffboarding;
        });

        revalidatePath("/offboarding");
        revalidatePath(`/offboarding/${id}`);
        return completedOffboarding;
    }

    const offboarding = await prisma.offboarding.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/offboarding");
    revalidatePath(`/offboarding/${id}`);
    return offboarding;
}

// ─── CHECKLIST ACTIONS ─────────────────────────────────────────────────

export async function updateChecklistItem(
    checklistId: string,
    data: {
        isCompleted?: boolean;
        completedBy?: string;
        completedAt?: Date;
        notes?: string;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);
    const session = await requireAuth();

    const updateData: Record<string, unknown> = { ...data };

    if (data.isCompleted) {
        updateData.completedBy = session.user.id;
        updateData.completedAt = new Date();
    }

    const checklist = await prisma.offboardingChecklist.update({
        where: { id: checklistId },
        data: updateData,
    });

    revalidatePath("/offboarding");
    return checklist;
}

export async function addChecklistItem(
    offboardingId: string,
    data: {
        taskTitle: string;
        taskDescription?: string;
        category?: string;
        assigneeRole?: string;
        dueDate?: Date;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const checklist = await prisma.offboardingChecklist.create({
        data: {
            offboardingId,
            taskTitle: data.taskTitle,
            taskDescription: data.taskDescription,
            category: data.category || "GENERAL",
            assigneeRole: data.assigneeRole,
            dueDate: data.dueDate,
        },
    });

    revalidatePath("/offboarding");
    return checklist;
}

export async function deleteChecklistItem(checklistId: string) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    await prisma.offboardingChecklist.delete({
        where: { id: checklistId },
    });

    revalidatePath("/offboarding");
}

// ─── ASSET ACTIONS ─────────────────────────────────────────────────────

export async function updateOffboardingAsset(
    assetId: string,
    data: {
        status?: string;
        returnDate?: Date;
        returnedTo?: string;
        condition?: string;
        notes?: string;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const asset = await prisma.offboardingAsset.update({
        where: { id: assetId },
        data,
    });

    // If asset is returned, also update the original asset assignment
    if (data.status === "RETURNED" && asset.assetId) {
        await prisma.assetAssignment.updateMany({
            where: {
                assetId: asset.assetId,
                status: "ASSIGNED",
            },
            data: {
                status: "RETURNED",
                returnDate: data.returnDate || new Date(),
                condition: data.condition,
            },
        });
    }

    revalidatePath("/offboarding");
    return asset;
}

// ─── EXIT INTERVIEW ───────────────────────────────────────────────────

export async function saveExitInterview(
    offboardingId: string,
    data: {
        exitInterview: string;
        interviewDate?: Date;
        interviewerId?: string;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const offboarding = await prisma.offboarding.update({
        where: { id: offboardingId },
        data: {
            exitInterview: data.exitInterview,
            interviewDate: data.interviewDate,
            interviewerId: data.interviewerId,
        },
    });

    revalidatePath("/offboarding");
    return offboarding;
}

// ─── FINAL SETTLEMENT ─────────────────────────────────────────────────

export async function calculateFinalSettlement(
    offboardingId: string,
    data: {
        finalSalary: number;
        unusedLeaveDays: number;
        unusedLeaveAmount: number;
        severancePay?: number;
        otherAllowances?: number;
    },
) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    const totalFinalPayment =
        (data.finalSalary || 0) +
        (data.unusedLeaveAmount || 0) +
        (data.severancePay || 0) +
        (data.otherAllowances || 0);

    const offboarding = await prisma.offboarding.update({
        where: { id: offboardingId },
        data: {
            finalSalary: data.finalSalary,
            unusedLeaveDays: data.unusedLeaveDays,
            unusedLeaveAmount: data.unusedLeaveAmount,
            severancePay: data.severancePay,
            otherAllowances: data.otherAllowances,
            totalFinalPayment,
        },
    });

    revalidatePath("/offboarding");
    return offboarding;
}

// ─── DELETE OFFBOARDING ────────────────────────────────────────────────

export async function deleteOffboarding(id: string) {
    await requirePermission(Permission.OFFBOARDING_MANAGE);

    await prisma.offboarding.delete({
        where: { id },
    });

    revalidatePath("/offboarding");
}

// ─── STATS ───────────────────────────────────────────────────────────────

export async function getOffboardingStats() {
    await requirePermission(Permission.OFFBOARDING_VIEW);

    const [total, processing, completed, thisMonth] = await Promise.all([
        prisma.offboarding.count(),
        prisma.offboarding.count({ where: { status: "PROCESSING" } }),
        prisma.offboarding.count({ where: { status: "COMPLETED" } }),
        prisma.offboarding.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        }),
    ]);

    return { total, processing, completed, thisMonth };
}

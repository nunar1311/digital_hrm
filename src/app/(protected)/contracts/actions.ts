"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { parseOffice } from "officeparser";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
    extractRole,
    getUserCustomPermissions,
    requireAuth,
    requirePermission,
} from "@/lib/auth-session";
import { hasAnyPermissionWithCustom } from "@/lib/rbac/check-access";
import { Permission } from "@/lib/rbac/permissions";
import {
    buildContractDocxBuffer,
    buildContractPdfBuffer,
    extractTemplateVariables,
    mergeTemplateContent,
} from "@/lib/contracts/document-export";
import {
    dispatchContractExpiryReminders,
    findExpiringContracts,
} from "@/lib/contracts/expiry-reminder";
import type {
    ContractAddendumItem,
    ContractDetailItem,
    ContractExportResult,
    ContractListItem,
    ContractListQuery,
    ContractListResult,
    ContractStatus,
    ContractTemplateItem,
} from "@/types/contract";

const CONTRACT_STATUSES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PENDING_SIGN",
    "ACTIVE",
    "EXPIRED",
    "TERMINATED",
] as const;

const ADDENDUM_TYPES = ["EXTENSION", "SALARY_CHANGE"] as const;

const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["ALL", ...CONTRACT_STATUSES]).default("ALL"),
    expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
    startDateFrom: z.string().optional(),
    startDateTo: z.string().optional(),
    endDateFrom: z.string().optional(),
    endDateTo: z.string().optional(),
    employeeId: z.string().optional(),
});

const upsertContractSchema = z.object({
    id: z.string().optional(),
    userId: z.string().min(1, "Nhân viên không được để trống"),
    contractNumber: z.string().trim().min(1, "Số hợp đồng không được để trống"),
    title: z.string().trim().min(1, "Tiêu đề hợp đồng không được để trống"),
    contractTypeId: z.string().nullable().optional(),
    templateId: z.string().nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    signedDate: z.coerce.date().nullable().optional(),
    status: z.enum(CONTRACT_STATUSES).default("DRAFT"),
    salary: z.coerce.number().nonnegative().nullable().optional(),
    probationSalary: z.coerce.number().nonnegative().nullable().optional(),
    currency: z.string().trim().min(1).default("VND"),
    fileUrl: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
});

const createAddendumSchema = z.object({
    contractId: z.string().min(1),
    addendumType: z.enum(ADDENDUM_TYPES),
    title: z.string().trim().min(1, "Tiêu đề phụ lục không được để trống"),
    effectiveDate: z.coerce.date(),
    newEndDate: z.coerce.date().nullable().optional(),
    newSalary: z.coerce.number().nonnegative().nullable().optional(),
    reason: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
});

const upsertTemplateSchema = z.object({
    id: z.string().optional(),
    code: z.string().trim().optional(),
    name: z.string().trim().min(1, "Tên mẫu hợp đồng không được để trống"),
    description: z.string().trim().nullable().optional(),
    content: z.string().trim().min(1, "Nội dung mẫu không được để trống"),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

const exportContractSchema = z.object({
    contractId: z.string().min(1),
    templateId: z.string().optional(),
    format: z.enum(["DOCX", "PDF"]),
});

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function toIso(date: Date | null | undefined): string | null {
    if (!date) {
        return null;
    }
    return date.toISOString();
}

function formatDate(date: Date | null | undefined): string {
    if (!date) {
        return "";
    }
    return date.toLocaleDateString("vi-VN");
}

function formatCurrency(value: number | null | undefined, currency = "VND"): string {
    if (value === null || value === undefined) {
        return "";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function normalizeContractStatus(params: {
    status: string;
    startDate: Date;
    endDate: Date | null;
}): ContractStatus {
    const now = new Date();

    if (
        params.endDate &&
        now > params.endDate &&
        ["ACTIVE", "PENDING_SIGN", "APPROVED", "PENDING_APPROVAL"].includes(params.status)
    ) {
        return "EXPIRED";
    }

    if (CONTRACT_STATUSES.includes(params.status as ContractStatus)) {
        return params.status as ContractStatus;
    }

    return "DRAFT";
}

function buildExpiryInfo(endDate: Date | null): {
    expiryInDays: number | null;
    isExpiringIn15Days: boolean;
    isExpiringIn30Days: boolean;
} {
    if (!endDate) {
        return {
            expiryInDays: null,
            isExpiringIn15Days: false,
            isExpiringIn30Days: false,
        };
    }

    const diffMs = startOfDay(endDate).getTime() - startOfDay(new Date()).getTime();
    const expiryInDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    return {
        expiryInDays,
        isExpiringIn15Days: expiryInDays >= 0 && expiryInDays <= 15,
        isExpiringIn30Days: expiryInDays >= 0 && expiryInDays <= 30,
    };
}

function mapContractToListItem(contract: {
    id: string;
    contractNumber: string;
    title: string;
    contractTypeId: string | null;
    templateId: string | null;
    startDate: Date;
    endDate: Date | null;
    signedDate: Date | null;
    status: string;
    salary: number | null;
    probationSalary: number | null;
    currency: string;
    fileUrl: string | null;
    notes: string | null;
    approvalChain?: any;
    currentStep?: number;
    signedIp?: string | null;
    signedDevice?: string | null;
    eSignatureUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        username: string | null;
    };
    contractType: {
        name: string;
    } | null;
    template: {
        name: string;
    } | null;
}): ContractListItem {
    const expiry = buildExpiryInfo(contract.endDate);

    return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        contractTypeId: contract.contractTypeId,
        contractTypeName: contract.contractType?.name ?? "Hợp đồng lao động",
        templateId: contract.templateId,
        templateName: contract.template?.name ?? null,
        employee: {
            id: contract.user.id,
            name: contract.user.name,
            username: contract.user.username,
        },
        startDate: contract.startDate.toISOString(),
        endDate: toIso(contract.endDate),
        signedDate: toIso(contract.signedDate),
        status: normalizeContractStatus({
            status: contract.status,
            startDate: contract.startDate,
            endDate: contract.endDate,
        }),
        salary: contract.salary ?? null,
        probationSalary: contract.probationSalary ?? null,
        currency: contract.currency,
        fileUrl: contract.fileUrl ?? null,
        notes: contract.notes ?? null,
        expiryInDays: expiry.expiryInDays,
        isExpiringIn15Days: expiry.isExpiringIn15Days,
        isExpiringIn30Days: expiry.isExpiringIn30Days,
        approvalChain: contract.approvalChain,
        currentStep: contract.currentStep,
        signedIp: contract.signedIp ?? null,
        signedDevice: contract.signedDevice ?? null,
        eSignatureUrl: contract.eSignatureUrl ?? null,
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
    };
}

function mapAddendumToItem(addendum: {
    id: string;
    contractId: string;
    addendumType: string;
    title: string;
    effectiveDate: Date;
    oldEndDate: Date | null;
    newEndDate: Date | null;
    oldSalary: number | null;
    newSalary: number | null;
    reason: string | null;
    notes: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    creator: { name: string } | null;
}): ContractAddendumItem {
    return {
        id: addendum.id,
        contractId: addendum.contractId,
        addendumType: addendum.addendumType as ContractAddendumItem["addendumType"],
        title: addendum.title,
        effectiveDate: addendum.effectiveDate.toISOString(),
        oldEndDate: toIso(addendum.oldEndDate),
        newEndDate: toIso(addendum.newEndDate),
        oldSalary: addendum.oldSalary ?? null,
        newSalary: addendum.newSalary ?? null,
        reason: addendum.reason ?? null,
        notes: addendum.notes ?? null,
        createdBy: addendum.createdBy,
        createdByName: addendum.creator?.name ?? null,
        createdAt: addendum.createdAt.toISOString(),
        updatedAt: addendum.updatedAt.toISOString(),
    };
}

async function getContractAccess() {
    const session = await requireAuth();
    const role = extractRole(session);
    const customPermissions = await getUserCustomPermissions(session.user.id);

    const canViewAll = hasAnyPermissionWithCustom(
        role,
        [Permission.CONTRACT_VIEW_ALL],
        customPermissions,
    );
    const canPrint = hasAnyPermissionWithCustom(
        role,
        [Permission.CONTRACT_PRINT],
        customPermissions,
    );
    const canEdit = hasAnyPermissionWithCustom(
        role,
        [Permission.CONTRACT_EDIT],
        customPermissions,
    );
    const canCreate = hasAnyPermissionWithCustom(
        role,
        [Permission.CONTRACT_CREATE],
        customPermissions,
    );

    return {
        session,
        role,
        customPermissions,
        canViewAll,
        canPrint,
        canEdit,
        canCreate,
    };
}

function createTemplateCode(name: string): string {
    const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug) {
        return `contract-template-${Date.now()}`;
    }

    return slug;
}

async function getContractDetailRaw(contractId: string) {
    return prisma.contract.findUnique({
        where: { id: contractId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    department: {
                        select: {
                            name: true,
                        },
                    },
                    position: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            contractType: {
                select: {
                    id: true,
                    name: true,
                    durationMonths: true,
                },
            },
            template: {
                select: {
                    id: true,
                    name: true,
                    content: true,
                },
            },
            addendums: {
                include: {
                    creator: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    effectiveDate: "desc",
                },
            },
            histories: {
                include: {
                    actor: {
                        select: {
                            name: true,
                            username: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });
}

function buildMergeVariables(contract: NonNullable<Awaited<ReturnType<typeof getContractDetailRaw>>>) {
    return {
        today: formatDate(new Date()),
        companyName: "",
        companyAddress: "",
        contractNumber: contract.contractNumber,
        contractTitle: contract.title,
        contractType: contract.contractType?.name ?? "Hợp đồng lao động",
        contractStatus: contract.status,
        employeeName: contract.user.name,
        username: contract.user.username ?? "",
        employeeDepartment: contract.user.department?.name ?? "",
        employeePosition: contract.user.position?.name ?? "",
        startDate: formatDate(contract.startDate),
        endDate: formatDate(contract.endDate),
        signedDate: formatDate(contract.signedDate),
        salary: formatCurrency(contract.salary, contract.currency),
        probationSalary: formatCurrency(contract.probationSalary, contract.currency),
        currency: contract.currency,
    };
}

export async function getContracts(params?: ContractListQuery): Promise<ContractListResult> {
    await requirePermission(Permission.CONTRACT_VIEW_SELF, Permission.CONTRACT_VIEW_ALL);

    const access = await getContractAccess();
    const query = listQuerySchema.parse(params ?? {});

    const where: Record<string, unknown> = {};

    if (!access.canViewAll) {
        where.userId = access.session.user.id;
    }

    if (query.employeeId) {
        if (!access.canViewAll && query.employeeId !== access.session.user.id) {
            throw new Error("FORBIDDEN");
        }
        where.userId = query.employeeId;
    }

    if (query.search) {
        where.OR = [
            {
                contractNumber: {
                    contains: query.search,
                    mode: "insensitive",
                },
            },
            {
                title: {
                    contains: query.search,
                    mode: "insensitive",
                },
            },
            {
                user: {
                    name: {
                        contains: query.search,
                        mode: "insensitive",
                    },
                },
            },
            {
                user: {
                    username: {
                        contains: query.search,
                        mode: "insensitive",
                    },
                },
            },
        ];
    }

    if (query.status !== "ALL") {
        where.status = query.status;
    }

    if (query.startDateFrom || query.startDateTo) {
        where.startDate = {
            ...(query.startDateFrom ? { gte: startOfDay(new Date(query.startDateFrom)) } : {}),
            ...(query.startDateTo ? { lte: endOfDay(new Date(query.startDateTo)) } : {}),
        };
    }

    if (query.endDateFrom || query.endDateTo || query.expiringWithinDays) {
        const endDateWhere: Record<string, Date> = {
            ...(query.endDateFrom ? { gte: startOfDay(new Date(query.endDateFrom)) } : {}),
            ...(query.endDateTo ? { lte: endOfDay(new Date(query.endDateTo)) } : {}),
        };

        if (query.expiringWithinDays) {
            const now = startOfDay(new Date());
            const target = endOfDay(new Date(Date.now() + query.expiringWithinDays * 24 * 60 * 60 * 1000));
            endDateWhere.gte = now;
            endDateWhere.lte = target;
        }

        where.endDate = endDateWhere;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                contractType: {
                    select: {
                        name: true,
                    },
                },
                template: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [{ endDate: "asc" }, { updatedAt: "desc" }],
            skip,
            take: query.pageSize,
        }),
        prisma.contract.count({ where }),
    ]);

    const items = contracts.map(mapContractToListItem);

    return {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
    };
}

export async function getContractById(contractId: string): Promise<ContractDetailItem | null> {
    await requirePermission(Permission.CONTRACT_VIEW_SELF, Permission.CONTRACT_VIEW_ALL);

    const access = await getContractAccess();
    const contract = await getContractDetailRaw(contractId);

    if (!contract) {
        return null;
    }

    if (!access.canViewAll && contract.userId !== access.session.user.id) {
        throw new Error("FORBIDDEN");
    }

    const base = mapContractToListItem(contract);

    return {
        ...base,
        addendums: contract.addendums.map(mapAddendumToItem),
        histories: contract.histories.map((h) => {
            const changes = h.changes as any;
            return {
                id: h.id,
                contractId: h.contractId,
                action: h.action,
                statusFrom: (changes?.statusFrom as ContractStatus) || null,
                statusTo: (changes?.statusTo as ContractStatus) || null,
                notes: changes?.notes || null,
                actorId: h.actorId,
                actorName: h.actor?.name ?? "Hệ thống",
                createdAt: h.createdAt.toISOString(),
            };
        }),
    };
}

export async function getContractsByEmployee(employeeId: string) {
    const result = await getContracts({
        employeeId,
        page: 1,
        pageSize: 100,
        status: "ALL",
    });

    return result.items;
}

export async function upsertContract(data: z.infer<typeof upsertContractSchema>) {
    const parsed = upsertContractSchema.parse(data);
    const access = await getContractAccess();

    if (parsed.id && !access.canEdit) {
        throw new Error("FORBIDDEN");
    }

    if (!parsed.id && !access.canCreate) {
        throw new Error("FORBIDDEN");
    }

    if (parsed.endDate && parsed.endDate < parsed.startDate) {
        return {
            success: false,
            message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực.",
        };
    }

    const existingUser = await prisma.user.findUnique({
        where: { id: parsed.userId },
        select: {
            id: true,
        },
    });

    if (!existingUser) {
        return {
            success: false,
            message: "Nhân viên không tồn tại.",
        };
    }

    const duplicate = await prisma.contract.findFirst({
        where: {
            contractNumber: parsed.contractNumber,
            ...(parsed.id ? { id: { not: parsed.id } } : {}),
        },
        select: {
            id: true,
        },
    });

    if (duplicate) {
        return {
            success: false,
            message: "Số hợp đồng đã tồn tại.",
        };
    }

    if (parsed.templateId) {
        const templateExists = await prisma.contractTemplate.findUnique({
            where: { id: parsed.templateId },
            select: { id: true, isActive: true },
        });

        if (!templateExists || !templateExists.isActive) {
            return {
                success: false,
                message: "Mẫu hợp đồng không tồn tại hoặc đã bị khóa.",
            };
        }
    }

    const payload = {
        userId: parsed.userId,
        contractNumber: parsed.contractNumber,
        title: parsed.title,
        contractTypeId: parsed.contractTypeId || null,
        templateId: parsed.templateId || null,
        startDate: parsed.startDate,
        endDate: parsed.endDate || null,
        signedDate: parsed.signedDate || null,
        status: parsed.status,
        salary: parsed.salary ?? null,
        probationSalary: parsed.probationSalary ?? null,
        currency: parsed.currency,
        fileUrl: parsed.fileUrl || null,
        notes: parsed.notes || null,
    };

    const contract = parsed.id
        ? await prisma.contract.update({
              where: { id: parsed.id },
              data: payload,
          })
        : await prisma.contract.create({
              data: payload,
          });

    await prisma.contractHistory.create({
        data: {
            contractId: contract.id,
            action: parsed.id ? "UPDATED" : "CREATED",
            actorId: access.session.user.id,
        },
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contract.id}`);
    revalidatePath(`/employees/${contract.userId}`);
    revalidatePath("/ess/contracts");

    return {
        success: true,
        contractId: contract.id,
    };
}

export async function createContractAddendum(data: z.infer<typeof createAddendumSchema>) {
    await requirePermission(Permission.CONTRACT_EDIT);

    const access = await getContractAccess();
    const parsed = createAddendumSchema.parse(data);

    const contract = await prisma.contract.findUnique({
        where: { id: parsed.contractId },
        select: {
            id: true,
            userId: true,
            endDate: true,
            salary: true,
            status: true,
        },
    });

    if (!contract) {
        return {
            success: false,
            message: "Không tìm thấy hợp đồng.",
        };
    }

    if (!access.canViewAll && contract.userId !== access.session.user.id) {
        throw new Error("FORBIDDEN");
    }

    if (parsed.addendumType === "EXTENSION" && !parsed.newEndDate) {
        return {
            success: false,
            message: "Phụ lục gia hạn bắt buộc có ngày hết hạn mới.",
        };
    }

    if (parsed.addendumType === "SALARY_CHANGE" && parsed.newSalary === null) {
        return {
            success: false,
            message: "Phụ lục điều chỉnh lương bắt buộc có mức lương mới.",
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.contractAddendum.create({
            data: {
                contractId: contract.id,
                addendumType: parsed.addendumType,
                title: parsed.title,
                effectiveDate: parsed.effectiveDate,
                oldEndDate: contract.endDate,
                newEndDate: parsed.newEndDate || null,
                oldSalary: contract.salary ?? null,
                newSalary: parsed.newSalary ?? null,
                reason: parsed.reason || null,
                notes: parsed.notes || null,
                createdBy: access.session.user.id,
            },
        });

        const nextStatus =
            parsed.addendumType === "EXTENSION" && parsed.newEndDate && parsed.newEndDate >= startOfDay(new Date())
                ? "ACTIVE"
                : contract.status;

        await tx.contract.update({
            where: { id: contract.id },
            data: {
                ...(parsed.addendumType === "EXTENSION" ? { endDate: parsed.newEndDate || null } : {}),
                ...(parsed.addendumType === "SALARY_CHANGE" ? { salary: parsed.newSalary ?? null } : {}),
                status: nextStatus,
            },
        });
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contract.id}`);
    revalidatePath(`/employees/${contract.userId}`);
    revalidatePath("/ess/contracts");

    return {
        success: true,
    };
}

export async function getContractTemplates(params?: { includeInactive?: boolean }) {
    await requirePermission(
        Permission.CONTRACT_TEMPLATE_MANAGE,
        Permission.CONTRACT_CREATE,
        Permission.CONTRACT_EDIT,
        Permission.CONTRACT_PRINT,
    );

    const templates = await prisma.contractTemplate.findMany({
        where: params?.includeInactive
            ? undefined
            : {
                  isActive: true,
              },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return templates.map(
        (template): ContractTemplateItem => ({
            id: template.id,
            code: template.code,
            name: template.name,
            description: template.description,
            content: template.content,
            isDefault: template.isDefault,
            isActive: template.isActive,
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
        }),
    );
}

export async function upsertContractTemplate(data: z.infer<typeof upsertTemplateSchema>) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE);

    const session = await requireAuth();
    const parsed = upsertTemplateSchema.parse(data);

    const code = parsed.code?.trim() || createTemplateCode(parsed.name);

    const duplicate = await prisma.contractTemplate.findFirst({
        where: {
            code,
            ...(parsed.id ? { id: { not: parsed.id } } : {}),
        },
        select: { id: true },
    });

    if (duplicate) {
        return {
            success: false,
            message: "Mã template đã tồn tại. Vui lòng đổi mã khác.",
        };
    }

    if (parsed.isDefault) {
        await prisma.contractTemplate.updateMany({
            data: { isDefault: false },
        });
    }

    const template = parsed.id
        ? await prisma.contractTemplate.update({
              where: { id: parsed.id },
              data: {
                  code,
                  name: parsed.name,
                  description: parsed.description || null,
                  content: parsed.content,
                  isDefault: parsed.isDefault,
                  isActive: parsed.isActive,
              },
          })
        : await prisma.contractTemplate.create({
              data: {
                  code,
                  name: parsed.name,
                  description: parsed.description || null,
                  content: parsed.content,
                  isDefault: parsed.isDefault,
                  isActive: parsed.isActive,
                  createdBy: session.user.id,
              },
          });

    revalidatePath("/contracts/templates");

    return {
        success: true,
        templateId: template.id,
    };
}

export async function deleteContractTemplate(templateId: string) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE);

    const inUseCount = await prisma.contract.count({
        where: { templateId },
    });

    if (inUseCount > 0) {
        await prisma.contractTemplate.update({
            where: { id: templateId },
            data: {
                isActive: false,
                isDefault: false,
            },
        });
    } else {
        await prisma.contractTemplate.delete({
            where: { id: templateId },
        });
    }

    revalidatePath("/contracts/templates");

    return {
        success: true,
    };
}

export async function getContractTemplatePreview(params: {
    contractId: string;
    templateId?: string;
}) {
    await requirePermission(Permission.CONTRACT_VIEW_SELF, Permission.CONTRACT_VIEW_ALL);

    const access = await getContractAccess();
    const contract = await getContractDetailRaw(params.contractId);

    if (!contract) {
        return {
            success: false,
            message: "Không tìm thấy hợp đồng.",
        };
    }

    if (!access.canViewAll && contract.userId !== access.session.user.id) {
        throw new Error("FORBIDDEN");
    }

    const template = params.templateId
        ? await prisma.contractTemplate.findUnique({
              where: { id: params.templateId },
          })
        : contract.templateId
          ? await prisma.contractTemplate.findUnique({
                where: { id: contract.templateId },
            })
          : await prisma.contractTemplate.findFirst({
                where: { isActive: true, isDefault: true },
                orderBy: { createdAt: "desc" },
            });

    const fallbackContent = [
        "HỢP ĐỒNG LAO ĐỘNG",
        "Số hợp đồng: {{contractNumber}}",
        "Nhân viên: {{employeeName}} ({{username}})",
        "Loại hợp đồng: {{contractType}}",
        "Ngày hiệu lực: {{startDate}}",
        "Ngày hết hạn: {{endDate}}",
        "Lương chính thức: {{salary}}",
    ].join("\n");

    const content = template?.content || fallbackContent;
    const company = await prisma.organization.findFirst({
        select: {
            name: true,
        },
    });

    const variables = {
        ...buildMergeVariables(contract),
        companyName: company?.name ?? "Công ty",
        companyAddress: "",
    };
    const mergedContent = mergeTemplateContent(content, variables);

    return {
        success: true,
        template: {
            id: template?.id ?? "fallback-template",
            name: template?.name ?? "Mẫu hợp đồng mặc định",
            code: template?.code ?? "default",
        },
        mergedContent,
        variables,
        requiredVariables: extractTemplateVariables(content),
    };
}

export async function getContractPreviewHtmlAction(contractId: string) {
    const preview = await getContractTemplatePreview({ contractId });

    if (!preview.success || !preview.mergedContent) {
        return { success: false, message: preview.message || "Lỗi xem trước hợp đồng" };
    }

    try {
        const docxBuffer = await buildContractDocxBuffer({
            title: preview.mergedContent.split("\n")[0] ?? "Hop Dong Lao Dong",
            mergedContent: preview.mergedContent,
        });

        const result = await mammoth.convertToHtml(
            { buffer: Buffer.from(docxBuffer) },
            {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Title'] => h1:fresh",
                    "p => p",
                ],
            },
        );

        return { success: true, html: result.value };
    } catch (err: any) {
        return { success: false, message: err.message || "Lỗi render HTML hợp đồng" };
    }
}

export async function exportContractDocument(payload: {
    contractId: string;
    format: "DOCX" | "PDF";
    templateId?: string;
}): Promise<ContractExportResult> {
    await requirePermission(
        Permission.CONTRACT_VIEW_SELF,
        Permission.CONTRACT_VIEW_ALL,
        Permission.CONTRACT_PRINT,
    );

    const parsed = exportContractSchema.parse(payload);
    const access = await getContractAccess();

    const contract = await getContractDetailRaw(parsed.contractId);
    if (!contract) {
        throw new Error("NOT_FOUND");
    }

    const isSelfContract = contract.userId === access.session.user.id;
    if (!access.canViewAll && !isSelfContract) {
        throw new Error("FORBIDDEN");
    }

    if (!access.canPrint && !isSelfContract) {
        throw new Error("FORBIDDEN");
    }

    const preview = await getContractTemplatePreview({
        contractId: parsed.contractId,
        templateId: parsed.templateId,
    });

    if (!preview.success) {
        throw new Error("TEMPLATE_PREVIEW_FAILED");
    }

    const mergedContent = preview.mergedContent || "";

    const title = `${contract.title} (${contract.contractNumber})`;

    let fileBuffer: Buffer;
    let mimeType: string;
    let fileName: string;

    if (parsed.format === "DOCX") {
        fileBuffer = await buildContractDocxBuffer({
            title,
            mergedContent,
        });
        mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        fileName = `${contract.contractNumber}.docx`;
    } else {
        fileBuffer = await buildContractPdfBuffer({
            title,
            mergedContent,
        });
        mimeType = "application/pdf";
        fileName = `${contract.contractNumber}.pdf`;
    }

    return {
        fileName,
        mimeType,
        base64Content: fileBuffer.toString("base64"),
    };
}

export async function getContractExpiryOverview() {
    await requirePermission(Permission.CONTRACT_VIEW_SELF, Permission.CONTRACT_VIEW_ALL);

    const access = await getContractAccess();
    const [in15, in30] = await Promise.all([
        findExpiringContracts(15),
        findExpiringContracts(30),
    ]);

    const filterByScope = (items: Awaited<ReturnType<typeof findExpiringContracts>>) =>
        access.canViewAll
            ? items
            : items.filter((item) => item.employeeId === access.session.user.id);

    const in15Scoped = filterByScope(in15);
    const in30Scoped = filterByScope(in30);

    return {
        in15Days: in15Scoped,
        in30Days: in30Scoped,
        total15Days: in15Scoped.length,
        total30Days: in30Scoped.length,
    };
}

export async function triggerContractExpiryReminderCheck() {
    const session = await requireAuth();
    const role = session.user.hrmRole || "EMPLOYEE";

    if (!["HR_MANAGER", "HR_STAFF", "DIRECTOR", "SUPER_ADMIN"].includes(role)) {
        return {
            success: true,
            skipped: true,
            reason: "role_not_supported",
        };
    }

    const result = await dispatchContractExpiryReminders({
        days: [15, 30],
        source: "page_open",
    });

    return {
        success: true,
        skipped: false,
        ...result,
    };
}

export async function signContract(contractId: string) {
    const session = await requireAuth();

    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        select: { id: true, userId: true, status: true },
    });

    if (!contract) {
        return { success: false, message: "Không tìm thấy hợp đồng" };
    }

    if (contract.userId !== session.user.id) {
        return { success: false, message: "Bạn không có quyền ký hợp đồng này" };
    }

    if (contract.status !== "PENDING_SIGN" && contract.status !== "DRAFT" && contract.status !== "PENDING_APPROVAL" && contract.status !== "APPROVED") {
        return { success: false, message: "Hợp đồng không ở trạng thái có thể ký" };
    }

    await prisma.contract.update({
        where: { id: contractId },
        data: {
            status: "ACTIVE",
            signedDate: new Date(),
            signedIp: "Internal System",
            histories: {
                create: {
                    action: "SIGNED",
                    actorId: session.user.id,
                },
            },
        },
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contract.id}`);
    revalidatePath("/ess/contracts");

    return { success: true };
}

export async function importContractFromDocx(formData: FormData) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE, Permission.CONTRACT_CREATE, Permission.CONTRACT_EDIT);

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "Không tìm thấy file" };

    // Read buffer ONCE upfront — File.arrayBuffer() can only be consumed reliably once
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("[importContractFromDocx] file.name:", file.name, "size:", file.size, "buffer.length:", buffer.length, "type:", file.type);
    
    if (buffer.length === 0) {
        return { success: false, message: "File rỗng hoặc bị lỗi khi tải lên" };
    }

    // Check file magic bytes to detect actual format
    const magicBytes = buffer.slice(0, 4).toString('hex');
    console.log("[importContractFromDocx] magic bytes:", magicBytes);
    
    // PK (ZIP/DOCX) starts with 504b0304
    // DOC (OLE2) starts with d0cf11e0
    // RTF starts with 7b5c7274 ({\\rt)
    // PDF starts with 25504446 (%PDF)
    
    const isZip = magicBytes.startsWith('504b');
    const isOle2 = magicBytes.startsWith('d0cf11e0');
    const isRtf = magicBytes.startsWith('7b5c7274');
    
    // If it's actually an OLE2 (.doc) file, skip mammoth and go straight to word-extractor
    if (isOle2) {
        console.log("[importContractFromDocx] Detected OLE2 (.doc) format, using word-extractor directly");
        
        // Attempt 1: word-extractor
        try {
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(buffer);
            const text = extracted.getBody();
            
            const html = text
                .split(/\n+/)
                .filter((p: string) => p.trim() !== '')
                .map((p: string) => `<p>${p}</p>`)
                .join('');
            
            if (html.length > 0) {
                return { success: true, html };
            }
        } catch (docErr: any) {
            console.error("[importContractFromDocx] word-extractor failed:", docErr.message);
        }
        
        // Attempt 2: officeparser (more robust for complex .doc files)
        try {
            console.log("[importContractFromDocx] Trying officeparser as fallback...");
            const ast = await parseOffice(buffer);
            const text = typeof ast === 'string' ? ast : ast.toText?.() || String(ast);
            
            const html = text
                .split(/\n+/)
                .filter((p: string) => p.trim() !== '')
                .map((p: string) => `<p>${p}</p>`)
                .join('');
            
            if (html.length > 0) {
                return { success: true, html };
            }
        } catch (officeErr: any) {
            console.error("[importContractFromDocx] officeparser also failed:", officeErr.message);
        }
        
        return { 
            success: false, 
            message: "Không thể đọc file .doc này. File có thể bị hỏng hoặc có cấu trúc không được hỗ trợ. Vui lòng mở file bằng Word và chọn 'Save As' -> 'Word Document (*.docx)' rồi thử lại." 
        };
    }
    
    // If it's RTF, provide a clear message
    if (isRtf) {
        return { 
            success: false, 
            message: "File này có định dạng RTF, không phải DOCX. Vui lòng mở file bằng Word và chọn 'Save As' -> 'Word Document (*.docx)' rồi thử lại." 
        };
    }

    // Try mammoth for ZIP-based DOCX
    try {
        const result = await mammoth.convertToHtml(
            { buffer },
            {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Title'] => h1:fresh",
                    "p => p",
                ]
            }
        );
        return { success: true, html: result.value };
    } catch (err: any) {
        const msg = err.message || "";
        console.error("[importContractFromDocx] mammoth failed:", msg);
        
        if (msg.includes("Can't find end of central directory")) {
            // Last resort: Try word-extractor then officeparser
            try {
                const extractor = new WordExtractor();
                const extracted = await extractor.extract(buffer);
                const text = extracted.getBody();
                
                const html = text
                    .split(/\n+/)
                    .filter((p: string) => p.trim() !== '')
                    .map((p: string) => `<p>${p}</p>`)
                    .join('');
                
                if (html.length > 0) {
                    return { success: true, html };
                }
            } catch (fallbackErr: any) {
                console.error("[importContractFromDocx] word-extractor fallback also failed:", fallbackErr.message);
            }
            
            // Try officeparser
            try {
                const ast = await parseOffice(buffer);
                const text = typeof ast === 'string' ? ast : ast.toText?.() || String(ast);
                
                const html = text
                    .split(/\n+/)
                    .filter((p: string) => p.trim() !== '')
                    .map((p: string) => `<p>${p}</p>`)
                    .join('');
                
                if (html.length > 0) {
                    return { success: true, html };
                }
            } catch (officeErr: any) {
                console.error("[importContractFromDocx] officeparser fallback also failed:", officeErr.message);
            }
            
            return { 
                success: false, 
                message: "File không đúng định dạng chuẩn DOCX. Vui lòng mở file bằng Word và chọn 'Save As' -> định dạng 'Word Document (*.docx)' rồi thử lại." 
            };
        }
        return { success: false, message: msg || "Lỗi khi trích xuất dữ liệu từ file DOCX" };
    }
}

export async function importContractFromBase64(base64String: string) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE, Permission.CONTRACT_CREATE, Permission.CONTRACT_EDIT);

    try {
        const buffer = Buffer.from(base64String, 'base64');
        
        if (buffer.length === 0) {
            return { success: false, message: "Dữ liệu file rỗng hoặc bị lỗi khi truyền tải" };
        }

        const result = await mammoth.convertToHtml(
            { buffer },
            {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Title'] => h1:fresh",
                    "p => p",
                ]
            }
        );
        return { success: true, html: result.value };
    } catch (err: any) {
        const msg = err.message || "";
        if (msg.includes("Can't find end of central directory")) {
            return { 
                success: false, 
                message: "File không đúng định dạng chuẩn DOCX. Vui lòng mở file bằng Word và chọn 'Save As' -> định dạng 'Word Document (*.docx)' rồi thử lại." 
            };
        }
        return { success: false, message: msg || "Lỗi khi trích xuất dữ liệu từ file DOCX" };
    }
}

export async function importContractFromOldDoc(base64String: string) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE, Permission.CONTRACT_CREATE, Permission.CONTRACT_EDIT);

    const buffer = Buffer.from(base64String, 'base64');
    if (buffer.length === 0) {
        return { success: false, message: "Dữ liệu file rỗng" };
    }

    // Attempt 1: word-extractor
    try {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(buffer);
        const text = extracted.getBody();

        const html = text
            .split(/\n+/)
            .filter((p: string) => p.trim() !== '')
            .map((p: string) => `<p>${p}</p>`)
            .join('');

        if (html.length > 0) {
            return { success: true, html };
        }
    } catch (err: any) {
        console.error("[importContractFromOldDoc] word-extractor failed:", err.message);
    }

    // Attempt 2: officeparser
    try {
        const ast = await parseOffice(buffer);
        const text = typeof ast === 'string' ? ast : ast.toText?.() || String(ast);

        const html = text
            .split(/\n+/)
            .filter((p: string) => p.trim() !== '')
            .map((p: string) => `<p>${p}</p>`)
            .join('');

        if (html.length > 0) {
            return { success: true, html };
        }
    } catch (officeErr: any) {
        console.error("[importContractFromOldDoc] officeparser also failed:", officeErr.message);
    }

    return { success: false, message: "Không thể đọc file .doc này. Vui lòng mở file bằng Word và lưu lại dưới định dạng .docx rồi thử lại." };
}

export async function importContractFromPdf(base64String: string) {
    await requirePermission(Permission.CONTRACT_TEMPLATE_MANAGE, Permission.CONTRACT_CREATE, Permission.CONTRACT_EDIT);

    try {
        const buffer = Buffer.from(base64String, 'base64');
        if (buffer.length === 0) {
            return { success: false, message: "Dữ liệu file rỗng" };
        }

        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        const text = data.text;

        // Convert plain text to basic HTML paragraphs
        const html = text
            .split(/\n+/)
            .filter((p: string) => p.trim() !== '')
            .map((p: string) => `<p>${p}</p>`)
            .join('');

        return { success: true, html };
    } catch (err: any) {
        return { success: false, message: err.message || "Lỗi khi trích xuất dữ liệu từ file PDF" };
    }
}

"use server";

import {
    requireAuth,
    requirePermission,
} from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { emitToAll, emitToUser } from "@/lib/socket/server";

// ─── ZOD SCHEMAS ───

const assetSchema = z.object({
    name: z.string().min(1, "Tên tài sản không được để trống"),
    code: z.string().min(1, "Mã tài sản không được để trống"),
    category: z.enum([
        "LAPTOP", "PHONE", "MONITOR", "DESK", "CHAIR", "CARD", "OTHER",
    ]),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    purchaseDate: z.date().optional(),
    purchasePrice: z.number().optional(),
    warrantyEnd: z.date().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    status: z
        .enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "DISPOSED"])
        .optional(),
});

const assignSchema = z.object({
    assetId: z.string().min(1, "Tài sản không được để trống"),
    userId: z.string().min(1, "Nhân viên không được để trống"),
    assignDate: z.date().optional(),
    expectedReturn: z.date().optional(),
    notes: z.string().optional(),
});

const returnSchema = z.object({
    assignmentId: z.string().min(1, "Phiếu cấp phát không được để trống"),
    condition: z.enum(["GOOD", "DAMAGED", "LOST"]).optional(),
    notes: z.string().optional(),
});

// ─── STATS ───

export async function getAssetStats() {
    await requirePermission(
        Permission.ASSET_VIEW_ALL,
        Permission.ASSET_VIEW_SELF,
    );

    const [total, available, assigned, maintenance, disposed, totalValueAgg] =
        await Promise.all([
            prisma.asset.count(),
            prisma.asset.count({ where: { status: "AVAILABLE" } }),
            prisma.asset.count({ where: { status: "ASSIGNED" } }),
            prisma.asset.count({ where: { status: "MAINTENANCE" } }),
            prisma.asset.count({ where: { status: "DISPOSED" } }),
            prisma.asset.aggregate({
                _sum: { purchasePrice: true },
                where: { status: { not: "DISPOSED" } },
            }),
        ]);

    return {
        totalAssets: total,
        availableAssets: available,
        assignedAssets: assigned,
        maintenanceAssets: maintenance,
        disposedAssets: disposed,
        totalValue: totalValueAgg._sum.purchasePrice
            ? Number(totalValueAgg._sum.purchasePrice)
            : 0,
    };
}

// ─── GET ASSETS (paginated + filter) ───

export async function getAssets(
    filters?: {
        category?: string;
        status?: string;
        search?: string;
    },
    options?: { page?: number; limit?: number },
) {
    await requirePermission(Permission.ASSET_VIEW_ALL);

    const { category, status, search } = filters || {};
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (category && category !== "") where.category = category;
    if (status && status !== "") where.status = status;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { serialNumber: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.asset.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                assignments: {
                    where: { status: "ASSIGNED" },
                    take: 1,
                    orderBy: { assignDate: "desc" },
                },
            },
        }),
        prisma.asset.count({ where }),
    ]);

    // Fetch current user names for assigned assets
    const assignedUserIds = items
        .flatMap((item) => item.assignments.map((a) => a.userId))
        .filter(Boolean);

    const users =
        assignedUserIds.length > 0
            ? await prisma.user.findMany({
                  where: { id: { in: assignedUserIds } },
                  select: { id: true, name: true },
              })
            : [];

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const itemsMapped = items.map((item) => {
        const currentAssignment = item.assignments[0] || null;
        return {
            id: item.id,
            name: item.name,
            code: item.code,
            category: item.category,
            status: item.status,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            purchaseDate: item.purchaseDate?.toISOString() || null,
            purchasePrice: item.purchasePrice
                ? Number(item.purchasePrice)
                : null,
            warrantyEnd: item.warrantyEnd?.toISOString() || null,
            location: item.location,
            description: item.description,
            createdBy: item.createdBy,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
            currentUserName: currentAssignment
                ? userMap.get(currentAssignment.userId) || null
                : null,
            currentUserId: currentAssignment?.userId || null,
            currentAssignmentId: currentAssignment?.id || null,
        };
    });

    return {
        items: itemsMapped,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

// ─── GET ASSET BY ID ───

export async function getAssetById(id: string) {
    await requirePermission(Permission.ASSET_VIEW_ALL);

    const item = await prisma.asset.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: { assignDate: "desc" },
            },
        },
    });

    if (!item) return null;

    // Fetch user names for all assignments
    const userIds = [
        ...new Set([
            ...item.assignments.map((a) => a.userId),
            ...item.assignments
                .map((a) => a.assignedBy)
                .filter(Boolean) as string[],
            ...item.assignments
                .map((a) => a.returnedTo)
                .filter(Boolean) as string[],
        ]),
    ];

    const users =
        userIds.length > 0
            ? await prisma.user.findMany({
                  where: { id: { in: userIds } },
                  select: { id: true, name: true },
              })
            : [];

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        status: item.status,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        purchaseDate: item.purchaseDate?.toISOString() || null,
        purchasePrice: item.purchasePrice
            ? Number(item.purchasePrice)
            : null,
        warrantyEnd: item.warrantyEnd?.toISOString() || null,
        location: item.location,
        description: item.description,
        createdBy: item.createdBy,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        assignments: item.assignments.map((a) => ({
            id: a.id,
            assetId: a.assetId,
            userId: a.userId,
            userName: userMap.get(a.userId) || "—",
            assignedBy: a.assignedBy,
            assignedByName: a.assignedBy
                ? userMap.get(a.assignedBy) || null
                : null,
            assignDate: a.assignDate.toISOString(),
            expectedReturn: a.expectedReturn?.toISOString() || null,
            returnDate: a.returnDate?.toISOString() || null,
            returnedTo: a.returnedTo,
            returnedToName: a.returnedTo
                ? userMap.get(a.returnedTo) || null
                : null,
            status: a.status,
            condition: a.condition,
            notes: a.notes,
            createdAt: a.createdAt.toISOString(),
        })),
    };
}

// ─── CREATE ASSET ───

export async function createAsset(data: z.infer<typeof assetSchema>) {
    const session = await requirePermission(Permission.ASSET_MANAGE);

    const validated = assetSchema.parse(data);

    // Check unique code
    const existing = await prisma.asset.findUnique({
        where: { code: validated.code },
    });
    if (existing) {
        throw new Error("Mã tài sản đã tồn tại");
    }

    const item = await prisma.asset.create({
        data: {
            name: validated.name,
            code: validated.code,
            category: validated.category,
            brand: validated.brand || null,
            model: validated.model || null,
            serialNumber: validated.serialNumber || null,
            purchaseDate: validated.purchaseDate
                ? new Date(validated.purchaseDate)
                : null,
            purchasePrice: validated.purchasePrice || null,
            warrantyEnd: validated.warrantyEnd
                ? new Date(validated.warrantyEnd)
                : null,
            location: validated.location || null,
            description: validated.description || null,
            createdBy: session.user.id,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "CREATE",
            entity: "Asset",
            entityId: item.id,
            newData: { name: item.name, code: item.code, category: item.category },
        },
    });

    // Emit socket event
    emitToAll("asset:created", {
        assetId: item.id,
        assetName: item.name,
        assetCode: item.code,
        category: item.category,
        createdBy: session.user.id,
        createdByName: session.user.name,
    });

    revalidatePath("/assets");
    return item;
}

// ─── UPDATE ASSET ───

export async function updateAsset(
    id: string,
    data: Partial<z.infer<typeof assetSchema>>,
) {
    const session = await requirePermission(Permission.ASSET_MANAGE);

    const validated = assetSchema.partial().parse(data);

    const updateData: Record<string, unknown> = { ...validated };

    if (validated.purchaseDate) {
        updateData.purchaseDate = new Date(validated.purchaseDate);
    }
    if (validated.warrantyEnd) {
        updateData.warrantyEnd = new Date(validated.warrantyEnd);
    }

    // Remove optional empty strings
    if (validated.brand === "") updateData.brand = null;
    if (validated.model === "") updateData.model = null;
    if (validated.serialNumber === "") updateData.serialNumber = null;
    if (validated.location === "") updateData.location = null;
    if (validated.description === "") updateData.description = null;

    const item = await prisma.asset.update({
        where: { id },
        data: updateData,
    });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "Asset",
            entityId: item.id,
            newData: updateData as Prisma.InputJsonValue,
        },
    });

    // Emit socket event
    emitToAll("asset:updated", {
        assetId: item.id,
        changes: updateData,
    });

    revalidatePath("/assets");
    return item;
}

// ─── DELETE ASSET ───

export async function deleteAsset(id: string) {
    const session = await requirePermission(Permission.ASSET_MANAGE);

    // Check if asset is currently assigned
    const activeAssignment = await prisma.assetAssignment.findFirst({
        where: { assetId: id, status: "ASSIGNED" },
    });

    if (activeAssignment) {
        throw new Error(
            "Không thể xóa tài sản đang được cấp phát. Vui lòng thu hồi trước.",
        );
    }

    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
        throw new Error("Tài sản không tồn tại");
    }

    await prisma.asset.delete({ where: { id } });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "DELETE",
            entity: "Asset",
            entityId: id,
            oldData: { name: asset.name, code: asset.code },
        },
    });

    // Emit socket event
    emitToAll("asset:deleted", {
        assetId: id,
        assetName: asset.name,
        assetCode: asset.code,
    });

    revalidatePath("/assets");
    return { success: true };
}

// ─── ASSIGN ASSET ───

export async function assignAsset(data: z.infer<typeof assignSchema>) {
    const session = await requirePermission(Permission.ASSET_MANAGE);

    const validated = assignSchema.parse(data);

    // Check asset is available
    const asset = await prisma.asset.findUnique({
        where: { id: validated.assetId },
    });

    if (!asset) throw new Error("Tài sản không tồn tại");
    if (asset.status === "ASSIGNED") {
        throw new Error("Tài sản đã được cấp phát cho người khác");
    }
    if (asset.status === "DISPOSED") {
        throw new Error("Tài sản đã thanh lý, không thể cấp phát");
    }

    // Create assignment + update asset status in transaction
    const [assignment] = await prisma.$transaction([
        prisma.assetAssignment.create({
            data: {
                assetId: validated.assetId,
                userId: validated.userId,
                assignedBy: session.user.id,
                assignDate: validated.assignDate
                    ? new Date(validated.assignDate)
                    : new Date(),
                expectedReturn: validated.expectedReturn
                    ? new Date(validated.expectedReturn)
                    : null,
                notes: validated.notes || null,
                status: "ASSIGNED",
            },
        }),
        prisma.asset.update({
            where: { id: validated.assetId },
            data: { status: "ASSIGNED" },
        }),
    ]);

    // Get assigned user info
    const assignedUser = await prisma.user.findUnique({
        where: { id: validated.userId },
        select: { name: true },
    });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "CREATE",
            entity: "AssetAssignment",
            entityId: assignment.id,
            newData: {
                assetId: validated.assetId,
                assetName: asset.name,
                userId: validated.userId,
            },
        },
    });

    // Emit socket events
    emitToAll("asset:assigned", {
        assetId: asset.id,
        assetName: asset.name,
        userId: validated.userId,
        userName: assignedUser?.name || "",
        assignedBy: session.user.id,
        assignedByName: session.user.name,
        assignDate: assignment.assignDate,
        expectedReturn: assignment.expectedReturn?.toISOString(),
    });
    emitToUser(validated.userId, "asset:assigned", {
        assetId: asset.id,
        assetName: asset.name,
        userId: validated.userId,
        userName: assignedUser?.name || "",
        assignedBy: session.user.id,
        assignedByName: session.user.name,
        assignDate: assignment.assignDate,
        expectedReturn: assignment.expectedReturn?.toISOString(),
    });

    revalidatePath("/assets");
    return assignment;
}

// ─── RETURN ASSET ───

export async function returnAsset(data: z.infer<typeof returnSchema>) {
    const session = await requirePermission(Permission.ASSET_MANAGE);

    const validated = returnSchema.parse(data);

    const assignment = await prisma.assetAssignment.findUnique({
        where: { id: validated.assignmentId },
        include: { asset: true },
    });

    if (!assignment) throw new Error("Phiếu cấp phát không tồn tại");
    if (assignment.status === "RETURNED") {
        throw new Error("Tài sản đã được thu hồi trước đó");
    }

    // Determine new asset status based on condition
    let newAssetStatus = "AVAILABLE";
    if (validated.condition === "DAMAGED") {
        newAssetStatus = "MAINTENANCE";
    } else if (validated.condition === "LOST") {
        newAssetStatus = "DISPOSED";
    }

    await prisma.$transaction([
        prisma.assetAssignment.update({
            where: { id: validated.assignmentId },
            data: {
                status: "RETURNED",
                returnDate: new Date(),
                returnedTo: session.user.id,
                condition: validated.condition || "GOOD",
                notes: validated.notes || null,
            },
        }),
        prisma.asset.update({
            where: { id: assignment.assetId },
            data: { status: newAssetStatus },
        }),
    ]);

    // Get user info
    const assignedUser = await prisma.user.findUnique({
        where: { id: assignment.userId },
        select: { name: true },
    });

    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            userName: session.user.name,
            action: "UPDATE",
            entity: "AssetAssignment",
            entityId: validated.assignmentId,
            newData: {
                action: "RETURN",
                assetName: assignment.asset.name,
                condition: validated.condition,
            },
        },
    });

    // Emit socket events
    emitToAll("asset:returned", {
        assetId: assignment.assetId,
        assetName: assignment.asset.name,
        userId: assignment.userId,
        userName: assignedUser?.name || "",
        returnedBy: session.user.id,
        returnedByName: session.user.name,
        returnDate: new Date(),
        condition: validated.condition || "GOOD",
    });
    emitToUser(assignment.userId, "asset:returned", {
        assetId: assignment.assetId,
        assetName: assignment.asset.name,
        userId: assignment.userId,
        userName: assignedUser?.name || "",
        returnedBy: session.user.id,
        returnedByName: session.user.name,
        returnDate: new Date(),
        condition: validated.condition || "GOOD",
    });

    revalidatePath("/assets");
    return { success: true };
}

// ─── MY ASSETS ───

export async function getMyAssets() {
    const session = await requireAuth();

    const assignments = await prisma.assetAssignment.findMany({
        where: {
            userId: session.user.id,
            status: "ASSIGNED",
        },
        include: {
            asset: true,
        },
        orderBy: { assignDate: "desc" },
    });

    return assignments.map((a) => ({
        id: a.id,
        assetId: a.assetId,
        assetName: a.asset.name,
        assetCode: a.asset.code,
        category: a.asset.category,
        brand: a.asset.brand,
        model: a.asset.model,
        serialNumber: a.asset.serialNumber,
        assignDate: a.assignDate.toISOString(),
        expectedReturn: a.expectedReturn?.toISOString() || null,
        notes: a.notes,
    }));
}

// ─── USERS LIST (for assign dropdown) ───

export async function getUsersList() {
    await requirePermission(Permission.ASSET_MANAGE);

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
        },
        orderBy: { name: "asc" },
        take: 200,
    });

    return users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        departmentName: null as string | null,
    }));
}

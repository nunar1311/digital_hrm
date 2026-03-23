"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";

/**
 * Kiểu dữ liệu Authority Type trả về cho client
 */
export interface AuthorityTypeItem {
    code: string;
    name: string;
    level: number;
    icon: string | null;
    color: string | null;
    bgColor: string | null;
    textColor: string | null;
    isActive: boolean;
    sortOrder: number;
}

/**
 * Lấy danh sách tất cả Authority Types từ database
 * Được sử dụng cho dropdown quyền hạn trong các form chức vụ
 */
export async function getAuthorityTypes(
    includeInactive = false,
): Promise<AuthorityTypeItem[]> {
    await requirePermission(Permission.DEPT_VIEW);

    const where = includeInactive ? {} : { isActive: true };

    const authorityTypes = await prisma.authorityType.findMany({
        where,
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    return authorityTypes.map((a) => ({
        code: a.code,
        name: a.name,
        level: a.level,
        icon: a.icon,
        color: a.color,
        bgColor: a.bgColor,
        textColor: a.textColor,
        isActive: a.isActive,
        sortOrder: a.sortOrder,
    }));
}

/**
 * Lấy một Authority Type theo code
 */
export async function getAuthorityTypeByCode(
    code: string,
): Promise<AuthorityTypeItem | null> {
    const authorityType = await prisma.authorityType.findUnique({
        where: { code },
    });

    if (!authorityType) return null;

    return {
        code: authorityType.code,
        name: authorityType.name,
        level: authorityType.level,
        icon: authorityType.icon,
        color: authorityType.color,
        bgColor: authorityType.bgColor,
        textColor: authorityType.textColor,
        isActive: authorityType.isActive,
        sortOrder: authorityType.sortOrder,
    };
}

/**
 * Tạo Authority Type mới
 */
export async function createAuthorityType(data: {
    code: string;
    name: string;
    level?: number;
    icon?: string;
    color?: string;
    bgColor?: string;
    textColor?: string;
    sortOrder?: number;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_CREATE);

        const existing = await prisma.authorityType.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            return { success: false, error: "Mã quyền hạn đã tồn tại" };
        }

        const authorityType = await prisma.authorityType.create({
            data: {
                code: data.code,
                name: data.name,
                level: data.level ?? 0,
                icon: data.icon,
                color: data.color,
                bgColor: data.bgColor,
                textColor: data.textColor,
                sortOrder: data.sortOrder ?? 0,
            },
        });

        revalidatePath("/positions");
        return { success: true, id: authorityType.id };
    } catch (err) {
        console.error("createAuthorityType error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi tạo quyền hạn" };
    }
}

/**
 * Cập nhật Authority Type
 */
export async function updateAuthorityType(
    code: string,
    data: {
        name?: string;
        level?: number;
        icon?: string;
        color?: string;
        bgColor?: string;
        textColor?: string;
        isActive?: boolean;
        sortOrder?: number;
    },
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_EDIT);

        const existing = await prisma.authorityType.findUnique({
            where: { code },
        });
        if (!existing) {
            return { success: false, error: "Quyền hạn không tồn tại" };
        }

        await prisma.authorityType.update({
            where: { code },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.level !== undefined && { level: data.level }),
                ...(data.icon !== undefined && { icon: data.icon }),
                ...(data.color !== undefined && { color: data.color }),
                ...(data.bgColor !== undefined && { bgColor: data.bgColor }),
                ...(data.textColor !== undefined && { textColor: data.textColor }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
        });

        revalidatePath("/positions");
        return { success: true };
    } catch (err) {
        console.error("updateAuthorityType error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi cập nhật quyền hạn" };
    }
}

/**
 * Xóa Authority Type
 */
export async function deleteAuthorityType(
    code: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_DELETE);

        const existing = await prisma.authorityType.findUnique({
            where: { code },
        });
        if (!existing) {
            return { success: false, error: "Quyền hạn không tồn tại" };
        }

        // Check if any positions use this authority
        const positionsUsing = await prisma.position.count({
            where: { authority: code },
        });

        if (positionsUsing > 0) {
            return {
                success: false,
                error: `Có ${positionsUsing} chức vụ đang sử dụng quyền hạn này. Vui lòng cập nhật chức vụ trước.`,
            };
        }

        await prisma.authorityType.delete({
            where: { code },
        });

        revalidatePath("/positions");
        return { success: true };
    } catch (err) {
        console.error("deleteAuthorityType error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi xóa quyền hạn" };
    }
}

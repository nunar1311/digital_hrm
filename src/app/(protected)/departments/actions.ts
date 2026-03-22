"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import type {
    DepartmentListItem,
    DepartmentStats,
    GetDepartmentsParams,
    GetDepartmentsResult,
} from "./types";
import {
    getDepartmentTree,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from "../org-chart/actions";

export {
    getDepartmentTree,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};

/**
 * Lấy danh sách phòng ban dạng phẳng với pagination, search, filter, sort
 */
export async function getDepartments(
    params: GetDepartmentsParams,
): Promise<GetDepartmentsResult> {
    await requirePermission(Permission.DEPT_VIEW);

    const {
        page = 1,
        pageSize = 20,
        search,
        status = "ALL",
        parentId,
        sortBy = "name",
        sortOrder = "asc",
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status !== "ALL") {
        where.status = status;
    }

    // Handle parentId filter - null means "no parent (root)", undefined means "all"
    if (parentId !== undefined) {
        where.parentId = parentId;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
        ];
    }

    // Get departments with related data
    const [departments, total] = await Promise.all([
        prisma.department.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [sortBy === "employeeCount" ? "sortOrder" : sortBy]:
                    sortOrder,
            },
            include: {
                users: {
                    where: { employeeStatus: "ACTIVE" },
                    orderBy: [
                        { position: { level: "asc" } },
                        { departmentRole: "asc" },
                    ],
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        position: true,
                        departmentRole: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        positions: true,
                    },
                },
            },
        }),
        prisma.department.count({ where }),
    ]);

    // Get employee counts for each department
    const departmentIds = departments.map((d) => d.id);
    const employeeCounts = await prisma.user.groupBy({
        by: ["departmentId"],
        where: {
            departmentId: { in: departmentIds },
        },
        _count: {
            id: true,
        },
    });

    const employeeCountMap = new Map(
        employeeCounts.map((e) => [e.departmentId, e._count.id]),
    );

    // Auto-determine manager: user with lowest position.level in department (HEAD as tiebreaker)
    const getAutoManager = (dept: {
        users: { id: string; name: string; image: string | null; position: { name: string } | null; departmentRole: string }[];
    }) => {
        const topUser = dept.users[0];
        if (!topUser) return null;
        return {
            id: topUser.id,
            name: topUser.name,
            image: topUser.image,
            position: topUser.position?.name ?? null,
        };
    };

    // Transform to list items
    const items: DepartmentListItem[] = departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        logo: dept.logo,
        status: dept.status as "ACTIVE" | "INACTIVE",
        sortOrder: dept.sortOrder,
        parentId: dept.parentId,
        secondaryParentIds: dept.secondaryParentIds,
        managerId: dept.managerId,
        manager: getAutoManager(dept),
        employeeCount: employeeCountMap.get(dept.id) || 0,
        positionCount: dept._count.positions,
        children: [],
        parentName: dept.parent?.name || null,
    }));

    return {
        departments: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Lấy thống kê phòng ban
 */
export async function getDepartmentStats(): Promise<DepartmentStats> {
    await requirePermission(Permission.DEPT_VIEW);

    const [
        totalDepartments,
        activeDepartments,
        inactiveDepartments,
        totalEmployees,
    ] = await Promise.all([
        prisma.department.count(),
        prisma.department.count({ where: { status: "ACTIVE" } }),
        prisma.department.count({ where: { status: "INACTIVE" } }),
        prisma.user.count({ where: { departmentId: { not: null } } }),
    ]);

    return {
        totalDepartments,
        activeDepartments,
        inactiveDepartments,
        totalEmployees,
    };
}

/**
 * Lấy danh sách tất cả phòng ban (dạng phẳng) cho dropdown/filter
 */
export async function getAllDepartments(): Promise<
    DepartmentListItem[]
> {
    await requirePermission(Permission.DEPT_VIEW);

    const departments = await prisma.department.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
            users: {
                where: { employeeStatus: "ACTIVE" },
                orderBy: [
                    { position: { level: "asc" } },
                    { departmentRole: "asc" },
                ],
                take: 1,
                select: {
                    id: true,
                    name: true,
                    image: true,
                    position: true,
                    departmentRole: true,
                },
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            _count: {
                select: {
                    positions: true,
                },
            },
        },
    });

    // Get employee counts
    const employeeCounts = await prisma.user.groupBy({
        by: ["departmentId"],
        where: {
            departmentId: { in: departments.map((d) => d.id) },
        },
        _count: {
            id: true,
        },
    });

    const employeeCountMap = new Map(
        employeeCounts.map((e) => [e.departmentId, e._count.id]),
    );

    // Auto-determine manager: user with lowest position.level in department (HEAD as tiebreaker)
    const getAutoManager = (dept: {
        users: { id: string; name: string; image: string | null; position: { name: string } | null; departmentRole: string }[];
    }) => {
        const topUser = dept.users[0];
        if (!topUser) return null;
        return {
            id: topUser.id,
            name: topUser.name,
            image: topUser.image,
            position: topUser.position?.name ?? null,
        };
    };

    return departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        logo: dept.logo,
        status: dept.status as "ACTIVE" | "INACTIVE",
        sortOrder: dept.sortOrder,
        parentId: dept.parentId,
        secondaryParentIds: dept.secondaryParentIds,
        managerId: dept.managerId,
        manager: getAutoManager(dept),
        employeeCount: employeeCountMap.get(dept.id) || 0,
        positionCount: dept._count.positions,
        children: [],
        parentName: dept.parent?.name || null,
    }));
}

/**
 * Lấy chi tiết một phòng ban
 */
export async function getDepartmentById(
    id: string,
): Promise<DepartmentListItem | null> {
    await requirePermission(Permission.DEPT_VIEW);

    const dept = await prisma.department.findUnique({
        where: { id },
        include: {
            manager: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    position: true,
                    employeeCode: true,
                },
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            _count: {
                select: {
                    positions: true,
                },
            },
        },
    });

    if (!dept) return null;

    const employeeCount = await prisma.user.count({
        where: { departmentId: id },
    });

    return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        logo: dept.logo,
        status: dept.status as "ACTIVE" | "INACTIVE",
        sortOrder: dept.sortOrder,
        parentId: dept.parentId,
        secondaryParentIds: dept.secondaryParentIds,
        managerId: dept.managerId,
        manager: dept.manager
            ? {
                  id: dept.manager.id,
                  name: dept.manager.name,
                  image: dept.manager.image,
                  position: dept.manager.position?.name ?? null,
              }
            : null,
        employeeCount,
        positionCount: dept._count.positions,
        children: [],
        parentName: dept.parent?.name || null,
    };
}

/**
 * Lấy danh sách nhân viên trong một phòng ban
 */
export async function getDepartmentEmployees(
    departmentId: string,
    params: {
        page?: number;
        pageSize?: number;
        search?: string;
    } = {},
) {
    await requirePermission(Permission.DEPT_VIEW);

    const { page = 1, pageSize = 20, search } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { departmentId };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            {
                employeeCode: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const [employees, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                employeeCode: true,
                position: true,
                hrmRole: true,
                departmentRole: true,
                createdAt: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        employees,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Lấy danh sách nhân viên có thể làm trưởng phòng
 */
export async function getPotentialManagers(): Promise<
    {
        id: string;
        name: string;
        employeeCode: string | null;
        position: string | null;
        image: string | null;
    }[]
> {
    await requirePermission(Permission.DEPT_VIEW);

    const employees = await prisma.user.findMany({
        where: {
            employeeCode: { not: null },
        },
        select: {
            id: true,
            name: true,
            employeeCode: true,
            position: { select: { name: true } },
            image: true,
        },
        orderBy: { name: "asc" },
    });

    return employees.map((e) => ({
        id: e.id,
        name: e.name,
        employeeCode: e.employeeCode,
        position: e.position?.name ?? null,
        image: e.image,
    }));
}

/**
 * Cập nhật vai trò phòng ban của nhân viên
 * Ràng buộc: mỗi phòng ban chỉ có 1 Trưởng phòng và 1 Phó phòng
 * - Khi đặt HEAD: tìm HEAD cũ trong phòng, hạ xuống MEMBER, set Department.managerId
 * - Khi đặt DEPUTY: tìm DEPUTY cũ trong phòng, hạ xuống MEMBER
 * - Khi đặt MEMBER: nếu là HEAD cũ thì xóa Department.managerId
 */
export async function updateDepartmentRole(
    employeeId: string,
    departmentId: string,
    role: "HEAD" | "DEPUTY" | "MEMBER",
): Promise<{ success: boolean; error?: string }> {
    await requirePermission(Permission.EMPLOYEE_EDIT);

    const employee = await prisma.user.findFirst({
        where: { id: employeeId, departmentId },
    });
    if (!employee) {
        return {
            success: false,
            error: "Nhân viên không thuộc phòng ban này",
        };
    }

    // Nếu đã giữ vai trò này rồi thì bỏ qua
    if (employee.departmentRole === role) {
        return { success: true };
    }

    // --- Hạ HEAD cũ khi thay thế bằng HEAD mới ---
    if (role === "HEAD") {
        const currentHead = await prisma.user.findFirst({
            where: {
                departmentId,
                departmentRole: "HEAD",
                id: { not: employeeId },
            },
        });
        if (currentHead) {
            await prisma.user.update({
                where: { id: currentHead.id },
                data: { departmentRole: "MEMBER" },
            });
        }
    }

    if (role === "DEPUTY") {
        // Hạ DEPUTY cũ xuống MEMBER
        const currentDeputy = await prisma.user.findFirst({
            where: {
                departmentId,
                departmentRole: "DEPUTY",
                id: { not: employeeId },
            },
        });
        if (currentDeputy) {
            await prisma.user.update({
                where: { id: currentDeputy.id },
                data: { departmentRole: "MEMBER" },
            });
        }
    }

    // --- Cập nhật vai trò mới ---
    await prisma.user.update({
        where: { id: employeeId },
        data: { departmentRole: role },
    });

    // Sync Department.managerId cho HEAD
    if (role === "HEAD") {
        await prisma.department.update({
            where: { id: departmentId },
            data: { managerId: employeeId },
        });
    } else if (
        employee.departmentRole === "HEAD" ||
        (await prisma.department.findUnique({ where: { id: departmentId } }))
            ?.managerId === employeeId
    ) {
        await prisma.department.update({
            where: { id: departmentId },
            data: { managerId: null },
        });
    }

    revalidatePath(`/departments/${departmentId}`);
    revalidatePath("/employees");
    return { success: true };
}

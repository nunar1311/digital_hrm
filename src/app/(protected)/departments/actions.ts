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
    DepartmentPosition,
    CreatePositionForDepartmentInput,
    UpdatePositionForDepartmentInput,
    PositionSalaryItem,
    CreatePositionSalaryInput,
    UpdatePositionSalaryInput,
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
        users: {
            id: string;
            name: string;
            image: string | null;
            position: { name: string } | null;
            departmentRole: string | null;
        }[];
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
        users: {
            id: string;
            name: string;
            image: string | null;
            position: { name: string } | null;
            departmentRole: string | null;
        }[];
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
 * Cập nhật chức vụ phòng ban của nhân viên
 * Ràng buộc: mỗi phòng ban chỉ có 1 Trưởng phòng và 1 Phó phòng
 * - Khi đặt HEAD: tìm Position có authority=MANAGER trong phòng ban, assign cho nhân viên
 * - Khi đặt DEPUTY: tìm Position có authority=DEPUTY trong phòng ban, assign cho nhân viên
 * - Khi đặt MEMBER: xóa Position MANGAER/DEPUTY khỏi nhân viên, cập nhật department.managerId
 */
export async function updateDepartmentRole(
    employeeId: string,
    departmentId: string,
    role: "HEAD" | "DEPUTY" | "MEMBER",
): Promise<{ success: boolean; error?: string }> {
    await requirePermission(Permission.EMPLOYEE_EDIT);

    // Kiểm tra nhân viên thuộc phòng ban
    const employee = await prisma.user.findFirst({
        where: { id: employeeId, departmentId },
        include: {
            position: { select: { id: true, authority: true } },
        },
    });
    if (!employee) {
        return {
            success: false,
            error: "Nhân viên không thuộc phòng ban này",
        };
    }

    // Nếu giữ vai trò này rồi thì bỏ qua
    if (
        role === "HEAD" &&
        employee.position?.authority === "MANAGER"
    ) {
        return { success: true };
    }
    if (
        role === "DEPUTY" &&
        employee.position?.authority === "DEPUTY"
    ) {
        return { success: true };
    }
    if (role === "MEMBER" && !employee.position) {
        return { success: true };
    }

    // --- Xử lý HEAD: gán Position authority=MANAGER ---
    if (role === "HEAD") {
        // Tìm position MANAGER trong phòng ban
        const managerPosition = await prisma.position.findFirst({
            where: {
                departmentId,
                authority: "MANAGER",
                status: "ACTIVE",
            },
        });
        if (!managerPosition) {
            return {
                success: false,
                error: "Không tìm thấy chức vụ Trưởng phòng (MANAGER) trong phòng ban này. Vui lòng tạo chức vụ Trưởng phòng trước.",
            };
        }

        // Gỡ position MANAGER khỏi nhân viên hiện tại giữ chức
        // Tìm position STAFF trong phòng ban để assign, nếu không có thì xóa hết
        const fallbackPosition = await prisma.position.findFirst({
            where: {
                departmentId,
                authority: "STAFF",
                status: "ACTIVE",
            },
        });
        const currentHolder = await prisma.user.findFirst({
            where: {
                positionId: managerPosition.id,
                id: { not: employeeId },
            },
        });
        if (currentHolder) {
            await prisma.user.update({
                where: { id: currentHolder.id },
                data: {
                    positionId: fallbackPosition?.id ?? null,
                    departmentRole: "MEMBER",
                },
            });
        }

        // Gán position mới cho nhân viên
        await prisma.user.update({
            where: { id: employeeId },
            data: {
                positionId: managerPosition.id,
                departmentRole: "HEAD",
            },
        });

        // Sync Department.managerId
        await prisma.department.update({
            where: { id: departmentId },
            data: { managerId: employeeId },
        });
    }

    // --- Xử lý DEPUTY: gán Position authority=DEPUTY ---
    else if (role === "DEPUTY") {
        const deputyPosition = await prisma.position.findFirst({
            where: {
                departmentId,
                authority: "DEPUTY",
                status: "ACTIVE",
            },
        });
        if (!deputyPosition) {
            return {
                success: false,
                error: "Không tìm thấy chức vụ Phó phòng (DEPUTY) trong phòng ban này. Vui lòng tạo chức vụ Phó phòng trước.",
            };
        }

        // Tìm position STAFF trong phòng ban để assign, nếu không có thì xóa hết
        const fallbackPosition = await prisma.position.findFirst({
            where: {
                departmentId,
                authority: "STAFF",
                status: "ACTIVE",
            },
        });
        const currentHolder = await prisma.user.findFirst({
            where: {
                positionId: deputyPosition.id,
                id: { not: employeeId },
            },
        });
        if (currentHolder) {
            await prisma.user.update({
                where: { id: currentHolder.id },
                data: {
                    positionId: fallbackPosition?.id ?? null,
                    departmentRole: "MEMBER",
                },
            });
        }

        await prisma.user.update({
            where: { id: employeeId },
            data: {
                positionId: deputyPosition.id,
                departmentRole: "DEPUTY",
            },
        });
    }

    // --- Xử lý MEMBER: xóa position lãnh đạo ---
    else if (role === "MEMBER") {
        const currentPosition = await prisma.position.findUnique({
            where: { id: employee.positionId ?? undefined },
        });

        // Gỡ position hiện tại nếu là MANAGER hoặc DEPUTY
        if (
            currentPosition &&
            (currentPosition.authority === "MANAGER" ||
                currentPosition.authority === "DEPUTY")
        ) {
            await prisma.user.update({
                where: { id: employeeId },
                data: { positionId: null, departmentRole: "MEMBER" },
            });
        } else {
            await prisma.user.update({
                where: { id: employeeId },
                data: { departmentRole: "MEMBER" },
            });
        }

        // Nếu nhân viên đang là trưởng phòng thì xóa managerId
        const dept = await prisma.department.findUnique({
            where: { id: departmentId },
            select: { managerId: true },
        });
        if (dept?.managerId === employeeId) {
            await prisma.department.update({
                where: { id: departmentId },
                data: { managerId: null },
            });
        }
    }

    revalidatePath(`/departments/${departmentId}`);
    revalidatePath("/employees");
    return { success: true };
}

// =============================================
// POSITION MANAGEMENT (Department-scoped)
// =============================================

// Authority values that are constrained to 1 per department
const UNIQUE_AUTHORITY_PER_DEPT = ["MANAGER", "DEPUTY"];

/**
 * Lấy danh sách chức vụ thuộc một phòng ban
 */
export async function getDepartmentPositions(
    departmentId: string,
): Promise<DepartmentPosition[]> {
    await requirePermission(Permission.DEPT_VIEW);

    const positions = await prisma.position.findMany({
        where: { departmentId },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
        include: {
            _count: { select: { users: true } },
        },
    });

    if (positions.length === 0) {
        return [];
    }

    // Lấy user đang giữ mỗi position
    const positionIds = positions.map((p) => p.id);
    const positionHolders = await prisma.user.findMany({
        where: {
            positionId: { in: positionIds },
            employeeStatus: { not: "RESIGNED" },
        },
        select: {
            id: true,
            name: true,
            image: true,
            employeeCode: true,
            positionId: true,
        },
    });

    const holdersByPosition = new Map(
        positionHolders.map((u) => [u.positionId, u]),
    );

    return positions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        authority: p.authority,
        level: p.level,
        status: p.status,
        sortOrder: p.sortOrder,
        description: p.description,
        minSalary: p.minSalary?.toString() ?? null,
        maxSalary: p.maxSalary?.toString() ?? null,
        userCount: p._count.users,
        holder: holdersByPosition.get(p.id) ?? null,
    }));
}

/**
 * Tạo chức vụ mới cho phòng ban
 */
export async function createPositionForDepartment(
    departmentId: string,
    data: CreatePositionForDepartmentInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_CREATE);

        // Check department exists
        const dept = await prisma.department.findUnique({
            where: { id: departmentId },
        });
        if (!dept) {
            return { success: false, error: "Phòng ban không tồn tại" };
        }

        // Check unique code
        const existingCode = await prisma.position.findUnique({
            where: { code: data.code },
        });
        if (existingCode) {
            return { success: false, error: "Mã chức vụ đã tồn tại" };
        }

        // Check unique authority constraint (MANAGER, DEPUTY only 1 per dept)
        if (UNIQUE_AUTHORITY_PER_DEPT.includes(data.authority)) {
            const existingAuth = await prisma.position.findFirst({
                where: {
                    departmentId,
                    authority: data.authority,
                    status: "ACTIVE",
                },
            });
            if (existingAuth) {
                const authLabel =
                    data.authority === "MANAGER" ? "Trưởng phòng" : "Phó phòng";
                return {
                    success: false,
                    error: `Phòng ban đã có chức vụ ${authLabel}. Không thể tạo thêm.`,
                };
            }
        }

        // Get max sortOrder if not provided
        let sortOrder = data.sortOrder;
        if (sortOrder === undefined) {
            const maxOrder = await prisma.position.aggregate({
                where: { departmentId },
                _max: { sortOrder: true },
            });
            sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;
        }

        const position = await prisma.position.create({
            data: {
                name: data.name,
                code: data.code,
                authority: data.authority,
                departmentId,
                level: data.level ?? 1,
                description: data.description,
                minSalary: data.minSalary,
                maxSalary: data.maxSalary,
                sortOrder,
                status: "ACTIVE",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "CREATE",
                entity: "Position",
                entityId: position.id,
                newData: { ...data, departmentId },
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath(`/departments/${departmentId}`);
        revalidatePath("/positions");

        return { success: true, id: position.id };
    } catch (err) {
        console.error("createPositionForDepartment error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi tạo chức vụ" };
    }
}

/**
 * Cập nhật chức vụ trong phòng ban
 */
export async function updatePositionForDepartment(
    positionId: string,
    departmentId: string,
    data: UpdatePositionForDepartmentInput,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_EDIT);

        // Check position belongs to department
        const position = await prisma.position.findFirst({
            where: { id: positionId, departmentId },
        });
        if (!position) {
            return { success: false, error: "Chức vụ không tồn tại trong phòng ban này" };
        }

        // Check unique code (if changed)
        if (data.code && data.code !== position.code) {
            const existingCode = await prisma.position.findFirst({
                where: { code: data.code, NOT: { id: positionId } },
            });
            if (existingCode) {
                return { success: false, error: "Mã chức vụ đã tồn tại" };
            }
        }

        // Check unique authority constraint if changing authority
        if (data.authority && data.authority !== position.authority) {
            if (UNIQUE_AUTHORITY_PER_DEPT.includes(data.authority)) {
                const existingAuth = await prisma.position.findFirst({
                    where: {
                        departmentId,
                        authority: data.authority,
                        status: "ACTIVE",
                        NOT: { id: positionId },
                    },
                });
                if (existingAuth) {
                    const authLabel =
                        data.authority === "MANAGER" ? "Trưởng phòng" : "Phó phòng";
                    return {
                        success: false,
                        error: `Phòng ban đã có chức vụ ${authLabel}. Không thể thay đổi.`,
                    };
                }
            }
        }

        const oldData = {
            name: position.name,
            code: position.code,
            authority: position.authority,
            level: position.level,
            description: position.description,
            minSalary: position.minSalary?.toString() ?? null,
            maxSalary: position.maxSalary?.toString() ?? null,
            sortOrder: position.sortOrder,
            status: position.status,
        };

        await prisma.position.update({
            where: { id: positionId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.code !== undefined && { code: data.code }),
                ...(data.authority !== undefined && { authority: data.authority }),
                ...(data.level !== undefined && { level: data.level }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.minSalary !== undefined && { minSalary: data.minSalary }),
                ...(data.maxSalary !== undefined && { maxSalary: data.maxSalary }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
                ...(data.status !== undefined && { status: data.status }),
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "UPDATE",
                entity: "Position",
                entityId: positionId,
                oldData: oldData as object,
                newData: data as object,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath(`/departments/${departmentId}`);
        revalidatePath("/positions");
        revalidatePath(`/positions/${positionId}`);

        return { success: true };
    } catch (err) {
        console.error("updatePositionForDepartment error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi cập nhật chức vụ" };
    }
}

/**
 * Xóa chức vụ (soft delete bằng cách đổi status = INACTIVE)
 */
export async function deletePositionForDepartment(
    positionId: string,
    departmentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const session = await requirePermission(Permission.POSITION_DELETE);

        // Check position belongs to department
        const position = await prisma.position.findFirst({
            where: { id: positionId, departmentId },
            include: { _count: { select: { users: true } } },
        });
        if (!position) {
            return { success: false, error: "Chức vụ không tồn tại trong phòng ban này" };
        }

        // Check if position has active users
        const activeUsers = await prisma.user.count({
            where: {
                positionId,
                employeeStatus: { not: "RESIGNED" },
            },
        });

        if (activeUsers > 0) {
            return {
                success: false,
                error: `Chức vụ đang có ${activeUsers} nhân viên đang làm việc. Vui lòng chuyển nhân viên sang chức vụ khác trước khi xóa.`,
            };
        }

        // Soft delete
        await prisma.position.update({
            where: { id: positionId },
            data: { status: "INACTIVE" },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                userName: session.user.name,
                action: "DELETE",
                entity: "Position",
                entityId: positionId,
                oldData: { status: position.status } as object,
                ipAddress: null,
                userAgent: null,
            },
        });

        revalidatePath(`/departments/${departmentId}`);
        revalidatePath("/positions");

        return { success: true };
    } catch (err) {
        console.error("deletePositionForDepartment error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi xóa chức vụ" };
    }
}

// =============================================
// POSITION SALARY MANAGEMENT
// =============================================

/**
 * Lấy danh sách lương theo chức vụ
 */
export async function getPositionSalaries(
    positionId: string,
): Promise<PositionSalaryItem[]> {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    const salaries = await prisma.positionSalary.findMany({
        where: { positionId },
        orderBy: [{ salaryGrade: "asc" }, { effectiveDate: "desc" }],
    });

    return salaries.map((s) => ({
        id: s.id,
        positionId: s.positionId,
        salaryGrade: s.salaryGrade,
        baseSalary: s.baseSalary.toString(),
        description: s.description,
        isActive: s.isActive,
        effectiveDate: s.effectiveDate,
    }));
}

/**
 * Lấy lương hiện tại của chức vụ (bậc cao nhất đang active)
 */
export async function getCurrentPositionSalary(
    positionId: string,
): Promise<PositionSalaryItem | null> {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    const salary = await prisma.positionSalary.findFirst({
        where: { positionId, isActive: true },
        orderBy: { effectiveDate: "desc" },
    });

    if (!salary) return null;

    return {
        id: salary.id,
        positionId: salary.positionId,
        salaryGrade: salary.salaryGrade,
        baseSalary: salary.baseSalary.toString(),
        description: salary.description,
        isActive: salary.isActive,
        effectiveDate: salary.effectiveDate,
    };
}

/**
 * Tạo lương mới cho chức vụ
 */
export async function createPositionSalary(
    data: CreatePositionSalaryInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_CREATE);

        // Check position exists
        const position = await prisma.position.findUnique({
            where: { id: data.positionId },
        });
        if (!position) {
            return { success: false, error: "Chức vụ không tồn tại" };
        }

        // Check unique grade for this position
        const existing = await prisma.positionSalary.findFirst({
            where: { positionId: data.positionId, salaryGrade: data.salaryGrade },
        });
        if (existing) {
            return { success: false, error: `Bậc lương ${data.salaryGrade} đã tồn tại cho chức vụ này` };
        }

        const salary = await prisma.positionSalary.create({
            data: {
                positionId: data.positionId,
                salaryGrade: data.salaryGrade,
                baseSalary: data.baseSalary,
                description: data.description,
                effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
                isActive: true,
            },
        });

        revalidatePath(`/departments/${position.departmentId}`);
        return { success: true, id: salary.id };
    } catch (err) {
        console.error("createPositionSalary error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi tạo lương chức vụ" };
    }
}

/**
 * Cập nhật lương chức vụ
 */
export async function updatePositionSalary(
    salaryId: string,
    data: UpdatePositionSalaryInput,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_EDIT);

        const salary = await prisma.positionSalary.findUnique({
            where: { id: salaryId },
        });
        if (!salary) {
            return { success: false, error: "Không tìm thấy lương chức vụ" };
        }

        await prisma.positionSalary.update({
            where: { id: salaryId },
            data: {
                ...(data.baseSalary !== undefined && { baseSalary: data.baseSalary }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.effectiveDate !== undefined && { effectiveDate: new Date(data.effectiveDate) }),
            },
        });

        // Revalidate department page
        const position = await prisma.position.findUnique({
            where: { id: salary.positionId },
        });
        if (position?.departmentId) {
            revalidatePath(`/departments/${position.departmentId}`);
        }

        return { success: true };
    } catch (err) {
        console.error("updatePositionSalary error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi cập nhật lương chức vụ" };
    }
}

/**
 * Xóa lương chức vụ (soft delete)
 */
export async function deletePositionSalary(
    salaryId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requirePermission(Permission.POSITION_DELETE);

        const salary = await prisma.positionSalary.findUnique({
            where: { id: salaryId },
        });
        if (!salary) {
            return { success: false, error: "Không tìm thấy lương chức vụ" };
        }

        // Soft delete - set isActive = false
        await prisma.positionSalary.update({
            where: { id: salaryId },
            data: { isActive: false },
        });

        // Revalidate
        const position = await prisma.position.findUnique({
            where: { id: salary.positionId },
        });
        if (position?.departmentId) {
            revalidatePath(`/departments/${position.departmentId}`);
        }

        return { success: true };
    } catch (err) {
        console.error("deletePositionSalary error:", err);
        return { success: false, error: "Đã xảy ra lỗi khi xóa lương chức vụ" };
    }
}

/**
 * Lấy lương chức vụ mặc định (tham khảo) để gợi ý khi tạo nhân viên mới
 */
export async function getDefaultPositionSalary(
    departmentId: string,
    authority: string,
): Promise<PositionSalaryItem | null> {
    await requirePermission(Permission.POSITION_VIEW_ALL);

    // Find position with given authority in department
    const position = await prisma.position.findFirst({
        where: { departmentId, authority, status: "ACTIVE" },
    });
    if (!position) return null;

    return getCurrentPositionSalary(position.id);
}

"use server";

import { prisma } from "@/lib/prisma";
import type {
    DepartmentNode,
    EmployeeBasic,
} from "@/types/org-chart";
import { requirePermission, requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import {
    COMPANY_STRUCTURE_TEMPLATES,
    type TemplateDepartment,
} from "@/lib/org-chart-templates";
import { emitToAll } from "@/lib/socket/server";

/**
 * Láy cây phòng ban từ Database
 */
export async function getDepartmentTree(): Promise<DepartmentNode[]> {
    await requirePermission(Permission.ORG_CHART_VIEW);

    // Fetch all departments
    const departments = await prisma.department.findMany({
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
            _count: {
                select: { positions: true },
            },
        },
        orderBy: { sortOrder: "asc" },
    });

    // Fetch all users assigned to any department
    const users = await prisma.user.findMany({
        where: { departmentId: { not: null } },
        select: {
            id: true,
            name: true,
            image: true,
            position: true,
            employeeCode: true,
            departmentId: true,
        },
    });

    // Group users by departmentId
    const usersByDept: Record<string, EmployeeBasic[]> = {};
    for (const user of users) {
        if (!user.departmentId) continue;
        if (!usersByDept[user.departmentId]) {
            usersByDept[user.departmentId] = [];
        }
        usersByDept[user.departmentId].push({
            id: user.id,
            name: user.name,
            image: user.image,
            position: user.position,
            employeeCode: user.employeeCode,
        });
    }

    // Convert flat list to tree
    const nodeMap = new Map<string, DepartmentNode>();

    for (const d of departments) {
        const emps = usersByDept[d.id] || [];
        nodeMap.set(d.id, {
            id: d.id,
            name: d.name,
            code: d.code,
            description: d.description,
            logo: d.logo,
            status: d.status as "ACTIVE" | "INACTIVE",
            sortOrder: d.sortOrder,
            parentId: d.parentId,
            secondaryParentIds: d.secondaryParentIds,
            managerId: d.managerId,
            manager: d.manager
                ? {
                      id: d.manager.id,
                      name: d.manager.name,
                      image: d.manager.image,
                      position: d.manager.position,
                  }
                : null,
            employeeCount: emps.length,
            positionCount: d._count.positions,
            children: [],
            employees: emps,
        });
    }

    const tree: DepartmentNode[] = [];

    for (const d of departments) {
        const node = nodeMap.get(d.id)!;
        if (node.parentId && nodeMap.has(node.parentId)) {
            const parent = nodeMap.get(node.parentId)!;
            parent.children.push(node);
        } else {
            tree.push(node);
        }
    }

    return tree;
}

/**
 * Di chuyển nhân viên sang phòng ban khác
 */
export async function moveEmployeeToDepartment(
    employeeId: string,
    targetDepartmentId: string,
): Promise<{ success: boolean; message: string }> {
    await requirePermission(Permission.ORG_CHART_EDIT);
    try {
        await prisma.user.update({
            where: { id: employeeId },
            data: { departmentId: targetDepartmentId },
        });
        revalidatePath("/org-chart");
        emitToAll("department:employee-moved", {
            employeeId,
            targetDepartmentId,
        });
        return {
            success: true,
            message: "Đã chuyển nhân viên thành công",
        };
    } catch (error) {
        return {
            success: false,
            message: "Lỗi khi chuyển nhân viên",
        };
    }
}

/**
 * Tạo phòng ban mới
 */
export async function createDepartment(data: {
    name: string;
    code: string;
    description?: string;
    logo?: string;
    parentId?: string | null;
    secondaryParentIds?: string[];
    status?: string;
    managerId?: string | null;
}): Promise<{ success: boolean; message: string }> {
    await requirePermission(Permission.DEPT_CREATE);
    try {
        const existing = await prisma.department.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            return {
                success: false,
                message: "Mã phòng ban đã tồn tại",
            };
        }

        const created = await prisma.department.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                logo: data.logo,
                parentId: data.parentId,
                secondaryParentIds: data.secondaryParentIds || [],
                status: data.status || "ACTIVE",
                managerId: data.managerId,
            },
        });

        // Audit log
        const session = await requireAuth();
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "CREATE",
                entity: "Department",
                entityId: created.id,
                newData: {
                    name: created.name,
                    code: created.code,
                    description: created.description,
                    status: created.status,
                    managerId: created.managerId,
                },
            },
        });

        revalidatePath("/org-chart");
        emitToAll("department:created", {
            departmentId: created.id,
            departmentName: data.name,
            parentId: data.parentId ?? null,
        });
        return {
            success: true,
            message: `Đã tạo phòng ban "${data.name}" thành công`,
        };
    } catch (error) {
        return { success: false, message: "Lỗi khi tạo phòng ban" };
    }
}

/**
 * Cập nhật phòng ban
 */
export async function updateDepartment(
    id: string,
    data: {
        name?: string;
        code?: string;
        description?: string;
        logo?: string;
        parentId?: string | null;
        secondaryParentIds?: string[];
        managerId?: string | null;
        status?: string;
    },
): Promise<{ success: boolean; message: string }> {
    await requirePermission(Permission.DEPT_EDIT);
    try {
        // Lấy dữ liệu cũ để audit
        const oldDepartment = await prisma.department.findUnique({ where: { id } });

        if (data.code) {
            const existing = await prisma.department.findUnique({
                where: { code: data.code },
            });
            if (existing && existing.id !== id) {
                return {
                    success: false,
                    message: "Mã phòng ban đã tồn tại",
                };
            }
        }

        await prisma.department.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                logo: data.logo,
                parentId: data.parentId,
                secondaryParentIds: data.secondaryParentIds,
                managerId: data.managerId,
                status: data.status,
            },
        });

        // Audit log
        const session = await requireAuth();
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "UPDATE",
                entity: "Department",
                entityId: id,
                oldData: {
                    name: oldDepartment?.name,
                    code: oldDepartment?.code,
                    description: oldDepartment?.description,
                    status: oldDepartment?.status,
                },
                newData: data,
            },
        });

        revalidatePath("/org-chart");
        emitToAll("department:updated", {
            departmentId: id,
            departmentName: data.name ?? "",
            changes: data as Record<string, unknown>,
        });
        return {
            success: true,
            message: "Đã cập nhật phòng ban thành công",
        };
    } catch (error) {
        return {
            success: false,
            message: "Lỗi khi cập nhật phòng ban",
        };
    }
}

/**
 * Xóa phòng ban
 */
export async function deleteDepartment(
    id: string,
): Promise<{ success: boolean; message: string }> {
    await requirePermission(Permission.DEPT_DELETE);
    try {
        const children = await prisma.department.count({
            where: { parentId: id },
        });
        if (children > 0) {
            return {
                success: false,
                message:
                    "Không thể xóa phòng ban đang có phòng ban con",
            };
        }

        const employees = await prisma.user.count({
            where: { departmentId: id },
        });
        if (employees > 0) {
            return {
                success: false,
                message: "Không thể xóa phòng ban đang có nhân viên",
            };
        }

        // Lấy dữ liệu cũ để audit
        const department = await prisma.department.findUnique({ where: { id } });

        await prisma.department.delete({ where: { id } });

        // Audit log
        const session = await requireAuth();
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "DELETE",
                entity: "Department",
                entityId: id,
                oldData: {
                    name: department?.name,
                    code: department?.code,
                    description: department?.description,
                    status: department?.status,
                },
            },
        });

        revalidatePath("/org-chart");
        emitToAll("department:deleted", { departmentId: id });
        return {
            success: true,
            message: "Đã xóa phòng ban thành công",
        };
    } catch (error) {
        return { success: false, message: "Lỗi khi xóa phòng ban" };
    }
}

/**
 * Áp dụng mẫu cơ cấu tổ chức
 */
export async function applyCompanyStructureTemplate(
    templateId: string,
): Promise<{ success: boolean; message: string }> {
    await requirePermission(Permission.ORG_CHART_EDIT);
    try {
        const { COMPANY_STRUCTURE_TEMPLATES } =
            await import("@/lib/org-chart-templates");
        const template = COMPANY_STRUCTURE_TEMPLATES.find(
            (t) => t.id === templateId,
        );
        if (!template) {
            return {
                success: false,
                message: "Mẫu cơ cấu không tồn tại",
            };
        }

        // 1. Safe cleanup
        // Remove departmentId from all users
        await prisma.user.updateMany({
            where: { departmentId: { not: null } },
            data: { departmentId: null },
        });

        // Remove departmentId from all positions
        await prisma.position.updateMany({
            where: { departmentId: { not: null } },
            data: { departmentId: null },
        });

        // Remove parentId from all departments to avoid foreign key constraints during deletion
        await prisma.department.updateMany({
            data: { parentId: null },
        });

        // Delete all departments
        await prisma.department.deleteMany({});

        // 2. Recursive creation function
        let currentSortOrder = 0;
        const codeToIdMap = new Map<string, string>();
        const secondaryLinks: {
            deptId: string;
            parentCodes: string[];
        }[] = [];

        async function createDepts(
            depts: TemplateDepartment[],
            parentId: string | null = null,
        ) {
            for (const dept of depts) {
                const created = await prisma.department.create({
                    data: {
                        name: dept.name,
                        code: dept.code,
                        logo: dept.logo,
                        description: dept.description,
                        status: "ACTIVE",
                        sortOrder: currentSortOrder++,
                        parentId: parentId,
                    },
                });

                codeToIdMap.set(created.code, created.id);

                if (
                    dept.secondaryParentCodes &&
                    dept.secondaryParentCodes.length > 0
                ) {
                    secondaryLinks.push({
                        deptId: created.id,
                        parentCodes: dept.secondaryParentCodes,
                    });
                }

                if (dept.children && dept.children.length > 0) {
                    await createDepts(dept.children, created.id);
                }
            }
        }

        // 3. Start creation
        await createDepts(template.departments);

        // 4. Resolve and link secondary parents
        for (const link of secondaryLinks) {
            const parentIds = link.parentCodes
                .map((code) => codeToIdMap.get(code))
                .filter((id): id is string => id !== undefined);

            if (parentIds.length > 0) {
                await prisma.department.update({
                    where: { id: link.deptId },
                    data: { secondaryParentIds: parentIds },
                });
            }
        }

        revalidatePath("/org-chart");
        emitToAll("department:template-applied", { templateId });
        return {
            success: true,
            message: "Đã áp dụng mẫu cơ cấu thành công",
        };
    } catch (error) {
        console.error("Error applying structure template:", error);
        return {
            success: false,
            message: "Lỗi khi áp dụng mẫu cơ cấu",
        };
    }
}

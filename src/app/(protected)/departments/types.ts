import type { DepartmentNode } from "@/types/org-chart";

export interface DepartmentListItem extends DepartmentNode {
    parentName?: string | null;
}

export interface DepartmentFilters {
    search?: string;
    status?: "ACTIVE" | "INACTIVE" | "ALL";
    parentId?: string | null;
}

export interface DepartmentStats {
    totalDepartments: number;
    activeDepartments: number;
    inactiveDepartments: number;
    totalEmployees: number;
}

export interface GetDepartmentsParams {
    page: number;
    pageSize: number;
    search?: string;
    status?: "ACTIVE" | "INACTIVE" | "ALL";
    parentId?: string | null;
    sortBy?: "name" | "code" | "createdAt" | "employeeCount";
    sortOrder?: "asc" | "desc";
}

export interface GetDepartmentsResult {
    departments: DepartmentListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// =============================================
// POSITION TYPES (Department-scoped)
// =============================================

export interface DepartmentPosition {
    id: string;
    name: string;
    code: string;
    authority: string;
    level: number;
    status: string;
    sortOrder: number;
    description: string | null;
    minSalary: string | null;
    maxSalary: string | null;
    userCount: number;
    holder: {
        id: string;
        name: string;
        image: string | null;
        employeeCode: string | null;
    } | null;
}

export interface CreatePositionForDepartmentInput {
    name: string;
    code: string;
    authority: string;
    level?: number;
    description?: string;
    minSalary?: number;
    maxSalary?: number;
    sortOrder?: number;
}

export interface UpdatePositionForDepartmentInput {
    name?: string;
    code?: string;
    authority?: string;
    level?: number;
    description?: string;
    minSalary?: number;
    maxSalary?: number;
    sortOrder?: number;
    status?: string;
}

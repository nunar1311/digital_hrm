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

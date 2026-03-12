// =============================================================================
// Department, Position & JobTitle Types
// Mirrors Prisma models: Department, Position, JobTitle
// =============================================================================

export interface Department {
    id: string;
    name: string;
    code: string;
    description: string | null;
    parentId: string | null;
    managerId: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    // Resolved relations
    parent?: Department;
    children?: Department[];
    employeeCount?: number;
    managerName?: string;
}

export interface Position {
    id: string;
    name: string;
    code: string;
    departmentId: string | null;
    level: number;
    description: string | null;
    // Resolved relations
    department?: Department;
}

export interface JobTitle {
    id: string;
    name: string;
    code: string;
    description: string | null;
}

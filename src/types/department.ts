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

export type PositionAuthority =
    | "EXECUTIVE"
    | "DIRECTOR"
    | "MANAGER"
    | "DEPUTY"
    | "TEAM_LEAD"
    | "STAFF"
    | "INTERN";

export type PositionStatus = "ACTIVE" | "INACTIVE";

export interface Position {
    id: string;
    name: string;
    code: string;
    authority: PositionAuthority;
    departmentId: string | null;
    level: number;
    description: string | null;
    parentId: string | null;
    minSalary: string | null;
    maxSalary: string | null;
    status: PositionStatus;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    // Resolved relations
    department?: Department;
    parent?: Pick<Position, "id" | "name" | "code">;
    children?: Pick<Position, "id" | "name" | "code">[];
    _count?: { users: number };
}

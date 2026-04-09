// ─── Org Chart Types ───

export interface DepartmentNode {
    id: string;
    name: string;
    code: string;
    description: string | null;
    logo: string | null;
    status: "ACTIVE" | "INACTIVE";
    sortOrder: number;
    parentId: string | null;
    secondaryParentIds: string[];
    managerId: string | null;
    manager: {
        id: string;
        name: string;
        image: string | null;
        position: string | null;
    } | null;
    employeeCount: number;
    positionCount: number;
    children: DepartmentNode[];
    employees?: EmployeeBasic[];
}

export interface EmployeeBasic {
    id: string;
    name: string;
    username: string | null;
    employeeCode?: string | null;
    image: string | null;
    position: string | null;
}

export interface DepartmentFormData {
    name: string;
    code: string;
    description: string;
    logo?: string;
    parentId: string | null;
    secondaryParentIds?: string[];
    managerId: string | null;
    status: "ACTIVE" | "INACTIVE";
}

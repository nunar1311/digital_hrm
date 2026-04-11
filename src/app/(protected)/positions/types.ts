export interface PositionListItem {
    id: string;
    name: string;
    code: string;
    authority: string;
    departmentId: string | null;
    departmentName: string | null;
    level: number;
    parentId: string | null;
    parentName: string | null;
    status: string;
    sortOrder: number;
    userCount: number;
    description: string | null;
    minSalary: string | null;
    maxSalary: string | null;
}

export interface PositionDetail extends PositionListItem {
    description: string | null;
    minSalary: string | null;
    maxSalary: string | null;
    createdAt: Date;
    updatedAt: Date;
    children: Pick<PositionListItem, "id" | "name" | "code" | "authority">[];
    users: {
        id: string;
        name: string;
        username: string | null;
        image: string | null;
        departmentName: string | null;
    }[];
}

export interface GetPositionsParams {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    authority?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface GetPositionsResult {
    positions: PositionListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
}

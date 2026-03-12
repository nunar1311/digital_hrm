// ─── Types ───

export interface UserRow {
    id: string;
    name: string;
    email: string;
    image: string | null;
    employeeCode: string | null;
    hrmRole: string;
    departmentId: string | null;
    position: string | null;
}

export interface UsersPage {
    users: UserRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface RolesData {
    roles: string[];
    permissions: string[];
    rolePermissionsMap: Record<string, string[]>;
}

// ─── Constants ───

export const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    DIRECTOR: "Giám đốc",
    HR_MANAGER: "Trưởng phòng HR",
    HR_STAFF: "Nhân viên HR",
    DEPT_MANAGER: "Trưởng phòng ban",
    TEAM_LEADER: "Trưởng nhóm",
    EMPLOYEE: "Nhân viên",
    ACCOUNTANT: "Kế toán",
    IT_ADMIN: "Quản trị IT",
};

export const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    DIRECTOR:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    HR_MANAGER:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    HR_STAFF:
        "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
    DEPT_MANAGER:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    TEAM_LEADER:
        "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    EMPLOYEE:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    ACCOUNTANT:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    IT_ADMIN:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export const PERMISSION_GROUPS: Record<string, string> = {
    dashboard: "Dashboard",
    org_chart: "Sơ đồ tổ chức",
    department: "Phòng ban",
    employee: "Nhân viên",
    contract: "Hợp đồng",
    leave: "Nghỉ phép",
    attendance: "Chấm công",
    payroll: "Tính lương",
    onboarding: "Onboarding",
    offboarding: "Offboarding",
    recruitment: "Tuyển dụng",
    training: "Đào tạo",
    performance: "Đánh giá",
    asset: "Tài sản",
    reward: "Khen thưởng",
    report: "Báo cáo",
    ess: "Cổng nhân viên",
    settings: "Cài đặt",
};

// ─── Helpers ───

export function groupPermissions(permissions: string[]) {
    const groups: Record<string, string[]> = {};
    for (const perm of permissions) {
        const groupKey = perm.split(":")[0];
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(perm);
    }
    return groups;
}

export function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

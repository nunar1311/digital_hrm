import { Permission } from "./permissions";

/**
 * Map route pattern → required permissions (OR logic: cần ít nhất 1)
 * Sắp xếp từ cụ thể → chung để match đúng nhất trước
 */
export const ROUTE_PERMISSIONS: Array<{
    pattern: string;
    permissions: Permission[];
}> = [
    // ─── Dashboard ───
    { pattern: "/", permissions: [Permission.DASHBOARD_VIEW] },

    // ─── Tổ chức ───
    {
        pattern: "/org-chart",
        permissions: [Permission.ORG_CHART_VIEW],
    },
    {
        pattern: "/departments",
        permissions: [Permission.DEPT_VIEW],
    },

    // ─── Nhân viên ───
    {
        pattern: "/employees/new",
        permissions: [Permission.EMPLOYEE_CREATE],
    },
    {
        pattern: "/employees",
        permissions: [
            Permission.EMPLOYEE_VIEW_SELF,
            Permission.EMPLOYEE_VIEW_TEAM,
            Permission.EMPLOYEE_VIEW_ALL,
        ],
    },

    // ─── Hợp đồng ───
    {
        pattern: "/contracts/templates",
        permissions: [Permission.CONTRACT_TEMPLATE_MANAGE],
    },
    {
        pattern: "/contracts",
        permissions: [
            Permission.CONTRACT_VIEW_SELF,
            Permission.CONTRACT_VIEW_ALL,
        ],
    },

    // ─── Nghỉ phép ───
    {
        pattern: "/leaves/policies",
        permissions: [Permission.LEAVE_POLICY_MANAGE],
    },
    {
        pattern: "/leaves/calendar",
        permissions: [Permission.LEAVE_CALENDAR_VIEW],
    },
    {
        pattern: "/leaves",
        permissions: [
            Permission.LEAVE_VIEW_SELF,
            Permission.LEAVE_VIEW_TEAM,
            Permission.LEAVE_VIEW_ALL,
        ],
    },

    // ─── Chấm công ───
    {
        pattern: "/attendance/records",
        permissions: [
            Permission.ATTENDANCE_VIEW_TEAM,
            Permission.ATTENDANCE_VIEW_ALL,
        ],
    },
    {
        pattern: "/attendance/shifts",
        permissions: [Permission.ATTENDANCE_SHIFT_MANAGE],
    },
    {
        pattern: "/attendance/overtime",
        permissions: [
            Permission.ATTENDANCE_VIEW_SELF,
            Permission.ATTENDANCE_OVERTIME_APPROVE,
        ],
    },
    {
        pattern: "/attendance/explanations",
        permissions: [
            Permission.ATTENDANCE_EXPLANATION,
            Permission.ATTENDANCE_APPROVE,
        ],
    },
    {
        pattern: "/attendance",
        permissions: [
            Permission.ATTENDANCE_VIEW_SELF,
            Permission.ATTENDANCE_VIEW_TEAM,
            Permission.ATTENDANCE_VIEW_ALL,
        ],
    },

    // ─── Tính lương ───
    {
        pattern: "/payroll/formulas",
        permissions: [Permission.PAYROLL_FORMULA_MANAGE],
    },
    {
        pattern: "/payroll/payslips",
        permissions: [
            Permission.PAYROLL_VIEW_SELF,
            Permission.PAYROLL_SEND_PAYSLIP,
        ],
    },
    {
        pattern: "/payroll/tax-insurance",
        permissions: [Permission.PAYROLL_TAX_MANAGE],
    },
    {
        pattern: "/payroll",
        permissions: [
            Permission.PAYROLL_VIEW_SELF,
            Permission.PAYROLL_VIEW_ALL,
        ],
    },

    // ─── Quy trình ───
    {
        pattern: "/onboarding",
        permissions: [Permission.ONBOARDING_VIEW],
    },
    {
        pattern: "/offboarding",
        permissions: [Permission.OFFBOARDING_VIEW],
    },
    {
        pattern: "/recruitment",
        permissions: [Permission.RECRUITMENT_VIEW],
    },

    // ─── Phát triển ───
    {
        pattern: "/training",
        permissions: [
            Permission.TRAINING_VIEW_SELF,
            Permission.TRAINING_VIEW_ALL,
        ],
    },
    {
        pattern: "/performance",
        permissions: [
            Permission.PERFORMANCE_VIEW_SELF,
            Permission.PERFORMANCE_VIEW_TEAM,
            Permission.PERFORMANCE_VIEW_ALL,
        ],
    },
    {
        pattern: "/rewards",
        permissions: [Permission.REWARD_VIEW],
    },

    // ─── Khác ───
    {
        pattern: "/assets",
        permissions: [
            Permission.ASSET_VIEW_SELF,
            Permission.ASSET_VIEW_ALL,
        ],
    },
    {
        pattern: "/reports",
        permissions: [
            Permission.REPORT_VIEW_BASIC,
            Permission.REPORT_VIEW_ALL,
        ],
    },

    // ─── ESS ───
    {
        pattern: "/ess/profile",
        permissions: [Permission.ESS_UPDATE_PROFILE],
    },
    {
        pattern: "/ess/requests",
        permissions: [Permission.ESS_SEND_REQUEST],
    },
    {
        pattern: "/ess",
        permissions: [Permission.ESS_VIEW],
    },

    // ─── Cài đặt ───
    {
        pattern: "/settings/roles",
        permissions: [Permission.SETTINGS_ROLES_MANAGE],
    },
    {
        pattern: "/settings/audit-log",
        permissions: [Permission.SETTINGS_AUDIT_LOG],
    },
    {
        pattern: "/settings",
        permissions: [Permission.SETTINGS_VIEW],
    },
];

/**
 * Tìm permissions cần thiết cho 1 route.
 * Match pattern cụ thể nhất (startsWith, ưu tiên dài nhất).
 * Return null nếu route không cần bảo vệ.
 */
export function getRoutePermissions(
    pathname: string,
): Permission[] | null {
    // Exact match "/" chỉ khi pathname đúng "/"
    if (pathname === "/") {
        return ROUTE_PERMISSIONS[0].permissions;
    }

    // Tìm pattern dài nhất match trước
    let bestMatch: (typeof ROUTE_PERMISSIONS)[number] | null = null;

    for (const route of ROUTE_PERMISSIONS) {
        if (route.pattern === "/") continue; // skip root, đã xử lý

        if (
            pathname === route.pattern ||
            pathname.startsWith(route.pattern + "/")
        ) {
            if (
                !bestMatch ||
                route.pattern.length > bestMatch.pattern.length
            ) {
                bestMatch = route;
            }
        }
    }

    return bestMatch?.permissions ?? null;
}

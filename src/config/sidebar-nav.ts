import {
    LayoutDashboard,
    Network,
    Building2,
    Users,
    FileText,
    CalendarDays,
    CalendarCheck,
    Wallet,
    UserPlus,
    UserMinus,
    Briefcase,
    GraduationCap,
    Target,
    Package,
    Award,
    BarChart3,
    Settings,
    UserCircle,
    type LucideIcon,
} from "lucide-react";
import { Permission } from "@/lib/rbac/permissions";

export interface NavChild {
    title: string;
    url: string;
    permissions: Permission[];
}

export interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    permissions: Permission[];
    children?: NavChild[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const sidebarNav: NavGroup[] = [
    {
        label: "Tổng quan",
        items: [
            {
                title: "Dashboard",
                url: "/",
                icon: LayoutDashboard,
                permissions: [Permission.DASHBOARD_VIEW],
            },
        ],
    },
    {
        label: "Tổ chức",
        items: [
            {
                title: "Sơ đồ tổ chức",
                url: "/org-chart",
                icon: Network,
                permissions: [Permission.ORG_CHART_VIEW],
            },
            {
                title: "Phòng ban",
                url: "/departments",
                icon: Building2,
                permissions: [Permission.DEPT_VIEW],
            },
        ],
    },
    {
        label: "Nhân sự",
        items: [
            {
                title: "Nhân viên",
                url: "/employees",
                icon: Users,
                permissions: [
                    Permission.EMPLOYEE_VIEW_SELF,
                    Permission.EMPLOYEE_VIEW_TEAM,
                    Permission.EMPLOYEE_VIEW_ALL,
                ],
                children: [
                    {
                        title: "Danh sách",
                        url: "/employees",
                        permissions: [
                            Permission.EMPLOYEE_VIEW_SELF,
                            Permission.EMPLOYEE_VIEW_TEAM,
                            Permission.EMPLOYEE_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Thêm mới",
                        url: "/employees/new",
                        permissions: [Permission.EMPLOYEE_CREATE],
                    },
                    {
                        title: "Nhập/Xuất Excel",
                        url: "/employees/import-export",
                        permissions: [
                            Permission.EMPLOYEE_IMPORT,
                            Permission.EMPLOYEE_EXPORT,
                        ],
                    },
                ],
            },
            {
                title: "Hợp đồng",
                url: "/contracts",
                icon: FileText,
                permissions: [
                    Permission.CONTRACT_VIEW_SELF,
                    Permission.CONTRACT_VIEW_ALL,
                ],
                children: [
                    {
                        title: "Danh sách",
                        url: "/contracts",
                        permissions: [
                            Permission.CONTRACT_VIEW_SELF,
                            Permission.CONTRACT_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Mẫu hợp đồng",
                        url: "/contracts/templates",
                        permissions: [
                            Permission.CONTRACT_TEMPLATE_MANAGE,
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: "Công việc",
        items: [
            {
                title: "Nghỉ phép",
                url: "/leaves",
                icon: CalendarDays,
                permissions: [
                    Permission.LEAVE_VIEW_SELF,
                    Permission.LEAVE_VIEW_TEAM,
                    Permission.LEAVE_VIEW_ALL,
                ],
                children: [
                    {
                        title: "Đơn nghỉ phép",
                        url: "/leaves",
                        permissions: [
                            Permission.LEAVE_VIEW_SELF,
                            Permission.LEAVE_VIEW_TEAM,
                            Permission.LEAVE_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Lịch Team",
                        url: "/leaves/calendar",
                        permissions: [Permission.LEAVE_CALENDAR_VIEW],
                    },
                    {
                        title: "Chính sách",
                        url: "/leaves/policies",
                        permissions: [Permission.LEAVE_POLICY_MANAGE],
                    },
                ],
            },
            {
                title: "Chấm công",
                url: "/attendance",
                icon: CalendarCheck,
                permissions: [
                    Permission.ATTENDANCE_VIEW_SELF,
                    Permission.ATTENDANCE_VIEW_TEAM,
                    Permission.ATTENDANCE_VIEW_ALL,
                ],
                children: [
                    {
                        title: "Hôm nay",
                        url: "/attendance",
                        permissions: [
                            Permission.ATTENDANCE_VIEW_SELF,
                            Permission.ATTENDANCE_VIEW_TEAM,
                            Permission.ATTENDANCE_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Bảng công tháng",
                        url: "/attendance/monthly",
                        permissions: [
                            Permission.ATTENDANCE_VIEW_SELF,
                            Permission.ATTENDANCE_VIEW_TEAM,
                            Permission.ATTENDANCE_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Nhật ký chấm công",
                        url: "/attendance/records",
                        permissions: [
                            Permission.ATTENDANCE_VIEW_TEAM,
                            Permission.ATTENDANCE_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Ca làm việc",
                        url: "/attendance/shifts",
                        permissions: [
                            Permission.ATTENDANCE_SHIFT_MANAGE,
                        ],
                    },
                    {
                        title: "Làm thêm giờ",
                        url: "/attendance/overtime",
                        permissions: [
                            Permission.ATTENDANCE_VIEW_SELF,
                            Permission.ATTENDANCE_OVERTIME_APPROVE,
                        ],
                    },
                    {
                        title: "Giải trình",
                        url: "/attendance/explanations",
                        permissions: [
                            Permission.ATTENDANCE_EXPLANATION,
                            Permission.ATTENDANCE_APPROVE,
                        ],
                    },
                    {
                        title: "Thiết lập",
                        url: "/attendance/settings",
                        permissions: [
                            Permission.ATTENDANCE_SHIFT_MANAGE,
                        ],
                    },
                ],
            },
            {
                title: "Tính lương",
                url: "/payroll",
                icon: Wallet,
                permissions: [
                    Permission.PAYROLL_VIEW_SELF,
                    Permission.PAYROLL_VIEW_ALL,
                ],
                children: [
                    {
                        title: "Bảng lương",
                        url: "/payroll",
                        permissions: [
                            Permission.PAYROLL_VIEW_SELF,
                            Permission.PAYROLL_VIEW_ALL,
                        ],
                    },
                    {
                        title: "Công thức",
                        url: "/payroll/formulas",
                        permissions: [
                            Permission.PAYROLL_FORMULA_MANAGE,
                        ],
                    },
                    {
                        title: "Phiếu lương",
                        url: "/payroll/payslips",
                        permissions: [
                            Permission.PAYROLL_VIEW_SELF,
                            Permission.PAYROLL_SEND_PAYSLIP,
                        ],
                    },
                    {
                        title: "Thuế & BHXH",
                        url: "/payroll/tax-insurance",
                        permissions: [Permission.PAYROLL_TAX_MANAGE],
                    },
                ],
            },
        ],
    },
    {
        label: "Quy trình",
        items: [
            {
                title: "Onboarding",
                url: "/onboarding",
                icon: UserPlus,
                permissions: [Permission.ONBOARDING_VIEW],
            },
            {
                title: "Offboarding",
                url: "/offboarding",
                icon: UserMinus,
                permissions: [Permission.OFFBOARDING_VIEW],
            },
            {
                title: "Tuyển dụng",
                url: "/recruitment",
                icon: Briefcase,
                permissions: [Permission.RECRUITMENT_VIEW],
            },
        ],
    },
    {
        label: "Phát triển",
        items: [
            {
                title: "Đào tạo",
                url: "/training",
                icon: GraduationCap,
                permissions: [
                    Permission.TRAINING_VIEW_SELF,
                    Permission.TRAINING_VIEW_ALL,
                ],
            },
            {
                title: "Đánh giá",
                url: "/performance",
                icon: Target,
                permissions: [
                    Permission.PERFORMANCE_VIEW_SELF,
                    Permission.PERFORMANCE_VIEW_TEAM,
                    Permission.PERFORMANCE_VIEW_ALL,
                ],
            },
            {
                title: "Khen thưởng & KL",
                url: "/rewards",
                icon: Award,
                permissions: [Permission.REWARD_VIEW],
            },
        ],
    },
    {
        label: "Khác",
        items: [
            {
                title: "Tài sản",
                url: "/assets",
                icon: Package,
                permissions: [
                    Permission.ASSET_VIEW_SELF,
                    Permission.ASSET_VIEW_ALL,
                ],
            },
            {
                title: "Báo cáo",
                url: "/reports",
                icon: BarChart3,
                permissions: [
                    Permission.REPORT_VIEW_BASIC,
                    Permission.REPORT_VIEW_ALL,
                ],
            },
            {
                title: "Cổng nhân viên",
                url: "/ess",
                icon: UserCircle,
                permissions: [Permission.ESS_VIEW],
                children: [
                    {
                        title: "Tổng quan",
                        url: "/ess",
                        permissions: [Permission.ESS_VIEW],
                    },
                    {
                        title: "Hồ sơ cá nhân",
                        url: "/ess/profile",
                        permissions: [Permission.ESS_UPDATE_PROFILE],
                    },
                    {
                        title: "Yêu cầu",
                        url: "/ess/requests",
                        permissions: [Permission.ESS_SEND_REQUEST],
                    },
                ],
            },
            {
                title: "Cài đặt",
                url: "/settings",
                icon: Settings,
                permissions: [Permission.SETTINGS_VIEW],
                children: [
                    {
                        title: "Chung",
                        url: "/settings",
                        permissions: [Permission.SETTINGS_VIEW],
                    },
                    {
                        title: "Phân quyền",
                        url: "/settings/roles",
                        permissions: [
                            Permission.SETTINGS_ROLES_MANAGE,
                        ],
                    },
                    {
                        title: "Nhật ký",
                        url: "/settings/audit-log",
                        permissions: [Permission.SETTINGS_AUDIT_LOG],
                    },
                ],
            },
        ],
    },
];

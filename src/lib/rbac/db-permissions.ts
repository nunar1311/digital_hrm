import { Permission } from "@/lib/rbac/permissions";

/**
 * Mô tả tiếng Việt cho từng permission key
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    // Dashboard
    "dashboard:view": "Xem dashboard cá nhân",
    "dashboard:view_all": "Xem dashboard tổng hợp",

    // Sơ đồ tổ chức
    "org_chart:view": "Xem sơ đồ tổ chức",
    "org_chart:edit": "Chỉnh sửa sơ đồ tổ chức",

    // Phòng ban
    "department:view": "Xem phòng ban",
    "department:create": "Tạo phòng ban mới",
    "department:edit": "Chỉnh sửa phòng ban",
    "department:delete": "Xóa phòng ban",

    // Chức vụ
    "position:view_all": "Xem tất cả chức vụ",
    "position:create": "Tạo chức vụ mới",
    "position:edit": "Chỉnh sửa chức vụ",
    "position:delete": "Xóa chức vụ",

    // Nhân viên
    "employee:view_self": "Xem hồ sơ cá nhân",
    "employee:view_team": "Xem hồ sơ nhân viên trong phòng ban",
    "employee:view_all": "Xem tất cả hồ sơ nhân viên",
    "employee:create": "Tạo hồ sơ nhân viên mới",
    "employee:edit": "Chỉnh sửa hồ sơ nhân viên",
    "employee:delete": "Xóa hồ sơ nhân viên",
    "employee:update": "Cập nhật thông tin nhân viên",
    "employee:import": "Nhập dữ liệu nhân viên từ file",
    "employee:export": "Xuất dữ liệu nhân viên ra file",

    // Hợp đồng
    "contract:view_self": "Xem hợp đồng cá nhân",
    "contract:view_all": "Xem tất cả hợp đồng",
    "contract:create": "Tạo hợp đồng mới",
    "contract:edit": "Chỉnh sửa hợp đồng",
    "contract:print": "In hợp đồng",
    "contract:template_manage": "Quản lý mẫu hợp đồng",

    // Nghỉ phép
    "leave:view_self": "Xem đơn nghỉ phép cá nhân",
    "leave:view_team": "Xem đơn nghỉ phép của phòng ban",
    "leave:view_all": "Xem tất cả đơn nghỉ phép",
    "leave:create": "Tạo đơn nghỉ phép",
    "leave:approve_team": "Phê duyệt đơn nghỉ phép của phòng ban",
    "leave:approve_all": "Phê duyệt tất cả đơn nghỉ phép",
    "leave:policy_manage": "Quản lý chính sách nghỉ phép",
    "leave:calendar_view": "Xem lịch nghỉ phép",

    // Chấm công
    "attendance:view_self": "Xem chấm công cá nhân",
    "attendance:view_team": "Xem chấm công của phòng ban",
    "attendance:view_all": "Xem tất cả chấm công",
    "attendance:checkin": "Chấm công",
    "attendance:explanation": "Giải trình chấm công",
    "attendance:approve": "Phê duyệt chấm công",
    "attendance:shift_manage": "Quản lý ca làm việc",
    "attendance:overtime_approve": "Phê duyệt tăng ca",
    "attendance:overtime_hr_review": "HR duyệt tăng ca",
    "attendance:approval_config": "Cấu hình luồng phê duyệt",
    "attendance:approval_view": "Xem lịch sử phê duyệt",
    "attendance:approval_approve": "Duyệt theo luồng phê duyệt",
    "attendance:adjustment_create": "Tạo yêu cầu điều chỉnh chấm công",
    "attendance:adjustment_edit": "Sửa điều chỉnh chấm công",

    // Lương
    "payroll:view_self": "Xem lương cá nhân",
    "payroll:view_all": "Xem tất cả bảng lương",
    "payroll:calculate": "Tính lương",
    "payroll:approve": "Phê duyệt bảng lương",
    "payroll:formula_manage": "Quản lý công thức lương",
    "payroll:send_payslip": "Gửi phiếu lương",
    "payroll:tax_manage": "Quản lý thuế",

    // Onboarding
    "onboarding:view": "Xem quy trình onboarding",
    "onboarding:manage": "Quản lý onboarding",

    // Offboarding
    "offboarding:view": "Xem quy trình offboarding",
    "offboarding:manage": "Quản lý offboarding",

    // Tuyển dụng
    "recruitment:view": "Xem tuyển dụng",
    "recruitment:manage": "Quản lý tuyển dụng",
    "recruitment:post_create": "Tạo tin tuyển dụng",
    "recruitment:post_edit": "Sửa tin tuyển dụng",
    "recruitment:post_delete": "Xóa tin tuyển dụng",
    "recruitment:candidate_view": "Xem ứng viên",
    "recruitment:candidate_create": "Tạo hồ sơ ứng viên",
    "recruitment:candidate_edit": "Sửa hồ sơ ứng viên",
    "recruitment:candidate_delete": "Xóa ứng viên",
    "recruitment:interview_schedule": "Lên lịch phỏng vấn",
    "recruitment:interview_manage": "Quản lý phỏng vấn",
    "recruitment:candidate_pool_view": "Xem hồ sơ ứng viên",
    "recruitment:report_view": "Xem báo cáo tuyển dụng",
    "recruitment:report_export": "Xuất báo cáo tuyển dụng",

    // Đào tạo
    "training:view_self": "Xem khóa đào tạo cá nhân",
    "training:view_all": "Xem tất cả khóa đào tạo",
    "training:manage": "Quản lý đào tạo",

    // Hiệu suất
    "performance:view_self": "Xem đánh giá cá nhân",
    "performance:view_team": "Xem đánh giá phòng ban",
    "performance:view_all": "Xem tất cả đánh giá",
    "performance:evaluate": "Thực hiện đánh giá",

    // Tài sản
    "asset:view_self": "Xem tài sản cá nhân",
    "asset:view_all": "Xem tất cả tài sản",
    "asset:manage": "Quản lý tài sản",

    // Khen thưởng
    "reward:view": "Xem khen thưởng",
    "reward:create": "Tạo khen thưởng",
    "reward:approve": "Phê duyệt khen thưởng",

    // Báo cáo
    "report:view_basic": "Xem báo cáo cơ bản",
    "report:view_all": "Xem tất cả báo cáo",
    "report:export": "Xuất báo cáo",

    // ESS
    "ess:view": "Truy cập cổng nhân viên (ESS)",
    "ess:update_profile": "Cập nhật thông tin trên ESS",
    "ess:send_request": "Gửi yêu cầu qua ESS",

    // Cài đặt
    "settings:view": "Xem cài đặt hệ thống",
    "settings:roles_manage": "Quản lý vai trò và phân quyền",
    "settings:audit_log": "Xem nhật ký hệ thống",
    "settings:system": "Cấu hình hệ thống",
};

/**
 * Nhóm permissions theo module - dùng để hiển thị trong UI
 */
export const PERMISSION_GROUPS_DB: Record<string, string> = {
    dashboard: "Dashboard",
    org_chart: "Sơ đồ tổ chức",
    department: "Phòng ban",
    position: "Chức vụ",
    employee: "Nhân viên",
    contract: "Hợp đồng",
    leave: "Nghỉ phép",
    attendance: "Chấm công",
    payroll: "Lương",
    onboarding: "Onboarding",
    offboarding: "Offboarding",
    recruitment: "Tuyển dụng",
    training: "Đào tạo",
    performance: "Hiệu suất",
    asset: "Tài sản",
    reward: "Khen thưởng",
    report: "Báo cáo",
    ess: "Cổng nhân viên",
    settings: "Cài đặt",
};

/**
 * Lấy tất cả permission keys dưới dạng string[]
 */
export function getAllPermissionKeys(): string[] {
    return Object.values(Permission);
}

/**
 * Nhóm permissions theo module
 */
export function groupPermissionsDB(permissions: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const perm of permissions) {
        const groupKey = perm.split(":")[0];
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(perm);
    }
    return groups;
}

/**
 * Lấy label tiếng Việt cho 1 permission key
 */
export function getPermissionLabel(key: string): string {
    return PERMISSION_DESCRIPTIONS[key] ?? key;
}

/**
 * Lấy group label cho 1 permission key
 */
export function getPermissionGroupLabel(key: string): string {
    const groupKey = key.split(":")[0];
    return PERMISSION_GROUPS_DB[groupKey] ?? groupKey;
}

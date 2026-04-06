// ─── Attendance Approval Process Constants ───

export const STEP_TYPE_OPTIONS = [
    { value: "APPROVER", label: "Người duyệt" },
    { value: "CONDITION", label: "Điều kiện" },
] as const;

export const APPROVER_TYPE_OPTIONS = [
    {
        value: "DIRECT_MANAGER",
        label: "Quản lý trực tiếp",
        description: "Người quản lý trực tiếp của nhân viên",
    },
    {
        value: "MANAGER_LEVEL",
        label: "Quản lý trực tiếp (Nhiều bậc)",
        description: "Duyệt theo thứ tự từ thấp đến cao",
    },
    {
        value: "DEPT_HEAD",
        label: "Trưởng phòng",
        description: "Trưởng phòng ban của nhân viên",
    },
    {
        value: "CUSTOM_LIST",
        label: "Danh sách chọn lọc",
        description: "Chọn danh sách nhân viên cố định",
    },
] as const;

export const APPROVAL_METHOD_OPTIONS = [
    {
        value: "ALL_MUST_APPROVE",
        label: "Tiếp ký (Tất cả phải duyệt)",
        description: "Tất cả người duyệt phải duyệt yêu cầu trước khi qua bước tiếp theo. Nếu chỉ một người từ chối thì yêu cầu sẽ bị dừng tại đây.",
    },
    {
        value: "FIRST_APPROVES",
        label: "Tiếp ký (Chỉ cần một người phê duyệt)",
        description:
            "Người duyệt đầu tiên sẽ quyết định việc duyệt hoặc từ chối yêu cầu để yêu cầu qua bước tiếp theo hoặc bị từ chối. Những người duyệt khác sau đó sẽ không thể thao tác trên yêu cầu được duyệt hoặc từ chối.",
    },
] as const;

export const CONDITION_TYPE_OPTIONS = [
    { value: "DEPARTMENT", label: "Phòng ban", description: "Lọc theo phòng ban của nhân viên" },
    { value: "PAYROLL_COMPANY", label: "Công ty trả lương", description: "Lọc theo công ty trả lương của nhân viên" },
    { value: "OTHER", label: "Điều kiện khác", description: "Áp dụng cho tất cả các yêu cầu còn lại" },
] as const;

export const MANAGER_LEVEL_OPTIONS = [
    { value: 1, label: "Cấp 1", description: "Quản lý trực tiếp" },
    { value: 2, label: "Cấp 2", description: "Quản lý cấp trên trực tiếp" },
    { value: 3, label: "Cấp 3", description: "Quản lý cấp cao hơn" },
] as const;

export const ADJUSTMENT_STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: string;
    }
> = {
    PENDING: {
        label: "Chờ duyệt",
        variant: "secondary",
        icon: "AlertCircle",
    },
    APPROVED: {
        label: "Đã duyệt",
        variant: "default",
        icon: "CheckCircle",
    },
    REJECTED: {
        label: "Từ chối",
        variant: "destructive",
        icon: "XCircle",
    },
    AUTO_APPROVED: {
        label: "Tự động duyệt",
        variant: "outline",
        icon: "Zap",
    },
    CANCELLED: {
        label: "Đã hủy",
        variant: "outline",
        icon: "Ban",
    },
};

export const DEFAULT_APPROVAL_STEPS: import("../types").ApprovalStep[] = [
    {
        stepOrder: 1,
        stepType: "APPROVER",
        approverType: "DIRECT_MANAGER",
        approvalMethod: "FIRST_APPROVES",
        skipIfNoApproverFound: true,
    },
];

export const DEPARTMENT_STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "INACTIVE", label: "Ngừng hoạt động" },
] as const;

export const PAGE_SIZE = 20;

export const SORT_OPTIONS = [
    { value: "name", label: "Tên phòng ban" },
    { value: "code", label: "Mã phòng ban" },
    { value: "createdAt", label: "Ngày tạo" },
    { value: "employeeCount", label: "Số nhân viên" },
] as const;

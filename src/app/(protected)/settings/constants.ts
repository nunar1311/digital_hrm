/** Theme color swatches: id is preset name (or "default"), color is used for swatch display */
export const THEME_COLOR_SWATCHES = [
    { id: "default", color: "oklch(0.45 0.01 265)", label: "Mặc định" },
    { id: "violet", color: "oklch(0.556 0.215 292.717)", label: "Tím" },
    { id: "blue", color: "oklch(0.558 0.214 252.894)", label: "Xanh dương" },
    { id: "rose", color: "oklch(0.645 0.246 16.439)", label: "Hồng" },
    { id: "orange", color: "oklch(0.705 0.213 47.604)", label: "Cam" },
    { id: "teal", color: "oklch(0.696 0.17 162.48)", label: "Xanh lục" },
    { id: "green", color: "oklch(0.648 0.2 131.684)", label: "Xanh lá" },
] as const;

export const LANGUAGE_OPTIONS = [
    { value: "vi", label: "Tiếng Việt" },
    { value: "en", label: "English" },
] as const;

export const TIMEZONE_OPTIONS = [
    { value: "Asia/Ho_Chi_Minh", label: "Asia/Saigon (UTC+7)" },
    { value: "Asia/Bangkok", label: "Thái Lan (UTC+7)" },
    { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
    { value: "Asia/Tokyo", label: "Nhật Bản (UTC+9)" },
    { value: "Asia/Shanghai", label: "Trung Quốc (UTC+8)" },
];

export const WEEK_START_OPTIONS = [
    { value: "0", label: "Chủ nhật" },
    { value: "1", label: "Thứ hai" },
];

export const DATE_FORMAT_OPTIONS = [
    { value: "dd/MM/yyyy", label: "dd/MM/yyyy" },
    { value: "MM/dd/yyyy", label: "MM/dd/yyyy" },
    { value: "yyyy-MM-dd", label: "yyyy-MM-dd" },
];

export const COMPANY_FIELDS = [
    { key: "company.name", label: "Tên công ty", type: "text", placeholder: "Nhập tên công ty", fullWidth: false },
    { key: "company.email", label: "Email", type: "email", placeholder: "contact@company.com", fullWidth: false },
    { key: "company.phone", label: "Số điện thoại", type: "text", placeholder: "024-xxxx-xxxx", fullWidth: false },
    { key: "company.taxCode", label: "Mã số thuế", type: "text", placeholder: "Nhập mã số thuế", fullWidth: false },
    { key: "company.address", label: "Địa chỉ", type: "text", placeholder: "Nhập địa chỉ công ty", fullWidth: true },
] as const;

export const SYSTEM_FIELDS = {
    timezone: { key: "system.timezone", default: "Asia/Ho_Chi_Minh" },
    weekStartDay: { key: "system.weekStartDay", default: "1" },
    dateFormat: { key: "system.dateFormat", default: "dd/MM/yyyy" },
    standardWorkHours: { key: "system.standardWorkHours", default: "8" },
    standardWorkDays: { key: "system.standardWorkDays", default: "22" },
} as const;

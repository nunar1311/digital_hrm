import type { AssetCategory, AssetStatus, AssignmentStatus, AssetCondition } from "./types";

// ─── Category Labels & Icons ───

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
    LAPTOP: "Laptop",
    PHONE: "Điện thoại",
    MONITOR: "Màn hình",
    DESK: "Bàn làm việc",
    CHAIR: "Ghế",
    CARD: "Thẻ ra vào",
    OTHER: "Khác",
};

export const ASSET_CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
    { value: "LAPTOP", label: "Laptop" },
    { value: "PHONE", label: "Điện thoại" },
    { value: "MONITOR", label: "Màn hình" },
    { value: "DESK", label: "Bàn làm việc" },
    { value: "CHAIR", label: "Ghế" },
    { value: "CARD", label: "Thẻ ra vào" },
    { value: "OTHER", label: "Khác" },
];

// ─── Status Labels & Colors ───

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
    AVAILABLE: "Sẵn sàng",
    ASSIGNED: "Đã cấp phát",
    MAINTENANCE: "Bảo trì",
    DISPOSED: "Đã thanh lý",
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    DISPOSED: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400",
};

export const ASSET_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
    { value: "AVAILABLE", label: "Sẵn sàng" },
    { value: "ASSIGNED", label: "Đã cấp phát" },
    { value: "MAINTENANCE", label: "Bảo trì" },
    { value: "DISPOSED", label: "Đã thanh lý" },
];

// ─── Assignment Status ───

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
    ASSIGNED: "Đã cấp",
    RETURNED: "Đã thu hồi",
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
    ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RETURNED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ─── Condition Labels ───

export const CONDITION_LABELS: Record<AssetCondition, string> = {
    GOOD: "Tốt",
    DAMAGED: "Hư hỏng",
    LOST: "Mất",
};

export const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
    { value: "GOOD", label: "Tốt" },
    { value: "DAMAGED", label: "Hư hỏng" },
    { value: "LOST", label: "Mất" },
];

// ─── Format Helpers ───

export function formatCurrency(value: number | null | undefined): string {
    if (value == null) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

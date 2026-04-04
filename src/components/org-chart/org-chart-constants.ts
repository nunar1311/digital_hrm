import { LucideIcon, Building2, Users, Briefcase, UserCircle, Settings, HelpCircle, DollarSign } from "lucide-react";

export const ZOOM_CONFIG = {
    MIN: 0.25,
    MAX: 2,
    STEP: 0.1,
    DEFAULT: 0.75,
    // Mobile defaults - start more zoomed out on small screens
    DEFAULT_MOBILE: 0.5,
} as const;

export const NODE_CONFIG = {
    WIDTH: 280,
    // Mobile: narrower cards for small screens
    WIDTH_MOBILE: 260,
    MIN_HEIGHT: 140,
    EXPAND_BUTTON_SIZE: 28,
    EXPAND_BUTTON_SIZE_MOBILE: 36,
    CHIP_DISPLAY_LIMIT: 3,
} as const;

export const ANIMATION_CONFIG = {
    TRANSITION_DURATION: 150,
    DEBOUNCE_DELAY: 300,
    LINE_RECALC_DELAY: 20,
    LINE_RECALC_DELAYED: 180,
} as const;

export const GRID_CONFIG = {
    BACKGROUND_SIZE: 24,
    OPACITY_LIGHT: 0.04,
    OPACITY_DARK: 0.06,
} as const;

export const COLORS = {
    STATUS_ACTIVE: "bg-emerald-500",
    STATUS_INACTIVE: "bg-gray-400",
    HIGHLIGHT: "ring-primary/60 border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]",
    DIMMED: "opacity-35 scale-[0.97]",
    DRAG_OVER: "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/30 scale-[1.03]",
    ACTIVE_BAR: "bg-primary",
} as const;

export const STATUS_LABELS = {
    ACTIVE: "Đang hoạt động",
    INACTIVE: "Ngừng hoạt động",
} as const;

export const PLACEHOLDERS = {
    SEARCH: "Tìm phòng ban, nhân viên...",
    NO_MANAGER: "Chưa phân công",
    NO_POSITION: "Chưa có quản trị",
    NO_DATA: "Chưa có dữ liệu phòng ban",
    CREATE_FIRST: "Hãy tạo phòng ban đầu tiên",
} as const;

export const TOOLTIPS = {
    ZOOM_IN: "Phóng to",
    ZOOM_OUT: "Thu nhỏ",
    RESET_VIEW: "Đặt lại",
    FULLSCREEN: "Toàn màn hình",
    EXIT_FULLSCREEN: "Thoát toàn màn hình",
    LOCK: "Khóa khung hình",
    UNLOCK: "Mở khóa khung hình",
    EXPAND_ALL: "Mở rộng tất cả",
    COLLAPSE_ALL: "Thu gọn tất cả",
    CREATE_DEPT: "Thêm phòng ban",
    TEMPLATES: "Mẫu cơ cấu",
    DRAG_EMPLOYEE: "Kéo để chuyển nhân viên sang phòng ban khác",
    DROP_ZONE: "Thả vào đây",
    SCROLL_ZOOM: "Cuộn = zoom",
    DRAG_MOVE: "Kéo = di chuyển",
    CLICK_DETAIL: "Click = chi tiết",
    DRAG_TRANSFER: "Kéo thả nhân viên để chuyển phòng ban",
    SHARE: "Chia sẻ liên kết",
    EXPORT_IMAGE: "Xuất ảnh",
    CUSTOMIZE: "Tùy chỉnh giao diện",
} as const;

export const HELP_TEXT = "🖱️ Cuộn = zoom • Kéo = di chuyển • Click = chi tiết • Kéo thả nhân viên để chuyển phòng ban";

export const DEPARTMENT_ICON_MAP: Record<string, LucideIcon> = {
    building: Building2,
    users: Users,
    briefcase: Briefcase,
    user: UserCircle,
    settings: Settings,
    help: HelpCircle,
    money: DollarSign,
};

export type ZoomLevel = typeof ZOOM_CONFIG.MIN | typeof ZOOM_CONFIG.MAX | typeof ZOOM_CONFIG.DEFAULT;
export type AnimationDuration = typeof ANIMATION_CONFIG.TRANSITION_DURATION;

// ─── Cá nhân hóa sơ đồ (Chart personalization) ───
export type ChartThemeId = "default" | "blue" | "emerald" | "violet" | "amber";
export type ChartCardStyle = "default" | "compact" | "bordered";

export const CHART_THEMES: Record<
    ChartThemeId,
    { label: string; accent: string; border: string }
> = {
    default: { label: "Mặc định", accent: "primary", border: "border-primary/50" },
    blue: { label: "Xanh dương", accent: "blue", border: "border-blue-500/50" },
    emerald: { label: "Xanh lá", accent: "emerald", border: "border-emerald-500/50" },
    violet: { label: "Tím", accent: "violet", border: "border-violet-500/50" },
    amber: { label: "Vàng cam", accent: "amber", border: "border-amber-500/50" },
};

export const CHART_CARD_STYLES: Record<ChartCardStyle, { label: string }> = {
    default: { label: "Chuẩn" },
    compact: { label: "Gọn" },
    bordered: { label: "Viền nổi" },
};

// ─── Cơ cấu đa chức năng (Layout mode) ───
export type ChartLayoutMode = "hierarchy" | "functional";

export const CHART_LAYOUT_LABELS: Record<ChartLayoutMode, string> = {
    hierarchy: "Phân cấp",
    functional: "Theo nhóm chức năng",
};

// Màu cho từng nhóm chức năng (functional view)
export const FUNCTIONAL_GROUP_COLORS = [
    "bg-amber-500/90",
    "bg-red-500/90",
    "bg-emerald-500/90",
    "bg-blue-500/90",
    "bg-violet-500/90",
    "bg-cyan-500/90",
] as const;

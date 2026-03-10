import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Ban,
    ClipboardCheck,
    ShieldCheck,
} from "lucide-react";

export const PAGE_SIZE = 20;

export const STATUS_MAP: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof CheckCircle;
    }
> = {
    PENDING: {
        label: "Chờ QL duyệt",
        variant: "secondary",
        icon: AlertCircle,
    },
    MANAGER_APPROVED: {
        label: "QL đã duyệt",
        variant: "outline",
        icon: ClipboardCheck,
    },
    HR_APPROVED: {
        label: "HR đã duyệt",
        variant: "outline",
        icon: ShieldCheck,
    },
    COMPLETED: {
        label: "Hoàn thành",
        variant: "default",
        icon: CheckCircle,
    },
    REJECTED: {
        label: "Từ chối",
        variant: "destructive",
        icon: XCircle,
    },
    CANCELLED: { label: "Đã hủy", variant: "outline", icon: Ban },
};

export const DAY_TYPE_LABELS: Record<string, string> = {
    WEEKDAY: "Ngày thường",
    WEEKEND: "Cuối tuần",
    HOLIDAY: "Ngày lễ",
};

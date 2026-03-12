import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const STATUS_MAP: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof CheckCircle;
    }
> = {
    PENDING: {
        label: "Chờ duyệt",
        variant: "secondary",
        icon: AlertCircle,
    },
    APPROVED: {
        label: "Đã duyệt",
        variant: "default",
        icon: CheckCircle,
    },
    REJECTED: {
        label: "Từ chối",
        variant: "destructive",
        icon: XCircle,
    },
};

export const TYPE_LABELS: Record<string, string> = {
    LATE: "Đi muộn",
    EARLY_LEAVE: "Về sớm",
    ABSENT: "Vắng mặt",
    FORGOT_CHECKOUT: "Quên checkout",
    OTHER: "Khác",
};

export const STATUS_LABELS: Record<string, string> = {
    LATE: "Đi muộn",
    EARLY_LEAVE: "Về sớm",
    LATE_AND_EARLY: "Muộn & Sớm",
    ABSENT: "Vắng mặt",
    HALF_DAY: "Nửa ngày",
};

import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    CalendarOff,
    CalendarCheck,
    Coffee,
    Ban,
} from "lucide-react";

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof CheckCircle;
        className?: string;
    }
> = {
    PRESENT: {
        label: "Đúng giờ",
        variant: "default",
        icon: CheckCircle,
        className: "bg-green-600",
    },
    LATE: {
        label: "Đi muộn",
        variant: "secondary",
        icon: Clock,
        className: "bg-yellow-500 text-white",
    },
    EARLY_LEAVE: {
        label: "Về sớm",
        variant: "secondary",
        icon: Clock,
        className: "bg-orange-500 text-white",
    },
    LATE_AND_EARLY: {
        label: "Muộn & Sớm",
        variant: "destructive",
        icon: AlertCircle,
    },
    ABSENT: {
        label: "Vắng mặt",
        variant: "destructive",
        icon: XCircle,
    },
    HALF_DAY: { label: "Nửa ngày", variant: "outline", icon: Coffee },
    ON_LEAVE: {
        label: "Nghỉ phép",
        variant: "secondary",
        icon: CalendarOff,
        className: "bg-purple-500 text-white",
    },
    HOLIDAY: {
        label: "Ngày lễ",
        variant: "secondary",
        icon: CalendarCheck,
        className: "bg-indigo-500 text-white",
    },
    // Approval statuses
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
    CANCELLED: { label: "Đã hủy", variant: "outline", icon: Ban },
};

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const config = STATUS_CONFIG[status];
    if (!config) {
        return (
            <Badge variant="outline" className={className}>
                {status}
            </Badge>
        );
    }

    const Icon = config.icon;
    return (
        <Badge
            variant={config.variant}
            className={`${config.className || ""} ${className || ""}`}
        >
            <Icon className="mr-1 h-3 w-3" /> {config.label}
        </Badge>
    );
}

export function AttendanceStatusLabel({
    status,
}: {
    status: string;
}) {
    const config = STATUS_CONFIG[status];
    return config?.label || status;
}

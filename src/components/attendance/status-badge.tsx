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
import { useTranslations } from "next-intl";

const STATUS_CONFIG: Record<
    string,
    {
        labelKey: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof CheckCircle;
        className?: string;
    }
> = {
    PRESENT: {
        labelKey: "attendanceStatusBadgePresent",
        variant: "default",
        icon: CheckCircle,
        className: "bg-green-600",
    },
    LATE: {
        labelKey: "attendanceStatusBadgeLate",
        variant: "secondary",
        icon: Clock,
        className: "bg-yellow-500 text-white",
    },
    EARLY_LEAVE: {
        labelKey: "attendanceStatusBadgeEarlyLeave",
        variant: "secondary",
        icon: Clock,
        className: "bg-orange-500 text-white",
    },
    LATE_AND_EARLY: {
        labelKey: "attendanceStatusBadgeLateAndEarly",
        variant: "destructive",
        icon: AlertCircle,
    },
    ABSENT: {
        labelKey: "attendanceStatusBadgeAbsent",
        variant: "destructive",
        icon: XCircle,
    },
    HALF_DAY: {
        labelKey: "attendanceStatusBadgeHalfDay",
        variant: "outline",
        icon: Coffee,
    },
    ON_LEAVE: {
        labelKey: "attendanceStatusBadgeOnLeave",
        variant: "secondary",
        icon: CalendarOff,
        className: "bg-purple-500 text-white",
    },
    HOLIDAY: {
        labelKey: "attendanceStatusBadgeHoliday",
        variant: "secondary",
        icon: CalendarCheck,
        className: "bg-indigo-500 text-white",
    },
    PENDING: {
        labelKey: "attendanceStatusBadgePending",
        variant: "secondary",
        icon: AlertCircle,
    },
    APPROVED: {
        labelKey: "attendanceStatusBadgeApproved",
        variant: "default",
        icon: CheckCircle,
    },
    REJECTED: {
        labelKey: "attendanceStatusBadgeRejected",
        variant: "destructive",
        icon: XCircle,
    },
    CANCELLED: {
        labelKey: "attendanceStatusBadgeCancelled",
        variant: "outline",
        icon: Ban,
    },
};

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const t = useTranslations("ProtectedPages");
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
            <Icon className="mr-1 h-3 w-3" /> {t(config.labelKey)}
        </Badge>
    );
}

export function AttendanceStatusLabel({
    status,
}: {
    status: string;
}) {
    const t = useTranslations("ProtectedPages");
    const config = STATUS_CONFIG[status];
    return config ? t(config.labelKey) : status;
}

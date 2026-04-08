import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const STATUS_MAP: Record<
    string,
    {
        labelKey: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof CheckCircle;
    }
> = {
    PENDING: {
        labelKey: "attendanceExplanationsStatusPending",
        variant: "secondary",
        icon: AlertCircle,
    },
    APPROVED: {
        labelKey: "attendanceExplanationsStatusApproved",
        variant: "default",
        icon: CheckCircle,
    },
    REJECTED: {
        labelKey: "attendanceExplanationsStatusRejected",
        variant: "destructive",
        icon: XCircle,
    },
};

export const TYPE_TRANSLATION_KEYS: Record<string, string> = {
    LATE: "attendanceExplanationsTypeLate",
    EARLY_LEAVE: "attendanceExplanationsTypeEarlyLeave",
    ABSENT: "attendanceExplanationsTypeAbsent",
    FORGOT_CHECKOUT: "attendanceExplanationsTypeForgotCheckout",
    OTHER: "attendanceExplanationsTypeOther",
};

export const ATTENDANCE_STATUS_TRANSLATION_KEYS: Record<string, string> = {
    LATE: "attendanceExplanationsAttendanceStatusLate",
    EARLY_LEAVE: "attendanceExplanationsAttendanceStatusEarlyLeave",
    LATE_AND_EARLY: "attendanceExplanationsAttendanceStatusLateAndEarly",
    ABSENT: "attendanceExplanationsAttendanceStatusAbsent",
    HALF_DAY: "attendanceExplanationsAttendanceStatusHalfDay",
};

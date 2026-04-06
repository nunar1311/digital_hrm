"use client";

import { useTimezone as useTimezoneContext } from "@/contexts/timezone-context";

export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export const TIMEZONE_OPTIONS = [
    { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (GMT+7)" },
    { value: "Asia/Bangkok", label: "Thái Lan (GMT+7)" },
    { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
    { value: "Asia/Hong_Kong", label: "Hồng Kông (GMT+8)" },
    { value: "Asia/Shanghai", label: "Trung Quốc (GMT+8)" },
    { value: "Asia/Tokyo", label: "Nhật Bản (GMT+9)" },
    { value: "Asia/Seoul", label: "Hàn Quốc (GMT+9)" },
    { value: "Asia/Jakarta", label: "Indonesia (GMT+7)" },
    { value: "Asia/Manila", label: "Philippines (GMT+8)" },
    { value: "Asia/Kuala_Lumpur", label: "Malaysia (GMT+8)" },
    { value: "Asia/Dubai", label: "UAE (GMT+4)" },
    { value: "Asia/Kolkata", label: "Ấn Độ (GMT+5:30)" },
    { value: "Asia/Karachi", label: "Pakistan (GMT+5)" },
    { value: "Europe/London", label: "Anh (GMT+0)" },
    { value: "Europe/Paris", label: "Pháp (GMT+1)" },
    { value: "Europe/Berlin", label: "Đức (GMT+1)" },
    { value: "Europe/Moscow", label: "Nga (GMT+3)" },
    { value: "America/New_York", label: "Mỹ - New York (GMT-5)" },
    { value: "America/Los_Angeles", label: "Mỹ - Los Angeles (GMT-8)" },
    { value: "America/Chicago", label: "Mỹ - Chicago (GMT-6)" },
    { value: "America/Denver", label: "Mỹ - Denver (GMT-7)" },
    { value: "America/Toronto", label: "Canada - Toronto (GMT-5)" },
    { value: "America/Vancouver", label: "Canada - Vancouver (GMT-8)" },
    { value: "Australia/Sydney", label: "Úc - Sydney (GMT+11)" },
    { value: "Australia/Melbourne", label: "Úc - Melbourne (GMT+11)" },
    { value: "Pacific/Auckland", label: "New Zealand (GMT+13)" },
    { value: "UTC", label: "UTC (GMT+0)" },
] as const;

export type TimezoneValue = (typeof TIMEZONE_OPTIONS)[number]["value"];

export function useTimezone() {
    return useTimezoneContext();
}

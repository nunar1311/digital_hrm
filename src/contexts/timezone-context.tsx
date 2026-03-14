"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { getTimezoneFromDB } from "@/app/(protected)/settings/get-timezone";

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

interface TimezoneContextValue {
    timezone: string;
    setTimezone: (value: string) => void;
    isLoading: boolean;
    isInitialized: boolean;
    formatDate: (date: string | Date | null, options?: Intl.DateTimeFormatOptions) => string;
    formatTime: (date: string | Date | null, options?: Intl.DateTimeFormatOptions) => string;
    formatDateTime: (date: string | Date | null, options?: Intl.DateTimeFormatOptions) => string;
    getTimezoneOffset: () => string;
    getTimezoneLabel: () => string;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

interface TimezoneProviderProps {
    children: ReactNode;
    initialTimezone?: string;
}

export function TimezoneProvider({ children, initialTimezone }: TimezoneProviderProps) {
    const [storedTimezone, setStoredTimezone] = useLocalStorage({
        key: "app-timezone",
        defaultValue: initialTimezone ?? DEFAULT_TIMEZONE,
    });

    const [timezone, setTimezoneState] = useState(initialTimezone ?? DEFAULT_TIMEZONE);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initTimezone = async () => {
            try {
                const dbTimezone = await getTimezoneFromDB();
                if (dbTimezone && dbTimezone !== storedTimezone) {
                    setStoredTimezone(dbTimezone);
                    setTimezoneState(dbTimezone);
                } else if (!storedTimezone || storedTimezone === DEFAULT_TIMEZONE) {
                    setTimezoneState(dbTimezone);
                }
            } catch (error) {
                console.error("Failed to fetch timezone:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initTimezone();
    }, []);

    useSocketEvent("settings:updated", () => {
        getTimezoneFromDB()
            .then((tz) => {
                if (tz) {
                    setStoredTimezone(tz);
                    setTimezoneState(tz);
                }
            })
            .catch(console.error);
    });

    const setTimezone = (value: string) => {
        setStoredTimezone(value);
        setTimezoneState(value);
    };

    const formatDate = (
        date: string | Date | null,
        options?: Intl.DateTimeFormatOptions,
    ): string => {
        if (!date) return "—";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleDateString("vi-VN", {
            timeZone: timezone,
            ...options,
        });
    };

    const formatTime = (
        date: string | Date | null,
        options?: Intl.DateTimeFormatOptions,
    ): string => {
        if (!date) return "—";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleTimeString("vi-VN", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            ...options,
        });
    };

    const formatDateTime = (
        date: string | Date | null,
        options?: Intl.DateTimeFormatOptions,
    ): string => {
        if (!date) return "—";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleString("vi-VN", {
            timeZone: timezone,
            ...options,
        });
    };

    const getTimezoneOffset = (): string => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("vi-VN", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(now);
        const offsetPart = parts.find((p) => p.type === "timeZoneName");
        return offsetPart?.value ?? "";
    };

    const getTimezoneLabel = (): string => {
        const option = TIMEZONE_OPTIONS.find((opt) => opt.value === timezone);
        return option?.label ?? timezone;
    };

    return (
        <TimezoneContext.Provider
            value={{
                timezone,
                setTimezone,
                isLoading,
                isInitialized: !isLoading,
                formatDate,
                formatTime,
                formatDateTime,
                getTimezoneOffset,
                getTimezoneLabel,
            }}
        >
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);
    if (!context) {
        throw new Error("useTimezone must be used within a TimezoneProvider");
    }
    return context;
}

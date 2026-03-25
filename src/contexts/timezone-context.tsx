"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useLocalStorage } from "@mantine/hooks";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { getTimezoneFromDB } from "@/app/(protected)/settings/get-timezone";
import { DEFAULT_TIMEZONE } from "@/hooks/use-timezone";
import { TIMEZONE_OPTIONS } from "@/app/(protected)/settings/constants";

interface TimezoneContextValue {
  timezone: string;
  setTimezone: (value: string) => void;
  isLoading: boolean;
  isInitialized: boolean;
  formatDate: (
    date: string | Date | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatTime: (
    date: string | Date | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatDateTime: (
    date: string | Date | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  getTimezoneOffset: () => string;
  getTimezoneLabel: () => string;
  /** Convert a Date to a "local" Date whose year/month/day match the configured timezone */
  toTimezoneDate: (date: Date) => Date;
  /** Check if a given date is "today" in the configured timezone */
  isTodayInTimezone: (date: Date) => boolean;
  /** Format a date as "yyyy-MM-dd" in the configured timezone */
  formatDateKey: (date: Date) => string;
  /** Get "now" as a Date whose year/month/day match the configured timezone */
  nowInTimezone: () => Date;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

interface TimezoneProviderProps {
  children: ReactNode;
  initialTimezone?: string;
}

export function TimezoneProvider({
  children,
  initialTimezone,
}: TimezoneProviderProps) {
  const [storedTimezone, setStoredTimezone] = useLocalStorage({
    key: "app-timezone",
    defaultValue: initialTimezone ?? DEFAULT_TIMEZONE,
  });

  const [timezone, setTimezoneState] = useState(
    initialTimezone ?? DEFAULT_TIMEZONE,
  );
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

  /** Convert a Date to a "local" Date whose y/m/d match the configured timezone */
  const toTimezoneDate = (date: Date): Date => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA gives yyyy-MM-dd format
    const [y, m, d] = fmt.format(date).split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  /** Check if a given date is "today" in the configured timezone */
  const isTodayInTimezone = (date: Date): boolean => {
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const dayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    return todayStr === dayStr;
  };

  /** Format a date as "yyyy-MM-dd" in the configured timezone */
  const formatDateKey = (date: Date): string => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  /** Get "now" as a Date whose year/month/day match the configured timezone */
  const nowInTimezone = (): Date => {
    return toTimezoneDate(new Date());
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
        toTimezoneDate,
        isTodayInTimezone,
        formatDateKey,
        nowInTimezone,
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

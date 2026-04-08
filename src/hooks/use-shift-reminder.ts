"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getUpcomingShiftReminder,
  sendShiftReminderNotification,
} from "@/app/[locale]/(protected)/attendance/actions";

const REMINDER_STORAGE_PREFIX = "shift-reminder-sent-";

function getReminderKey(shiftId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${REMINDER_STORAGE_PREFIX}${shiftId}-${today}`;
}

function wasReminderSent(shiftId: string): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(getReminderKey(shiftId)) === "1";
}

function markReminderSent(shiftId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getReminderKey(shiftId), "1");
}

export function useShiftReminder() {
  const isSending = useRef(false);

  const { data } = useQuery({
    queryKey: ["attendance", "shift-reminder"],
    queryFn: () => getUpcomingShiftReminder(),
    refetchInterval: 60_000, // Poll má»—i 60 giÃ¢y
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const sendReminder = useCallback(async () => {
    if (!data?.shouldRemind || !data.shift) return;
    if (wasReminderSent(data.shift.id)) return;
    if (isSending.current) return;

    isSending.current = true;
    try {
      // Gá»­i notification vÃ o DB + email (server-side)
      await sendShiftReminderNotification({
        shiftId: data.shift.id,
        shiftName: data.shift.name,
        shiftStartTime: data.shift.startTime,
      });

      // ÄÃ¡nh dáº¥u Ä‘Ã£ gá»­i
      markReminderSent(data.shift.id);
    } catch (error) {
      console.error("[ShiftReminder] Failed to send reminder:", error);
    } finally {
      isSending.current = false;
    }
  }, [data]);

  useEffect(() => {
    if (data?.shouldRemind && data.shift) {
      sendReminder();
    }
  }, [data, sendReminder]);

  return {
    shouldRemind: data?.shouldRemind ?? false,
    shift: data?.shift ?? null,
    minutesUntil: data?.minutesUntil ?? 0,
  };
}


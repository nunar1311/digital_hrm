"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { createElement } from "react";
import { useTranslations } from "next-intl";
import { useShiftReminder } from "@/hooks/use-shift-reminder";
import { useBrowserNotification } from "@/lib/browser-notification";

/**
 * Invisible component: mounts shift reminder hook and dispatches
 * toast + browser notifications.
 */
export function ShiftReminderNotifier() {
  const { shouldRemind, shift, minutesUntil } = useShiftReminder();
  const browserNotification = useBrowserNotification();
  const t = useTranslations("ProtectedPages");
  const toastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRemind || !shift) return;

    // Prevent duplicate notifications for the same shift/day
    const toastKey = `${shift.id}-${new Date().toISOString().split("T")[0]}`;
    if (toastShown.current === toastKey) return;
    toastShown.current = toastKey;

    const minuteText =
      minutesUntil === 0
        ? t("attendanceShiftReminderNow")
        : t("attendanceShiftReminderInMinutes", { minutes: minutesUntil });

    const title = t("attendanceShiftReminderTitle");
    const description = t("attendanceShiftReminderDescription", {
      shiftName: shift.name,
      startTime: shift.startTime,
      minuteText,
    });

    toast.info(title, {
      description,
      duration: 15000,
      icon: createElement(Clock, { className: "h-4 w-4" }),
      action: {
        label: t("attendanceShiftReminderAction"),
        onClick: () => {
          window.location.href = "/attendance";
        },
      },
    });

    browserNotification.showNotification(
      title,
      description,
      "HIGH",
      "/attendance"
    );
  }, [shouldRemind, shift, minutesUntil, browserNotification, t]);

  return null;
}

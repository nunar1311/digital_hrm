"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { createElement } from "react";
import { useShiftReminder } from "@/hooks/use-shift-reminder";
import { useBrowserNotification } from "@/lib/browser-notification";

/**
 * Component "invisible" — không render gì lên màn hình.
 * Chỉ mount hook useShiftReminder và handle hiển thị toast + browser notification.
 */
export function ShiftReminderNotifier() {
  const { shouldRemind, shift, minutesUntil } = useShiftReminder();
  const browserNotification = useBrowserNotification();
  const toastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRemind || !shift) return;

    // Tránh hiện toast trùng lặp cho cùng ca
    const toastKey = `${shift.id}-${new Date().toISOString().split("T")[0]}`;
    if (toastShown.current === toastKey) return;
    toastShown.current = toastKey;

    // Hiển thị toast trên trang
    const minuteText =
      minutesUntil === 0
        ? "ngay bây giờ"
        : `trong ${minutesUntil} phút nữa`;

    toast.info(`Sắp đến giờ làm việc`, {
      description: `Ca "${shift.name}" bắt đầu lúc ${shift.startTime} (${minuteText}). Hãy chuẩn bị chấm công!`,
      duration: 15000,
      icon: createElement(Clock, { className: "h-4 w-4" }),
      action: {
        label: "Chấm công",
        onClick: () => {
          window.location.href = "/attendance";
        },
      },
    });

    // Hiển thị browser notification
    browserNotification.showNotification(
      "Sắp đến giờ làm việc",
      `Ca "${shift.name}" bắt đầu lúc ${shift.startTime} (${minuteText}). Hãy chuẩn bị chấm công!`,
      "HIGH",
      "/attendance"
    );
  }, [shouldRemind, shift, minutesUntil, browserNotification]);

  return null;
}

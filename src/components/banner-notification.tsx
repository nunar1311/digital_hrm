"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon, XIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "dhrm_notification_banner";

interface BannerState {
  dismissed: boolean;
  permission: NotificationPermission | "default";
  remindAt?: number;
}

async function fetchPreferences() {
  const { getNotificationSettings } =
    await import("@/app/(protected)/notifications/actions");
  return await getNotificationSettings();
}

async function updateBrowserPreference(enabled: boolean) {
  const { savePreferences } =
    await import("@/app/(protected)/notifications/actions");
  return await savePreferences({ browserEnabled: enabled });
}

export default function BannerNotification() {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const currentPermission = Notification?.permission || "default";
      if (currentPermission === "granted") {
        return false;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: BannerState = JSON.parse(stored);
        if (state.dismissed) {
          if (state.remindAt && Date.now() < state.remindAt) {
            return false;
          }
        }
        if (state.permission === currentPermission) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  });

  const { isLoading: isLoadingPrefs } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: fetchPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: updateBrowserPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });

  const handleEnable = async () => {
    if (!("Notification" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ thông báo.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        new Notification("Digital HRM", {
          body: "Bạn sẽ nhận được thông báo từ hệ thống.",
          icon: "/icon.png",
        });

        updateMutation.mutate(true);
      }

      const state: BannerState = {
        dismissed: false,
        permission,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      setIsVisible(false);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const handleRemindLater = () => {
    const remindAt = Date.now() + 24 * 60 * 60 * 1000;
    const state: BannerState = {
      dismissed: true,
      permission: "default",
      remindAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setIsVisible(false);
  };

  const handleDismiss = () => {
    const state: BannerState = {
      dismissed: true,
      permission: "default",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const currentPermission = Notification?.permission || "default";
  const isGranted = currentPermission === "granted";
  const isPending = updateMutation.isPending;

  if (isPending) {
    return null;
  }

  return (
    <section className="flex items-center justify-between flex-nowrap gap-1 sm:gap-4 bg-primary min-h-11 text-accent leading-5 py-2.5 px-2 sm:px-4">
      <div className="grow flex items-center justify-between flex-wrap gap-1 sm:gap-2">
        <BellIcon className="size-4" />
        <p className="grow-500 basis-[min-content] text-xs sm:text-sm font-medium">
          <strong>Digital HRM</strong> cần quyền truy cập để gửi thông báo.
        </p>
        <Button
          size="xs"
          variant="outline"
          className="bg-transparent hover:text-white hover:bg-white/20"
          onClick={handleEnable}
          disabled={isGranted || isLoadingPrefs || isPending}
        >
          {isGranted ? "Đã bật" : "Bật"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="bg-transparent hover:text-white hover:bg-white/20"
          onClick={handleRemindLater}
        >
          Nhắc tôi sau
        </Button>
      </div>
      <Button
        size="icon-xs"
        variant="ghost"
        tooltip={"Đóng"}
        className="hover:text-white hover:bg-white/20"
        onClick={handleDismiss}
      >
        <XIcon />
      </Button>
    </section>
  );
}

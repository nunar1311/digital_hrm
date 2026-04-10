"use client";

import { useMemo, useState } from "react";
import { Bell, Inbox, Mail, Monitor, X } from "lucide-react";
import {
  useNotificationPreferences,
  useUpdatePreferences,
  useSendTestEmail,
} from "@/app/(protected)/notifications/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import NotificationSelect from "@/components/notifications/notification-select";
import { CustomNotificationDialog } from "@/components/notifications/custom-notification-dialog";
import { BrowserNotificationDropdown } from "@/components/notifications/browser-notification";

type ProfileType = "default" | "focused" | "custom" | "off";

type NotificationPreferenceData = {
  emailEnabled?: boolean;
  browserEnabled?: boolean;
  browserSoundEnabled?: boolean;
  notificationTypes?: string[];
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  emailNotificationTypes?: string[];
  emailQuietHoursEnabled?: boolean;
  emailQuietHoursStart?: string | null;
  emailQuietHoursEnd?: string | null;
  inboxNotificationTypes?: string[];
  inboxQuietHoursEnabled?: boolean;
  inboxQuietHoursStart?: string | null;
  inboxQuietHoursEnd?: string | null;
  browserNotificationTypes?: string[];
  browserQuietHoursEnabled?: boolean;
  browserQuietHoursStart?: string | null;
  browserQuietHoursEnd?: string | null;
};

const PROFILE_OPTIONS = [
  {
    value: "default" as ProfileType,
    label: "Mặc định",
    description: "Nhận tất cả thông báo trong hệ thống",
    subtitle: "Cài đặt được đề xuất",
  },
  {
    value: "focused" as ProfileType,
    label: "Tập trung",
    description: "Chỉ thông báo quan trọng, giờ yên tĩnh",
    subtitle: "Theo dõi công việc mà không bị quá tải thông báo",
  },
  {
    value: "custom" as ProfileType,
    label: "Tùy chỉnh",
    description: "Tự cấu hình theo nhu cầu của bạn",
    subtitle: "Cấu hình theo nhu cầu của bạn",
  },
];

const CHANNEL_OPTIONS = [
  ...PROFILE_OPTIONS,
  {
    value: "off" as ProfileType,
    label: "Tắt",
    description: "Tắt kênh thông báo này",
    subtitle: "Không nhận thông báo qua kênh này",
  },
];

export function NotificationSettingsClient() {
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdatePreferences();
  const sendTestEmail = useSendTestEmail();

  // Dialog state
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customDialogChannel, setCustomDialogChannel] = useState<
    "inbox" | "email" | "browser"
  >("inbox");

  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>(() => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return "default";
      }
      return Notification.permission;
    });

  // Calculate profile for inbox
  const inboxProfile = useMemo<ProfileType>(() => {
    if (!preferences) return "default";

    const prefs = preferences as unknown as NotificationPreferenceData;
    const hasNotificationTypes =
      prefs.inboxNotificationTypes &&
      Array.isArray(prefs.inboxNotificationTypes) &&
      prefs.inboxNotificationTypes.length > 0;

    if (!prefs.inboxQuietHoursEnabled && !hasNotificationTypes) {
      return "default";
    } else if (prefs.inboxQuietHoursEnabled && !hasNotificationTypes) {
      return "focused";
    }
    return "custom";
  }, [preferences]);

  // Calculate profile for email
  const emailProfile = useMemo<ProfileType>(() => {
    if (!preferences) return "default";

    const prefs = preferences as unknown as NotificationPreferenceData;

    if (prefs.emailEnabled === false) return "off";

    const hasNotificationTypes =
      prefs.emailNotificationTypes &&
      Array.isArray(prefs.emailNotificationTypes) &&
      prefs.emailNotificationTypes.length > 0;

    if (!prefs.emailQuietHoursEnabled && !hasNotificationTypes) {
      return "default";
    } else if (prefs.emailQuietHoursEnabled && !hasNotificationTypes) {
      return "focused";
    }
    return "custom";
  }, [preferences]);

  // Calculate profile for browser
  const browserProfile = useMemo<ProfileType>(() => {
    if (!preferences) return "default";

    const prefs = preferences as unknown as NotificationPreferenceData;

    if (prefs.browserEnabled === false) return "off";

    const hasNotificationTypes =
      prefs.browserNotificationTypes &&
      Array.isArray(prefs.browserNotificationTypes) &&
      prefs.browserNotificationTypes.length > 0;

    if (!prefs.browserQuietHoursEnabled && !hasNotificationTypes) {
      return "default";
    } else if (prefs.browserQuietHoursEnabled && !hasNotificationTypes) {
      return "focused";
    }
    return "custom";
  }, [preferences]);

  const isBrowserActive =
    preferences &&
    (preferences as unknown as NotificationPreferenceData).browserEnabled &&
    browserPermission === "granted";

  const handleProfileChange = async (
    channel: "inbox" | "email" | "browser",
    profile: ProfileType,
  ) => {
    if (profile === "off") {
      if (channel === "email") {
        await updatePreferences.mutateAsync({
          emailEnabled: false,
        });
      } else if (channel === "browser") {
        await updatePreferences.mutateAsync({
          browserEnabled: false,
          browserNotificationTypes: [],
        });
      }
      return;
    }

    if (channel === "inbox") {
      if (profile === "focused") {
        await updatePreferences.mutateAsync({
          inboxQuietHoursEnabled: true,
          inboxQuietHoursStart: "18:00",
          inboxQuietHoursEnd: "09:00",
          inboxNotificationTypes: [],
        });
      } else if (profile === "default") {
        await updatePreferences.mutateAsync({
          inboxQuietHoursEnabled: false,
          inboxQuietHoursStart: undefined,
          inboxQuietHoursEnd: undefined,
          inboxNotificationTypes: [],
        });
      }
    } else if (channel === "email") {
      if (profile === "focused") {
        await updatePreferences.mutateAsync({
          emailEnabled: true,
          emailQuietHoursEnabled: true,
          emailQuietHoursStart: "18:00",
          emailQuietHoursEnd: "09:00",
          emailNotificationTypes: [],
        });
      } else if (profile === "default") {
        await updatePreferences.mutateAsync({
          emailEnabled: true,
          emailQuietHoursEnabled: false,
          emailQuietHoursStart: undefined,
          emailQuietHoursEnd: undefined,
          emailNotificationTypes: [],
        });
      }
    } else if (channel === "browser") {
      if (profile === "focused") {
        await updatePreferences.mutateAsync({
          browserEnabled: true,
          browserQuietHoursEnabled: true,
          browserQuietHoursStart: "18:00",
          browserQuietHoursEnd: "09:00",
          browserNotificationTypes: [],
        });
      } else if (profile === "default") {
        if (browserPermission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            toast.error("Không thể bật thông báo trình duyệt");
            return;
          }
        }
        await updatePreferences.mutateAsync({
          browserEnabled: true,
          browserQuietHoursEnabled: false,
          browserQuietHoursStart: undefined,
          browserQuietHoursEnd: undefined,
          browserNotificationTypes: [],
        });
      }
    }
  };

  const handleEnableBrowser = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Trình duyệt không hỗ trợ thông báo");
      return;
    }
    if (Notification.permission === "granted") {
      await updatePreferences.mutateAsync({
        browserEnabled: true,
      });
      setBrowserPermission("granted");
      toast.success("Đã bật thông báo trình duyệt");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await updatePreferences.mutateAsync({
        browserEnabled: true,
      });
      setBrowserPermission("granted");
      toast.success("Đã bật thông báo trình duyệt");
    } else if (permission === "denied") {
      setBrowserPermission("denied");
      toast.error("Bạn đã từ chối thông báo trình duyệt");
    }
  };

  const handleSendTestEmail = () => {
    if (!preferences?.emailEnabled) {
      toast.error(
        "Bạn cần bật thông báo email trước khi gửi thử",
      );
      return;
    }
    sendTestEmail.mutate();
  };

  const handleCustomDialogOpen = (channel: "inbox" | "email" | "browser") => {
    setCustomDialogChannel(channel);
    setCustomDialogOpen(true);
  };

  const handleCustomSave = async (types: string[]) => {
    console.log(
      "[handleCustomSave] channel:",
      customDialogChannel,
      "types:",
      JSON.stringify(types),
    );
    if (customDialogChannel === "inbox") {
      await updatePreferences.mutateAsync({
        inboxNotificationTypes: types,
        inboxQuietHoursEnabled: false,
      });
    } else if (customDialogChannel === "email") {
      await updatePreferences.mutateAsync({
        emailNotificationTypes: types,
        emailQuietHoursEnabled: false,
      });
    } else if (customDialogChannel === "browser") {
      await updatePreferences.mutateAsync({
        browserNotificationTypes: types,
        browserQuietHoursEnabled: false,
      });
    }
  };

  const getSelectedTypes = (
    channel: "inbox" | "email" | "browser",
  ): string[] => {
    const prefs = preferences as unknown as NotificationPreferenceData;
    if (!prefs) return [];
    if (channel === "inbox") {
      return prefs.inboxNotificationTypes || [];
    } else if (channel === "browser") {
      return prefs.browserNotificationTypes || [];
    } else {
      return prefs.emailNotificationTypes || prefs.notificationTypes || [];
    }
  };

  const inboxOption = PROFILE_OPTIONS.find((o) => o.value === inboxProfile);
  const emailOption = CHANNEL_OPTIONS.find((o) => o.value === emailProfile);

  const browserOptionLabel =
    PROFILE_OPTIONS.find((o) => o.value === browserProfile)?.label ??
    "Mặc định";

  const handleBrowserPresetChange = async (
    profile: "default" | "focused" | "custom",
  ) => {
    await handleProfileChange("browser", profile);
  };

  const handleBrowserCustomClick = () => {
    setCustomDialogChannel("browser");
    setCustomDialogOpen(true);
  };

  const handleBrowserPlaySoundChange = async (enabled: boolean) => {
    await updatePreferences.mutateAsync({
      browserSoundEnabled: enabled,
    });
  };

  const handleBrowserDisable = async () => {
    await updatePreferences.mutateAsync({
      browserEnabled: false,
      browserNotificationTypes: [],
    });
  };

  const browserSoundEnabled =
    (preferences as unknown as NotificationPreferenceData)
      ?.browserSoundEnabled ?? true;

  return (
    <div className="space-y-4 px-6 py-4">
      <div>
        <h3 className="text-xl font-bold">Cài đặt thông báo</h3>
        <p className="text-xs text-muted-foreground">
          Cài đặt thông báo cho các kênh nhận thông báo
        </p>
      </div>
      {/* Hộp thư đến */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Hộp thư đến</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {inboxOption
                    ? `${inboxOption.label} • ${inboxOption.subtitle}`
                    : "Cấu hình chế độ nhận thông báo"}
                </p>
              </div>
            </div>
            <NotificationSelect
              value={inboxProfile}
              onValueChange={(v) => {
                if (v === "custom") {
                  handleCustomDialogOpen("inbox");
                } else {
                  handleProfileChange("inbox", v as ProfileType);
                }
              }}
              options={PROFILE_OPTIONS}
              disabled={updatePreferences.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Email</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-md text-xs font-normal"
                    onClick={handleSendTestEmail}
                    disabled={
                      sendTestEmail.isPending ||
                      updatePreferences.isPending
                    }
                  >
                    {sendTestEmail.isPending ? "Đang gửi..." : "Gửi thử"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailOption
                    ? `${emailOption.label} • ${emailOption.subtitle}`
                    : "Nhận thông báo qua email"}
                </p>
              </div>
            </div>
            <NotificationSelect
              value={emailProfile}
              onValueChange={(v) => {
                if (v === "custom") {
                  handleCustomDialogOpen("email");
                } else {
                  handleProfileChange("email", v as ProfileType);
                }
              }}
              options={CHANNEL_OPTIONS}
              disabled={updatePreferences.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trình duyệt */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isBrowserActive
                    ? "bg-purple-100 dark:bg-purple-900"
                    : "bg-muted",
                )}
              >
                {isBrowserActive ? (
                  <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <span className="relative">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive">
                      <X className="h-2 w-2 text-white" />
                    </span>
                  </span>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Trình duyệt</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isBrowserActive
                    ? "Nhận thông báo trên trình duyệt"
                    : "Thông báo đã tắt"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isBrowserActive ? (
                  <BrowserNotificationDropdown
                    profile={browserProfile}
                    playSoundEnabled={browserSoundEnabled}
                    onPresetChange={handleBrowserPresetChange}
                    onCustomClick={handleBrowserCustomClick}
                    onPlaySoundChange={handleBrowserPlaySoundChange}
                    onDisable={handleBrowserDisable}
                    isSaving={updatePreferences.isPending}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-35 justify-between gap-2 rounded-md"
                    >
                      {browserOptionLabel}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </BrowserNotificationDropdown>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEnableBrowser}
                    disabled={updatePreferences.isPending}
                    className="w-auto"
                  >
                    <Bell />
                    Bật thông báo
                  </Button>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      <CustomNotificationDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        channel={customDialogChannel}
        selectedTypes={getSelectedTypes(customDialogChannel)}
        onSave={handleCustomSave}
        isSaving={updatePreferences.isPending}
      />
    </div>
  );
}

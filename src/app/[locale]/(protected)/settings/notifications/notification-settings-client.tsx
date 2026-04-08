"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Inbox, Mail, Monitor, X } from "lucide-react";
import {
    useNotificationPreferences,
    useUpdatePreferences,
} from "@/app/[locale]/(protected)/notifications/use-notifications";
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
        labelKey: "settingsNotificationsProfileDefaultLabel",
        descriptionKey: "settingsNotificationsProfileDefaultDescription",
        subtitleKey: "settingsNotificationsProfileDefaultSubtitle",
    },
    {
        value: "focused" as ProfileType,
        labelKey: "settingsNotificationsProfileFocusedLabel",
        descriptionKey: "settingsNotificationsProfileFocusedDescription",
        subtitleKey: "settingsNotificationsProfileFocusedSubtitle",
    },
    {
        value: "custom" as ProfileType,
        labelKey: "settingsNotificationsProfileCustomLabel",
        descriptionKey: "settingsNotificationsProfileCustomDescription",
        subtitleKey: "settingsNotificationsProfileCustomSubtitle",
    },
] as const;

const CHANNEL_OPTIONS = [
    ...PROFILE_OPTIONS,
    {
        value: "off" as ProfileType,
        labelKey: "settingsNotificationsProfileOffLabel",
        descriptionKey: "settingsNotificationsProfileOffDescription",
        subtitleKey: "settingsNotificationsProfileOffSubtitle",
    },
] as const;

export function NotificationSettingsClient() {
    const t = useTranslations("ProtectedPages");
    const { data: preferences } = useNotificationPreferences();
    const updatePreferences = useUpdatePreferences();

    // Dialog state
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customDialogChannel, setCustomDialogChannel] = useState<
        "inbox" | "email" | "browser"
    >("inbox");

    const [browserPermission, setBrowserPermission] =
        useState<NotificationPermission>(() => {
            if (
                typeof window === "undefined" ||
                !("Notification" in window)
            ) {
                return "default";
            }
            return Notification.permission;
        });

    // Calculate profile for inbox
    const inboxProfile = useMemo<ProfileType>(() => {
        if (!preferences) return "default";

        const prefs =
            preferences as unknown as NotificationPreferenceData;
        const hasNotificationTypes =
            prefs.inboxNotificationTypes &&
            Array.isArray(prefs.inboxNotificationTypes) &&
            prefs.inboxNotificationTypes.length > 0;

        if (!prefs.inboxQuietHoursEnabled && !hasNotificationTypes) {
            return "default";
        } else if (
            prefs.inboxQuietHoursEnabled &&
            !hasNotificationTypes
        ) {
            return "focused";
        }
        return "custom";
    }, [preferences]);

    // Calculate profile for email
    const emailProfile = useMemo<ProfileType>(() => {
        if (!preferences) return "default";

        const prefs =
            preferences as unknown as NotificationPreferenceData;

        if (prefs.emailEnabled === false) return "off";

        const hasNotificationTypes =
            prefs.emailNotificationTypes &&
            Array.isArray(prefs.emailNotificationTypes) &&
            prefs.emailNotificationTypes.length > 0;

        if (!prefs.emailQuietHoursEnabled && !hasNotificationTypes) {
            return "default";
        } else if (
            prefs.emailQuietHoursEnabled &&
            !hasNotificationTypes
        ) {
            return "focused";
        }
        return "custom";
    }, [preferences]);

    // Calculate profile for browser
    const browserProfile = useMemo<ProfileType>(() => {
        if (!preferences) return "default";

        const prefs =
            preferences as unknown as NotificationPreferenceData;

        if (prefs.browserEnabled === false) return "off";

        const hasNotificationTypes =
            prefs.browserNotificationTypes &&
            Array.isArray(prefs.browserNotificationTypes) &&
            prefs.browserNotificationTypes.length > 0;

        if (
            !prefs.browserQuietHoursEnabled &&
            !hasNotificationTypes
        ) {
            return "default";
        } else if (
            prefs.browserQuietHoursEnabled &&
            !hasNotificationTypes
        ) {
            return "focused";
        }
        return "custom";
    }, [preferences]);

    const isBrowserActive =
        preferences &&
        (preferences as unknown as NotificationPreferenceData)
            .browserEnabled &&
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
                    const permission =
                        await Notification.requestPermission();
                    if (permission !== "granted") {
                        toast.error(
                            t("settingsNotificationsBrowserEnablePermissionError"),
                        );
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
        if (
            typeof window === "undefined" ||
            !("Notification" in window)
        ) {
            toast.error(t("settingsNotificationsBrowserUnsupportedError"));
            return;
        }
        if (Notification.permission === "granted") {
            await updatePreferences.mutateAsync({
                browserEnabled: true,
            });
            setBrowserPermission("granted");
            toast.success(t("settingsNotificationsBrowserEnabledSuccess"));
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            await updatePreferences.mutateAsync({
                browserEnabled: true,
            });
            setBrowserPermission("granted");
            toast.success(t("settingsNotificationsBrowserEnabledSuccess"));
        } else if (permission === "denied") {
            setBrowserPermission("denied");
            toast.error(t("settingsNotificationsBrowserDeniedError"));
        }
    };

    const handleSendTestNotification = () => {
        toast.info(
            t("settingsNotificationsTestNotificationDeveloping"),
        );
    };

    const handleCustomDialogOpen = (
        channel: "inbox" | "email" | "browser",
    ) => {
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
        const prefs =
            preferences as unknown as NotificationPreferenceData;
        if (!prefs) return [];
        if (channel === "inbox") {
            return prefs.inboxNotificationTypes || [];
        } else if (channel === "browser") {
            return prefs.browserNotificationTypes || [];
        } else {
            return (
                prefs.emailNotificationTypes ||
                prefs.notificationTypes ||
                []
            );
        }
    };

    const inboxOption = PROFILE_OPTIONS.find(
        (o) => o.value === inboxProfile,
    );
    const emailOption = CHANNEL_OPTIONS.find(
        (o) => o.value === emailProfile,
    );

    const profileOptions = useMemo(
        () =>
            PROFILE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: t(opt.labelKey),
                description: t(opt.descriptionKey),
            })),
        [t],
    );

    const channelOptions = useMemo(
        () =>
            CHANNEL_OPTIONS.map((opt) => ({
                value: opt.value,
                label: t(opt.labelKey),
                description: t(opt.descriptionKey),
            })),
        [t],
    );

    const browserOptionLabel =
        PROFILE_OPTIONS.find((o) => o.value === browserProfile)
            ? t(
                  PROFILE_OPTIONS.find((o) => o.value === browserProfile)!
                      .labelKey,
              )
            : t("settingsNotificationsProfileDefaultFallback");

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
        <div className="space-y-4 p-6">
            <div>
                <h3 className="text-xl font-bold">
                    {t("settingsNotificationsPageTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t("settingsNotificationsPageDescription")}
                </p>
            </div>
            {/* Há»™p thÆ° Ä‘áº¿n */}
            <Card>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Inbox className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">
                                    {t("settingsNotificationsInboxTitle")}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {inboxOption
                                        ? `${t(inboxOption.labelKey)} • ${t(inboxOption.subtitleKey)}`
                                        : t("settingsNotificationsInboxSummaryFallback")}
                                </p>
                            </div>
                        </div>
                        <NotificationSelect
                            value={inboxProfile}
                            onValueChange={(v) => {
                                if (v === "custom") {
                                    handleCustomDialogOpen("inbox");
                                } else {
                                    handleProfileChange(
                                        "inbox",
                                        v as ProfileType,
                                    );
                                }
                            }}
                            options={profileOptions}
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
                                    <CardTitle className="text-base">
                                        Email
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 rounded-md text-xs font-normal"
                                        onClick={
                                            handleSendTestNotification
                                        }
                                        disabled={
                                            updatePreferences.isPending
                                        }
                                    >
                                        {t("settingsNotificationsEmailSendTestButton")}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {emailOption
                                        ? `${t(emailOption.labelKey)} • ${t(emailOption.subtitleKey)}`
                                        : t("settingsNotificationsEmailSummaryFallback")}
                                </p>
                            </div>
                        </div>
                        <NotificationSelect
                            value={emailProfile}
                            onValueChange={(v) => {
                                if (v === "custom") {
                                    handleCustomDialogOpen("email");
                                } else {
                                    handleProfileChange(
                                        "email",
                                        v as ProfileType,
                                    );
                                }
                            }}
                            options={channelOptions}
                            disabled={updatePreferences.isPending}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* TrÃ¬nh duyá»‡t */}
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
                            <div>
                                <CardTitle className="text-base">
                                    {t("settingsNotificationsBrowserTitle")}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {isBrowserActive
                                        ? t("settingsNotificationsBrowserSummaryActive")
                                        : t("settingsNotificationsBrowserSummaryInactive")}
                                </p>
                            </div>
                        </div>
                        {isBrowserActive ? (
                            <BrowserNotificationDropdown
                                profile={browserProfile}
                                playSoundEnabled={browserSoundEnabled}
                                onPresetChange={
                                    handleBrowserPresetChange
                                }
                                onCustomClick={
                                    handleBrowserCustomClick
                                }
                                onPlaySoundChange={
                                    handleBrowserPlaySoundChange
                                }
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
                                {t("settingsNotificationsEnableBrowserButton")}
                            </Button>
                        )}
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


"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { useLocalStorage } from "@mantine/hooks";
import { updateSystemSettings } from "./actions";
import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsAppearance } from "@/components/settings/preferences/settings-appearance";
import { SettingsLanguageRegion } from "@/components/settings/preferences/settings-language-region";
import { SettingsDatetime } from "@/components/settings/preferences/settings-datetime";
import { ReadOnlyNotice } from "@/components/settings/read-only-notice";
import { SYSTEM_FIELDS } from "../constants";
import { TIMEZONE_OPTIONS } from "@/hooks/use-timezone";
import SettingPreferences from "@/components/settings/preferences/settings-prefereces";
import {
    registerShortcut,
    unregisterShortcut,
} from "@/hooks/use-keyboard-shortcuts";

interface SettingsClientProps {
    initialSettings: Record<string, string>;
    canEdit: boolean;
}

export function SettingsClient({
    initialSettings,
    canEdit,
}: SettingsClientProps) {
    const t = useTranslations("ProtectedPages");
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const queryClient = useQueryClient();

    // Local state for flyout toast (for pending changes)
    const [flyoutToastEnabled, setFlyoutToastEnabled] =
        useState<boolean>(true);
    const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
        useState<boolean>(true);

    // Load from localStorage on mount
    const [savedFlyoutToast, setSavedFlyoutToast] = useLocalStorage({
        key: "settings-flyout-toast",
        defaultValue: { flyoutToastEnabled: true },
    });

    const [savedKeyboardShortcuts, setSavedKeyboardShortcuts] =
        useLocalStorage({
            key: "settings-keyboard-shortcuts",
            defaultValue: { keyboardShortcutsEnabled: true },
        });

    // Notify timezone setting
    const [notifyTimezone, setNotifyTimezone] = useLocalStorage({
        key: "settings-notify-timezone",
        defaultValue: true,
    });

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            // Save system settings
            const result = await updateSystemSettings(settings);

            // Save flyout toast setting to localStorage
            setSavedFlyoutToast({ flyoutToastEnabled });
            setSavedKeyboardShortcuts({ keyboardShortcutsEnabled });

            // Show timezone change notification if timezone was changed
            if (result.timezoneChanged) {
                const newTimezone =
                    settings[SYSTEM_FIELDS.timezone.key];
                const timezoneLabel =
                    TIMEZONE_OPTIONS.find(
                        (option: { value: string; label: string }) =>
                            option.value === newTimezone,
                    )?.label ?? newTimezone;

                toast.success(
                    t("settingsPreferencesTimezoneChangedSuccess", {
                        timezone: timezoneLabel,
                    }),
                    {
                        description: t(
                            "settingsPreferencesTimezoneChangedDescription",
                        ),
                        duration: 5000,
                    },
                );
            } else {
                toast.success(t("settingsPreferencesSaveSuccess"));
            }

            setHasChanges(false);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t("settingsPreferencesSaveFailed"),
            );
        } finally {
            setIsSaving(false);
        }
    }, [
        settings,
        flyoutToastEnabled,
        keyboardShortcutsEnabled,
        setSavedFlyoutToast,
        setSavedKeyboardShortcuts,
        t,
    ]);

    useEffect(() => {
        if (savedFlyoutToast && savedKeyboardShortcuts) {
            setFlyoutToastEnabled(
                savedFlyoutToast.flyoutToastEnabled,
            );
            setKeyboardShortcutsEnabled(
                savedKeyboardShortcuts.keyboardShortcutsEnabled,
            );
        }
    }, [savedFlyoutToast, savedKeyboardShortcuts]);

    // Register keyboard shortcut for save
    useEffect(() => {
        const handleSaveShortcut = () => {
            if (hasChanges && !isSaving && canEdit) {
                handleSave();
            }
        };

        registerShortcut("save", handleSaveShortcut);

        return () => {
            unregisterShortcut("save");
        };
    }, [hasChanges, isSaving, canEdit, handleSave]);

    useSocketEvent("settings:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
    });

    const updateField = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleFlyoutToastChange = (enabled: boolean) => {
        setFlyoutToastEnabled(enabled);
        setHasChanges(true);
    };

    const handleKeyboardShortcutsChange = (enabled: boolean) => {
        setKeyboardShortcutsEnabled(enabled);
        setHasChanges(true);
    };

    const handleNotifyTimezoneChange = (enabled: boolean) => {
        setNotifyTimezone(enabled);
        setHasChanges(true);
    };

    const timezone =
        settings[SYSTEM_FIELDS.timezone.key] ??
        SYSTEM_FIELDS.timezone.default;

    return (
        <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden min-h-0">
            <div className="shrink-0 px-6 py-4">
                <SettingsHeader
                    title={t("settingsPreferencesHeaderTitle")}
                    description={t("settingsPreferencesHeaderDescription")}
                    canEdit={canEdit}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onSave={handleSave}
                />
            </div>

            <div className="flex-1 px-4 md:px-6 pb-6 overflow-auto h-full min-h-0 no-scrollbar">
                <div className="space-y-0">
                    <SettingsAppearance />

                    <Separator />

                    <SettingPreferences
                        flyoutToastEnabled={flyoutToastEnabled}
                        onFlyoutToastChange={handleFlyoutToastChange}
                        keyboardShortcutsEnabled={
                            keyboardShortcutsEnabled
                        }
                        onKeyboardShortcutsChange={
                            handleKeyboardShortcutsChange
                        }
                    />

                    <Separator />

                    <SettingsLanguageRegion
                        timezone={timezone}
                        onTimezoneChange={(v: string) =>
                            updateField(SYSTEM_FIELDS.timezone.key, v)
                        }
                        canEdit={canEdit}
                        notifyTimezone={notifyTimezone}
                        onNotifyTimezoneChange={
                            handleNotifyTimezoneChange
                        }
                    />

                    <Separator />

                    <SettingsDatetime
                        settings={settings}
                        onFieldChange={updateField}
                        canEdit={canEdit}
                    />
                </div>

                {!canEdit && <ReadOnlyNotice />}
            </div>
        </div>
    );
}

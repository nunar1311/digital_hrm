"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { updateSystemSettings } from "./actions";
import { SettingsHeader } from "./settings-header";
import { SettingsAppearance } from "./settings-appearance";
import { SettingsLanguageRegion } from "./settings-language-region";
import { SettingsDatetime } from "./settings-datetime";
import { CompanyInfoCard } from "./company-info-card";
import { SystemConfigCard } from "./system-config-card";
import { ReadOnlyNotice } from "./read-only-notice";
import { SYSTEM_FIELDS } from "./constants";

interface SettingsClientProps {
    initialSettings: Record<string, string>;
    canEdit: boolean;
}

export function SettingsClient({
    initialSettings,
    canEdit,
}: SettingsClientProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const queryClient = useQueryClient();

    useSocketEvent("settings:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
    });

    const updateField = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSystemSettings(settings);
            toast.success("Đã lưu cài đặt thành công");
            setHasChanges(false);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu cài đặt",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const timezone =
        settings[SYSTEM_FIELDS.timezone.key] ??
        SYSTEM_FIELDS.timezone.default;

    return (
        <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden min-h-0">
            <div className="shrink-0 p-4 md:p-6">
                <SettingsHeader
                    canEdit={canEdit}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onSave={handleSave}
                />
            </div>

            <div className="flex-1 px-4 md:px-6 pb-6 overflow-auto h-full min-h-0 no-scrollbar">
                <div className="space-y-0">
                    <SettingsAppearance />

                    <SettingsLanguageRegion
                        timezone={timezone}
                        onTimezoneChange={(v) =>
                            updateField(SYSTEM_FIELDS.timezone.key, v)
                        }
                        canEdit={canEdit}
                    />

                    <SettingsDatetime
                        settings={settings}
                        onFieldChange={updateField}
                        canEdit={canEdit}
                    />
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                    <CompanyInfoCard
                        settings={settings}
                        canEdit={canEdit}
                        onFieldChange={updateField}
                    />

                    <SystemConfigCard
                        settings={settings}
                        canEdit={canEdit}
                        onFieldChange={updateField}
                    />
                </div>

                {!canEdit && <ReadOnlyNotice />}
            </div>
        </div>
    );
}

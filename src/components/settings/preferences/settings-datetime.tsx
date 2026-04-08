"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "./settings-section";
import {
    WEEK_START_OPTIONS,
    DATE_FORMAT_OPTIONS,
    SYSTEM_FIELDS,
} from "@/app/[locale]/(protected)/settings/constants";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface SettingsDatetimeProps {
    settings: Record<string, string>;
    onFieldChange: (key: string, value: string) => void;
    canEdit: boolean;
}

export function SettingsDatetime({
    settings,
    onFieldChange,
    canEdit,
}: SettingsDatetimeProps) {
    const weekStart = SYSTEM_FIELDS.weekStartDay;
    const dateFormat = SYSTEM_FIELDS.dateFormat;

    const t = useTranslations("ProtectedPages");

    return (
        <SettingsSection
            title={t("settingsDatetimeTitle")}
            description={t("settingsDatetimeDescription")}
        >
            <div className="space-y-4 w-full min-w-[200px]">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        {t("settingsDatetimeWeekStart")}
                    </Label>
                    <Select
                        value={
                            settings[weekStart.key] ??
                            weekStart.default
                        }
                        onValueChange={(v) =>
                            onFieldChange(weekStart.key, v)
                        }
                        disabled={!canEdit}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {WEEK_START_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        {t("settingsDatetimeDateFormat")}
                    </Label>
                    <Select
                        value={
                            settings[dateFormat.key] ??
                            dateFormat.default
                        }
                        onValueChange={(v) =>
                            onFieldChange(dateFormat.key, v)
                        }
                        disabled={!canEdit}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DATE_FORMAT_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </SettingsSection>
    );
}

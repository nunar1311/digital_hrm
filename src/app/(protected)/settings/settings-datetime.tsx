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
} from "./constants";
import { Label } from "@/components/ui/label";

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

    return (
        <SettingsSection
            title="Định dạng thời gian & Ngày"
            description="Ngày bắt đầu tuần và định dạng ngày tháng."
        >
            <div className="space-y-4 w-full min-w-[200px]">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        Bắt đầu tuần
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
                        Định dạng ngày
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

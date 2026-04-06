"use client";

import { Globe, Clock } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "./settings-section";
import { LANGUAGE_OPTIONS } from "../../../app/(protected)/settings/constants";
import { TIMEZONE_OPTIONS } from "@/hooks/use-timezone";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@mantine/hooks";
import { useTimezone } from "@/hooks/use-timezone";

interface SettingsLanguageRegionProps {
    timezone: string;
    onTimezoneChange: (value: string) => void;
    canEdit: boolean;
    notifyTimezone?: boolean;
    onNotifyTimezoneChange?: (enabled: boolean) => void;
}

export function SettingsLanguageRegion({
    timezone,
    onTimezoneChange,
    canEdit,
    notifyTimezone: externalNotifyTimezone,
    onNotifyTimezoneChange,
}: SettingsLanguageRegionProps) {
    const [language, setLanguage] = useLocalStorage({
        key: "settings-language",
        defaultValue: "vi",
    });
    
    // Use external state if provided, otherwise use localStorage
    const [internalNotifyTimezone, setInternalNotifyTimezone] = useLocalStorage({
        key: "settings-notify-timezone",
        defaultValue: true,
    });
    
    const notifyTimezone = externalNotifyTimezone ?? internalNotifyTimezone;
    const setNotifyTimezone = onNotifyTimezoneChange 
        ? onNotifyTimezoneChange 
        : setInternalNotifyTimezone;
    
    const { setTimezone } = useTimezone();

    const handleTimezoneChange = (value: string) => {
        setTimezone(value);
        onTimezoneChange(value);
    };

    return (
        <SettingsSection
            title="Ngôn ngữ & Khu vực"
            description="Tùy chỉnh ngôn ngữ và múi giờ."
        >
            <div className="space-y-4 w-full min-w-[200px]">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        Ngôn ngữ
                    </Label>
                    <Select
                        value={language}
                        onValueChange={setLanguage}
                        disabled={!canEdit}
                    >
                        <SelectTrigger className="w-full justify-start gap-2">
                            <Globe className="size-4 shrink-0 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGE_OPTIONS.map((opt) => (
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
                        Múi giờ
                    </Label>
                    <Select
                        value={timezone}
                        onValueChange={handleTimezoneChange}
                        disabled={!canEdit}
                    >
                        <SelectTrigger className="w-full justify-start gap-2">
                            <Clock className="size-4 shrink-0 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONE_OPTIONS.map((opt) => (
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
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        id="notify-timezone"
                        checked={notifyTimezone}
                        onCheckedChange={(v) =>
                            setNotifyTimezone(!!v)
                        }
                        disabled={!canEdit}
                    />
                    <Label
                        htmlFor="notify-timezone"
                        className="text-sm font-normal cursor-pointer"
                    >
                        Thông báo khi đổi múi giờ
                    </Label>
                </div>
            </div>
        </SettingsSection>
    );
}

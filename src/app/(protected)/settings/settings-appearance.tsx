"use client";

import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useSettings } from "@/contexts/settings-context";
import type { Mode } from "@/contexts/settings-context";
import { SettingsSection } from "./settings-section";
import { THEME_COLOR_SWATCHES } from "./constants";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect } from "react";
import ThemePreset from "@/components/themes/theme-preset";
import ModeSelection from "@/components/themes/mode-selection";

export function SettingsAppearance() {
    const { settings, updateSettings, applyThemePreset } =
        useSettings();
    const { setTheme } = useTheme();
    const [highContrast, setHighContrast] = useLocalStorage({
        key: "settings-high-contrast",
        defaultValue: false,
    });

    useEffect(() => {
        document.documentElement.classList.toggle(
            "high-contrast",
            highContrast,
        );
    }, [highContrast]);

    const currentPreset = settings.theme?.preset ?? "default";

    const handlePreset = (id: string) => {
        applyThemePreset(id === "default" ? "default" : id);
    };

    const handleModeChange = (mode: Mode) => {
        updateSettings({ mode });
        setTheme(mode);
    };

    return (
        <>
            <SettingsSection
                title="Màu giao diện"
                description="Chọn màu chủ đạo cho ứng dụng."
            >
                <div className="flex flex-wrap gap-2">
                    <ThemePreset />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Giao diện"
                description="Chọn chế độ sáng, tối hoặc theo hệ thống."
            >
                <div className="flex gap-3">
                    <ModeSelection />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Độ tương phản"
                description="Bật/tắt độ tương phản cao cho chữ và viền."
            >
                <div className="flex items-center gap-3">
                    <Switch
                        id="high-contrast"
                        checked={highContrast}
                        onCheckedChange={setHighContrast}
                    />
                    <Label
                        htmlFor="high-contrast"
                        className="text-sm cursor-pointer"
                    >
                        Độ tương phản cao (hỗ trợ truy cập)
                    </Label>
                </div>
            </SettingsSection>
        </>
    );
}

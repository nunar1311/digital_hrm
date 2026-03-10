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

const APPEARANCE_OPTIONS: { value: Mode; label: string; preview: string }[] = [
    {
        value: "light",
        label: "Sáng",
        preview: "bg-white border border-border rounded-lg",
    },
    {
        value: "dark",
        label: "Tối",
        preview: "bg-[#1a1a2e] border border-border rounded-lg",
    },
    {
        value: "system",
        label: "Tự động",
        preview: "rounded-lg border border-border overflow-hidden relative",
    },
];

export function SettingsAppearance() {
    const { settings, updateSettings, applyThemePreset } = useSettings();
    const { setTheme } = useTheme();
    const [highContrast, setHighContrast] = useLocalStorage({
        key: "settings-high-contrast",
        defaultValue: false,
    });

    useEffect(() => {
        document.documentElement.classList.toggle("high-contrast", highContrast);
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
                    {THEME_COLOR_SWATCHES.map(({ id, color }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => handlePreset(id)}
                            className="relative size-9 rounded-full border-2 border-transparent transition-[transform,border-color] hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ backgroundColor: color }}
                            title={id === "default" ? "Mặc định" : id}
                        >
                            {(currentPreset === id) ? (
                                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/20">
                                    <Check className="size-5 text-white drop-shadow" />
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </SettingsSection>

            <SettingsSection
                title="Giao diện"
                description="Chọn chế độ sáng, tối hoặc theo hệ thống."
            >
                <div className="flex gap-3">
                    {APPEARANCE_OPTIONS.map(({ value, label, preview }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleModeChange(value)}
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-1 transition-colors ${
                                settings.mode === value
                                    ? "border-primary bg-primary/5"
                                    : "border-transparent hover:border-muted-foreground/30"
                            }`}
                        >
                            <div className={`w-16 h-10 ${preview}`}>
                                {value === "system" && (
                                    <>
                                        <div className="absolute inset-0 bg-white [clip-path:polygon(0_0,100%_0,0_100%)]" />
                                        <div className="absolute inset-0 bg-[#1a1a2e] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
                                    </>
                                )}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    ))}
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
                    <Label htmlFor="high-contrast" className="text-sm cursor-pointer">
                        Độ tương phản cao (hỗ trợ truy cập)
                    </Label>
                </div>
            </SettingsSection>
        </>
    );
}

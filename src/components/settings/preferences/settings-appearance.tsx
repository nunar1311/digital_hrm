"use client";

import { SettingsSection } from "./settings-section";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect } from "react";
import ThemePreset from "@/components/themes/theme-preset";
import ModeSelection from "@/components/themes/mode-selection";
import { useTranslations } from "next-intl";

export function SettingsAppearance() {
    const t = useTranslations("ProtectedPages");

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

    return (
        <>
            <SettingsSection
                title={t("settingsAppearanceColorTitle")}
                description={t("settingsAppearanceColorDescription")}
            >
                <div className="flex flex-wrap gap-2">
                    <ThemePreset className="grid-cols-7" />
                </div>
            </SettingsSection>

            <SettingsSection
                title={t("settingsAppearanceModeTitle")}
                description={t("settingsAppearanceModeDescription")}
            >
                <div className="flex gap-3">
                    <ModeSelection />
                </div>
            </SettingsSection>

            <SettingsSection
                title={t("settingsAppearanceContrastTitle")}
                description={t("settingsAppearanceContrastDescription")}
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
                        {t("settingsAppearanceHighContrastLabel")}
                    </Label>
                </div>
            </SettingsSection>
        </>
    );
}

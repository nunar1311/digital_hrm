"use client";

import { createContext, ReactNode, useContext } from "react";
import { defaultThemeState } from "@/config/theme";
import { useObjectCookie } from "@/hooks/use-object-cookie";
import { ThemePreset } from "@/types/theme";
import { getPresetThemeStyles } from "@/utils/theme-presets";
import { useLocalStorage } from "@mantine/hooks";

export type Mode = "light" | "dark" | "system";

export type ThemeType = {
    preset?: string | null;
    styles?: ThemePreset;
};

export type ThemeSettings = {
    theme: ThemeType;
    savedThemes?: Array<{ name: string; styles: ThemeType }>;
};

export type ModeSettings = {
    mode: Mode;
};

export type Settings = ModeSettings &
    ThemeSettings & {
        flyoutToastEnabled: boolean;
        keyboardShortcutsEnabled: boolean;
    };

type SettingsContextProps = {
    settings: Settings;
    updateSettings: (settings: Partial<Settings>) => void;
    applyThemePreset: (preset: string) => void;
};

type Props = {
    children: ReactNode;
    settingsCookies?: ModeSettings;
};

const initialModeSettings: ModeSettings = {
    mode: "light",
};

const initialThemeSettings: ThemeSettings = {
    theme: {
        preset: null,
        styles: defaultThemeState,
    },
};

const initialFlyoutToastSettings = {
    flyoutToastEnabled: true,
};

const initialKeyboardShortcutsSettings = {
    keyboardShortcutsEnabled: true,
};

export const SettingsContext =
    createContext<SettingsContextProps | null>(null);

export const SettingsProvider = ({
    children,
    settingsCookies,
}: Props) => {
    const updatedInitialModeSettings = {
        ...initialModeSettings,
        mode: settingsCookies?.mode ?? "system",
    };

    // Cookie for mode
    const [modeCookie, updateModeCookie] =
        useObjectCookie<ModeSettings>(
            "shadcn-studio-mode",
            JSON.stringify(settingsCookies) !== "{}"
                ? settingsCookies
                : updatedInitialModeSettings,
        );

    const [themeSettings, setThemeSettings] = useLocalStorage({
        key: "shadcn-studio-theme",
        defaultValue: initialThemeSettings,
    });

    const [flyoutToastSettings, setFlyoutToastSettings] =
        useLocalStorage({
            key: "settings-flyout-toast",
            defaultValue: initialFlyoutToastSettings,
        });

    const [keyboardShortcutsSettings, setKeyboardShortcutsSettings] =
        useLocalStorage({
            key: "settings-keyboard-shortcuts",
            defaultValue: initialKeyboardShortcutsSettings,
        });

    const settings: Settings = {
        ...modeCookie,
        ...themeSettings,
        ...flyoutToastSettings,
        ...keyboardShortcutsSettings,
    };

    const updateSettings = (newSettings: Partial<Settings>) => {
        if ("mode" in newSettings) {
            const modeUpdate: ModeSettings = {
                mode: newSettings.mode!,
            };

            updateModeCookie(modeUpdate);
        }

        if ("theme" in newSettings || "savedThemes" in newSettings) {
            setThemeSettings((prev: ThemeSettings) => ({
                ...prev,
                ...(newSettings.theme && {
                    theme: newSettings.theme,
                }),
                ...(newSettings.savedThemes && {
                    savedThemes: newSettings.savedThemes,
                }),
            }));
        }

        if ("flyoutToastEnabled" in newSettings) {
            setFlyoutToastSettings({
                flyoutToastEnabled: newSettings.flyoutToastEnabled!,
            });
        }

        if ("keyboardShortcutsEnabled" in newSettings) {
            setKeyboardShortcutsSettings({
                keyboardShortcutsEnabled: newSettings.keyboardShortcutsEnabled!,
            });
        }
    };

    const applyThemePreset = (preset: string) => {
        setThemeSettings((prev: ThemeSettings) => ({
            ...prev,
            theme: {
                ...prev.theme,
                preset,
                styles: getPresetThemeStyles(preset),
            },
        }));
    };
    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                applyThemePreset,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error(
            "useSettings must be used within a SettingsProvider",
        );
    }
    return context;
};

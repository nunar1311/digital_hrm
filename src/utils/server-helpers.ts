// Next Imports
import { cookies } from "next/headers";

// Third-party Imports
import "server-only";

// Type Imports
import type { ModeSettings } from "@/contexts/settings-context";
import { getPresetThemeStyles } from "./theme-presets";
import { colorFormatter } from "./color-converter";

export const getSettingsFromCookie =
    async (): Promise<ModeSettings> => {
        try {
            const cookieStore = await cookies();
            const settings = cookieStore.get("shadcn-studio-mode");

            if (!settings?.value) {
                return {
                    mode: "light",
                };
            }

            try {
                return JSON.parse(settings.value) as ModeSettings;
            } catch {
                return {
                    mode: "light",
                };
            }
        } catch {
            return {
                mode: "light",
            };
        }
    };

// Helper to generate CSS variables for theme colors
export default function generateThemeCssVar(
    presetName: string,
    mode: string,
): Record<string, string> {
    const themeStyles = getPresetThemeStyles(presetName);
    const targetMode = mode === "system" ? "light" : mode;
    const colors =
        themeStyles[targetMode as keyof typeof themeStyles];

    const cssVars: Record<string, string> = {};

    if (colors && typeof colors === "object") {
        Object.entries(colors).forEach(([key, value]) => {
            if (typeof value === "string") {
                const formattedColor = colorFormatter(value, "oklch");
                // CSS custom properties need -- prefix
                cssVars[`--${key}`] = formattedColor;
            }
        });
    }

    // Add common styles
    if (themeStyles.css) {
        Object.entries(themeStyles.css).forEach(([key, value]) => {
            if (typeof value === "string") {
                cssVars[`--${key}`] = value;
            }
        });
    }

    return cssVars;
}

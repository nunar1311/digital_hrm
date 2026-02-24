// Type Imports
import type { ThemeStyles } from "@/types/theme";

// Config Imports
import { defaultThemeState } from "@/config/theme";

export function getPresetThemeStyles(name: string): ThemeStyles {
    if (name === "default") {
        return defaultThemeState;
    }

    const preset = presets[name];

    if (!preset) {
        return defaultThemeState;
    }

    return {
        light: {
            ...defaultThemeState.light,
            ...(preset.light || {}),
        },
        dark: {
            ...defaultThemeState.dark,
            ...(preset.dark || {}),
        },
        css: preset.css || {},
    };
}

export const presets: Record<string, ThemeStyles> = {
    green: {
        light: {
            background: "oklch(1 0 0)",
            foreground: "oklch(0.141 0.005 285.823)",
            card: "oklch(1 0 0)",
            "card-foreground": "oklch(0.141 0.005 285.823)",
            popover: "oklch(1 0 0)",
            "popover-foreground": "oklch(0.141 0.005 285.823)",
            primary: "oklch(0.648 0.2 131.684)",
            "primary-foreground": "oklch(0.986 0.031 120.757)",
            secondary: "oklch(0.967 0.001 286.375)",
            "secondary-foreground": "oklch(0.21 0.006 285.885)",
            muted: "oklch(0.967 0.001 286.375)",
            "muted-foreground": "oklch(0.552 0.016 285.938)",
            accent: "oklch(0.967 0.001 286.375)",
            "accent-foreground": "oklch(0.21 0.006 285.885)",
            destructive: "oklch(0.577 0.245 27.325)",
        },
        dark: {
            background: "oklch(0.141 0.005 285.823)",
            foreground: "oklch(0.985 0 0)",
            card: "oklch(0.21 0.006 285.885)",
            "card-foreground": "oklch(0.985 0 0)",
            popover: "oklch(0.21 0.006 285.885)",
            "popover-foreground": "oklch(0.985 0 0)",
            primary: "oklch(0.648 0.2 131.684)",
            "primary-foreground": "oklch(0.986 0.031 120.757)",
            secondary: "oklch(0.274 0.006 286.033)",
            "secondary-foreground": "oklch(0.985 0 0)",
            muted: "oklch(0.274 0.006 286.033)",
            "muted-foreground": "oklch(0.705 0.015 286.067)",
            accent: "oklch(0.274 0.006 286.033)",
            "accent-foreground": "oklch(0.985 0 0)",
            destructive: "oklch(0.704 0.191 22.216)",
        },
    },
};

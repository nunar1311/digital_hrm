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

const primaryPair = (primary: string, primaryFg: string) => ({
    primary,
    "primary-foreground": primaryFg,
});

export const presets: Record<string, ThemeStyles> = {
    green: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.648 0.2 131.684)", "oklch(0.986 0.031 120.757)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.648 0.2 131.684)", "oklch(0.986 0.031 120.757)"),
        },
    },
    violet: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.556 0.215 292.717)", "oklch(0.985 0 0)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.627 0.265 303.9)", "oklch(0.985 0 0)"),
        },
    },
    blue: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.558 0.214 252.894)", "oklch(0.985 0 0)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.488 0.243 264.376)", "oklch(0.985 0 0)"),
        },
    },
    rose: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.645 0.246 16.439)", "oklch(0.985 0 0)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.704 0.191 22.216)", "oklch(0.985 0 0)"),
        },
    },
    orange: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.705 0.213 47.604)", "oklch(0.145 0 0)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.769 0.188 70.08)", "oklch(0.145 0 0)"),
        },
    },
    teal: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair("oklch(0.696 0.17 162.48)", "oklch(0.985 0 0)"),
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair("oklch(0.696 0.17 162.48)", "oklch(0.985 0 0)"),
        },
    },
};

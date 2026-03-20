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
            ...primaryPair(
                "oklch(0.648 0.2 131.684)",
                "oklch(0.986 0.031 120.757)",
            ),
            "chart-1": "oklch(0.871 0.15 154.449)",
            "chart-2": "oklch(0.723 0.219 149.579)",
            "chart-3": "oklch(0.627 0.194 149.214)",
            "chart-4": "oklch(0.527 0.154 150.069)",
            "chart-5": "oklch(0.448 0.119 151.328)",
            "chart-6": "oklch(0.374 0.084 152.96)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.648 0.2 131.684)",
                "oklch(0.986 0.031 120.757)",
            ),
            "chart-1": "oklch(0.871 0.15 154.449)",
            "chart-2": "oklch(0.723 0.219 149.579)",
            "chart-3": "oklch(0.627 0.194 149.214)",
            "chart-4": "oklch(0.527 0.154 150.069)",
            "chart-5": "oklch(0.448 0.119 151.328)",
            "chart-6": "oklch(0.374 0.084 152.96)",
        },
    },
    violet: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair(
                "oklch(0.556 0.215 292.717)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.811 0.111 293.571)",
            "chart-2": "oklch(0.606 0.25 292.717)",
            "chart-3": "oklch(0.541 0.281 293.009)",
            "chart-4": "oklch(0.491 0.27 292.581)",
            "chart-5": "oklch(0.432 0.232 292.759)",
            "chart-6": "oklch(0.358 0.182 293.282)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.627 0.265 303.9)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.811 0.111 293.571)",
            "chart-2": "oklch(0.606 0.25 292.717)",
            "chart-3": "oklch(0.541 0.281 293.009)",
            "chart-4": "oklch(0.491 0.27 292.581)",
            "chart-5": "oklch(0.432 0.232 292.759)",
            "chart-6": "oklch(0.358 0.182 293.282)",
        },
    },
    blue: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair(
                "oklch(0.558 0.214 252.894)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.809 0.105 251.813)",
            "chart-2": "oklch(0.623 0.214 259.815)",
            "chart-3": "oklch(0.546 0.245 262.881)",
            "chart-4": "oklch(0.488 0.243 264.376)",
            "chart-5": "oklch(0.424 0.199 265.638)",
            "chart-6": "oklch(0.35 0.162 266.311)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.488 0.243 264.376)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.809 0.105 251.813)",
            "chart-2": "oklch(0.623 0.214 259.815)",
            "chart-3": "oklch(0.546 0.245 262.881)",
            "chart-4": "oklch(0.488 0.243 264.376)",
            "chart-5": "oklch(0.424 0.199 265.638)",
            "chart-6": "oklch(0.35 0.162 266.311)",
        },
    },
    rose: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair(
                "oklch(0.645 0.246 16.439)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.81 0.117 11.638)",
            "chart-2": "oklch(0.645 0.246 16.439)",
            "chart-3": "oklch(0.586 0.253 17.585)",
            "chart-4": "oklch(0.514 0.222 16.935)",
            "chart-5": "oklch(0.455 0.188 13.697)",
            "chart-6": "oklch(0.376 0.147 14.11)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.704 0.191 22.216)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.81 0.117 11.638)",
            "chart-2": "oklch(0.645 0.246 16.439)",
            "chart-3": "oklch(0.586 0.253 17.585)",
            "chart-4": "oklch(0.514 0.222 16.935)",
            "chart-5": "oklch(0.455 0.188 13.697)",
            "chart-6": "oklch(0.376 0.147 14.11)",
        },
    },
    orange: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair(
                "oklch(0.705 0.213 47.604)",
                "oklch(0.145 0 0)",
            ),
            "chart-1": "oklch(0.837 0.128 66.29)",
            "chart-2": "oklch(0.705 0.213 47.604)",
            "chart-3": "oklch(0.646 0.222 41.116)",
            "chart-4": "oklch(0.553 0.195 38.402)",
            "chart-5": "oklch(0.47 0.157 37.304)",
            "chart-6": "oklch(0.392 0.129 37.933)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.769 0.188 70.08)",
                "oklch(0.145 0 0)",
            ),
            "chart-1": "oklch(0.837 0.128 66.29)",
            "chart-2": "oklch(0.705 0.213 47.604)",
            "chart-3": "oklch(0.646 0.222 41.116)",
            "chart-4": "oklch(0.553 0.195 38.402)",
            "chart-5": "oklch(0.47 0.157 37.304)",
            "chart-6": "oklch(0.392 0.129 37.933)",
        },
    },
    teal: {
        light: {
            ...defaultThemeState.light,
            ...primaryPair(
                "oklch(0.696 0.17 162.48)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.809 0.105 251.813)",
            "chart-2": "oklch(0.623 0.214 259.815)",
            "chart-3": "oklch(0.546 0.245 262.881)",
            "chart-4": "oklch(0.488 0.243 264.376)",
            "chart-5": "oklch(0.424 0.199 265.638)",
            "chart-6": "oklch(0.318 0.108 163.517)",
        },
        dark: {
            ...defaultThemeState.dark,
            ...primaryPair(
                "oklch(0.696 0.17 162.48)",
                "oklch(0.985 0 0)",
            ),
            "chart-1": "oklch(0.809 0.105 251.813)",
            "chart-2": "oklch(0.623 0.214 259.815)",
            "chart-3": "oklch(0.546 0.245 262.881)",
            "chart-4": "oklch(0.488 0.243 264.376)",
            "chart-5": "oklch(0.424 0.199 265.638)",
            "chart-6": "oklch(0.318 0.108 163.517)",
        },
    },
};

// Type Imports
import type { ThemeStyles } from "@/types/theme";

export const COMMON_STYLES = [
    "font-sans",
    "font-serif",
    "font-mono",
    "radius",
    "shadow-opacity",
    "shadow-blur",
    "shadow-spread",
    "shadow-offset-x",
    "shadow-offset-y",
    "letter-spacing",
    "spacing",
];

export const DEFAULT_FONT_SANS =
    "'Geist', 'Geist Fallback', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

export const DEFAULT_FONT_SERIF =
    '"Geist", "Geist Fallback", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

export const DEFAULT_FONT_MONO =
    '"Geist Mono", "Geist Mono Fallback", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// Default light theme styles
export const defaultLightThemeStyles: ThemeStyles["light"] = {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    "primary-foreground": "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    "secondary-foreground": "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    "muted-foreground": "oklch(0.552 0.016 285.938)",
    accent: "oklch(0.97 0 0)",
    "accent-foreground": "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    "chart-1": "oklch(0.922 0 0)",
    "chart-2": "oklch(0.704 0.191 22.216)",
    "chart-3": "oklch(0.552 0.016 285.938)",
    "chart-4": "oklch(0.205 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
};

// Default dark theme styles
export const defaultDarkThemeStyles: ThemeStyles["dark"] = {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    "card-foreground": "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    "popover-foreground": "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    "primary-foreground": "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    "secondary-foreground": "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    "muted-foreground": "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    "accent-foreground": "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    "chart-1": "oklch(0.922 0 0)",
    "chart-2": "oklch(0.704 0.191 22.216)",
    "chart-3": "oklch(0.552 0.016 285.938)",
    "chart-4": "oklch(0.205 0 0)",
    border: "oklch(0.269 0 0)",
    input: "oklch(0.269 0 0)",
};

// Default theme state
export const defaultThemeState: ThemeStyles = {
    light: defaultLightThemeStyles,
    dark: defaultDarkThemeStyles,
};

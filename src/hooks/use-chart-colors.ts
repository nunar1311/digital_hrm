"use client";

import { useSettings } from "@/contexts/settings-context";
import { useTheme } from "@/providers/ThemesProvider";
import type { ThemeStyleProps } from "@/types/theme";

const CHART_COLOR_KEYS: Array<keyof ThemeStyleProps> = [
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "chart-6",
    "chart-7",
    "chart-8",
    "chart-9",
    "chart-10",
];

/**
 * Trả về mảng màu chart lấy từ hệ thống theme hiện tại.
 * Tự động cập nhật khi người dùng đổi theme hoặc dark/light mode.
 *
 * @returns mảng chuỗi màu (oklch/hsl) tương ứng với chart-1..chart-10
 */
export function useChartColors(): string[] {
    const { settings } = useSettings();
    const { theme } = useTheme();

    // Chọn đúng mode (light/dark), fallback về light
    const mode: "light" | "dark" =
        theme === "dark" ? "dark" : "light";

    const themeStyles = settings.theme.styles;

    if (!themeStyles) {
        // Fallback: trả về CSS var strings nếu chưa có theme
        return CHART_COLOR_KEYS.map((k) => `var(--${k})`);
    }

    const modeStyles =
        mode === "dark"
            ? { ...themeStyles.light, ...themeStyles.dark }
            : themeStyles.light;

    return CHART_COLOR_KEYS.map(
        (key) =>
            (modeStyles as ThemeStyleProps)[key] ?? `var(--${key})`,
    );
}

/**
 * Lấy một màu chart cụ thể theo index (0-based).
 * Tự động xoay vòng nếu index vượt quá số màu.
 */
export function useChartColor(index: number): string {
    const colors = useChartColors();
    return colors[index % colors.length]!;
}

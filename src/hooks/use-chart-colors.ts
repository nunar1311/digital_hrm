"use client";

import { useMemo } from "react";
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
 * Lấy một màu cụ thể từ theme hiện tại theo key (ví dụ: "background", "foreground", "card", ...).
 * Tự động cập nhật khi đổi theme hoặc dark/light mode.
 *
 * @param key - key trong ThemeStyleProps (ví dụ: "background")
 * @returns chuỗi màu thực tế (oklch/hsl) hoặc CSS var fallback
 */
export function useThemeColor(key: keyof ThemeStyleProps): string {
    const { settings } = useSettings();
    const { theme } = useTheme();

    const mode: "light" | "dark" =
        theme === "dark" ? "dark" : "light";

    const themeStyles = settings.theme.styles;

    if (!themeStyles) {
        return `var(--${key})`;
    }

    const modeStyles =
        mode === "dark"
            ? { ...themeStyles.light, ...themeStyles.dark }
            : themeStyles.light;

    return (modeStyles as ThemeStyleProps)[key] ?? `var(--${key})`;
}

/**
 * Lấy một màu chart cụ thể theo index (0-based).
 * Tự động xoay vòng nếu index vượt quá số màu.
 */
export function useChartColor(index: number): string {
    const colors = useChartColors();
    return colors[index % colors.length]!;
}

/**
 * Trả về mảng màu đảm bảo ít nhất `count` phần tử, mỗi phần tử một màu riêng.
 * Ưu tiên dùng 10 màu từ theme, nếu cần thêm sẽ sinh ra các màu HSL phân bố
 * đều trên vòng hue wheel để đảm bảo tương phản tốt.
 *
 * @param count - Số lượng màu cần thiết (ví dụ: departmentData.length)
 * @returns mảng chuỗi màu, length >= count
 */
export function useExtendedChartColors(count: number): string[] {
    const baseColors = useChartColors();

    return useMemo(() => {
        if (count <= baseColors.length) return baseColors;

        const extra = count - baseColors.length;
        const extras = Array.from({ length: extra }, (_, i) => {
            const hue = Math.round((360 * (i + 1)) / (extra + 1));
            return `hsl(${hue}, 62%, 52%)`;
        });
        return [...baseColors, ...extras];
    }, [count, baseColors]);
}

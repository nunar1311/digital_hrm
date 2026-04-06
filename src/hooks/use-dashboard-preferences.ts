"use client";

import { useState, useEffect, useCallback } from "react";

export type DashboardItemId =
    | "kpi-total"
    | "kpi-new"
    | "kpi-absent"
    | "kpi-turnover"
    | "kpi-payroll"
    | "chart-department"
    | "chart-headcount"
    | "demo-gender"
    | "demo-age"
    | "demo-seniority"
    | "payroll-summary"
    | "upcoming-events";

export interface DashboardPreferences {
    items: DashboardItemId[];
    hiddenItems: DashboardItemId[];
}

const STORAGE_KEY = "dashboard-preferences";

const DEFAULT_PREFERENCES: DashboardPreferences = {
    items: [
        "kpi-total",
        "kpi-new",
        "kpi-absent",
        "kpi-turnover",
        "kpi-payroll",
        "chart-department",
        "chart-headcount",
        "demo-gender",
        "demo-age",
        "demo-seniority",
        "payroll-summary",
        "upcoming-events",
    ],
    hiddenItems: [],
};

export function useDashboardPreferences() {
    const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as DashboardPreferences;
                setPreferences({
                    items: parsed.items || DEFAULT_PREFERENCES.items,
                    hiddenItems: parsed.hiddenItems || [],
                });
            } catch {
                setPreferences(DEFAULT_PREFERENCES);
            }
        }
        setIsLoaded(true);
    }, []);

    const savePreferences = useCallback((newPreferences: DashboardPreferences) => {
        setPreferences(newPreferences);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    }, []);

    const toggleVisibility = useCallback((itemId: DashboardItemId) => {
        setPreferences((prev) => {
            const isHidden = prev.hiddenItems.includes(itemId);
            const newHiddenItems = isHidden
                ? prev.hiddenItems.filter((id) => id !== itemId)
                : [...prev.hiddenItems, itemId];
            const newPreferences = { ...prev, hiddenItems: newHiddenItems };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
            return newPreferences;
        });
    }, []);

    const reorderItems = useCallback((newItems: DashboardItemId[]) => {
        setPreferences((prev) => {
            const newPreferences = { ...prev, items: newItems };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
            return newPreferences;
        });
    }, []);

    const resetToDefault = useCallback(() => {
        setPreferences(DEFAULT_PREFERENCES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    }, []);

    return {
        preferences,
        isLoaded,
        toggleVisibility,
        reorderItems,
        resetToDefault,
    };
}

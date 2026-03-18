"use client";

import { Toaster } from "@/components/ui/sonner";
import { useLocalStorage } from "@mantine/hooks";

interface ToastProviderProps {
    children: React.ReactNode;
}

const DEFAULT_FLYOUT_TOAST = true;

export function ToastProvider({ children }: ToastProviderProps) {
    // Read directly from localStorage to get current setting
    const [savedSetting] = useLocalStorage<{ flyoutToastEnabled: boolean }>({
        key: "settings-flyout-toast",
        defaultValue: { flyoutToastEnabled: DEFAULT_FLYOUT_TOAST },
    });

    const isEnabled = savedSetting?.flyoutToastEnabled ?? DEFAULT_FLYOUT_TOAST;

    return (
        <>
            {children}
            {isEnabled && <Toaster richColors />}
        </>
    );
}

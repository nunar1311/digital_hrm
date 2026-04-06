"use client";

import { useEffect, useCallback } from "react";
import { useSettings } from "@/contexts/settings-context";

type KeyboardShortcutHandler = () => void;

interface KeyboardShortcutsMap {
    save?: KeyboardShortcutHandler;
    [key: string]: KeyboardShortcutHandler | undefined;
}

let globalShortcuts: KeyboardShortcutsMap = {};

export const registerShortcut = (key: string, handler: KeyboardShortcutHandler) => {
    globalShortcuts[key] = handler;
};

export const unregisterShortcut = (key: string) => {
    delete globalShortcuts[key];
};

export function useKeyboardShortcuts() {
    const { settings } = useSettings();
    const isEnabled = settings.keyboardShortcutsEnabled;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isEnabled) return;

            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modifier = isMac ? event.metaKey : event.ctrlKey;

            if (!modifier) return;

            const key = event.key.toLowerCase();

            // Ctrl/Cmd + S - Save
            if (key === "s") {
                event.preventDefault();
                if (globalShortcuts.save) {
                    globalShortcuts.save();
                }
            }
        },
        [isEnabled]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);
}

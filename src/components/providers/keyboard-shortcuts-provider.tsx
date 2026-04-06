"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsProviderProps {
    children: React.ReactNode;
}

export function KeyboardShortcutsProvider({
    children,
}: KeyboardShortcutsProviderProps) {
    useKeyboardShortcuts();
    return <>{children}</>;
}

"use client";

import { useEffect, useCallback } from "react";

interface UseKeyboardShortcutsOptions {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetView?: () => void;
    onToggleLock?: () => void;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    isLocked?: boolean;
    enabled?: boolean;
}

export function useKeyboardShortcuts({
    onZoomIn,
    onZoomOut,
    onResetView,
    onToggleLock,
    onExpandAll,
    onCollapseAll,
    onUndo,
    onRedo,
    isLocked = false,
    enabled = true,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if user is typing in an input
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                onUndo?.();
                return;
            }

            // Ctrl/Cmd + Y or Ctrl+Shift+Z: Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                onRedo?.();
                return;
            }

            // Ctrl/Cmd + Plus: Zoom in
            if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
                e.preventDefault();
                onZoomIn?.();
                return;
            }

            // Ctrl/Cmd + Minus: Zoom out
            if ((e.ctrlKey || e.metaKey) && e.key === "-") {
                e.preventDefault();
                onZoomOut?.();
                return;
            }

            // Ctrl/Cmd + 0: Reset view
            if ((e.ctrlKey || e.metaKey) && e.key === "0") {
                e.preventDefault();
                onResetView?.();
                return;
            }

            // Space: Toggle lock
            if (e.code === "Space" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onToggleLock?.();
                return;
            }

            // E: Expand all
            if (e.key === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                onExpandAll?.();
                return;
            }

            // C: Collapse all
            if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                onCollapseAll?.();
                return;
            }

            // Escape: Exit fullscreen (handled by browser)
        },
        [
            enabled,
            onZoomIn,
            onZoomOut,
            onResetView,
            onToggleLock,
            onExpandAll,
            onCollapseAll,
        ]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [enabled, onUndo, onRedo, onZoomIn, onZoomOut, onResetView, onToggleLock, onExpandAll, onCollapseAll]);
}

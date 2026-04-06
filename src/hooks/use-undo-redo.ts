"use client";

import { useState, useCallback, useRef } from "react";

interface UseUndoRedoOptions<T> {
    initialState: T;
    maxHistory?: number;
}

export function useUndoRedo<T>({
    initialState,
    maxHistory = 50,
}: UseUndoRedoOptions<T>) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [index, setIndex] = useState(0);
    const isUndoRedoingRef = useRef(false);

    const current = history[index] ?? initialState;

    const push = useCallback(
        (state: T) => {
            if (isUndoRedoingRef.current) return;
            setHistory((prev) => {
                const truncated = prev.slice(0, index + 1);
                const next = [...truncated, state];
                // Limit history size
                if (next.length > maxHistory) {
                    return next.slice(next.length - maxHistory);
                }
                return next;
            });
            setIndex((prev) => Math.min(prev + 1, maxHistory - 1));
        },
        [index, maxHistory],
    );

    const undo = useCallback(() => {
        if (index <= 0) return;
        isUndoRedoingRef.current = true;
        setIndex((prev) => prev - 1);
        isUndoRedoingRef.current = false;
    }, [index]);

    const redo = useCallback(() => {
        if (index >= history.length - 1) return;
        isUndoRedoingRef.current = true;
        setIndex((prev) => prev + 1);
        isUndoRedoingRef.current = false;
    }, [index, history.length]);

    const canUndo = index > 0;
    const canRedo = index < history.length - 1;
    const reset = useCallback((state: T) => {
        setHistory([state]);
        setIndex(0);
    }, []);

    return {
        state: current,
        push,
        undo,
        redo,
        canUndo,
        canRedo,
        reset,
        historyLength: history.length,
        currentIndex: index,
    };
}

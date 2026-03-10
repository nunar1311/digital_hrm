"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSocket } from "@/providers/socket-provider";
import type { ServerToClientEvents } from "@/lib/socket/types";

/**
 * Hook để lắng nghe một Socket.IO event cụ thể
 *
 * @example
 * useSocketEvent("attendance:check-in", (data) => {
 *   console.log("Ai đó vừa check-in:", data.userName);
 *   queryClient.invalidateQueries({ queryKey: ["attendance"] });
 * });
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
    event: E,
    handler: Parameters<ServerToClientEvents[E]>[0] extends infer D
        ? (data: D) => void
        : never,
) {
    const { socket, isConnected } = useSocket();
    const handlerRef = useRef(handler);

    // Keep handler ref up to date
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const listener = (data: unknown) => {
            handlerRef.current(
                data as Parameters<ServerToClientEvents[E]>[0],
            );
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(event as any, listener);

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socket.off(event as any, listener);
        };
    }, [socket, isConnected, event]);
}

/**
 * Hook để lắng nghe nhiều Socket.IO events cùng lúc
 * Hữu ích khi cần invalidate query cho nhiều events
 *
 * @example
 * useSocketEvents(
 *   ["attendance:check-in", "attendance:check-out"],
 *   () => queryClient.invalidateQueries({ queryKey: ["attendance"] })
 * );
 */
export function useSocketEvents(
    events: (keyof ServerToClientEvents)[],
    handler: (event: string, data: unknown) => void,
) {
    const { socket, isConnected } = useSocket();
    const handlerRef = useRef(handler);
    const eventsKey = useMemo(() => events.join(","), [events]);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const listeners = events.map((event) => {
            const listener = (data: unknown) => {
                handlerRef.current(event, data);
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socket.on(event as any, listener);
            return { event, listener };
        });

        return () => {
            listeners.forEach(({ event, listener }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                socket.off(event as any, listener);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, isConnected, eventsKey]);
}

"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSocket } from "@/providers/socket-provider";
import type { ServerToClientEvents } from "@/lib/socket/types";

type ServerToClientHandler<E extends keyof ServerToClientEvents> =
    | ((data: Parameters<ServerToClientEvents[E]>[0]) => void)
    | (() => void);

/**
 * Hook để lắng nghe một Socket.IO event cụ thể
 *
 * @example
 * useSocketEvent("attendance:check-in", (data) => {
 *   queryClient.invalidateQueries({ queryKey: ["attendance"] });
 * });
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientHandler<E>,
) {
    const { socket, isConnected } = useSocket();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(event, handlerRef.current as any);

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socket.off(event, handlerRef.current as any);
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

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    const eventsKey = useMemo(() => events.join(","), [events]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const listeners = events.map((ev) => {
            const listener = (data: unknown) => {
                handlerRef.current(ev, data);
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socket.on(ev, listener as any);
            return { event: ev, listener };
        });

        return () => {
            listeners.forEach(({ event: ev, listener }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                socket.off(ev, listener as any);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, isConnected, eventsKey]);
}

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket/client";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "@/lib/socket/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
    socket: TypedSocket | null;
    isConnected: boolean;
    joinOrganization: (orgId: string) => void;
    joinUser: (userId: string) => void;
    leaveOrganization: (orgId: string) => void;
    leaveUser: (userId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    isConnected: false,
    joinOrganization: () => {},
    joinUser: () => {},
    leaveOrganization: () => {},
    leaveUser: () => {},
});

export function SocketProvider({
    children,
    userId,
    organizationId,
}: {
    children: ReactNode;
    userId?: string;
    organizationId?: string;
}) {
    const [isConnected, setIsConnected] = useState(false);
    // Lazy init: created once, stable across renders
    const [socket] = useState<TypedSocket | null>(() =>
        typeof window !== "undefined" ? getSocket() : null,
    );

    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            setIsConnected(true);
            console.log("[Socket.IO] Connected:", socket.id);

            if (organizationId) {
                socket.emit("join:organization", organizationId);
            }
            if (userId) {
                socket.emit("join:user", userId);
            }
        };

        const onDisconnect = () => {
            setIsConnected(false);
            console.log("[Socket.IO] Disconnected");
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.disconnect();
        };
    }, [socket, userId, organizationId]);

    const joinOrganization = useCallback(
        (orgId: string) => {
            socket?.emit("join:organization", orgId);
        },
        [socket],
    );

    const joinUser = useCallback(
        (uid: string) => {
            socket?.emit("join:user", uid);
        },
        [socket],
    );

    const leaveOrganization = useCallback(
        (orgId: string) => {
            socket?.emit("leave:organization", orgId);
        },
        [socket],
    );

    const leaveUser = useCallback(
        (uid: string) => {
            socket?.emit("leave:user", uid);
        },
        [socket],
    );

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                joinOrganization,
                joinUser,
                leaveOrganization,
                leaveUser,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}

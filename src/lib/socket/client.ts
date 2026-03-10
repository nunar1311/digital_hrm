import { io, Socket } from "socket.io-client";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "./types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

/**
 * Lấy hoặc tạo Socket.IO client instance (singleton)
 */
export function getSocket(): TypedSocket {
    if (!socket) {
        const url =
            typeof window !== "undefined"
                ? window.location.origin
                : "";
        socket = io(url, {
            path: "/api/socketio",
            addTrailingSlash: false,
            transports: ["websocket", "polling"],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });
    }
    return socket;
}

/**
 * Disconnect và cleanup socket instance
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

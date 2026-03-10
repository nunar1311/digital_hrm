import type { Server as SocketIOServer } from "socket.io";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "./types";

type TypedServer = SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents
>;

/**
 * Lấy Socket.IO server instance từ global
 * Instance này được tạo bởi custom server (server.ts)
 */
export function getIO(): TypedServer | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).__socketio ?? null;
}

/**
 * Emit event đến tất cả clients trong một organization
 */
export function emitToOrganization<
    E extends keyof ServerToClientEvents,
>(orgId: string, event: E, data: Parameters<ServerToClientEvents[E]>[0]) {
    const io = getIO();
    if (!io) {
        console.warn(
            "[Socket.IO] Server not initialized, skipping emit:",
            event,
        );
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io.to(`org:${orgId}`) as any).emit(event, data);
}

/**
 * Emit event đến một user cụ thể
 */
export function emitToUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    data: Parameters<ServerToClientEvents[E]>[0],
) {
    const io = getIO();
    if (!io) {
        console.warn(
            "[Socket.IO] Server not initialized, skipping emit:",
            event,
        );
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io.to(`user:${userId}`) as any).emit(event, data);
}

/**
 * Emit event đến tất cả connected clients
 */
export function emitToAll<E extends keyof ServerToClientEvents>(
    event: E,
    data: Parameters<ServerToClientEvents[E]>[0],
) {
    const io = getIO();
    if (!io) {
        console.warn(
            "[Socket.IO] Server not initialized, skipping emit:",
            event,
        );
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io as any).emit(event, data);
}

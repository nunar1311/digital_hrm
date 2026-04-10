import type { Server as SocketIOServer } from "socket.io";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "./types";

type TypedServer = SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents
>;

type UntypedServer = SocketIOServer<
    Record<string, (...args: unknown[]) => void>,
    Record<string, (...args: unknown[]) => void>
>;

/**
 * Lấy Socket.IO server instance từ global
 * Instance này được tạo bởi custom server (server.ts)
 */
export function getIO(): TypedServer | null {
    return (globalThis as unknown as { __socketio?: TypedServer }).__socketio ?? null;
}

function getUntypedIO(): UntypedServer | null {
    return (globalThis as unknown as { __socketio?: UntypedServer }).__socketio ?? null;
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

/**
 * Emit position:created event (untyped)
 */
export function emitPositionCreated(positionId: string, positionName: string): void {
    const io = getUntypedIO();
    if (!io) {
        console.warn("[Socket.IO] Server not initialized, skipping emit: position:created");
        return;
    }
    io.emit("position:created", { id: positionId, name: positionName });
}

/**
 * Emit position:updated event (untyped)
 */
export function emitPositionUpdated(positionId: string, positionName: string): void {
    const io = getUntypedIO();
    if (!io) {
        console.warn("[Socket.IO] Server not initialized, skipping emit: position:updated");
        return;
    }
    io.emit("position:updated", { id: positionId, name: positionName });
}

/**
 * Emit position:deleted event (untyped)
 */
export function emitPositionDeleted(positionId: string): void {
    const io = getUntypedIO();
    if (!io) {
        console.warn("[Socket.IO] Server not initialized, skipping emit: position:deleted");
        return;
    }
    io.emit("position:deleted", { id: positionId });
}

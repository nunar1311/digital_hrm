import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({dev, hostname, port });
const handle = app.getRequestHandler();

let lastContractReminderRunDate: string | null = null;

async function runContractReminderJob(trigger: "startup" | "interval") {
    const todayKey = new Date().toISOString().split("T")[0] || "";

    if (trigger === "interval" && lastContractReminderRunDate === todayKey) {
        return;
    }

    try {
        const { dispatchContractExpiryReminders } = await import("./src/lib/contracts/expiry-reminder");
        const result = await dispatchContractExpiryReminders({
            days: [15, 30],
            source: "scheduler",
        });

        lastContractReminderRunDate = todayKey;
        console.log(
            `[ContractScheduler] Processed=${result.processedContracts}, Created=${result.createdDispatches}, Skipped=${result.skippedDispatches}`,
        );
    } catch (error) {
        console.error("[ContractScheduler] Failed to dispatch reminders:", error);
    }
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer(httpServer, {
        path: "/api/socketio",
        addTrailingSlash: false,
        cors: {
            origin: dev
                ? [`http://${hostname}:${port}`, "http://localhost:3000"]
                : [],
            methods: ["GET", "POST"],
        },
        // Tối ưu cho production
        transports: ["websocket", "polling"],
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Lưu io instance vào global để server actions có thể truy cập
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__socketio = io;

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Client tham gia room theo organizationId
        socket.on("join:organization", (orgId: string) => {
            socket.join(`org:${orgId}`);
            console.log(
                `[Socket.IO] ${socket.id} joined org:${orgId}`,
            );
        });

        // Client tham gia room theo userId (cho notifications cá nhân)
        socket.on("join:user", (userId: string) => {
            socket.join(`user:${userId}`);
            console.log(
                `[Socket.IO] ${socket.id} joined user:${userId}`,
            );
        });

        // Client rời room
        socket.on("leave:organization", (orgId: string) => {
            socket.leave(`org:${orgId}`);
        });

        socket.on("leave:user", (userId: string) => {
            socket.leave(`user:${userId}`);
        });

        // Client manually triggers a data refresh event for other clients
        // Used by AI action execution to refresh pages like /ess/leave
        socket.on("data:updated", (data: { entity: string; userId?: string; action?: string; data?: unknown }) => {
            // Broadcast to ALL connected clients (including sender for self-refresh)
            io.emit("data:updated", data);
        });

        socket.on("disconnect", (reason) => {
            console.log(
                `[Socket.IO] Client disconnected: ${socket.id} (${reason})`,
            );
        });
    });

    httpServer.listen(port, () => {
        console.log(
            `> Ready on http://localhost:${port} (Socket.IO enabled)`,
        );
    });

    if (process.env.ENABLE_CONTRACT_EXPIRY_SCHEDULER !== "false") {
        void runContractReminderJob("startup");
        setInterval(() => {
            void runContractReminderJob("interval");
        }, 60 * 60 * 1000);
    }
});

"use client";

import { SocketProvider } from "@/providers/socket-provider";

export function SocketWrapper({
    children,
    userId,
    organizationId,
}: {
    children: React.ReactNode;
    userId: string;
    organizationId?: string;
}) {
    return (
        <SocketProvider
            userId={userId}
            organizationId={organizationId}
        >
            {children}
        </SocketProvider>
    );
}

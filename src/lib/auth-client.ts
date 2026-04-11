import { createAuthClient } from "better-auth/react";
import {
    adminClient,
    organizationClient,
    inferAdditionalFields,
    usernameClient,
} from "better-auth/client/plugins";

function resolveAuthBaseURL(): string | undefined {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (configured) return configured;
    if (typeof window !== "undefined") return window.location.origin;
    return undefined;
}

export const authClient = createAuthClient({
    baseURL: resolveAuthBaseURL(),
    plugins: [
        adminClient(),
        organizationClient(),
        usernameClient(),
        inferAdditionalFields({
            user: {
                username: {
                    type: "string",
                    required: false,
                },
                departmentId: {
                    type: "string",
                    required: false,
                },
                position: {
                    type: "string",
                    required: false,
                },
                hrmRole: {
                    type: "string",
                },
            },
        }),
    ],
});

// Export các hooks & utilities
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    organization,
} = authClient;

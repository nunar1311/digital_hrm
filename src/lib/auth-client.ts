import { createAuthClient } from "better-auth/react";
import {
    adminClient,
    organizationClient,
    inferAdditionalFields,
    usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    plugins: [
        adminClient(),
        organizationClient(),
        usernameClient(),
        inferAdditionalFields({
            user: {
                employeeCode: {
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

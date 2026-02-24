import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // hoặc "mysql", "sqlite"
    }),

    // ─── Email + Password ───
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
    },

    // ─── Session config ───
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 ngày
        updateAge: 60 * 60 * 24, // refresh mỗi 24h
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // cache cookie 5 phút
        },
    },

    // ─── Plugins ───
    plugins: [
        // Plugin admin: quản lý user, ban, impersonate
        admin({
            defaultRole: "employee",
        }),

        // Plugin organization: phòng ban, roles
        organization({
            allowUserToCreateOrganization: false,
        }),
    ],

    // ─── Callbacks ───
    user: {
        additionalFields: {
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
                defaultValue: "EMPLOYEE",
            },
        },
    },

    // ─── Rate limiting ───
    rateLimit: {
        window: 60,
        max: 100,
    },

    // ─── Trusted origins ───
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});

export type Session = typeof auth.$Infer.Session;

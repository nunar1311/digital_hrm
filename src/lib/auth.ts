import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization, username } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    // ─── Email + Password ───
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 1,
        maxPasswordLength: 128,
        autoSignIn: true,
        password: {
            hash: async (password: string) => {
                return await bcrypt.hash(password, 10);
            },
            verify: async ({ hash, password }: { hash: string; password: string }) => {
                return await bcrypt.compare(password, hash);
            },
        },
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

        // Plugin organization: Công ty, chi nhánh
        organization({
            allowUserToCreateOrganization: false,
        }),

        // Plugin username: đăng nhập bằng mã nhân viên (username)
        username({
            minUsernameLength: 2,
            maxUsernameLength: 50,
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
    // ---Trust host ---
    trustHost: true,

    // ─── Trusted origins ───
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});

export type Session = typeof auth.$Infer.Session;

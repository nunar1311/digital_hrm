// Script để reset password cho user admin
// Chạy: npx tsx prisma/reset-admin.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    user: {
        additionalFields: {
            employeeCode: { type: "string", required: false },
            departmentId: { type: "string", required: false },
            hrmRole: { type: "string", defaultValue: "EMPLOYEE" },
        },
    },
    plugins: [
        username({
            minUsernameLength: 2,
            maxUsernameLength: 50,
        }),
    ],
});

async function resetAdminPassword() {
    console.log("🔑 Resetting admin password...\n");

    const adminEmail = "admin@company.vn";
    const adminUsername = "260403001";
    const adminPassword = "Admin@123";

    try {
        // Xóa user admin cũ nếu tồn tại
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: adminEmail },
                    { username: adminUsername }
                ]
            }
        });
        console.log("  ✅ Deleted old admin user");

        // Tạo lại admin user với password đúng
        const result = await auth.api.signUpEmail({
            body: {
                name: "Super Admin",
                email: adminEmail,
                password: adminPassword,
                hrmRole: "SUPER_ADMIN",
                employeeCode: "SA-001",
                username: adminUsername,
            },
        });

        if (result?.user) {
            console.log("  ✅ Created new admin user with correct password");
            console.log(`\n📋 Admin login credentials:`);
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
        }
    } catch (error) {
        console.error("  ❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();

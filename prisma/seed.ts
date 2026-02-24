import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// ─── Setup Prisma + Auth standalone (no path aliases) ───
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
            position: { type: "string", required: false },
            hrmRole: { type: "string", defaultValue: "EMPLOYEE" },
        },
    },
});

const DEMO_USERS = [
    {
        name: "Super Admin",
        email: "admin@company.vn",
        password: "Admin@123",
        hrmRole: "SUPER_ADMIN",
        employeeCode: "SA-001",
        position: "Quản trị hệ thống",
    },
    {
        name: "Nguyễn Văn Giám Đốc",
        email: "director@company.vn",
        password: "Director@123",
        hrmRole: "DIRECTOR",
        employeeCode: "DIR-001",
        position: "Giám đốc",
    },
    {
        name: "Trần Thị HR Manager",
        email: "hr.manager@company.vn",
        password: "HrManager@123",
        hrmRole: "HR_MANAGER",
        employeeCode: "HR-001",
        position: "Trưởng phòng Nhân sự",
    },
    {
        name: "Lê Văn HR Staff",
        email: "hr.staff@company.vn",
        password: "HrStaff@123",
        hrmRole: "HR_STAFF",
        employeeCode: "HR-002",
        position: "Nhân viên Nhân sự",
    },
    {
        name: "Phạm Văn Trưởng Phòng",
        email: "dept.manager@company.vn",
        password: "DeptManager@123",
        hrmRole: "DEPT_MANAGER",
        employeeCode: "DM-001",
        position: "Trưởng phòng Kỹ thuật",
    },
    {
        name: "Hoàng Thị Team Leader",
        email: "team.leader@company.vn",
        password: "TeamLeader@123",
        hrmRole: "TEAM_LEADER",
        employeeCode: "TL-001",
        position: "Trưởng nhóm Frontend",
    },
    {
        name: "Vũ Văn Nhân Viên",
        email: "employee@company.vn",
        password: "Employee@123",
        hrmRole: "EMPLOYEE",
        employeeCode: "EMP-001",
        position: "Lập trình viên",
    },
    {
        name: "Đỗ Thị Kế Toán",
        email: "accountant@company.vn",
        password: "Accountant@123",
        hrmRole: "ACCOUNTANT",
        employeeCode: "ACC-001",
        position: "Kế toán trưởng",
    },
    {
        name: "Ngô Văn IT Admin",
        email: "it.admin@company.vn",
        password: "ItAdmin@123",
        hrmRole: "IT_ADMIN",
        employeeCode: "IT-001",
        position: "Quản trị IT",
    },
];

async function seed() {
    console.log("🌱 Seeding demo users...\n");

    for (const user of DEMO_USERS) {
        try {
            const result = await auth.api.signUpEmail({
                body: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    hrmRole: user.hrmRole,
                    employeeCode: user.employeeCode,
                    position: user.position,
                },
            });

            if (result?.user) {
                console.log(
                    `  ✅ ${user.hrmRole.padEnd(15)} | ${user.email.padEnd(25)} | ${user.name}`,
                );
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : String(error);
            if (
                message.includes("already exists") ||
                message.includes("unique constraint")
            ) {
                console.log(
                    `  ⏭️  ${user.hrmRole.padEnd(15)} | ${user.email.padEnd(25)} | Đã tồn tại`,
                );
            } else {
                console.error(
                    `  ❌ ${user.hrmRole.padEnd(15)} | ${user.email.padEnd(25)} | Lỗi: ${message}`,
                );
            }
        }
    }

    console.log("\n🎉 Seed hoàn tất!");
    console.log("\n📋 Thông tin đăng nhập:");
    console.log("─".repeat(60));
    for (const user of DEMO_USERS) {
        console.log(`  ${user.email.padEnd(25)} | ${user.password}`);
    }
    console.log("─".repeat(60));
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Seed thất bại:", err);
        process.exit(1);
    });

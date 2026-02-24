import { prisma } from "@/lib/prisma";
import { auth } from "../lib/auth";

async function main() {
    console.log("🌱 Seeding...");

    // Tạo Super Admin qua Better Auth API context
    const adminUser = await auth.api.signUpEmail({
        body: {
            name: "Super Admin",
            email: "admin@company.vn",
            password: "Admin@123456",
        },
    });

    if (adminUser?.user?.id) {
        await prisma.user.update({
            where: { id: adminUser.user.id },
            data: {
                hrmRole: "SUPER_ADMIN",
                employeeCode: "EMP001",
                position: "Quản trị hệ thống",
            },
        });
        console.log(
            "✅ Super Admin created: admin@company.vn / Admin@123456",
        );
    }

    // Tạo thêm user demo
    const demoUsers = [
        {
            name: "Nguyễn Văn A",
            email: "director@company.vn",
            role: "DIRECTOR",
            code: "EMP002",
            position: "Giám đốc",
        },
        {
            name: "Trần Thị B",
            email: "hr@company.vn",
            role: "HR_MANAGER",
            code: "EMP003",
            position: "Trưởng phòng HR",
        },
        {
            name: "Lê Văn C",
            email: "staff@company.vn",
            role: "EMPLOYEE",
            code: "EMP004",
            position: "Nhân viên",
        },
        {
            name: "Phạm Thị D",
            email: "accountant@company.vn",
            role: "ACCOUNTANT",
            code: "EMP005",
            position: "Kế toán",
        },
    ];

    for (const u of demoUsers) {
        const created = await auth.api.signUpEmail({
            body: {
                name: u.name,
                email: u.email,
                password: "Demo@123456",
            },
        });
        if (created?.user?.id) {
            await prisma.user.update({
                where: { id: created.user.id },
                data: {
                    hrmRole: u.role,
                    employeeCode: u.code,
                    position: u.position,
                },
            });
            console.log(`✅ ${u.role}: ${u.email} / Demo@123456`);
        }
    }

    console.log("🌱 Seeding done!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

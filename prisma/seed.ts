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

    // ─── Seed Departments ───
    console.log("\n🏢 Seeding departments...\n");

    // Find users by email for manager assignment
    const directorUser = await prisma.user.findUnique({
        where: { email: "director@company.vn" },
    });
    const hrManagerUser = await prisma.user.findUnique({
        where: { email: "hr.manager@company.vn" },
    });
    const deptManagerUser = await prisma.user.findUnique({
        where: { email: "dept.manager@company.vn" },
    });
    const accountantUser = await prisma.user.findUnique({
        where: { email: "accountant@company.vn" },
    });
    const itAdminUser = await prisma.user.findUnique({
        where: { email: "it.admin@company.vn" },
    });
    const teamLeaderUser = await prisma.user.findUnique({
        where: { email: "team.leader@company.vn" },
    });

    // Create root department
    const bgd = await prisma.department.upsert({
        where: { code: "BGD" },
        update: {},
        create: {
            name: "Ban Giám đốc",
            code: "BGD",
            description: "Ban lãnh đạo công ty",
            managerId: directorUser?.id ?? null,
            sortOrder: 0,
        },
    });
    console.log("  ✅ Ban Giám đốc (BGD)");

    // Create child departments
    const departments = [
        {
            name: "Phòng Nhân sự",
            code: "HR",
            description: "Quản lý nhân sự và tuyển dụng",
            managerId: hrManagerUser?.id,
            sortOrder: 1,
        },
        {
            name: "Phòng Kỹ thuật",
            code: "TECH",
            description: "Phát triển phần mềm và công nghệ",
            managerId: deptManagerUser?.id,
            sortOrder: 2,
        },
        {
            name: "Phòng Kinh doanh",
            code: "SALES",
            description: "Kinh doanh và chăm sóc khách hàng",
            managerId: null,
            sortOrder: 3,
        },
        {
            name: "Phòng Tài chính - Kế toán",
            code: "FIN",
            description: "Quản lý tài chính và kế toán",
            managerId: accountantUser?.id,
            sortOrder: 4,
        },
        {
            name: "Phòng Marketing",
            code: "MKT",
            description: "Marketing và truyền thông",
            managerId: null,
            sortOrder: 5,
        },
        {
            name: "Phòng IT & Hạ tầng",
            code: "IT",
            description: "Quản trị hệ thống và hạ tầng CNTT",
            managerId: itAdminUser?.id,
            sortOrder: 6,
        },
    ];

    const deptMap: Record<string, string> = {};
    for (const dept of departments) {
        const created = await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: {
                name: dept.name,
                code: dept.code,
                description: dept.description,
                parentId: bgd.id,
                managerId: dept.managerId ?? null,
                sortOrder: dept.sortOrder,
            },
        });
        deptMap[dept.code] = created.id;
        console.log(`  ✅ ${dept.name} (${dept.code})`);
    }

    // Create sub-departments under TECH
    const techSubDepts = [
        {
            name: "Nhóm Frontend",
            code: "TECH-FE",
            description: "Phát triển giao diện người dùng",
            managerId: teamLeaderUser?.id,
            sortOrder: 1,
        },
        {
            name: "Nhóm Backend",
            code: "TECH-BE",
            description: "Phát triển hệ thống server",
            managerId: null,
            sortOrder: 2,
        },
        {
            name: "Nhóm QA/Testing",
            code: "TECH-QA",
            description: "Kiểm thử và đảm bảo chất lượng",
            managerId: null,
            sortOrder: 3,
        },
    ];

    for (const dept of techSubDepts) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: {
                name: dept.name,
                code: dept.code,
                description: dept.description,
                parentId: deptMap["TECH"],
                managerId: dept.managerId ?? null,
                sortOrder: dept.sortOrder,
            },
        });
        console.log(`  ✅   └─ ${dept.name} (${dept.code})`);
    }

    // ─── Seed Positions ───
    console.log("\n💼 Seeding positions...\n");

    const positions = [
        {
            name: "Giám đốc",
            code: "POS-DIR",
            departmentId: bgd.id,
            level: 1,
        },
        {
            name: "Phó Giám đốc",
            code: "POS-VDIR",
            departmentId: bgd.id,
            level: 2,
        },
        {
            name: "Trưởng phòng Nhân sự",
            code: "POS-HR-MGR",
            departmentId: deptMap["HR"],
            level: 1,
        },
        {
            name: "Nhân viên Nhân sự",
            code: "POS-HR-STAFF",
            departmentId: deptMap["HR"],
            level: 2,
        },
        {
            name: "Trưởng phòng Kỹ thuật",
            code: "POS-TECH-MGR",
            departmentId: deptMap["TECH"],
            level: 1,
        },
        {
            name: "Trưởng nhóm",
            code: "POS-TECH-TL",
            departmentId: deptMap["TECH"],
            level: 2,
        },
        {
            name: "Lập trình viên",
            code: "POS-TECH-DEV",
            departmentId: deptMap["TECH"],
            level: 3,
        },
        {
            name: "Kỹ sư QA",
            code: "POS-TECH-QA",
            departmentId: deptMap["TECH"],
            level: 3,
        },
        {
            name: "Trưởng phòng Kinh doanh",
            code: "POS-SALES-MGR",
            departmentId: deptMap["SALES"],
            level: 1,
        },
        {
            name: "Nhân viên Kinh doanh",
            code: "POS-SALES-STAFF",
            departmentId: deptMap["SALES"],
            level: 2,
        },
        {
            name: "Kế toán trưởng",
            code: "POS-FIN-MGR",
            departmentId: deptMap["FIN"],
            level: 1,
        },
        {
            name: "Kế toán viên",
            code: "POS-FIN-STAFF",
            departmentId: deptMap["FIN"],
            level: 2,
        },
        {
            name: "Trưởng phòng Marketing",
            code: "POS-MKT-MGR",
            departmentId: deptMap["MKT"],
            level: 1,
        },
        {
            name: "Nhân viên Marketing",
            code: "POS-MKT-STAFF",
            departmentId: deptMap["MKT"],
            level: 2,
        },
        {
            name: "Quản trị hệ thống",
            code: "POS-IT-ADMIN",
            departmentId: deptMap["IT"],
            level: 1,
        },
        {
            name: "Nhân viên IT Support",
            code: "POS-IT-STAFF",
            departmentId: deptMap["IT"],
            level: 2,
        },
    ];

    for (const pos of positions) {
        await prisma.position.upsert({
            where: { code: pos.code },
            update: {},
            create: {
                name: pos.name,
                code: pos.code,
                departmentId: pos.departmentId,
                level: pos.level,
            },
        });
        console.log(`  ✅ ${pos.name} (${pos.code})`);
    }

    // ─── Update user departmentId and jobTitle ───
    console.log("\n🔗 Linking users to departments and positions...\n");
    const userDeptLinks: { email: string; deptCode: string; positionCode: string }[] = [
        { email: "admin@company.vn", deptCode: "BGD", positionCode: "POS-IT-ADMIN" },
        { email: "director@company.vn", deptCode: "BGD", positionCode: "POS-DIR" },
        { email: "hr.manager@company.vn", deptCode: "HR", positionCode: "POS-HR-MGR" },
        { email: "hr.staff@company.vn", deptCode: "HR", positionCode: "POS-HR-STAFF" },
        { email: "dept.manager@company.vn", deptCode: "TECH", positionCode: "POS-TECH-MGR" },
        { email: "team.leader@company.vn", deptCode: "TECH", positionCode: "POS-TECH-TL" },
        { email: "employee@company.vn", deptCode: "TECH", positionCode: "POS-TECH-DEV" },
        { email: "accountant@company.vn", deptCode: "FIN", positionCode: "POS-FIN-MGR" },
        { email: "it.admin@company.vn", deptCode: "IT", positionCode: "POS-IT-ADMIN" },
    ];

    for (const link of userDeptLinks) {
        const dept = await prisma.department.findUnique({
            where: { code: link.deptCode },
        });
        const position = await prisma.position.findUnique({
            where: { code: link.positionCode },
        });
        if (dept || position) {
            await prisma.user.updateMany({
                where: { email: link.email },
                data: {
                    departmentId: dept?.id,
                    jobTitleId: position?.id,
                },
            });
            console.log(`  ✅ ${link.email} → ${link.deptCode} (${link.positionCode})`);
        }
    }

    // ─── Seed Company Settings ───
    console.log("\n🏢 Seeding company settings...\n");

    const companySettings = [
        { key: "company.companyName", value: "Công ty Công nghệ Digital HRM", group: "company" },
        { key: "company.companyCode", value: "DHRM", group: "company" },
        { key: "company.companyEmail", value: "info@digital-hrm.vn", group: "company" },
        { key: "company.companyPhone", value: "028 1234 5678", group: "company" },
        { key: "company.companyFax", value: "", group: "company" },
        { key: "company.companyTaxCode", value: "0123456789", group: "company" },
        { key: "company.companyAddress", value: "123 Đường Nguyễn Trãi", group: "company" },
        { key: "company.companyWard", value: "Phường Bến Thành", group: "company" },
        { key: "company.companyDistrict", value: "Quận 1", group: "company" },
        { key: "company.companyCity", value: "Hồ Chí Minh", group: "company" },
        { key: "company.companyCountry", value: "Vietnam", group: "company" },
        { key: "company.companyWebsite", value: "https://digital-hrm.vn", group: "company" },
        { key: "company.companyDescription", value: "Công ty chuyên cung cấp giải pháp quản lý nhân sự hàng đầu Việt Nam", group: "company" },
        { key: "company.companyLogo", value: "", group: "company" },
        { key: "company.companyIndustry", value: "technology", group: "company" },
        { key: "company.companyFoundedDate", value: "2020-01-15", group: "company" },
        { key: "company.companyEmployeeCount", value: "51-100", group: "company" },
        { key: "company.companyBusinessLicense", value: "0123456789", group: "company" },
        { key: "company.companyBankAccount", value: "1234567890", group: "company" },
        { key: "company.companyBankName", value: "Ngân hàng TMCP Ngoại thương Việt Nam (VCB)", group: "company" },
    ];

    for (const setting of companySettings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
        console.log(`  ✅ ${setting.key}`);
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

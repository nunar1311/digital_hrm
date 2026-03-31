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
    },
    {
        name: "Nguyễn Văn Giám Đốc",
        email: "director@company.vn",
        password: "Director@123",
        hrmRole: "DIRECTOR",
        employeeCode: "DIR-001",
    },
    {
        name: "Trần Thị HR Manager",
        email: "hr.manager@company.vn",
        password: "HrManager@123",
        hrmRole: "HR_MANAGER",
        employeeCode: "HR-001",
    },
    {
        name: "Lê Văn HR Staff",
        email: "hr.staff@company.vn",
        password: "HrStaff@123",
        hrmRole: "HR_STAFF",
        employeeCode: "HR-002",
    },
    {
        name: "Phạm Văn Trưởng Phòng",
        email: "dept.manager@company.vn",
        password: "DeptManager@123",
        hrmRole: "DEPT_MANAGER",
        employeeCode: "DM-001",
    },
    {
        name: "Hoàng Thị Team Leader",
        email: "team.leader@company.vn",
        password: "TeamLeader@123",
        hrmRole: "TEAM_LEADER",
        employeeCode: "TL-001",
    },
    {
        name: "Vũ Văn Nhân Viên",
        email: "employee@company.vn",
        password: "Employee@123",
        hrmRole: "EMPLOYEE",
        employeeCode: "EMP-001",
    },
    {
        name: "Đỗ Thị Kế Toán",
        email: "accountant@company.vn",
        password: "Accountant@123",
        hrmRole: "ACCOUNTANT",
        employeeCode: "ACC-001",
    },
    {
        name: "Ngô Văn IT Admin",
        email: "it.admin@company.vn",
        password: "ItAdmin@123",
        hrmRole: "IT_ADMIN",
        employeeCode: "IT-001",
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

    // ─── Seed Authority Types ───
    // console.log("\n🏷️ Seeding authority types...\n");

    // const authorityTypes = [
    //     { code: "EXECUTIVE", name: "HĐQT", level: 1, icon: "Crown", color: "#9333ea", bgColor: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-700 dark:text-purple-400", sortOrder: 1 },
    //     { code: "DIRECTOR", name: "Giám đốc", level: 2, icon: "Shield", color: "#dc2626", bgColor: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-700 dark:text-red-400", sortOrder: 2 },
    //     { code: "MANAGER", name: "Trưởng phòng", level: 3, icon: "Shield", color: "#2563eb", bgColor: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-700 dark:text-blue-400", sortOrder: 3 },
    //     { code: "DEPUTY", name: "Phó phòng", level: 4, icon: "Shield", color: "#16a34a", bgColor: "bg-green-100 dark:bg-green-900/30", textColor: "text-green-700 dark:text-green-400", sortOrder: 4 },
    //     { code: "TEAM_LEAD", name: "Tổ trưởng", level: 5, icon: "User", color: "#9333ea", bgColor: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-700 dark:text-purple-400", sortOrder: 5 },
    //     { code: "STAFF", name: "Nhân viên", level: 6, icon: "User", color: "#475569", bgColor: "bg-gray-100 dark:bg-gray-800", textColor: "text-gray-700 dark:text-gray-300", sortOrder: 6 },
    //     { code: "INTERN", name: "Thực tập sinh", level: 7, icon: "User", color: "#ca8a04", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", textColor: "text-yellow-700 dark:text-yellow-400", sortOrder: 7 },
    // ];

    // for (const auth of authorityTypes) {
    //     await prisma.authorityType.upsert({
    //         where: { code: auth.code },
    //         update: {},
    //         create: {
    //             code: auth.code,
    //             name: auth.name,
    //             level: auth.level,
    //             icon: auth.icon,
    //             color: auth.color,
    //             bgColor: auth.bgColor,
    //             textColor: auth.textColor,
    //             isActive: true,
    //             sortOrder: auth.sortOrder,
    //         },
    //     });
    //     console.log(`  ✅ ${auth.name} (${auth.code})`);
    // }

    // ─── Seed Departments ───
    console.log("\n🏢 Seeding departments...\n");

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

    const bgd = await prisma.department.upsert({
        where: { code: "BGD" },
        update: {},
        create: {
            name: "Ban Giám đốc",
            logo: "Building2",
            code: "BGD",
            description: "Ban lãnh đạo công ty",
            managerId: directorUser?.id ?? null,
            sortOrder: 0,
        },
    });
    console.log("  ✅ Ban Giám đốc (BGD)");

    const departments = [
        {
            name: "Phòng Nhân sự",
            logo: "Users",
            code: "HR",
            description: "Quản lý nhân sự và tuyển dụng",
            managerId: hrManagerUser?.id,
            sortOrder: 1,
        },
        {
            name: "Phòng Kỹ thuật",
            logo: "Code",
            code: "TECH",
            description: "Phát triển phần mềm và công nghệ",
            managerId: deptManagerUser?.id,
            sortOrder: 2,
        },
        {
            name: "Phòng Kinh doanh",
            logo: "Briefcase",
            code: "SALES",
            description: "Kinh doanh và chăm sóc khách hàng",
            managerId: null,
            sortOrder: 3,
        },
        {
            name: "Phòng Tài chính - Kế toán",
            logo: "Wallet",
            code: "FIN",
            description: "Quản lý tài chính và kế toán",
            managerId: accountantUser?.id,
            sortOrder: 4,
        },
        {
            name: "Phòng Marketing",
            logo: "Megaphone",
            code: "MKT",
            description: "Marketing và truyền thông",
            managerId: null,
            sortOrder: 5,
        },
        {
            name: "Phòng IT & Hạ tầng",
            logo: "Monitor",
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

    const positionDefs = [
        { name: "Giám đốc", code: "POS-DIR", authority: "DIRECTOR", departmentId: bgd.id, level: 1, sortOrder: 1, minSalary: 50000000, maxSalary: 100000000, description: "Đại diện pháp luật, điều hành toàn bộ hoạt động công ty" },
        { name: "Phó Giám đốc", code: "POS-VDIR", authority: "DEPUTY", departmentId: bgd.id, level: 2, sortOrder: 2, minSalary: 40000000, maxSalary: 80000000, description: "Hỗ trợ Giám đốc trong việc điều hành" },
        { name: "Trưởng phòng Nhân sự", code: "POS-HR-MGR", authority: "MANAGER", departmentId: deptMap["HR"], level: 3, sortOrder: 10, minSalary: 25000000, maxSalary: 50000000, description: "Quản lý toàn bộ hoạt động nhân sự" },
        { name: "Nhân viên Nhân sự", code: "POS-HR-STAFF", authority: "STAFF", departmentId: deptMap["HR"], level: 6, sortOrder: 11, minSalary: 10000000, maxSalary: 20000000, description: "Thực hiện các công tác nhân sự hàng ngày" },
        { name: "Trưởng phòng Kỹ thuật", code: "POS-TECH-MGR", authority: "MANAGER", departmentId: deptMap["TECH"], level: 3, sortOrder: 20, minSalary: 30000000, maxSalary: 60000000, description: "Quản lý bộ phận kỹ thuật và phát triển phần mềm" },
        { name: "Trưởng nhóm", code: "POS-TECH-TL", authority: "TEAM_LEAD", departmentId: deptMap["TECH"], level: 5, sortOrder: 21, minSalary: 20000000, maxSalary: 35000000, description: "Điều phối công việc của nhóm phát triển" },
        { name: "Lập trình viên", code: "POS-TECH-DEV", authority: "STAFF", departmentId: deptMap["TECH"], level: 6, sortOrder: 22, minSalary: 12000000, maxSalary: 30000000, description: "Phát triển và bảo trì phần mềm" },
        { name: "Kỹ sư QA", code: "POS-TECH-QA", authority: "STAFF", departmentId: deptMap["TECH"], level: 6, sortOrder: 23, minSalary: 10000000, maxSalary: 25000000, description: "Kiểm thử và đảm bảo chất lượng phần mềm" },
        { name: "Trưởng phòng Kinh doanh", code: "POS-SALES-MGR", authority: "MANAGER", departmentId: deptMap["SALES"], level: 3, sortOrder: 30, minSalary: 25000000, maxSalary: 55000000, description: "Quản lý bộ phận kinh doanh" },
        { name: "Nhân viên Kinh doanh", code: "POS-SALES-STAFF", authority: "STAFF", departmentId: deptMap["SALES"], level: 6, sortOrder: 31, minSalary: 8000000, maxSalary: 20000000, description: "Tìm kiếm và chăm sóc khách hàng" },
        { name: "Trưởng nhóm Kinh doanh", code: "POS-SALES-TL", authority: "TEAM_LEAD", departmentId: deptMap["SALES"], level: 5, sortOrder: 32, minSalary: 15000000, maxSalary: 30000000, description: "Điều phối nhóm kinh doanh" },
        { name: "Kế toán trưởng", code: "POS-FIN-MGR", authority: "MANAGER", departmentId: deptMap["FIN"], level: 3, sortOrder: 40, minSalary: 25000000, maxSalary: 50000000, description: "Quản lý toàn bộ hoạt động tài chính - kế toán" },
        { name: "Kế toán viên", code: "POS-FIN-STAFF", authority: "STAFF", departmentId: deptMap["FIN"], level: 6, sortOrder: 41, minSalary: 8000000, maxSalary: 18000000, description: "Thực hiện nghiệp vụ kế toán" },
        { name: "Trưởng phòng Marketing", code: "POS-MKT-MGR", authority: "MANAGER", departmentId: deptMap["MKT"], level: 3, sortOrder: 50, minSalary: 25000000, maxSalary: 50000000, description: "Quản lý hoạt động marketing" },
        { name: "Nhân viên Marketing", code: "POS-MKT-STAFF", authority: "STAFF", departmentId: deptMap["MKT"], level: 6, sortOrder: 51, minSalary: 8000000, maxSalary: 20000000, description: "Thực hiện các hoạt động marketing" },
        { name: "Quản trị hệ thống", code: "POS-IT-ADMIN", authority: "MANAGER", departmentId: deptMap["IT"], level: 3, sortOrder: 60, minSalary: 20000000, maxSalary: 45000000, description: "Quản trị hệ thống CNTT và bảo mật" },
        { name: "Nhân viên IT Support", code: "POS-IT-STAFF", authority: "STAFF", departmentId: deptMap["IT"], level: 6, sortOrder: 61, minSalary: 8000000, maxSalary: 20000000, description: "Hỗ trợ kỹ thuật và bảo trì hệ thống" },
        { name: "Thực tập sinh", code: "POS-INTERN", authority: "INTERN", departmentId: null, level: 7, sortOrder: 99, minSalary: 4000000, maxSalary: 8000000, description: "Thực tập sinh" },
    ];

    const posMap: Record<string, string> = {};
    for (const pos of positionDefs) {
        const created = await prisma.position.upsert({
            where: { code: pos.code },
            update: {},
            create: {
                name: pos.name,
                code: pos.code,
                authority: pos.authority,
                departmentId: pos.departmentId,
                level: pos.level,
                sortOrder: pos.sortOrder,
                minSalary: pos.minSalary,
                maxSalary: pos.maxSalary,
                description: pos.description,
                status: "ACTIVE",
            },
        });
        posMap[pos.code] = created.id;
        console.log(`  ✅ ${pos.name} (${pos.code})`);
    }

    // ─── Seed PositionRoleMapping ───
    const POSITION_ROLE_SEED: Record<string, string> = {
        DIRECTOR: "DIRECTOR",
        DEPUTY: "DEPT_MANAGER",
        MANAGER: "HR_MANAGER",
        TEAM_LEAD: "TEAM_LEADER",
        STAFF: "EMPLOYEE",
        INTERN: "EMPLOYEE",
    };

    console.log("\n🔗 Seeding position-role mappings...\n");
    const allPositions = await prisma.position.findMany({ select: { id: true, authority: true } });
    let mappedCount = 0;

    for (const pos of allPositions) {
        const roleKey = POSITION_ROLE_SEED[pos.authority];
        if (!roleKey) continue;
        const role = await prisma.role.findFirst({ where: { key: roleKey, isActive: true } });
        if (!role) continue;
        try {
            await prisma.positionRoleMapping.upsert({
                where: { positionId: pos.id },
                create: { positionId: pos.id, roleKey: role.key, isDefault: true },
                update: {},
            });
            mappedCount++;
        } catch {}
    }
    console.log(`  ✅ Đã seed ${mappedCount} position-role mappings`);

    // ─── Update user departmentId and positionId ───
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
        const dept = await prisma.department.findUnique({ where: { code: link.deptCode } });
        const position = await prisma.position.findUnique({ where: { code: link.positionCode } });
        if (dept || position) {
            await prisma.user.updateMany({
                where: { email: link.email },
                data: { departmentId: dept?.id, positionId: position?.id },
            });
            console.log(`  ✅ ${link.email} → ${link.deptCode} (${link.positionCode})`);
        }
    }

    // ─── Seed Attendance Approval Process (Default) ───
    console.log("\n📋 Seeding attendance approval process (default)...\n");

    const existingProcess = await prisma.attendanceApprovalProcess.findFirst();
    if (!existingProcess) {
        // Get HR Manager user for the approver
        const hrManager = await prisma.user.findFirst({
            where: { hrmRole: "HR_MANAGER" },
        });

        await prisma.attendanceApprovalProcess.create({
            data: {
                name: "Quy trình duyệt điều chỉnh chấm công",
                isActive: true,
                sendEmailReminder: false,
                skipDuplicateApprover: true,
                skipSelfApprover: true,
                steps: {
                    create: {
                        stepOrder: 1,
                        stepType: "APPROVER",
                        approverType: "DIRECT_MANAGER",
                        approvalMethod: "FIRST_APPROVES",
                        skipIfNoApproverFound: true,
                    },
                },
            },
        });
        console.log("  ✅ Default attendance approval process created");
        console.log("     - Step 1: Direct Manager (First Approves)");
    } else {
        console.log("  ⏭️  Attendance approval process already exists, skipping...");
    }

    // ─── Seed Attendance Config ───
    console.log("\n⏰ Seeding attendance config...\n");

    const existingConfig = await prisma.attendanceConfig.findFirst();
    if (!existingConfig) {
        await prisma.attendanceConfig.create({
            data: {
                otWeekdayCoeff: 1.5,
                otWeekendCoeff: 2.0,
                otHolidayCoeff: 3.0,
                standardWorkHours: 8,
                standardWorkDays: 22,
                requireGps: false,
                requireWifi: false,
                requireSelfie: false,
                maxGpsDistanceMeters: 200,
                earlyCheckinMinutes: 60,
            },
        });
        console.log("  ✅ Default attendance config created");
    } else {
        console.log("  ⏭️  Attendance config already exists, skipping...");
    }

    // ─── Seed Default Shifts ───
    console.log("\n🕐 Seeding default shifts...\n");

    const existingShifts = await prisma.shift.findMany();
    if (existingShifts.length === 0) {
        const shifts = [
            {
                name: "Ca sáng",
                code: "SHIFT-MORNING",
                startTime: "08:00",
                endTime: "12:00",
                breakMinutes: 0,
                lateThreshold: 15,
                earlyThreshold: 15,
                isDefault: false,
                isActive: true,
            },
            {
                name: "Ca chiều",
                code: "SHIFT-AFTERNOON",
                startTime: "13:00",
                endTime: "17:30",
                breakMinutes: 0,
                lateThreshold: 15,
                earlyThreshold: 15,
                isDefault: false,
                isActive: true,
            },
            {
                name: "Ca ngày",
                code: "SHIFT-FULL",
                startTime: "08:00",
                endTime: "17:30",
                breakMinutes: 90,
                lateThreshold: 15,
                earlyThreshold: 15,
                isDefault: true,
                isActive: true,
            },
            {
                name: "Ca đêm",
                code: "SHIFT-NIGHT",
                startTime: "22:00",
                endTime: "06:00",
                breakMinutes: 60,
                lateThreshold: 15,
                earlyThreshold: 15,
                isDefault: false,
                isActive: true,
            },
        ];

        for (const shift of shifts) {
            await prisma.shift.create({ data: shift });
            console.log(`  ✅ ${shift.name} (${shift.code})`);
        }
    } else {
        console.log("  ⏭️  Shifts already exist, skipping...");
    }

    // ─── Seed Holidays 2026 ─── (chỉ tạo nếu chưa có HolidayCalendar)
    console.log("\n🎉 Seeding holidays 2026...\n");

    // Chỉ seed trực tiếp nếu chưa có HolidayCalendar
    const existingCalendars = await prisma.holidayCalendar.findMany();
    if (existingCalendars.length === 0) {
        // Fallback: seed đơn giản nếu chưa có HolidayCalendar
        const simpleHolidays = [
            { name: "Tết Dương lịch", date: "2026-01-01" },
            { name: "Tết Nguyên Đán", date: "2026-02-17", endDate: "2026-02-23" },
            { name: "Giỗ Tổ Hùng Vương", date: "2026-04-10" },
            { name: "Ngày Giải phóng miền Nam", date: "2026-04-30" },
            { name: "Quốc tế Lao động", date: "2026-05-01" },
            { name: "Quốc khánh", date: "2026-09-02" },
        ];

        for (const holiday of simpleHolidays) {
            await prisma.holiday.upsert({
                where: {
                    id: `simple-${holiday.name}-2026`,
                },
                update: {},
                create: {
                    id: `simple-${holiday.name}-2026`,
                    name: holiday.name,
                    date: new Date(holiday.date),
                    endDate: holiday.endDate ? new Date(holiday.endDate) : null,
                    isRecurring: holiday.name !== "Tết Nguyên Đán",
                },
            });
            console.log(`  ✅ ${holiday.name} (${holiday.date})`);
        }
    } else {
        console.log("  ⏭️  Holidays đã được seed qua HolidayCalendar, bỏ qua...");
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
        {
            key: "company.companyDescription",
            value: "Công ty chuyên cung cấp giải pháp quản lý nhân sự hàng đầu Việt Nam",
            group: "company",
        },
        { key: "company.companyLogo", value: "", group: "company" },
        { key: "company.companyIndustry", value: "technology", group: "company" },
        { key: "company.companyFoundedDate", value: "2020-01-15", group: "company" },
        { key: "company.companyEmployeeCount", value: "51-100", group: "company" },
        { key: "company.companyBusinessLicense", value: "0123456789", group: "company" },
        { key: "company.companyBankAccount", value: "1234567890", group: "company" },
        {
            key: "company.companyBankName",
            value: "Ngân hàng TMCP Ngoại thương Việt Nam (VCB)",
            group: "company",
        },
    ];

    for (const setting of companySettings) {
        try {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: {},
                create: setting,
            });
            console.log(`  ✅ ${setting.key}`);
        } catch (error: unknown) {
            const isUniqueError =
                error instanceof Error && error.message.includes("P2002");
            if (isUniqueError) {
                console.log(`  ⏭️  ${setting.key} — da ton tai, bo qua`);
            } else {
                throw error;
            }
        }
    }

    // ─── Seed 100 Employees ───
    await seedEmployees();

    console.log("\n🎉 Seed hoàn tất!");
    console.log("\n📋 Thông tin đăng nhập:");
    console.log("─".repeat(60));
    for (const user of DEMO_USERS) {
        console.log(`  ${user.email.padEnd(25)} | ${user.password}`);
    }
    console.log("─".repeat(60));
}

// ─── Seed 100 Employees ───
async function seedEmployees() {
    console.log("\n👥 Seeding 100 employees...\n");

    const allDepts = await prisma.department.findMany();
    const allPositions = await prisma.position.findMany();

    const deptMap: Record<string, string> = {};
    for (const d of allDepts) deptMap[d.code] = d.id;

    const posMap: Record<string, string> = {};
    for (const p of allPositions) posMap[p.code] = p.id;

    const positionsByCode: Record<string, string> = {
        "POS-DIR": posMap["POS-DIR"] ?? "",
        "POS-VDIR": posMap["POS-VDIR"] ?? "",
        "POS-HR-MGR": posMap["POS-HR-MGR"] ?? "",
        "POS-HR-STAFF": posMap["POS-HR-STAFF"] ?? "",
        "POS-TECH-MGR": posMap["POS-TECH-MGR"] ?? "",
        "POS-TECH-TL": posMap["POS-TECH-TL"] ?? "",
        "POS-TECH-DEV": posMap["POS-TECH-DEV"] ?? "",
        "POS-TECH-QA": posMap["POS-TECH-QA"] ?? "",
        "POS-SALES-MGR": posMap["POS-SALES-MGR"] ?? "",
        "POS-SALES-STAFF": posMap["POS-SALES-STAFF"] ?? "",
        "POS-SALES-TL": posMap["POS-SALES-TL"] ?? "",
        "POS-FIN-MGR": posMap["POS-FIN-MGR"] ?? "",
        "POS-FIN-STAFF": posMap["POS-FIN-STAFF"] ?? "",
        "POS-MKT-MGR": posMap["POS-MKT-MGR"] ?? "",
        "POS-MKT-STAFF": posMap["POS-MKT-STAFF"] ?? "",
        "POS-IT-ADMIN": posMap["POS-IT-ADMIN"] ?? "",
        "POS-IT-STAFF": posMap["POS-IT-STAFF"] ?? "",
    };

    const techFEId = deptMap["TECH-FE"];
    const techBEId = deptMap["TECH-BE"];
    const techQAId = deptMap["TECH-QA"];

    const employees = [
        // BGD
        { code: "EMP-002", name: "Phạm Minh Tuấn", gender: "MALE", dept: "BGD", pos: "POS-VDIR", role: "DIRECTOR", dob: "1980-03-15", phone: "0902123456", nationalId: "025080001234", hire: "2018-06-01", type: "FULL_TIME" },
        { code: "EMP-003", name: "Đặng Hoàng Nam", gender: "MALE", dept: "BGD", pos: "POS-VDIR", role: "DIRECTOR", dob: "1982-07-22", phone: "0902123457", nationalId: "025080001235", hire: "2019-01-15", type: "FULL_TIME" },
        // TECH
        { code: "EMP-004", name: "Trần Đức Anh", gender: "MALE", dept: "TECH", pos: "POS-TECH-MGR", role: "DEPT_MANAGER", dob: "1985-04-10", phone: "0903123456", nationalId: "025080001236", hire: "2017-03-20", type: "FULL_TIME" },
        { code: "EMP-005", name: "Lê Thị Thu Hà", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1988-09-05", phone: "0903123457", nationalId: "025080001237", hire: "2018-07-01", type: "FULL_TIME" },
        { code: "EMP-006", name: "Nguyễn Văn Hùng", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1992-11-20", phone: "0903123458", nationalId: "025080001238", hire: "2019-09-15", type: "FULL_TIME" },
        { code: "EMP-007", name: "Phạm Thị Lan", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-02-14", phone: "0903123459", nationalId: "025080001239", hire: "2020-01-10", type: "FULL_TIME" },
        { code: "EMP-008", name: "Vũ Minh Khoa", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-06-30", phone: "0903123460", nationalId: "025080001240", hire: "2020-05-20", type: "FULL_TIME" },
        { code: "EMP-009", name: "Hoàng Thị Mai", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-08-17", phone: "0903123461", nationalId: "025080001241", hire: "2020-03-01", type: "FULL_TIME" },
        { code: "EMP-010", name: "Đỗ Văn Quang", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-12-08", phone: "0903123462", nationalId: "025080001242", hire: "2021-02-15", type: "FULL_TIME" },
        { code: "EMP-011", name: "Bùi Thị Hương", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-05-25", phone: "0903123463", nationalId: "025080001243", hire: "2021-06-01", type: "FULL_TIME" },
        { code: "EMP-012", name: "Trịnh Văn Toàn", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1991-03-12", phone: "0903123464", nationalId: "025080001244", hire: "2019-11-20", type: "FULL_TIME" },
        { code: "EMP-013", name: "Lưu Thị Ngọc", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-07-09", phone: "0903123465", nationalId: "025080001245", hire: "2022-01-10", type: "FULL_TIME" },
        { code: "EMP-014", name: "Ngô Minh Đức", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-10-03", phone: "0903123466", nationalId: "025080001246", hire: "2020-08-25", type: "FULL_TIME" },
        { code: "EMP-015", name: "Phan Thị Thanh", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-01-28", phone: "0903123467", nationalId: "025080001247", hire: "2022-07-15", type: "FULL_TIME" },
        { code: "EMP-016", name: "Cao Văn Minh", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-04-18", phone: "0903123468", nationalId: "025080001248", hire: "2021-10-01", type: "FULL_TIME" },
        { code: "EMP-017", name: "Trần Văn Sơn", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-09-07", phone: "0903123469", nationalId: "025080001249", hire: "2020-04-20", type: "FULL_TIME" },
        // TECH-FE
        { code: "EMP-018", name: "Nguyễn Thị Lan", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1989-12-01", phone: "0904123456", nationalId: "025080001250", hire: "2018-09-10", type: "FULL_TIME" },
        { code: "EMP-019", name: "Lê Hoàng Long", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-03-15", phone: "0904123457", nationalId: "025080001251", hire: "2020-11-01", type: "FULL_TIME" },
        { code: "EMP-020", name: "Trần Thị Hồng", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-06-22", phone: "0904123458", nationalId: "025080001252", hire: "2021-08-15", type: "FULL_TIME" },
        { code: "EMP-021", name: "Phạm Văn Kiên", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-02-08", phone: "0904123459", nationalId: "025080001253", hire: "2022-03-01", type: "FULL_TIME" },
        { code: "EMP-022", name: "Vũ Thị Phương", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-08-30", phone: "0904123460", nationalId: "025080001254", hire: "2021-05-20", type: "FULL_TIME" },
        { code: "EMP-023", name: "Đặng Minh Tuấn", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-11-14", phone: "0904123461", nationalId: "025080001255", hire: "2023-02-10", type: "FULL_TIME" },
        { code: "EMP-024", name: "Hoàng Thị Thúy", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-07-25", phone: "0904123462", nationalId: "025080001256", hire: "2020-10-01", type: "FULL_TIME" },
        { code: "EMP-025", name: "Nguyễn Văn Bảo", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-01-09", phone: "0904123463", nationalId: "025080001257", hire: "2022-06-15", type: "FULL_TIME" },
        // TECH-BE
        { code: "EMP-026", name: "Trần Văn Dũng", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1987-05-18", phone: "0905123456", nationalId: "025080001258", hire: "2017-11-01", type: "FULL_TIME" },
        { code: "EMP-027", name: "Phạm Thị Hà", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-09-03", phone: "0905123457", nationalId: "025080001259", hire: "2020-07-20", type: "FULL_TIME" },
        { code: "EMP-028", name: "Lê Văn Minh", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-12-20", phone: "0905123458", nationalId: "025080001260", hire: "2021-03-15", type: "FULL_TIME" },
        { code: "EMP-029", name: "Vũ Hoàng Nam", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-04-11", phone: "0905123459", nationalId: "025080001261", hire: "2022-01-25", type: "FULL_TIME" },
        { code: "EMP-030", name: "Đỗ Thị Linh", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-10-05", phone: "0905123460", nationalId: "025080001262", hire: "2020-12-01", type: "FULL_TIME" },
        { code: "EMP-031", name: "Bùi Văn Hải", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-02-28", phone: "0905123461", nationalId: "025080001263", hire: "2019-08-10", type: "FULL_TIME" },
        { code: "EMP-032", name: "Trịnh Thị Lan", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-07-14", phone: "0905123462", nationalId: "025080001264", hire: "2022-04-01", type: "FULL_TIME" },
        { code: "EMP-033", name: "Ngô Văn Trung", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-03-22", phone: "0905123463", nationalId: "025080001265", hire: "2023-01-15", type: "FULL_TIME" },
        { code: "EMP-034", name: "Phan Hoàng Sơn", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-06-08", phone: "0905123464", nationalId: "025080001266", hire: "2021-09-01", type: "FULL_TIME" },
        // TECH-QA
        { code: "EMP-035", name: "Cao Thị Thu", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1988-11-25", phone: "0906123456", nationalId: "025080001267", hire: "2018-04-15", type: "FULL_TIME" },
        { code: "EMP-036", name: "Trần Văn Đạt", gender: "MALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1995-01-30", phone: "0906123457", nationalId: "025080001268", hire: "2020-06-01", type: "FULL_TIME" },
        { code: "EMP-037", name: "Lê Thị Phương", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1997-08-12", phone: "0906123458", nationalId: "025080001269", hire: "2021-10-20", type: "FULL_TIME" },
        { code: "EMP-038", name: "Nguyễn Hoàng Mai", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1994-04-06", phone: "0906123459", nationalId: "025080001270", hire: "2020-09-01", type: "FULL_TIME" },
        { code: "EMP-039", name: "Phạm Văn Thắng", gender: "MALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1998-09-18", phone: "0906123460", nationalId: "025080001271", hire: "2022-08-01", type: "FULL_TIME" },
        { code: "EMP-040", name: "Vũ Thị Kim Oanh", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1996-02-27", phone: "0906123461", nationalId: "025080001272", hire: "2021-07-15", type: "FULL_TIME" },
        // HR
        { code: "EMP-041", name: "Hoàng Văn Phúc", gender: "MALE", dept: "HR", pos: "POS-HR-MGR", role: "HR_MANAGER", dob: "1984-06-10", phone: "0907123456", nationalId: "025080001273", hire: "2017-01-10", type: "FULL_TIME" },
        { code: "EMP-042", name: "Nguyễn Thị Hương", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1992-03-25", phone: "0907123457", nationalId: "025080001274", hire: "2019-05-01", type: "FULL_TIME" },
        { code: "EMP-043", name: "Lê Thị Mai", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1995-07-08", phone: "0907123458", nationalId: "025080001275", hire: "2020-10-15", type: "FULL_TIME" },
        { code: "EMP-044", name: "Trần Văn Hùng", gender: "MALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1993-10-30", phone: "0907123459", nationalId: "025080001276", hire: "2020-03-20", type: "FULL_TIME" },
        { code: "EMP-045", name: "Phạm Thị Lan Anh", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1997-12-14", phone: "0907123460", nationalId: "025080001277", hire: "2022-02-01", type: "FULL_TIME" },
        { code: "EMP-046", name: "Đặng Văn Tiến", gender: "MALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1996-05-20", phone: "0907123461", nationalId: "025080001278", hire: "2021-08-01", type: "FULL_TIME" },
        // SALES
        { code: "EMP-047", name: "Vũ Hoàng Dương", gender: "MALE", dept: "SALES", pos: "POS-SALES-MGR", role: "DEPT_MANAGER", dob: "1983-08-15", phone: "0908123456", nationalId: "025080001279", hire: "2016-05-01", type: "FULL_TIME" },
        { code: "EMP-048", name: "Trịnh Thị Thu Hà", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-TL", role: "TEAM_LEADER", dob: "1989-04-22", phone: "0908123457", nationalId: "025080001280", hire: "2018-03-15", type: "FULL_TIME" },
        { code: "EMP-049", name: "Bùi Văn Đức", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1994-01-10", phone: "0908123458", nationalId: "025080001281", hire: "2019-10-01", type: "FULL_TIME" },
        { code: "EMP-050", name: "Lê Thị Ngọc Mai", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-09-28", phone: "0908123459", nationalId: "025080001282", hire: "2020-06-20", type: "FULL_TIME" },
        { code: "EMP-051", name: "Ngô Văn Minh", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1992-12-05", phone: "0908123460", nationalId: "025080001283", hire: "2019-04-15", type: "FULL_TIME" },
        { code: "EMP-052", name: "Phan Thị Hồng Nhung", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1998-06-17", phone: "0908123461", nationalId: "025080001284", hire: "2022-01-10", type: "FULL_TIME" },
        { code: "EMP-053", name: "Cao Văn Trung", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1995-03-08", phone: "0908123462", nationalId: "025080001285", hire: "2020-11-01", type: "FULL_TIME" },
        { code: "EMP-054", name: "Trần Thị Minh Châu", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1997-10-22", phone: "0908123463", nationalId: "025080001286", hire: "2021-09-15", type: "FULL_TIME" },
        { code: "EMP-055", name: "Phạm Văn Thành", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1993-07-14", phone: "0908123464", nationalId: "025080001287", hire: "2020-02-01", type: "FULL_TIME" },
        { code: "EMP-056", name: "Vũ Thị Lan Phương", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1999-02-28", phone: "0908123465", nationalId: "025080001288", hire: "2023-03-01", type: "FULL_TIME" },
        { code: "EMP-057", name: "Đặng Hoàng Sơn", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1994-11-03", phone: "0908123466", nationalId: "025080001289", hire: "2020-08-20", type: "FULL_TIME" },
        { code: "EMP-058", name: "Hoàng Thị Thanh Tâm", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-08-11", phone: "0908123467", nationalId: "025080001290", hire: "2021-04-01", type: "FULL_TIME" },
        { code: "EMP-059", name: "Lê Văn Khánh", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1991-05-25", phone: "0908123468", nationalId: "025080001291", hire: "2019-07-15", type: "FULL_TIME" },
        { code: "EMP-060", name: "Trịnh Thị Xuân", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1998-01-09", phone: "0908123469", nationalId: "025080001292", hire: "2022-09-01", type: "FULL_TIME" },
        // FIN
        { code: "EMP-061", name: "Nguyễn Thị Thu Hồng", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-MGR", role: "ACCOUNTANT", dob: "1985-09-12", phone: "0909123456", nationalId: "025080001293", hire: "2016-08-01", type: "FULL_TIME" },
        { code: "EMP-062", name: "Phạm Văn Thọ", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1991-04-20", phone: "0909123457", nationalId: "025080001294", hire: "2019-02-15", type: "FULL_TIME" },
        { code: "EMP-063", name: "Lê Thị Kim Thoa", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1994-12-03", phone: "0909123458", nationalId: "025080001295", hire: "2020-07-01", type: "FULL_TIME" },
        { code: "EMP-064", name: "Vũ Hoàng Nam", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1993-06-18", phone: "0909123459", nationalId: "025080001296", hire: "2020-01-20", type: "FULL_TIME" },
        { code: "EMP-065", name: "Đỗ Thị Hương Giang", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1997-03-30", phone: "0909123460", nationalId: "025080001297", hire: "2021-06-15", type: "FULL_TIME" },
        { code: "EMP-066", name: "Bùi Văn Tâm", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1995-10-07", phone: "0909123461", nationalId: "025080001298", hire: "2020-09-01", type: "FULL_TIME" },
        { code: "EMP-067", name: "Trịnh Thị Minh Ngọc", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1996-07-25", phone: "0909123462", nationalId: "025080001299", hire: "2021-03-01", type: "FULL_TIME" },
        { code: "EMP-068", name: "Ngô Văn Đăng", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1992-11-14", phone: "0909123463", nationalId: "025080001300", hire: "2019-11-01", type: "FULL_TIME" },
        { code: "EMP-069", name: "Phan Thị Thu Hà", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1998-05-02", phone: "0909123464", nationalId: "025080001301", hire: "2022-04-15", type: "FULL_TIME" },
        { code: "EMP-070", name: "Cao Văn Quốc", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1994-08-19", phone: "0909123465", nationalId: "025080001302", hire: "2020-12-01", type: "FULL_TIME" },
        { code: "EMP-071", name: "Trần Thị Thu Minh", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1999-01-08", phone: "0909123466", nationalId: "025080001303", hire: "2023-01-15", type: "FULL_TIME" },
        // MKT
        { code: "EMP-072", name: "Phạm Hoàng Minh", gender: "MALE", dept: "MKT", pos: "POS-MKT-MGR", role: "DEPT_MANAGER", dob: "1986-03-05", phone: "0910123456", nationalId: "025080001304", hire: "2017-02-01", type: "FULL_TIME" },
        { code: "EMP-073", name: "Vũ Thị Lan Anh", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1993-09-22", phone: "0910123457", nationalId: "025080001305", hire: "2019-08-15", type: "FULL_TIME" },
        { code: "EMP-074", name: "Đặng Văn Hải", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1995-12-10", phone: "0910123458", nationalId: "025080001306", hire: "2020-05-01", type: "FULL_TIME" },
        { code: "EMP-075", name: "Hoàng Thị Ngọc Linh", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1997-06-28", phone: "0910123459", nationalId: "025080001307", hire: "2021-10-01", type: "FULL_TIME" },
        { code: "EMP-076", name: "Lê Văn Bình", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1994-04-15", phone: "0910123460", nationalId: "025080001308", hire: "2020-03-20", type: "FULL_TIME" },
        { code: "EMP-077", name: "Trịnh Thị Hồng Phượng", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1996-10-02", phone: "0910123461", nationalId: "025080001309", hire: "2021-05-15", type: "FULL_TIME" },
        { code: "EMP-078", name: "Ngô Văn Thắng", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1993-01-18", phone: "0910123462", nationalId: "025080001310", hire: "2019-10-01", type: "FULL_TIME" },
        { code: "EMP-079", name: "Phan Thị Thanh Hà", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1998-07-11", phone: "0910123463", nationalId: "025080001311", hire: "2022-06-20", type: "FULL_TIME" },
        { code: "EMP-080", name: "Cao Hoàng Long", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1995-02-25", phone: "0910123464", nationalId: "025080001312", hire: "2020-11-01", type: "FULL_TIME" },
        { code: "EMP-081", name: "Trần Thị Mỹ Duyên", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1999-08-06", phone: "0910123465", nationalId: "025080001313", hire: "2023-02-15", type: "FULL_TIME" },
        { code: "EMP-082", name: "Phạm Văn Phong", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1992-11-30", phone: "0910123466", nationalId: "025080001314", hire: "2019-06-01", type: "FULL_TIME" },
        // IT
        { code: "EMP-083", name: "Lê Văn Thành", gender: "MALE", dept: "IT", pos: "POS-IT-ADMIN", role: "IT_ADMIN", dob: "1987-05-14", phone: "0911123456", nationalId: "025080001315", hire: "2017-04-01", type: "FULL_TIME" },
        { code: "EMP-084", name: "Nguyễn Thị Thu Trang", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1994-10-28", phone: "0911123457", nationalId: "025080001316", hire: "2020-02-15", type: "FULL_TIME" },
        { code: "EMP-085", name: "Phạm Văn Duy", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1996-03-17", phone: "0911123458", nationalId: "025080001317", hire: "2020-08-01", type: "FULL_TIME" },
        { code: "EMP-086", name: "Vũ Thị Lan Chi", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1998-09-05", phone: "0911123459", nationalId: "025080001318", hire: "2022-01-20", type: "FULL_TIME" },
        { code: "EMP-087", name: "Đặng Hoàng Nam", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1993-07-23", phone: "0911123460", nationalId: "025080001319", hire: "2019-12-01", type: "FULL_TIME" },
        { code: "EMP-088", name: "Hoàng Văn Đức", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1995-01-09", phone: "0911123461", nationalId: "025080001320", hire: "2020-10-15", type: "FULL_TIME" },
        { code: "EMP-089", name: "Lê Thị Hồng Nhung", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1997-06-20", phone: "0911123462", nationalId: "025080001321", hire: "2021-07-01", type: "FULL_TIME" },
        { code: "EMP-090", name: "Trần Văn Khoa", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1994-12-12", phone: "0911123463", nationalId: "025080001322", hire: "2020-04-01", type: "FULL_TIME" },
        { code: "EMP-091", name: "Phạm Thị Thanh Thảo", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1999-04-07", phone: "0911123464", nationalId: "025080001323", hire: "2023-01-10", type: "FULL_TIME" },
        { code: "EMP-092", name: "Vũ Hoàng Sơn", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1996-08-30", phone: "0911123465", nationalId: "025080001324", hire: "2021-09-15", type: "FULL_TIME" },
        { code: "EMP-093", name: "Nguyễn Thị Kim Oanh", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1992-02-14", phone: "0911123466", nationalId: "025080001325", hire: "2019-05-01", type: "FULL_TIME" },
        { code: "EMP-094", name: "Lê Văn Trung", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1998-11-25", phone: "0911123467", nationalId: "025080001326", hire: "2022-05-01", type: "FULL_TIME" },
        { code: "EMP-095", name: "Trịnh Thị Thu Hằng", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1995-07-08", phone: "0911123468", nationalId: "025080001327", hire: "2020-11-20", type: "FULL_TIME" },
        // Extra 6 to reach 100
        { code: "EMP-096", name: "Bùi Văn Mạnh", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-03-21", phone: "0912123456", nationalId: "025080001328", hire: "2022-02-01", type: "FULL_TIME" },
        { code: "EMP-097", name: "Phan Thị Lan Hương", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-09-14", phone: "0912123457", nationalId: "025080001329", hire: "2021-11-01", type: "FULL_TIME" },
        { code: "EMP-098", name: "Cao Thị Thu Hà", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1994-05-28", phone: "0912123458", nationalId: "025080001330", hire: "2020-06-15", type: "FULL_TIME" },
        { code: "EMP-099", name: "Ngô Văn Hoàng", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-01-17", phone: "0912123459", nationalId: "025080001331", hire: "2022-10-01", type: "FULL_TIME" },
        { code: "EMP-100", name: "Trần Thị Mỹ Linh", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1999-10-05", phone: "0912123460", nationalId: "025080001332", hire: "2023-04-01", type: "FULL_TIME" },
    ];

    const techMgr = await prisma.user.findFirst({ where: { hrmRole: "DEPT_MANAGER", departmentId: deptMap["TECH"] } });
    const salesMgr = await prisma.user.findFirst({ where: { hrmRole: "DEPT_MANAGER", departmentId: deptMap["SALES"] } });
    const mktMgr = await prisma.user.findFirst({ where: { hrmRole: "DEPT_MANAGER", departmentId: deptMap["MKT"] } });
    const defaultManagerId = techMgr?.id ?? null;

    const streetNames = ["Nguyễn Trãi", "Lê Lợi", "Trần Hưng Đạo", "Võ Văn Tần", "Pasteur", "Điện Biên Phủ", "Nam Kỳ Khởi Nghĩa", "Hoàng Sa"];
    const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); };

    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
        const deptId = deptMap[emp.dept];
        const posId = positionsByCode[emp.pos] || positionsByCode["POS-TECH-DEV"];

        let managerId = defaultManagerId;
        if (emp.pos === "POS-TECH-TL" || emp.pos === "POS-SALES-TL") {
            if (deptId === techFEId || deptId === techBEId || deptId === techQAId) managerId = techMgr?.id ?? null;
            else if (deptId === deptMap["SALES"]) managerId = salesMgr?.id ?? null;
            else managerId = mktMgr?.id ?? null;
        } else if (["DEPT_MANAGER", "HR_MANAGER", "ACCOUNTANT", "IT_ADMIN", "DIRECTOR", "SUPER_ADMIN"].includes(emp.role) || emp.pos === "POS-VDIR") {
            managerId = null;
        }

        const email = emp.code.toLowerCase() + "@company.vn";
        const dobParts = emp.dob.split("-");
        const idx = hashStr(emp.code);

        try {
            await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    name: emp.name,
                    employeeCode: emp.code,
                    departmentId: deptId,
                    positionId: posId,
                    hrmRole: emp.role,
                    gender: emp.gender,
                    dateOfBirth: new Date(emp.dob),
                    phone: emp.phone,
                    nationalId: emp.nationalId,
                    nationalIdDate: new Date(parseInt(dobParts[0]) + 20, parseInt(dobParts[1]) - 1, 15),
                    nationalIdPlace: "TP. Hồ Chí Minh",
                    hireDate: new Date(emp.hire),
                    ethnicity: "Kinh",
                    nationality: "Việt Nam",
                    educationLevel: ["Đại học", "Cao đẳng", "Thạc sĩ", "Đại học", "Đại học"][idx % 5],
                    maritalStatus: ["Độc thân", "Đã kết hôn", "Độc thân", "Đã kết hôn"][idx % 4],
                    religion: ["Không", "Phật giáo", "Công giáo", "Cao Đài", "Không"][idx % 5],
                    employeeStatus: ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "PROBATION"][idx % 5],
                    employmentType: emp.type,
                    permanentAddress: `${(idx % 200) + 1} Đường ${streetNames[idx % streetNames.length]}, Quận ${(idx % 10) + 1}, TP. Hồ Chí Minh`,
                    address: `${(idx % 200) + 1} Đường ${streetNames[idx % streetNames.length]}, Quận ${(idx % 10) + 1}, TP. Hồ Chí Minh`,
                    personalEmail: `${emp.code.toLowerCase()}@gmail.com`,
                    managerId,
                    emailVerified: true,
                },
            });
            created++;
            if (created % 20 === 0) console.log(`  📊 Đã tạo ${created} nhân viên...`);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes("already exists") || msg.includes("unique constraint")) skipped++;
            else console.error(`  ❌ ${emp.code} ${emp.name}: ${msg}`);
        }
    }
    console.log(`\n  ✅ Đã tạo ${created} nhân viên`);
    if (skipped > 0) console.log(`  ⏭️  Đã bỏ qua ${skipped} nhân viên (đã tồn tại)`);

    // Salary
    console.log("\n💰 Seeding salaries...\n");
    const salaryRanges: Record<string, { min: number; max: number }> = {
        "POS-DIR": { min: 40000000, max: 60000000 },
        "POS-VDIR": { min: 30000000, max: 45000000 },
        "POS-HR-MGR": { min: 25000000, max: 35000000 },
        "POS-TECH-MGR": { min: 28000000, max: 40000000 },
        "POS-SALES-MGR": { min: 25000000, max: 35000000 },
        "POS-FIN-MGR": { min: 25000000, max: 35000000 },
        "POS-MKT-MGR": { min: 25000000, max: 35000000 },
        "POS-TECH-TL": { min: 18000000, max: 25000000 },
        "POS-SALES-TL": { min: 15000000, max: 22000000 },
        "POS-HR-STAFF": { min: 8000000, max: 14000000 },
        "POS-TECH-DEV": { min: 12000000, max: 25000000 },
        "POS-TECH-QA": { min: 10000000, max: 18000000 },
        "POS-SALES-STAFF": { min: 7000000, max: 15000000 },
        "POS-FIN-STAFF": { min: 8000000, max: 15000000 },
        "POS-MKT-STAFF": { min: 7000000, max: 14000000 },
        "POS-IT-ADMIN": { min: 15000000, max: 25000000 },
        "POS-IT-STAFF": { min: 8000000, max: 18000000 },
    };
    for (const emp of employees) {
        const user = await prisma.user.findUnique({ where: { email: emp.code.toLowerCase() + "@company.vn" } });
        if (!user) continue;
        const range = salaryRanges[emp.pos] ?? { min: 8000000, max: 15000000 };
        const idx = hashStr(emp.code + "salary");
        const baseSalary = Math.round(range.min + ((range.max - range.min) * (idx % 100)) / 100);
        try {
            await prisma.salary.upsert({
                where: { userId: user.id },
                update: { baseSalary },
                create: { userId: user.id, baseSalary, effectiveDate: new Date(emp.hire) },
            });
        } catch {}
    }
    console.log(`  ✅ Đã seed lương cho ${employees.length} nhân viên`);

    // Shift assignment
    console.log("\n🕐 Seeding shift assignments...\n");
    const defaultShift = await prisma.shift.findFirst({ where: { isDefault: true } });
    if (defaultShift) {
        for (const emp of employees) {
            const user = await prisma.user.findUnique({ where: { email: emp.code.toLowerCase() + "@company.vn" } });
            if (!user) continue;
            try {
                await prisma.shiftAssignment.upsert({
                    where: { id: `${user.id}-default` },
                    update: {},
                    create: { id: `${user.id}-default`, userId: user.id, shiftId: defaultShift.id, startDate: new Date(emp.hire) },
                });
            } catch {}
        }
        console.log(`  ✅ Đã gán ca làm việc cho ${employees.length} nhân viên`);
    }

    // ============================================================
    // LEAVE MANAGEMENT SEED
    // ============================================================

    console.log("\n🏖️ Seeding leave types...\n");
    const leaveTypes = [
        {
            name: "Phép năm",
            description: "Nghỉ phép năm có lương theo quy định",
            isPaidLeave: true,
            defaultDays: 12,
        },
        {
            name: "Nghỉ ốm",
            description: "Nghỉ ốm theo BHXH",
            isPaidLeave: true,
            defaultDays: 0,
        },
        {
            name: "Nghỉ thai sản",
            description: "Nghỉ thai sản theo quy định BHXH",
            isPaidLeave: true,
            defaultDays: 180,
        },
        {
            name: "Nghỉ không lương",
            description: "Nghỉ không lương theo yêu cầu",
            isPaidLeave: false,
            defaultDays: 0,
        },
    ];

    for (const lt of leaveTypes) {
        const existing = await prisma.leaveType.findFirst({
            where: { name: lt.name },
        });
        if (!existing) {
            await prisma.leaveType.create({
                data: {
                    name: lt.name,
                    description: lt.description,
                    isPaidLeave: lt.isPaidLeave,
                    defaultDays: lt.defaultDays,
                    isActive: true,
                },
            });
            console.log(`  ✅ Đã tạo: ${lt.name}`);
        } else {
            console.log(`  ⏭️  Đã tồn tại: ${lt.name}`);
        }
    }

    const totalUsers = await prisma.user.count();
    const totalDepts = await prisma.department.count();
    const totalPositions = await prisma.position.count();
    console.log("\n📊 Tổng kết sau seed:");
    console.log(`   - Tổng users: ${totalUsers}`);
    console.log(`   - Departments: ${totalDepts}`);
    console.log(`   - Positions: ${totalPositions}`);

    // ============================================================
    // HOLIDAY CALENDARS - Lịch nghỉ lễ (Route 4)
    // ============================================================
    console.log("\n🎉 Seeding holiday calendars...\n");

    const holidayCalendarDefs = [
        {
            name: "Lịch nghỉ lễ Việt Nam 2026",
            year: 2026,
            country: "Vietnam",
            isDefault: true,
            holidays: [
                { name: "Tết Dương lịch", date: "2026-01-01", isRecurring: true, halfDay: "FULL" },
                { name: "Tết Nguyên đán", date: "2026-02-17", endDate: "2026-02-23", isRecurring: false, halfDay: "FULL" },
                { name: "Giỗ Tổ Hùng Vương", date: "2026-04-10", isRecurring: true, halfDay: "FULL" },
                { name: "Ngày Giải phóng miền Nam 30/4", date: "2026-04-30", isRecurring: true, halfDay: "FULL" },
                { name: "Quốc tế Lao động 1/5", date: "2026-05-01", isRecurring: true, halfDay: "FULL" },
                { name: "Quốc khánh 2/9", date: "2026-09-02", isRecurring: true, halfDay: "FULL" },
            ],
        },
        {
            name: "Lịch nghỉ lễ Việt Nam 2025",
            year: 2025,
            country: "Vietnam",
            isDefault: false,
            holidays: [
                { name: "Tết Dương lịch", date: "2025-01-01", isRecurring: true, halfDay: "FULL" },
                { name: "Tết Nguyên đán", date: "2025-01-29", endDate: "2025-02-02", isRecurring: false, halfDay: "FULL" },
                { name: "Giỗ Tổ Hùng Vương", date: "2025-04-07", isRecurring: true, halfDay: "FULL" },
                { name: "Ngày Giải phóng miền Nam 30/4", date: "2025-04-30", isRecurring: true, halfDay: "FULL" },
                { name: "Quốc tế Lao động 1/5", date: "2025-05-01", isRecurring: true, halfDay: "FULL" },
                { name: "Quốc khánh 2/9", date: "2025-09-02", isRecurring: true, halfDay: "FULL" },
            ],
        },
    ];

    for (const calDef of holidayCalendarDefs) {
        const existingCal = await prisma.holidayCalendar.findFirst({
            where: { name: calDef.name, year: calDef.year },
        });
        let calendarId: string;
        if (existingCal) {
            calendarId = existingCal.id;
            console.log(`  ⏭️  Đã tồn tại: ${calDef.name}`);
        } else {
            const created = await prisma.holidayCalendar.create({
                data: {
                    name: calDef.name,
                    year: calDef.year,
                    country: calDef.country,
                    isDefault: calDef.isDefault,
                    isActive: true,
                },
            });
            calendarId = created.id;
            console.log(`  ✅ Đã tạo: ${calDef.name}`);
        }

        // Seed holidays cho calendar
        for (const holiday of calDef.holidays) {
            const existingHoliday = await prisma.holiday.findFirst({
                where: {
                    holidayCalendarId: calendarId,
                    name: holiday.name,
                },
            });
            if (!existingHoliday) {
                await prisma.holiday.create({
                    data: {
                        holidayCalendarId: calendarId,
                        name: holiday.name,
                        date: new Date(holiday.date),
                        endDate: holiday.endDate ? new Date(holiday.endDate) : null,
                        isRecurring: holiday.isRecurring,
                        year: parseInt(holiday.date.split("-")[0]),
                        halfDay: holiday.halfDay,
                    },
                });
                console.log(`     ✅ + ${holiday.name} (${holiday.date})`);
            } else {
                console.log(`     ⏭️  ${holiday.name} đã tồn tại`);
            }
        }
    }



    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    const finalUsers = await prisma.user.count();
    const finalDepts = await prisma.department.count();
    const finalPositions = await prisma.position.count();
    const finalLeaveTypes = await prisma.leaveType.count();
    const finalCalendars = await prisma.holidayCalendar.count();
    const finalHolidays = await prisma.holiday.count();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED HOÀN TẤT - TỔNG KẾT CUỐI CÙNG");
    console.log("=".repeat(60));
    console.log(`  👥 Users:             ${finalUsers}`);
    console.log(`  🏢 Departments:      ${finalDepts}`);
    console.log(`  💼 Positions:        ${finalPositions}`);
    console.log("");
    console.log(`  📋 Leave Types:      ${finalLeaveTypes}`);
    console.log("");
    console.log(`  🎉 HolidayCalendars: ${finalCalendars}`);
    console.log(`  📅 Holidays:         ${finalHolidays}`);
    console.log("=".repeat(60));
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Seed thất bại:", err);
        process.exit(1);
    });

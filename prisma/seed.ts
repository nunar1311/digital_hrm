import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

// ─── Prisma setup ────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Types ────────────────────────────────────────────────────────
interface EmployeeSeedData {
    code: string;
    name: string;
    gender: string;
    dept: string;
    pos: string;
    role: string;
    dob: string;
    phone: string;
    nationalId: string;
    hire: string;
    type: string;
    username: string;
    password?: string;
    managerUsername?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
async function createEmployeeAccount(
    emp: EmployeeSeedData,
    deptMap: Record<string, string>,
    posMap: Record<string, string>,
    posSalaryMap: Record<string, number>,
    contractTypeMap: Record<string, string>,
    managerIdMap: Record<string, string>,
): Promise<string> {
    const email = `${emp.code.toLowerCase()}@company.vn`;
    const password = emp.password ?? emp.username;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const credentialAccount = await prisma.account.findFirst({
            where: {
                userId: existing.id,
                providerId: "credential",
            },
        });

        if (credentialAccount) {
            await prisma.account.update({
                where: { id: credentialAccount.id },
                data: {
                    accountId: email,
                    password: hashedPassword,
                },
            });
        } else {
            await prisma.account.create({
                data: {
                    userId: existing.id,
                    providerId: "credential",
                    accountId: email,
                    password: hashedPassword,
                },
            });
        }

        return existing.id;
    }

    // Tạo user + account trực tiếp bằng Prisma (bypass auth.api vì seed không có HTTP context)
    const user = await prisma.user.create({
        data: {
            email,
            name: emp.name,
            username: emp.username,
            displayUsername: emp.name,
            departmentId: deptMap[emp.dept] ?? null,
            hrmRole: emp.role,
            gender: emp.gender,
            phone: emp.phone,
            nationalId: emp.nationalId,
            dateOfBirth: new Date(emp.dob),
            hireDate: new Date(emp.hire),
            positionId: posMap[emp.pos] ?? null,
            employmentType: emp.type,
            managerId: emp.managerUsername ? managerIdMap[emp.managerUsername] ?? null : null,
            accounts: {
                create: {
                    providerId: "credential",
                    accountId: email,
                    password: hashedPassword,
                },
            },
        },
    });

    if (!user) return "";
    const userId = user.id;

    const baseSalary = posSalaryMap[emp.pos];
    const contractTypeId = contractTypeMap[emp.type] ?? contractTypeMap["FULL_TIME"] ?? null;

    // ── Salary ──────────────────────────────────────────────────
    if (baseSalary) {
        await prisma.salary.upsert({
            where: { userId },
            update: { baseSalary, effectiveDate: new Date(emp.hire) },
            create: { userId, baseSalary, effectiveDate: new Date(emp.hire) },
        });
    }

    // ── Contract ────────────────────────────────────────────────
    const contractNumber = `HD-${emp.code}`;
    const isIndefinite = emp.type === "PERMANENT";
    await prisma.contract.upsert({
        where: { contractNumber },
        update: {
            userId,
            contractTypeId,
            startDate: new Date(emp.hire),
            endDate: isIndefinite ? null : new Date(`${parseInt(emp.hire.split("-")[0]) + 1}-${emp.hire.slice(5)}`),
            status: "ACTIVE",
        },
        create: {
            contractNumber,
            userId,
            title: isIndefinite ? "Hợp đồng lao động không thời hạn" : "Hợp đồng lao động có thời hạn",
            contractTypeId,
            startDate: new Date(emp.hire),
            endDate: isIndefinite ? null : new Date(`${parseInt(emp.hire.split("-")[0]) + 1}-${emp.hire.slice(5)}`),
            status: "ACTIVE",
            signedDate: new Date(emp.hire),
        },
    });

    return userId;
}

// ─── Main seed ───────────────────────────────────────────────────
async function seed() {
    console.log("\n🌱 Bắt đầu seed database...\n");

    // ── 1. Departments ──────────────────────────────────────────
    console.log("🏢 Đang seed departments...");
    const bgd = await prisma.department.upsert({
        where: { code: "BGD" },
        update: {},
        create: { name: "Ban Giám đốc", code: "BGD", logo: "Building2", description: "Ban lãnh đạo công ty", sortOrder: 0 },
    });

    const deptDefs = [
        { name: "Phòng Nhân sự", code: "HR", logo: "Users", desc: "Quản lý nhân sự và tuyển dụng", so: 1 },
        { name: "Phòng Kỹ thuật", code: "TECH", logo: "Code", desc: "Phát triển phần mềm", so: 2 },
        { name: "Phòng Kinh doanh", code: "SALES", logo: "Briefcase", desc: "Kinh doanh và chăm sóc khách hàng", so: 3 },
        { name: "Phòng Tài chính - Kế toán", code: "FIN", logo: "Wallet", desc: "Quản lý tài chính và kế toán", so: 4 },
        { name: "Phòng Marketing", code: "MKT", logo: "Megaphone", desc: "Marketing và truyền thông", so: 5 },
        { name: "Phòng IT & Hạ tầng", code: "IT", logo: "Monitor", desc: "Quản trị hệ thống", so: 6 },
    ];

    const deptMap: Record<string, string> = { BGD: bgd.id };
    for (const d of deptDefs) {
        const created = await prisma.department.upsert({
            where: { code: d.code },
            update: {},
            create: { name: d.name, code: d.code, logo: d.logo, description: d.desc, parentId: bgd.id, sortOrder: d.so },
        });
        deptMap[d.code] = created.id;
    }

    const techSubDepts = [
        { name: "Nhóm Frontend", code: "TECH-FE", desc: "Phát triển giao diện", so: 1 },
        { name: "Nhóm Backend", code: "TECH-BE", desc: "Phát triển hệ thống server", so: 2 },
        { name: "Nhóm QA/Testing", code: "TECH-QA", desc: "Kiểm thử phần mềm", so: 3 },
    ];
    for (const d of techSubDepts) {
        const created = await prisma.department.upsert({
            where: { code: d.code },
            update: {},
            create: { name: d.name, code: d.code, description: d.desc, parentId: deptMap["TECH"], sortOrder: d.so },
        });
        deptMap[d.code] = created.id;
    }
    console.log(`   ✅ Đã seed ${Object.keys(deptMap).length} departments\n`);

    // ── 2. Positions ────────────────────────────────────────────
    console.log("💼 Đang seed positions...");
    const posDefs = [
        { name: "Giám đốc", code: "POS-DIR", auth: "DIRECTOR", dept: "BGD", level: 1, so: 1, min: 50_000_000, max: 100_000_000, desc: "Đại diện pháp luật" },
        { name: "Phó Giám đốc", code: "POS-VDIR", auth: "DEPUTY", dept: "BGD", level: 2, so: 2, min: 40_000_000, max: 80_000_000, desc: "Hỗ trợ Giám đốc" },
        { name: "Trưởng phòng Nhân sự", code: "POS-HR-MGR", auth: "MANAGER", dept: "HR", level: 3, so: 10, min: 25_000_000, max: 50_000_000, desc: "Quản lý nhân sự" },
        { name: "Nhân viên Nhân sự", code: "POS-HR-STAFF", auth: "STAFF", dept: "HR", level: 6, so: 11, min: 10_000_000, max: 20_000_000, desc: "Nhân viên HR" },
        { name: "Trưởng phòng Kỹ thuật", code: "POS-TECH-MGR", auth: "MANAGER", dept: "TECH", level: 3, so: 20, min: 30_000_000, max: 60_000_000, desc: "Quản lý kỹ thuật" },
        { name: "Trưởng nhóm", code: "POS-TECH-TL", auth: "TEAM_LEAD", dept: "TECH", level: 5, so: 21, min: 20_000_000, max: 35_000_000, desc: "Điều phối nhóm" },
        { name: "Lập trình viên", code: "POS-TECH-DEV", auth: "STAFF", dept: "TECH", level: 6, so: 22, min: 12_000_000, max: 30_000_000, desc: "Phát triển phần mềm" },
        { name: "Kỹ sư QA", code: "POS-TECH-QA", auth: "STAFF", dept: "TECH", level: 6, so: 23, min: 10_000_000, max: 25_000_000, desc: "Kiểm thử phần mềm" },
        { name: "Trưởng phòng Kinh doanh", code: "POS-SALES-MGR", auth: "MANAGER", dept: "SALES", level: 3, so: 30, min: 25_000_000, max: 55_000_000, desc: "Quản lý kinh doanh" },
        { name: "Nhân viên Kinh doanh", code: "POS-SALES-STAFF", auth: "STAFF", dept: "SALES", level: 6, so: 31, min: 8_000_000, max: 20_000_000, desc: "Nhân viên kinh doanh" },
        { name: "Trưởng nhóm Kinh doanh", code: "POS-SALES-TL", auth: "TEAM_LEAD", dept: "SALES", level: 5, so: 32, min: 15_000_000, max: 30_000_000, desc: "Điều phối nhóm sales" },
        { name: "Kế toán trưởng", code: "POS-FIN-MGR", auth: "MANAGER", dept: "FIN", level: 3, so: 40, min: 25_000_000, max: 50_000_000, desc: "Quản lý tài chính" },
        { name: "Kế toán viên", code: "POS-FIN-STAFF", auth: "STAFF", dept: "FIN", level: 6, so: 41, min: 8_000_000, max: 18_000_000, desc: "Kế toán viên" },
        { name: "Trưởng phòng Marketing", code: "POS-MKT-MGR", auth: "MANAGER", dept: "MKT", level: 3, so: 50, min: 25_000_000, max: 50_000_000, desc: "Quản lý marketing" },
        { name: "Nhân viên Marketing", code: "POS-MKT-STAFF", auth: "STAFF", dept: "MKT", level: 6, so: 51, min: 8_000_000, max: 20_000_000, desc: "Nhân viên marketing" },
        { name: "Quản trị hệ thống", code: "POS-IT-ADMIN", auth: "MANAGER", dept: "IT", level: 3, so: 60, min: 20_000_000, max: 45_000_000, desc: "Quản trị hệ thống" },
        { name: "Nhân viên IT Support", code: "POS-IT-STAFF", auth: "STAFF", dept: "IT", level: 6, so: 61, min: 8_000_000, max: 20_000_000, desc: "Hỗ trợ kỹ thuật" },
        { name: "Thực tập sinh", code: "POS-INTERN", auth: "INTERN", dept: null, level: 7, so: 99, min: 4_000_000, max: 8_000_000, desc: "Thực tập sinh" },
    ];

    const posMap: Record<string, string> = {};
    for (const p of posDefs) {
        const created = await prisma.position.upsert({
            where: { code: p.code },
            update: {},
            create: {
                name: p.name, code: p.code, authority: p.auth, departmentId: p.dept ? deptMap[p.dept] : null,
                level: p.level, sortOrder: p.so, minSalary: p.min, maxSalary: p.max,
                description: p.desc, status: "ACTIVE",
            },
        });
        posMap[p.code] = created.id;
    }
    console.log(`   ✅ Đã seed ${Object.keys(posMap).length} positions\n`);

    // ── 3. Position-Role Mapping ────────────────────────────────
    console.log("🔗 Đang seed position-role mappings...");
    const roleSeed: Record<string, string> = {
        DIRECTOR: "DIRECTOR", DEPUTY: "DEPT_MANAGER", MANAGER: "HR_MANAGER",
        TEAM_LEAD: "TEAM_LEADER", STAFF: "EMPLOYEE", INTERN: "EMPLOYEE",
    };
    let mappedCount = 0;
    const allPositions = await prisma.position.findMany({ select: { id: true, authority: true } });
    for (const pos of allPositions) {
        const roleKey = roleSeed[pos.authority];
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
        } catch (e) {
            console.warn(`   ⚠️  Lỗi position-role mapping cho pos ${pos.id}:`, e);
        }
    }
    console.log(`   ✅ Đã seed ${mappedCount} position-role mappings\n`);

    // ── 4. Position Salaries ────────────────────────────────────
    console.log("💰 Đang seed position salaries...");
    const posSalaryDefs = [
        { posCode: "POS-DIR", grade: "A", base: 80_000_000 },
        { posCode: "POS-DIR", grade: "B", base: 65_000_000 },
        { posCode: "POS-VDIR", grade: "A", base: 60_000_000 },
        { posCode: "POS-VDIR", grade: "B", base: 48_000_000 },
        { posCode: "POS-HR-MGR", grade: "A", base: 35_000_000 },
        { posCode: "POS-HR-MGR", grade: "B", base: 28_000_000 },
        { posCode: "POS-HR-STAFF", grade: "A", base: 14_000_000 },
        { posCode: "POS-HR-STAFF", grade: "B", base: 11_000_000 },
        { posCode: "POS-TECH-MGR", grade: "A", base: 45_000_000 },
        { posCode: "POS-TECH-MGR", grade: "B", base: 36_000_000 },
        { posCode: "POS-TECH-TL", grade: "A", base: 28_000_000 },
        { posCode: "POS-TECH-TL", grade: "B", base: 22_000_000 },
        { posCode: "POS-TECH-DEV", grade: "A", base: 22_000_000 },
        { posCode: "POS-TECH-DEV", grade: "B", base: 17_000_000 },
        { posCode: "POS-TECH-DEV", grade: "C", base: 13_000_000 },
        { posCode: "POS-TECH-QA", grade: "A", base: 18_000_000 },
        { posCode: "POS-TECH-QA", grade: "B", base: 14_000_000 },
        { posCode: "POS-TECH-QA", grade: "C", base: 10_000_000 },
        { posCode: "POS-SALES-MGR", grade: "A", base: 40_000_000 },
        { posCode: "POS-SALES-MGR", grade: "B", base: 32_000_000 },
        { posCode: "POS-SALES-STAFF", grade: "A", base: 14_000_000 },
        { posCode: "POS-SALES-STAFF", grade: "B", base: 10_000_000 },
        { posCode: "POS-SALES-STAFF", grade: "C", base: 8_000_000 },
        { posCode: "POS-SALES-TL", grade: "A", base: 22_000_000 },
        { posCode: "POS-SALES-TL", grade: "B", base: 17_000_000 },
        { posCode: "POS-FIN-MGR", grade: "A", base: 38_000_000 },
        { posCode: "POS-FIN-MGR", grade: "B", base: 30_000_000 },
        { posCode: "POS-FIN-STAFF", grade: "A", base: 13_000_000 },
        { posCode: "POS-FIN-STAFF", grade: "B", base: 10_000_000 },
        { posCode: "POS-MKT-MGR", grade: "A", base: 35_000_000 },
        { posCode: "POS-MKT-MGR", grade: "B", base: 28_000_000 },
        { posCode: "POS-MKT-STAFF", grade: "A", base: 13_000_000 },
        { posCode: "POS-MKT-STAFF", grade: "B", base: 10_000_000 },
        { posCode: "POS-IT-ADMIN", grade: "A", base: 32_000_000 },
        { posCode: "POS-IT-ADMIN", grade: "B", base: 25_000_000 },
        { posCode: "POS-IT-STAFF", grade: "A", base: 13_000_000 },
        { posCode: "POS-IT-STAFF", grade: "B", base: 10_000_000 },
        { posCode: "POS-INTERN", grade: "A", base: 6_000_000 },
        { posCode: "POS-INTERN", grade: "B", base: 4_500_000 },
    ];

    const posSalaryMap: Record<string, number> = {};
    for (const ps of posSalaryDefs) {
        if (!posMap[ps.posCode]) continue;
        const created = await prisma.positionSalary.upsert({
            where: { positionId_salaryGrade: { positionId: posMap[ps.posCode], salaryGrade: ps.grade } },
            update: { baseSalary: ps.base, isActive: true },
            create: { positionId: posMap[ps.posCode], salaryGrade: ps.grade, baseSalary: ps.base, effectiveDate: new Date("2025-01-01"), isActive: true },
        });
        if (ps.grade === "A") posSalaryMap[ps.posCode] = Number(created.baseSalary);
    }
    console.log(`   ✅ Đã seed ${posSalaryDefs.length} position salaries\n`);

    // ── 5. Contract Types ───────────────────────────────────────
    console.log("📄 Đang seed contract types...");
    const contractTypeDefs = [
        { code: "FULL_TIME", name: "Hợp đồng có thời hạn", months: 12 },
        { code: "PERMANENT", name: "Hợp đồng không thời hạn", months: null },
        { code: "PART_TIME", name: "Hợp đồng bán thời gian", months: 12 },
        { code: "PROBATION", name: "Hợp đồng thử việc", months: 2 },
        { code: "INTERN", name: "Hợp đồng thực tập", months: 6 },
        { code: "SEASONAL", name: "Hợp đồng theo mùa vụ", months: 3 },
    ];
    const contractTypeMap: Record<string, string> = {};
    for (const ct of contractTypeDefs) {
        const existing = await prisma.contractType.findFirst({ where: { name: ct.name } });
        const created = existing ?? await prisma.contractType.create({ data: { name: ct.name, durationMonths: ct.months } });
        contractTypeMap[ct.code] = created.id;
    }
    console.log(`   ✅ Đã seed ${Object.keys(contractTypeMap).length} contract types\n`);

    // ── 5.1 Contract Templates ─────────────────────────────────
    console.log("🧾 Đang seed contract templates...");
    await prisma.contractTemplate.upsert({
        where: { code: "labor-contract-default" },
        update: {
            name: "Mẫu hợp đồng lao động mặc định",
            description: "Dùng cho xuất DOCX/PDF theo mail merge",
            content: [
                "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                "Độc lập - Tự do - Hạnh phúc",
                "",
                "HỢP ĐỒNG LAO ĐỘNG",
                "Số: {{contractNumber}}",
                "",
                "Bên sử dụng lao động: {{companyName}}",
                "Người lao động: {{employeeName}}",
                "Chức danh: {{employeePosition}}",
                "Phòng ban: {{employeeDepartment}}",
                "Loại hợp đồng: {{contractType}}",
                "Ngày hiệu lực: {{startDate}}",
                "Ngày hết hạn: {{endDate}}",
                "Mức lương: {{salary}}",
                "Lương thử việc: {{probationSalary}}",
                "",
                "Các bên cam kết thực hiện đúng nội dung hợp đồng này.",
                "Ngày lập hợp đồng: {{today}}",
            ].join("\n"),
            isDefault: true,
            isActive: true,
        },
        create: {
            code: "labor-contract-default",
            name: "Mẫu hợp đồng lao động mặc định",
            description: "Dùng cho xuất DOCX/PDF theo mail merge",
            content: [
                "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                "Độc lập - Tự do - Hạnh phúc",
                "",
                "HỢP ĐỒNG LAO ĐỘNG",
                "Số: {{contractNumber}}",
                "",
                "Bên sử dụng lao động: {{companyName}}",
                "Người lao động: {{employeeName}}",
                "Chức danh: {{employeePosition}}",
                "Phòng ban: {{employeeDepartment}}",
                "Loại hợp đồng: {{contractType}}",
                "Ngày hiệu lực: {{startDate}}",
                "Ngày hết hạn: {{endDate}}",
                "Mức lương: {{salary}}",
                "Lương thử việc: {{probationSalary}}",
                "",
                "Các bên cam kết thực hiện đúng nội dung hợp đồng này.",
                "Ngày lập hợp đồng: {{today}}",
            ].join("\n"),
            isDefault: true,
            isActive: true,
        },
    });
    console.log("   ✅ Đã seed template hợp đồng mặc định\n");

    // ── 6. Shifts ────────────────────────────────────────────────
    console.log("🕐 Đang seed shifts...");
    const existingShifts = await prisma.shift.findMany();
    if (existingShifts.length === 0) {
        const shifts = [
            { name: "Ca sáng", code: "SHIFT-MORNING", start: "08:00", end: "12:00", isDefault: false },
            { name: "Ca chiều", code: "SHIFT-AFTERNOON", start: "13:00", end: "17:30", isDefault: false },
            { name: "Ca ngày", code: "SHIFT-FULL", start: "08:00", end: "17:30", breakMins: 90, isDefault: true },
            { name: "Ca đêm", code: "SHIFT-NIGHT", start: "22:00", end: "06:00", breakMins: 60, isDefault: false },
        ];
        for (const s of shifts) {
            await prisma.shift.create({ data: {
                name: s.name, code: s.code, startTime: s.start, endTime: s.end,
                breakMinutes: s.breakMins ?? 0, lateThreshold: 15, earlyThreshold: 15,
                isDefault: s.isDefault, isActive: true,
            }});
        }
        console.log(`   ✅ Đã seed ${shifts.length} shifts\n`);
    } else {
        console.log(`   ⏭️  Shifts đã tồn tại, bỏ qua\n`);
    }

    // ── 7. Attendance Config ────────────────────────────────────
    console.log("⏰ Đang seed attendance config...");
    if (!await prisma.attendanceConfig.findFirst()) {
        await prisma.attendanceConfig.create({
            data: { otWeekdayCoeff: 1.5, otWeekendCoeff: 2.0, otHolidayCoeff: 3.0, standardWorkHours: 8, standardWorkDays: 22, requireGps: false, requireWifi: false, requireSelfie: false, maxGpsDistanceMeters: 200, earlyCheckinMinutes: 60 },
        });
        console.log("   ✅ Đã seed attendance config\n");
    } else {
        console.log("   ⏭️  Attendance config đã tồn tại\n");
    }

    // ── 8. Attendance Approval Process ─────────────────────────
    console.log("📋 Đang seed attendance approval process...");
    if (!await prisma.attendanceApprovalProcess.findFirst()) {
        await prisma.attendanceApprovalProcess.create({
            data: {
                name: "Quy trình duyệt điều chỉnh chấm công", isActive: true,
                sendEmailReminder: false, skipDuplicateApprover: true, skipSelfApprover: true,
                steps: { create: { stepOrder: 1, stepType: "APPROVER", approverType: "DIRECT_MANAGER", approvalMethod: "FIRST_APPROVES", skipIfNoApproverFound: true } },
            },
        });
        console.log("   ✅ Đã seed attendance approval process\n");
    } else {
        console.log("   ⏭️  Attendance approval process đã tồn tại\n");
    }

    // ── 9. Holidays & Calendars ─────────────────────────────────
    console.log("🎉 Đang seed holidays...");
    for (const cal of [
        { name: "Lịch nghỉ lễ Việt Nam 2026", year: 2026, isDefault: true, holidays: [
            { name: "Tết Dương lịch", date: "2026-01-01", isRecurring: true },
            { name: "Tết Nguyên đán", date: "2026-02-17", endDate: "2026-02-23", isRecurring: false },
            { name: "Giỗ Tổ Hùng Vương", date: "2026-04-10", isRecurring: true },
            { name: "Ngày Giải phóng miền Nam", date: "2026-04-30", isRecurring: true },
            { name: "Quốc tế Lao động", date: "2026-05-01", isRecurring: true },
            { name: "Quốc khánh", date: "2026-09-02", isRecurring: true },
        ]},
        { name: "Lịch nghỉ lễ Việt Nam 2025", year: 2025, isDefault: false, holidays: [
            { name: "Tết Dương lịch", date: "2025-01-01", isRecurring: true },
            { name: "Tết Nguyên đán", date: "2025-01-29", endDate: "2025-02-02", isRecurring: false },
            { name: "Giỗ Tổ Hùng Vương", date: "2025-04-07", isRecurring: true },
            { name: "Ngày Giải phóng miền Nam", date: "2025-04-30", isRecurring: true },
            { name: "Quốc tế Lao động", date: "2025-05-01", isRecurring: true },
            { name: "Quốc khánh", date: "2025-09-02", isRecurring: true },
        ]},
    ]) {
        let calId: string;
        const existingCal = await prisma.holidayCalendar.findFirst({ where: { name: cal.name, year: cal.year } });
        if (existingCal) {
            calId = existingCal.id;
            console.log(`   ⏭️  ${cal.name}`);
        } else {
            const created = await prisma.holidayCalendar.create({
                data: { name: cal.name, year: cal.year, country: "Vietnam", isDefault: cal.isDefault, isActive: true },
            });
            calId = created.id;
            console.log(`   ✅ ${cal.name}`);
        }
        for (const h of cal.holidays) {
            const exists = await prisma.holiday.findFirst({ where: { holidayCalendarId: calId, name: h.name } });
            if (!exists) {
                await prisma.holiday.create({
                    data: { holidayCalendarId: calId, name: h.name, date: new Date(h.date), endDate: h.endDate ? new Date(h.endDate) : null, isRecurring: h.isRecurring, year: parseInt(h.date.split("-")[0]), halfDay: "FULL" },
                });
                console.log(`      ✅ + ${h.name}`);
            }
        }
    }
    console.log("");

    // ── 10. Company Settings ─────────────────────────────────────
    console.log("🏢 Đang seed company settings...");
    const settings = [
        { key: "company.companyName", value: "Công ty Công nghệ Digital HRM", group: "company" },
        { key: "company.companyCode", value: "DHRM", group: "company" },
        { key: "company.companyEmail", value: "info@digital-hrm.vn", group: "company" },
        { key: "company.companyPhone", value: "028 1234 5678", group: "company" },
        { key: "company.companyTaxCode", value: "0123456789", group: "company" },
        { key: "company.companyAddress", value: "123 Đường Nguyễn Trãi", group: "company" },
        { key: "company.companyCity", value: "Hồ Chí Minh", group: "company" },
        { key: "company.companyCountry", value: "Vietnam", group: "company" },
        { key: "company.companyWebsite", value: "https://digital-hrm.vn", group: "company" },
        { key: "company.companyIndustry", value: "technology", group: "company" },
        { key: "company.companyFoundedDate", value: "2020-01-15", group: "company" },
        { key: "company.companyEmployeeCount", value: "51-100", group: "company" },
        { key: "company.companyBankAccount", value: "1234567890", group: "company" },
        { key: "company.companyBankName", value: "Ngân hàng TMCP Ngoại thương Việt Nam (VCB)", group: "company" },
    ];
    for (const s of settings) {
        try {
            await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s });
            console.log(`   ✅ ${s.key}`);
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("P2002")) {
                console.log(`   ⏭️  ${s.key} — đã tồn tại`);
            } else {
                throw e;
            }
        }
    }
    console.log("");

    // ── 11. Leave Types ──────────────────────────────────────────
    console.log("🏖️ Đang seed leave types...");
    const leaveDefs = [
        { name: "Phép năm", desc: "Nghỉ phép năm có lương", paid: true, days: 12 },
        { name: "Nghỉ ốm", desc: "Nghỉ ốm theo BHXH", paid: true, days: 0 },
        { name: "Nghỉ thai sản", desc: "Nghỉ thai sản theo quy định", paid: true, days: 180 },
        { name: "Nghỉ không lương", desc: "Nghỉ không lương theo yêu cầu", paid: false, days: 0 },
    ];
    for (const lt of leaveDefs) {
        const existing = await prisma.leaveType.findFirst({ where: { name: lt.name } });
        if (!existing) {
            await prisma.leaveType.create({ data: { name: lt.name, description: lt.desc, isPaidLeave: lt.paid, defaultDays: lt.days, isActive: true } });
            console.log(`   ✅ ${lt.name}`);
        } else {
            console.log(`   ⏭️  ${lt.name}`);
        }
    }
    console.log("");

    // ── 12. Employees ────────────────────────────────────────────
    console.log("👥 Đang seed employees...");
    const employees: EmployeeSeedData[] = [
        // ── Demo accounts ─────────────────────────────────────────
        { code: "SA-001", name: "Super Admin", gender: "MALE", dept: "BGD", pos: "POS-IT-ADMIN", role: "SUPER_ADMIN", dob: "1980-01-01", phone: "0900000001", nationalId: "025080000001", hire: "2018-01-01", type: "PERMANENT", username: "260403001", password: "Admin@123" },
        { code: "DIR-001", name: "Nguyễn Văn Giám Đốc", gender: "MALE", dept: "BGD", pos: "POS-DIR", role: "DIRECTOR", dob: "1975-05-15", phone: "0900000002", nationalId: "025080000002", hire: "2017-01-01", type: "PERMANENT", username: "260403002", password: "Director@123" },
        { code: "HR-001", name: "Trần Thị HR Manager", gender: "FEMALE", dept: "HR", pos: "POS-HR-MGR", role: "HR_MANAGER", dob: "1982-08-20", phone: "0900000003", nationalId: "025080000003", hire: "2018-03-01", type: "PERMANENT", username: "260403003", password: "HrManager@123" },
        { code: "HR-002", name: "Lê Văn HR Staff", gender: "MALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1990-06-10", phone: "0900000004", nationalId: "025080000004", hire: "2019-05-01", type: "FULL_TIME", username: "260403004", password: "HrStaff@123" },
        { code: "DM-001", name: "Phạm Văn Trưởng Phòng", gender: "MALE", dept: "TECH", pos: "POS-TECH-MGR", role: "DEPT_MANAGER", dob: "1983-04-15", phone: "0900000005", nationalId: "025080000005", hire: "2017-06-01", type: "PERMANENT", username: "260403005", password: "DeptManager@123" },
        { code: "TL-001", name: "Hoàng Thị Team Leader", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1987-09-25", phone: "0900000006", nationalId: "025080000006", hire: "2018-09-01", type: "PERMANENT", username: "260403006", password: "TeamLeader@123" },
        { code: "EMP-001", name: "Vũ Văn Nhân Viên", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-03-20", phone: "0900000007", nationalId: "025080000007", hire: "2020-02-01", type: "FULL_TIME", username: "260403007", password: "Employee@123" },
        { code: "ACC-001", name: "Đỗ Thị Kế Toán", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-MGR", role: "ACCOUNTANT", dob: "1984-11-12", phone: "0900000008", nationalId: "025080000008", hire: "2018-01-15", type: "PERMANENT", username: "260403008", password: "Accountant@123" },
        { code: "IT-001", name: "Ngô Văn IT Admin", gender: "MALE", dept: "IT", pos: "POS-IT-ADMIN", role: "IT_ADMIN", dob: "1986-07-08", phone: "0900000009", nationalId: "025080000009", hire: "2018-04-01", type: "PERMANENT", username: "260403009", password: "ItAdmin@123" },
        // ── TECH Department ──────────────────────────────────────
        { code: "EMP-002", name: "Phạm Minh Tuấn", gender: "MALE", dept: "BGD", pos: "POS-VDIR", role: "DIRECTOR", dob: "1980-03-15", phone: "0902123456", nationalId: "025080001234", hire: "2018-06-01", type: "PERMANENT", username: "180601010" },
        { code: "EMP-003", name: "Đặng Hoàng Nam", gender: "MALE", dept: "BGD", pos: "POS-VDIR", role: "DIRECTOR", dob: "1982-07-22", phone: "0902123457", nationalId: "025080001235", hire: "2019-01-15", type: "PERMANENT", username: "190115011" },
        { code: "EMP-004", name: "Trần Đức Anh", gender: "MALE", dept: "TECH", pos: "POS-TECH-MGR", role: "DEPT_MANAGER", dob: "1985-04-10", phone: "0903123456", nationalId: "025080001236", hire: "2017-03-20", type: "PERMANENT", username: "170320012" },
        { code: "EMP-005", name: "Lê Thị Thu Hà", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1988-09-05", phone: "0903123457", nationalId: "025080001237", hire: "2018-07-01", type: "PERMANENT", username: "180701013" },
        { code: "EMP-006", name: "Nguyễn Văn Hùng", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1992-11-20", phone: "0903123458", nationalId: "025080001238", hire: "2019-09-15", type: "FULL_TIME", username: "190915014" },
        { code: "EMP-007", name: "Phạm Thị Lan", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-02-14", phone: "0903123459", nationalId: "025080001239", hire: "2020-01-10", type: "FULL_TIME", username: "200110015" },
        { code: "EMP-008", name: "Vũ Minh Khoa", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-06-30", phone: "0903123460", nationalId: "025080001240", hire: "2020-05-20", type: "FULL_TIME", username: "200520016" },
        { code: "EMP-009", name: "Hoàng Thị Mai", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-08-17", phone: "0903123461", nationalId: "025080001241", hire: "2020-03-01", type: "FULL_TIME", username: "200301017" },
        { code: "EMP-010", name: "Đỗ Văn Quang", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-12-08", phone: "0903123462", nationalId: "025080001242", hire: "2021-02-15", type: "FULL_TIME", username: "210215018" },
        { code: "EMP-011", name: "Bùi Thị Hương", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-05-25", phone: "0903123463", nationalId: "025080001243", hire: "2021-06-01", type: "FULL_TIME", username: "210601019" },
        { code: "EMP-012", name: "Trịnh Văn Toàn", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1991-03-12", phone: "0903123464", nationalId: "025080001244", hire: "2019-11-20", type: "FULL_TIME", username: "191120020" },
        { code: "EMP-013", name: "Lưu Thị Ngọc", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-07-09", phone: "0903123465", nationalId: "025080001245", hire: "2022-01-10", type: "FULL_TIME", username: "220110021" },
        { code: "EMP-014", name: "Ngô Minh Đức", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-10-03", phone: "0903123466", nationalId: "025080001246", hire: "2020-08-25", type: "FULL_TIME", username: "200825022" },
        { code: "EMP-015", name: "Phan Thị Thanh", gender: "FEMALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-01-28", phone: "0903123467", nationalId: "025080001247", hire: "2022-07-15", type: "FULL_TIME", username: "220715023" },
        { code: "EMP-016", name: "Cao Văn Minh", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-04-18", phone: "0903123468", nationalId: "025080001248", hire: "2021-10-01", type: "FULL_TIME", username: "211001024" },
        { code: "EMP-017", name: "Trần Văn Sơn", gender: "MALE", dept: "TECH", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-09-07", phone: "0903123469", nationalId: "025080001249", hire: "2020-04-20", type: "FULL_TIME", username: "200420025" },
        // ── TECH-FE ─────────────────────────────────────────────
        { code: "EMP-018", name: "Nguyễn Thị Lan", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1989-12-01", phone: "0904123456", nationalId: "025080001250", hire: "2018-09-10", type: "PERMANENT", username: "180910026" },
        { code: "EMP-019", name: "Lê Hoàng Long", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-03-15", phone: "0904123457", nationalId: "025080001251", hire: "2020-11-01", type: "FULL_TIME", username: "201101027" },
        { code: "EMP-020", name: "Trần Thị Hồng", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-06-22", phone: "0904123458", nationalId: "025080001252", hire: "2021-08-15", type: "FULL_TIME", username: "210815028" },
        { code: "EMP-021", name: "Phạm Văn Kiên", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-02-08", phone: "0904123459", nationalId: "025080001253", hire: "2022-03-01", type: "FULL_TIME", username: "220301029" },
        { code: "EMP-022", name: "Vũ Thị Phương", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-08-30", phone: "0904123460", nationalId: "025080001254", hire: "2021-05-20", type: "FULL_TIME", username: "210520030" },
        { code: "EMP-023", name: "Đặng Minh Tuấn", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-11-14", phone: "0904123461", nationalId: "025080001255", hire: "2023-02-10", type: "FULL_TIME", username: "230210031" },
        { code: "EMP-024", name: "Hoàng Thị Thúy", gender: "FEMALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-07-25", phone: "0904123462", nationalId: "025080001256", hire: "2020-10-01", type: "FULL_TIME", username: "201001032" },
        { code: "EMP-025", name: "Nguyễn Văn Bảo", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-01-09", phone: "0904123463", nationalId: "025080001257", hire: "2022-06-15", type: "FULL_TIME", username: "220615033" },
        // ── TECH-BE ─────────────────────────────────────────────
        { code: "EMP-026", name: "Trần Văn Dũng", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1987-05-18", phone: "0905123456", nationalId: "025080001258", hire: "2017-11-01", type: "PERMANENT", username: "171101034" },
        { code: "EMP-027", name: "Phạm Thị Hà", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1994-09-03", phone: "0905123457", nationalId: "025080001259", hire: "2020-07-20", type: "FULL_TIME", username: "200720035" },
        { code: "EMP-028", name: "Lê Văn Minh", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-12-20", phone: "0905123458", nationalId: "025080001260", hire: "2021-03-15", type: "FULL_TIME", username: "210315036" },
        { code: "EMP-029", name: "Vũ Hoàng Nam", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-04-11", phone: "0905123459", nationalId: "025080001261", hire: "2022-01-25", type: "FULL_TIME", username: "220125037" },
        { code: "EMP-030", name: "Đỗ Thị Linh", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1995-10-05", phone: "0905123460", nationalId: "025080001262", hire: "2020-12-01", type: "FULL_TIME", username: "201201038" },
        { code: "EMP-031", name: "Bùi Văn Hải", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1993-02-28", phone: "0905123461", nationalId: "025080001263", hire: "2019-08-10", type: "FULL_TIME", username: "190810039" },
        { code: "EMP-032", name: "Trịnh Thị Lan", gender: "FEMALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-07-14", phone: "0905123462", nationalId: "025080001264", hire: "2022-04-01", type: "FULL_TIME", username: "220401040" },
        { code: "EMP-033", name: "Ngô Văn Trung", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1999-03-22", phone: "0905123463", nationalId: "025080001265", hire: "2023-01-15", type: "FULL_TIME", username: "230115041" },
        { code: "EMP-034", name: "Phan Hoàng Sơn", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1996-06-08", phone: "0905123464", nationalId: "025080001266", hire: "2021-09-01", type: "FULL_TIME", username: "210901042" },
        // ── TECH-QA ─────────────────────────────────────────────
        { code: "EMP-035", name: "Cao Thị Thu", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-TL", role: "TEAM_LEADER", dob: "1988-11-25", phone: "0906123456", nationalId: "025080001267", hire: "2018-04-15", type: "PERMANENT", username: "180415043" },
        { code: "EMP-036", name: "Trần Văn Đạt", gender: "MALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1995-01-30", phone: "0906123457", nationalId: "025080001268", hire: "2020-06-01", type: "FULL_TIME", username: "200601044" },
        { code: "EMP-037", name: "Lê Thị Phương", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1997-08-12", phone: "0906123458", nationalId: "025080001269", hire: "2021-10-20", type: "FULL_TIME", username: "211020045" },
        { code: "EMP-038", name: "Nguyễn Hoàng Mai", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1994-04-06", phone: "0906123459", nationalId: "025080001270", hire: "2020-09-01", type: "FULL_TIME", username: "200901046" },
        { code: "EMP-039", name: "Phạm Văn Thắng", gender: "MALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1998-09-18", phone: "0906123460", nationalId: "025080001271", hire: "2022-08-01", type: "FULL_TIME", username: "220801047" },
        { code: "EMP-040", name: "Vũ Thị Kim Oanh", gender: "FEMALE", dept: "TECH-QA", pos: "POS-TECH-QA", role: "EMPLOYEE", dob: "1996-02-27", phone: "0906123461", nationalId: "025080001272", hire: "2021-07-15", type: "FULL_TIME", username: "210715048" },
        // ── HR ────────────────────────────────────────────────────
        { code: "EMP-041", name: "Hoàng Văn Phúc", gender: "MALE", dept: "HR", pos: "POS-HR-MGR", role: "HR_MANAGER", dob: "1984-06-10", phone: "0907123456", nationalId: "025080001273", hire: "2017-01-10", type: "PERMANENT", username: "170110049" },
        { code: "EMP-042", name: "Nguyễn Thị Hương", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1992-03-25", phone: "0907123457", nationalId: "025080001274", hire: "2019-05-01", type: "FULL_TIME", username: "190501050" },
        { code: "EMP-043", name: "Lê Thị Mai", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1995-07-08", phone: "0907123458", nationalId: "025080001275", hire: "2020-10-15", type: "FULL_TIME", username: "201015051" },
        { code: "EMP-044", name: "Trần Văn Hùng", gender: "MALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1993-10-30", phone: "0907123459", nationalId: "025080001276", hire: "2020-03-20", type: "FULL_TIME", username: "200320052" },
        { code: "EMP-045", name: "Phạm Thị Lan Anh", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1997-12-14", phone: "0907123460", nationalId: "025080001277", hire: "2022-02-01", type: "FULL_TIME", username: "220201053" },
        { code: "EMP-046", name: "Đặng Văn Tiến", gender: "MALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1996-05-20", phone: "0907123461", nationalId: "025080001278", hire: "2021-08-01", type: "FULL_TIME", username: "210801054" },
        // ── SALES ───────────────────────────────────────────────
        { code: "EMP-047", name: "Vũ Hoàng Dương", gender: "MALE", dept: "SALES", pos: "POS-SALES-MGR", role: "DEPT_MANAGER", dob: "1983-08-15", phone: "0908123456", nationalId: "025080001279", hire: "2016-05-01", type: "PERMANENT", username: "160501055" },
        { code: "EMP-048", name: "Trịnh Thị Thu Hà", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-TL", role: "TEAM_LEADER", dob: "1989-04-22", phone: "0908123457", nationalId: "025080001280", hire: "2018-03-15", type: "PERMANENT", username: "180315056" },
        { code: "EMP-049", name: "Bùi Văn Đức", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1994-01-10", phone: "0908123458", nationalId: "025080001281", hire: "2019-10-01", type: "FULL_TIME", username: "191001057" },
        { code: "EMP-050", name: "Lê Thị Ngọc Mai", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-09-28", phone: "0908123459", nationalId: "025080001282", hire: "2020-06-20", type: "FULL_TIME", username: "200620058" },
        { code: "EMP-051", name: "Ngô Văn Minh", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1992-12-05", phone: "0908123460", nationalId: "025080001283", hire: "2019-04-15", type: "FULL_TIME", username: "190415059" },
        { code: "EMP-052", name: "Phan Thị Hồng Nhung", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1998-06-17", phone: "0908123461", nationalId: "025080001284", hire: "2022-01-10", type: "FULL_TIME", username: "220110060" },
        { code: "EMP-053", name: "Cao Văn Trung", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1995-03-08", phone: "0908123462", nationalId: "025080001285", hire: "2020-11-01", type: "FULL_TIME", username: "201101061" },
        { code: "EMP-054", name: "Trần Thị Minh Châu", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1997-10-22", phone: "0908123463", nationalId: "025080001286", hire: "2021-09-15", type: "FULL_TIME", username: "210915062" },
        { code: "EMP-055", name: "Phạm Văn Thành", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1993-07-14", phone: "0908123464", nationalId: "025080001287", hire: "2020-02-01", type: "FULL_TIME", username: "200201063" },
        { code: "EMP-056", name: "Vũ Thị Lan Phương", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1999-02-28", phone: "0908123465", nationalId: "025080001288", hire: "2023-03-01", type: "FULL_TIME", username: "230301064" },
        { code: "EMP-057", name: "Đặng Hoàng Sơn", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1994-11-03", phone: "0908123466", nationalId: "025080001289", hire: "2020-08-20", type: "FULL_TIME", username: "200820065" },
        { code: "EMP-058", name: "Hoàng Thị Thanh Tâm", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-08-11", phone: "0908123467", nationalId: "025080001290", hire: "2021-04-01", type: "FULL_TIME", username: "210401066" },
        { code: "EMP-059", name: "Lê Văn Khánh", gender: "MALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1991-05-25", phone: "0908123468", nationalId: "025080001291", hire: "2019-07-15", type: "FULL_TIME", username: "190715067" },
        { code: "EMP-060", name: "Trịnh Thị Xuân", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1998-01-09", phone: "0908123469", nationalId: "025080001292", hire: "2022-09-01", type: "FULL_TIME", username: "220901068" },
        // ── FIN ──────────────────────────────────────────────────
        { code: "EMP-061", name: "Nguyễn Thị Thu Hồng", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-MGR", role: "ACCOUNTANT", dob: "1985-09-12", phone: "0909123456", nationalId: "025080001293", hire: "2016-08-01", type: "PERMANENT", username: "160801069" },
        { code: "EMP-062", name: "Phạm Văn Thọ", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1991-04-20", phone: "0909123457", nationalId: "025080001294", hire: "2019-02-15", type: "FULL_TIME", username: "190215070" },
        { code: "EMP-063", name: "Lê Thị Kim Thoa", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1994-12-03", phone: "0909123458", nationalId: "025080001295", hire: "2020-07-01", type: "FULL_TIME", username: "200701071" },
        { code: "EMP-064", name: "Vũ Hoàng Nam", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1993-06-18", phone: "0909123459", nationalId: "025080001296", hire: "2020-01-20", type: "FULL_TIME", username: "200120072" },
        { code: "EMP-065", name: "Đỗ Thị Hương Giang", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1997-03-30", phone: "0909123460", nationalId: "025080001297", hire: "2021-06-15", type: "FULL_TIME", username: "210615073" },
        { code: "EMP-066", name: "Bùi Văn Tâm", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1995-10-07", phone: "0909123461", nationalId: "025080001298", hire: "2020-09-01", type: "FULL_TIME", username: "200901074" },
        { code: "EMP-067", name: "Trịnh Thị Minh Ngọc", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1996-07-25", phone: "0909123462", nationalId: "025080001299", hire: "2021-03-01", type: "FULL_TIME", username: "210301075" },
        { code: "EMP-068", name: "Ngô Văn Đăng", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1992-11-14", phone: "0909123463", nationalId: "025080001300", hire: "2019-11-01", type: "FULL_TIME", username: "191101076" },
        { code: "EMP-069", name: "Phan Thị Thu Hà", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1998-05-02", phone: "0909123464", nationalId: "025080001301", hire: "2022-04-15", type: "FULL_TIME", username: "220415077" },
        { code: "EMP-070", name: "Cao Văn Quốc", gender: "MALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1994-08-19", phone: "0909123465", nationalId: "025080001302", hire: "2020-12-01", type: "FULL_TIME", username: "201201078" },
        { code: "EMP-071", name: "Trần Thị Thu Minh", gender: "FEMALE", dept: "FIN", pos: "POS-FIN-STAFF", role: "ACCOUNTANT", dob: "1999-01-08", phone: "0909123466", nationalId: "025080001303", hire: "2023-01-15", type: "FULL_TIME", username: "230115079" },
        // ── MKT ──────────────────────────────────────────────────
        { code: "EMP-072", name: "Phạm Hoàng Minh", gender: "MALE", dept: "MKT", pos: "POS-MKT-MGR", role: "DEPT_MANAGER", dob: "1986-03-05", phone: "0910123456", nationalId: "025080001304", hire: "2017-02-01", type: "PERMANENT", username: "170201080" },
        { code: "EMP-073", name: "Vũ Thị Lan Anh", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1993-09-22", phone: "0910123457", nationalId: "025080001305", hire: "2019-08-15", type: "FULL_TIME", username: "190815081" },
        { code: "EMP-074", name: "Đặng Văn Hải", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1995-12-10", phone: "0910123458", nationalId: "025080001306", hire: "2020-05-01", type: "FULL_TIME", username: "200501082" },
        { code: "EMP-075", name: "Hoàng Thị Ngọc Linh", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1997-06-28", phone: "0910123459", nationalId: "025080001307", hire: "2021-10-01", type: "FULL_TIME", username: "211001083" },
        { code: "EMP-076", name: "Lê Văn Bình", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1994-04-15", phone: "0910123460", nationalId: "025080001308", hire: "2020-03-20", type: "FULL_TIME", username: "200320084" },
        { code: "EMP-077", name: "Trịnh Thị Hồng Phượng", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1996-10-02", phone: "0910123461", nationalId: "025080001309", hire: "2021-05-15", type: "FULL_TIME", username: "210515085" },
        { code: "EMP-078", name: "Ngô Văn Thắng", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1993-01-18", phone: "0910123462", nationalId: "025080001310", hire: "2019-10-01", type: "FULL_TIME", username: "191001086" },
        { code: "EMP-079", name: "Phan Thị Thanh Hà", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1998-07-11", phone: "0910123463", nationalId: "025080001311", hire: "2022-06-20", type: "FULL_TIME", username: "220620087" },
        { code: "EMP-080", name: "Cao Hoàng Long", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1995-02-25", phone: "0910123464", nationalId: "025080001312", hire: "2020-11-01", type: "FULL_TIME", username: "201101088" },
        { code: "EMP-081", name: "Trần Thị Mỹ Duyên", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1999-08-06", phone: "0910123465", nationalId: "025080001313", hire: "2023-02-15", type: "FULL_TIME", username: "230215089" },
        { code: "EMP-082", name: "Phạm Văn Phong", gender: "MALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1992-11-30", phone: "0910123466", nationalId: "025080001314", hire: "2019-06-01", type: "FULL_TIME", username: "190601090" },
        // ── IT ───────────────────────────────────────────────────
        { code: "EMP-083", name: "Lê Văn Thành", gender: "MALE", dept: "IT", pos: "POS-IT-ADMIN", role: "IT_ADMIN", dob: "1987-05-14", phone: "0911123456", nationalId: "025080001315", hire: "2017-04-01", type: "PERMANENT", username: "170401091" },
        { code: "EMP-084", name: "Nguyễn Thị Thu Trang", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1994-10-28", phone: "0911123457", nationalId: "025080001316", hire: "2020-02-15", type: "FULL_TIME", username: "200215092" },
        { code: "EMP-085", name: "Phạm Văn Duy", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1996-03-17", phone: "0911123458", nationalId: "025080001317", hire: "2020-08-01", type: "FULL_TIME", username: "200801093" },
        { code: "EMP-086", name: "Vũ Thị Lan Chi", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1998-09-05", phone: "0911123459", nationalId: "025080001318", hire: "2022-01-20", type: "FULL_TIME", username: "220120094" },
        { code: "EMP-087", name: "Đặng Hoàng Nam", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1993-07-23", phone: "0911123460", nationalId: "025080001319", hire: "2019-12-01", type: "FULL_TIME", username: "191201095" },
        { code: "EMP-088", name: "Hoàng Văn Đức", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1995-01-09", phone: "0911123461", nationalId: "025080001320", hire: "2020-10-15", type: "FULL_TIME", username: "201015096" },
        { code: "EMP-089", name: "Lê Thị Hồng Nhung", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1997-06-20", phone: "0911123462", nationalId: "025080001321", hire: "2021-07-01", type: "FULL_TIME", username: "210701097" },
        { code: "EMP-090", name: "Trần Văn Khoa", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1994-12-12", phone: "0911123463", nationalId: "025080001322", hire: "2020-04-01", type: "FULL_TIME", username: "200401098" },
        { code: "EMP-091", name: "Phạm Thị Thanh Thảo", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1999-04-07", phone: "0911123464", nationalId: "025080001323", hire: "2023-01-10", type: "FULL_TIME", username: "230110099" },
        { code: "EMP-092", name: "Vũ Hoàng Sơn", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1996-08-30", phone: "0911123465", nationalId: "025080001324", hire: "2021-09-15", type: "FULL_TIME", username: "210915100" },
        { code: "EMP-093", name: "Nguyễn Thị Kim Oanh", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1992-02-14", phone: "0911123466", nationalId: "025080001325", hire: "2019-05-01", type: "FULL_TIME", username: "190501101" },
        { code: "EMP-094", name: "Lê Văn Trung", gender: "MALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1998-11-25", phone: "0911123467", nationalId: "025080001326", hire: "2022-05-01", type: "FULL_TIME", username: "220501102" },
        { code: "EMP-095", name: "Trịnh Thị Thu Hằng", gender: "FEMALE", dept: "IT", pos: "POS-IT-STAFF", role: "EMPLOYEE", dob: "1995-07-08", phone: "0911123468", nationalId: "025080001327", hire: "2020-11-20", type: "FULL_TIME", username: "201120103" },
        // ── Extra ────────────────────────────────────────────────
        { code: "EMP-096", name: "Bùi Văn Mạnh", gender: "MALE", dept: "TECH-BE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1997-03-21", phone: "0912123456", nationalId: "025080001328", hire: "2022-02-01", type: "FULL_TIME", username: "220201104" },
        { code: "EMP-097", name: "Phan Thị Lan Hương", gender: "FEMALE", dept: "SALES", pos: "POS-SALES-STAFF", role: "EMPLOYEE", dob: "1996-09-14", phone: "0912123457", nationalId: "025080001329", hire: "2021-11-01", type: "FULL_TIME", username: "211101105" },
        { code: "EMP-098", name: "Cao Thị Thu Hà", gender: "FEMALE", dept: "MKT", pos: "POS-MKT-STAFF", role: "EMPLOYEE", dob: "1994-05-28", phone: "0912123458", nationalId: "025080001330", hire: "2020-06-15", type: "FULL_TIME", username: "200615106" },
        { code: "EMP-099", name: "Ngô Văn Hoàng", gender: "MALE", dept: "TECH-FE", pos: "POS-TECH-DEV", role: "EMPLOYEE", dob: "1998-01-17", phone: "0912123459", nationalId: "025080001331", hire: "2022-10-01", type: "FULL_TIME", username: "221001107" },
        { code: "EMP-100", name: "Trần Thị Mỹ Linh", gender: "FEMALE", dept: "HR", pos: "POS-HR-STAFF", role: "HR_STAFF", dob: "1999-10-05", phone: "0912123460", nationalId: "025080001332", hire: "2023-04-01", type: "FULL_TIME", username: "230401108" },
    ];

    // Xác định manager cho từng nhân viên
    const managerIdMap: Record<string, string> = {};

    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
        const userId = await createEmployeeAccount(emp, deptMap, posMap, posSalaryMap, contractTypeMap, managerIdMap);
        if (userId) {
            // Map username -> userId để làm manager cho nhân viên sau
            managerIdMap[emp.username] = userId;
            created++;
        } else {
            skipped++;
        }
        if (created % 20 === 0) console.log(`   📊 Đã tạo ${created} nhân viên...`);
    }
    console.log(`   ✅ Đã tạo ${created} nhân viên, ${skipped} bỏ qua (đã tồn tại)\n`);

    // ── 13. Shift Assignments ─────────────────────────────────────
    console.log("🕐 Đang seed shift assignments...");
    const defaultShift = await prisma.shift.findFirst({ where: { isDefault: true } });
    if (defaultShift) {
        const users = await prisma.user.findMany({ where: { employeeStatus: "ACTIVE" } });
        let shiftAssigned = 0;
        for (const user of users) {
            if (!user.hireDate) continue;
            try {
                await prisma.shiftAssignment.upsert({
                    where: { id: `${user.id}-default` },
                    update: {},
                    create: { id: `${user.id}-default`, userId: user.id, shiftId: defaultShift.id, startDate: user.hireDate },
                });
                shiftAssigned++;
            } catch (e) {
                console.warn(`   ⚠️  Lỗi shift assignment cho user ${user.id}:`, e);
            }
        }
        console.log(`   ✅ Đã gán ca làm việc cho ${shiftAssigned} nhân viên\n`);
    }

    // ── 14. Onboarding Templates ─────────────────────────────────
    console.log("🎯 Đang seed onboarding template...");
    if (!await prisma.onboardingTemplate.findFirst({ where: { name: "Template Tiếp nhận Chuẩn" } })) {
        await prisma.onboardingTemplate.create({
            data: {
                name: "Template Tiếp nhận Chuẩn",
                description: "Template mặc định cho quy trình tiếp nhận nhân viên mới",
                isActive: true,
                tasks: {
                    create: [
                        { title: "Cấp laptop/thiết bị", description: "Chuẩn bị và cấp laptop, chuột, bàn phím", category: "EQUIPMENT", assigneeRole: "IT_ADMIN", dueDays: 1, sortOrder: 1, isRequired: true },
                        { title: "Tạo email và mã nhân viên", description: "Tạo tài khoản email và mã nhân viên", category: "ACCOUNT", assigneeRole: "IT_ADMIN", dueDays: 1, sortOrder: 2, isRequired: true },
                        { title: "Cấp thẻ ra vào", description: "Làm thẻ ra vào văn phòng", category: "EQUIPMENT", assigneeRole: "ADMIN", dueDays: 1, sortOrder: 3, isRequired: true },
                        { title: "Cấp phát chỗ ngồi", description: "Sắp xếp bàn làm việc", category: "EQUIPMENT", assigneeRole: "ADMIN", dueDays: 1, sortOrder: 4, isRequired: true },
                        { title: "Setup tài khoản hệ thống", description: "Cấp quyền truy cập HRM, email, Slack...", category: "ACCOUNT", assigneeRole: "IT_ADMIN", dueDays: 1, sortOrder: 5, isRequired: true },
                        { title: "Đào tạo văn hóa công ty", description: "Giới thiệu về công ty, quy định, quy chế", category: "TRAINING", assigneeRole: "HR", dueDays: 3, sortOrder: 6, isRequired: true },
                        { title: "Đào tạo quy trình làm việc", description: "Hướng dẫn SOP của phòng ban", category: "TRAINING", assigneeRole: "HR", dueDays: 5, sortOrder: 7, isRequired: true },
                        { title: "Onboard với team", description: "Giới thiệu team, phân công công việc", category: "GENERAL", assigneeRole: "DEPT_MANAGER", dueDays: 3, sortOrder: 8, isRequired: true },
                        { title: "Cung cấp tài liệu", description: "Gửi handbook nhân viên, nội quy", category: "DOCUMENTS", assigneeRole: "HR", dueDays: 1, sortOrder: 9, isRequired: true },
                        { title: "Setup BHXH, thuế", description: "Hoàn tất thủ tục BHXH, thuế TNCN", category: "DOCUMENTS", assigneeRole: "HR", dueDays: 5, sortOrder: 10, isRequired: true },
                    ],
                },
            },
        });
        console.log(`   ✅ Đã tạo onboarding template với 10 tasks\n`);
    } else {
        console.log("   ⏭️  Onboarding template đã tồn tại\n");
    }

    // ── 15. Payroll Config ───────────────────────────────────────
    console.log("⚙️ Đang seed payroll configs...");
    const payrollConfigDefs = [
        { key: "SOCIAL_INSURANCE_RATE", value: 0.08, desc: "Tỷ lệ BHXH NLĐ (8%)" },
        { key: "HEALTH_INSURANCE_RATE", value: 0.015, desc: "Tỷ lệ BHYT NLĐ (1.5%)" },
        { key: "UNEMPLOYMENT_INSURANCE_RATE", value: 0.01, desc: "Tỷ lệ BHTN NLĐ (1%)" },
        { key: "SOCIAL_INSURANCE_EMPLOYER_RATE", value: 0.175, desc: "Tỷ lệ BHXH DN (17.5%)" },
        { key: "HEALTH_INSURANCE_EMPLOYER_RATE", value: 0.03, desc: "Tỷ lệ BHYT DN (3%)" },
        { key: "UNEMPLOYMENT_INSURANCE_EMPLOYER_RATE", value: 0.01, desc: "Tỷ lệ BHTN DN (1%)" },
        { key: "PERSONAL_DEDUCTION", value: 11_000_000, desc: "Giảm trừ bản thân/tháng" },
        { key: "DEPENDENT_DEDUCTION", value: 4_400_000, desc: "Giảm trừ người phụ thuộc/tháng" },
        { key: "OVERTIME_RATE", value: 1.5, desc: "Hệ số tăng ca ngày thường" },
        { key: "OVERTIME_WEEKEND_RATE", value: 2.0, desc: "Hệ số tăng ca cuối tuần" },
        { key: "OVERTIME_HOLIDAY_RATE", value: 3.0, desc: "Hệ số tăng ca ngày lễ" },
        { key: "MIN_SALARY_REGION_1", value: 4_960_000, desc: "Lương tối thiểu vùng I" },
        { key: "MIN_SALARY_REGION_2", value: 4_410_000, desc: "Lương tối thiểu vùng II" },
        { key: "MIN_SALARY_REGION_3", value: 3_860_000, desc: "Lương tối thiểu vùng III" },
        { key: "MIN_SALARY_REGION_4", value: 3_450_000, desc: "Lương tối thiểu vùng IV" },
    ];
    for (const cfg of payrollConfigDefs) {
        const existing = await prisma.payrollConfig.findUnique({ where: { key: cfg.key } });
        if (!existing) {
            await prisma.payrollConfig.create({ data: { key: cfg.key, value: cfg.value, description: cfg.desc, isActive: true, effectiveDate: new Date("2024-07-01") } });
            console.log(`   ✅ ${cfg.key} = ${cfg.value}`);
        } else {
            console.log(`   ⏭️  ${cfg.key}`);
        }
    }
    console.log("");

    // ── 16. Insurance Caps ───────────────────────────────────────
    console.log("🏥 Đang seed insurance caps...");
    const insuranceCaps = [
        { year: 2024, type: "SOCIAL", min: 1_490_000, max: 29_900_000 },
        { year: 2024, type: "HEALTH", min: 1_490_000, max: 44_790_000 },
        { year: 2024, type: "UNEMPLOYMENT", min: 1_490_000, max: 44_790_000 },
        { year: 2025, type: "SOCIAL", min: 1_740_000, max: 33_210_000 },
        { year: 2025, type: "HEALTH", min: 1_740_000, max: 49_815_000 },
        { year: 2025, type: "UNEMPLOYMENT", min: 1_740_000, max: 49_815_000 },
        { year: 2026, type: "SOCIAL", min: 2_024_000, max: 38_670_000 },
        { year: 2026, type: "HEALTH", min: 2_024_000, max: 58_005_000 },
        { year: 2026, type: "UNEMPLOYMENT", min: 2_024_000, max: 58_005_000 },
    ];
    for (const cap of insuranceCaps) {
        const existing = await prisma.insuranceCap.findFirst({ where: { year: cap.year, insuranceType: cap.type, region: "ALL" } });
        if (!existing) {
            await prisma.insuranceCap.create({ data: { year: cap.year, insuranceType: cap.type, minSalary: cap.min, maxSalary: cap.max, region: "ALL", isActive: true } });
            console.log(`   ✅ ${cap.year} | ${cap.type} | ${cap.min.toLocaleString()} - ${cap.max.toLocaleString()}`);
        } else {
            console.log(`   ⏭️  ${cap.year} | ${cap.type}`);
        }
    }
    console.log("");

    // ── 17. Standard Work Days ───────────────────────────────────
    console.log("📅 Đang seed standard work days...");
    for (const year of [2025, 2026]) {
        for (let month = 1; month <= 12; month++) {
            const existing = await prisma.standardWorkDays.findUnique({ where: { year_month: { year, month } } });
            if (!existing) {
                const lastDay = new Date(year, month, 0).getDate();
                let workDays = 0;
                for (let d = 1; d <= lastDay; d++) {
                    const dow = new Date(year, month - 1, d).getDay();
                    if (dow !== 0 && dow !== 6) workDays++;
                }
                if (year === 2026 && month === 2) workDays = 8;
                await prisma.standardWorkDays.create({ data: { year, month, workDays, workHours: workDays * 8 } });
            }
        }
    }
    console.log(`   ✅ Đã seed ngày làm việc chuẩn cho 2025 & 2026\n`);

    // ── 18. Payroll Formulas ─────────────────────────────────────
    console.log("🧮 Đang seed payroll formulas...");
    const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); };

    // Attendance Summaries cho 3 tháng gần nhất
    console.log("📊 Đang seed attendance summaries...");
    const now = new Date();
    const attendanceMonths = [
        { year: now.getFullYear(), month: now.getMonth() + 1 },
        { year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth() },
        { year: now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear(), month: now.getMonth() <= 1 ? 11 : now.getMonth() - 1 },
    ];
    const activeUsers = await prisma.user.findMany({ where: { employeeStatus: "ACTIVE" } });
    let summaryCount = 0;
    for (const { year, month } of attendanceMonths) {
        const stdDaysData = await prisma.standardWorkDays.findUnique({ where: { year_month: { year, month } } });
        const stdDays = stdDaysData?.workDays ?? 22;
        for (const user of activeUsers) {
            if (!await prisma.attendanceSummary.findFirst({ where: { userId: user.id, year, month } })) {
                const idx = hashStr(user.id + `${year}${month}`);
                const workDays = Math.round(stdDays * (0.85 + (idx % 15) / 100));
                await prisma.attendanceSummary.create({
                    data: {
                        userId: user.id, year, month, totalWorkDays: workDays,
                        totalWorkHours: workDays * 8, standardDays: stdDays,
                        lateDays: idx % 5, earlyLeaveDays: idx % 3,
                        otHoursWeekday: (idx % 10) * 2, otHoursWeekend: (idx % 5) * 4, totalOtHours: (idx % 15) * 2,
                    },
                });
                summaryCount++;
            }
        }
    }
    console.log(`   ✅ Đã seed attendance summaries: ${summaryCount} bản ghi\n`);

    // ── 19. Payroll Formulas ─────────────────────────────────────
    const formulas = [
        { code: "FORMULA_GROSS", name: "Tính lương Gross", type: "EARNING", cat: "GROSS", expr: "baseSalary + allowanceAmount + bonusAmount + overtimeAmount", priority: 1 },
        { code: "FORMULA_OT_WEEKDAY", name: "Tăng ca ngày thường", type: "EARNING", cat: "OVERTIME", expr: "(baseSalary / standardDays / 8) * overtimeHours * 1.5", priority: 10 },
        { code: "FORMULA_OT_WEEKEND", name: "Tăng ca cuối tuần", type: "EARNING", cat: "OVERTIME", expr: "(baseSalary / standardDays / 8) * overtimeHours * 2.0", priority: 11 },
        { code: "FORMULA_OT_HOLIDAY", name: "Tăng ca ngày lễ", type: "EARNING", cat: "OVERTIME", expr: "(baseSalary / standardDays / 8) * overtimeHours * 3.0", priority: 12 },
        { code: "FORMULA_BHXH", name: "Tính BHXH", type: "INSURANCE", cat: "SOCIAL", expr: "MIN(grossSalary, socialMax) * 0.08", priority: 20 },
        { code: "FORMULA_BHYT", name: "Tính BHYT", type: "INSURANCE", cat: "HEALTH", expr: "MIN(grossSalary, healthMax) * 0.015", priority: 21 },
        { code: "FORMULA_BHTN", name: "Tính BHTN", type: "INSURANCE", cat: "UNEMPLOYMENT", expr: "grossSalary * 0.01", priority: 22 },
        { code: "FORMULA_TAXABLE", name: "Thu nhập chịu thuế", type: "TAX", cat: "TAXABLE", expr: "grossSalary - totalInsurance - personalDeduction - dependentDeduction", priority: 30 },
        { code: "FORMULA_NET", name: "Tính lương Net", type: "NET", cat: "NET", expr: "grossSalary - totalInsurance - taxAmount - deductionAmount", priority: 100 },
    ];
    for (const f of formulas) {
        if (!await prisma.payrollFormula.findUnique({ where: { code: f.code } })) {
            await prisma.payrollFormula.create({
                data: { code: f.code, name: f.name, formulaType: f.type, category: f.cat, expression: f.expr, priority: f.priority, isSystem: true, isActive: true, effectiveDate: new Date("2024-01-01") },
            });
            console.log(`   ✅ ${f.name} (${f.code})`);
        } else {
            console.log(`   ⏭️  ${f.name}`);
        }
    }
    console.log("");

    // ── 20. Final Summary ────────────────────────────────────────
    console.log("\n" + "=".repeat(70));
    console.log("🎉 SEED HOÀN TẤT - TỔNG KẾT CUỐI CÙNG");
    console.log("=".repeat(70));
    console.log(`  👥 Users:                ${await prisma.user.count()}`);
    console.log(`  🏢 Departments:         ${await prisma.department.count()}`);
    console.log(`  💼 Positions:           ${await prisma.position.count()}`);
    console.log(`  📋 Leave Types:         ${await prisma.leaveType.count()}`);
    console.log(`  🎉 Holiday Calendars:   ${await prisma.holidayCalendar.count()}`);
    console.log(`  🚀 Onboarding Templates: ${await prisma.onboardingTemplate.count()}`);
    console.log(`  📄 Contracts:           ${await prisma.contract.count()}`);
    console.log(`  💰 Salaries:            ${await prisma.salary.count()}`);
    console.log(`  📊 Attendance Summaries: ${await prisma.attendanceSummary.count()}`);
    console.log(`  🧮 Payroll Formulas:     ${await prisma.payrollFormula.count()}`);
    console.log("=".repeat(70));

    console.log("\n📋 Thông tin đăng nhập demo:");
    console.log("(9 tài khoản demo đầu có mật khẩu riêng, các tài khoản còn lại dùng mật khẩu = username)");
    console.log("─".repeat(70));
    const demoAccounts = [
        { u: "260403001", e: "admin@company.vn", p: "Admin@123" },
        { u: "260403002", e: "director@company.vn", p: "Director@123" },
        { u: "260403003", e: "hr.manager@company.vn", p: "HrManager@123" },
        { u: "260403004", e: "hr.staff@company.vn", p: "HrStaff@123" },
        { u: "260403005", e: "dept.manager@company.vn", p: "DeptManager@123" },
        { u: "260403006", e: "team.leader@company.vn", p: "TeamLeader@123" },
        { u: "260403007", e: "employee@company.vn", p: "Employee@123" },
        { u: "260403008", e: "accountant@company.vn", p: "Accountant@123" },
        { u: "260403009", e: "it.admin@company.vn", p: "ItAdmin@123" },
    ];
    for (const acc of demoAccounts) {
        console.log(`  ${acc.u.padEnd(15)} | ${acc.e.padEnd(25)} | ${acc.p}`);
    }
    console.log("─".repeat(70));
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed thất bại:", err);
        process.exit(1);
    });

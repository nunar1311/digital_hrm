"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_1 = require("../generated/prisma/client");
var better_auth_1 = require("better-auth");
var prisma_1 = require("better-auth/adapters/prisma");
// ─── Setup Prisma + Auth standalone (no path aliases) ───
var connectionString = process.env.DATABASE_URL;
var adapter = new adapter_pg_1.PrismaPg({ connectionString: connectionString });
var prisma = new client_1.PrismaClient({ adapter: adapter });
var auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma, { provider: "postgresql" }),
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
var DEMO_USERS = [
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
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, DEMO_USERS_1, user, result, error_1, message, directorUser, hrManagerUser, deptManagerUser, accountantUser, itAdminUser, teamLeaderUser, bgd, departments, deptMap, _a, departments_1, dept, created, techSubDepts, _b, techSubDepts_1, dept, positions, _c, positions_1, pos, userDeptLinks, _d, userDeptLinks_1, link, dept, _e, DEMO_USERS_2, user;
        var _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log("🌱 Seeding demo users...\n");
                    _i = 0, DEMO_USERS_1 = DEMO_USERS;
                    _j.label = 1;
                case 1:
                    if (!(_i < DEMO_USERS_1.length)) return [3 /*break*/, 6];
                    user = DEMO_USERS_1[_i];
                    _j.label = 2;
                case 2:
                    _j.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, auth.api.signUpEmail({
                            body: {
                                name: user.name,
                                email: user.email,
                                password: user.password,
                                hrmRole: user.hrmRole,
                                employeeCode: user.employeeCode,
                                position: user.position,
                            },
                        })];
                case 3:
                    result = _j.sent();
                    if (result === null || result === void 0 ? void 0 : result.user) {
                        console.log("  \u2705 ".concat(user.hrmRole.padEnd(15), " | ").concat(user.email.padEnd(25), " | ").concat(user.name));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _j.sent();
                    message = error_1 instanceof Error
                        ? error_1.message
                        : String(error_1);
                    if (message.includes("already exists") ||
                        message.includes("unique constraint")) {
                        console.log("  \u23ED\uFE0F  ".concat(user.hrmRole.padEnd(15), " | ").concat(user.email.padEnd(25), " | \u0110\u00E3 t\u1ED3n t\u1EA1i"));
                    }
                    else {
                        console.error("  \u274C ".concat(user.hrmRole.padEnd(15), " | ").concat(user.email.padEnd(25), " | L\u1ED7i: ").concat(message));
                    }
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    // ─── Seed Departments ───
                    console.log("\n🏢 Seeding departments...\n");
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "director@company.vn" },
                        })];
                case 7:
                    directorUser = _j.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "hr.manager@company.vn" },
                        })];
                case 8:
                    hrManagerUser = _j.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "dept.manager@company.vn" },
                        })];
                case 9:
                    deptManagerUser = _j.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "accountant@company.vn" },
                        })];
                case 10:
                    accountantUser = _j.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "it.admin@company.vn" },
                        })];
                case 11:
                    itAdminUser = _j.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: "team.leader@company.vn" },
                        })];
                case 12:
                    teamLeaderUser = _j.sent();
                    return [4 /*yield*/, prisma.department.upsert({
                            where: { code: "BGD" },
                            update: {},
                            create: {
                                name: "Ban Giám đốc",
                                code: "BGD",
                                description: "Ban lãnh đạo công ty",
                                managerId: (_f = directorUser === null || directorUser === void 0 ? void 0 : directorUser.id) !== null && _f !== void 0 ? _f : null,
                                sortOrder: 0,
                            },
                        })];
                case 13:
                    bgd = _j.sent();
                    console.log("  ✅ Ban Giám đốc (BGD)");
                    departments = [
                        {
                            name: "Phòng Nhân sự",
                            code: "HR",
                            description: "Quản lý nhân sự và tuyển dụng",
                            managerId: hrManagerUser === null || hrManagerUser === void 0 ? void 0 : hrManagerUser.id,
                            sortOrder: 1,
                        },
                        {
                            name: "Phòng Kỹ thuật",
                            code: "TECH",
                            description: "Phát triển phần mềm và công nghệ",
                            managerId: deptManagerUser === null || deptManagerUser === void 0 ? void 0 : deptManagerUser.id,
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
                            managerId: accountantUser === null || accountantUser === void 0 ? void 0 : accountantUser.id,
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
                            managerId: itAdminUser === null || itAdminUser === void 0 ? void 0 : itAdminUser.id,
                            sortOrder: 6,
                        },
                    ];
                    deptMap = {};
                    _a = 0, departments_1 = departments;
                    _j.label = 14;
                case 14:
                    if (!(_a < departments_1.length)) return [3 /*break*/, 17];
                    dept = departments_1[_a];
                    return [4 /*yield*/, prisma.department.upsert({
                            where: { code: dept.code },
                            update: {},
                            create: {
                                name: dept.name,
                                code: dept.code,
                                description: dept.description,
                                parentId: bgd.id,
                                managerId: (_g = dept.managerId) !== null && _g !== void 0 ? _g : null,
                                sortOrder: dept.sortOrder,
                            },
                        })];
                case 15:
                    created = _j.sent();
                    deptMap[dept.code] = created.id;
                    console.log("  \u2705 ".concat(dept.name, " (").concat(dept.code, ")"));
                    _j.label = 16;
                case 16:
                    _a++;
                    return [3 /*break*/, 14];
                case 17:
                    techSubDepts = [
                        {
                            name: "Nhóm Frontend",
                            code: "TECH-FE",
                            description: "Phát triển giao diện người dùng",
                            managerId: teamLeaderUser === null || teamLeaderUser === void 0 ? void 0 : teamLeaderUser.id,
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
                    _b = 0, techSubDepts_1 = techSubDepts;
                    _j.label = 18;
                case 18:
                    if (!(_b < techSubDepts_1.length)) return [3 /*break*/, 21];
                    dept = techSubDepts_1[_b];
                    return [4 /*yield*/, prisma.department.upsert({
                            where: { code: dept.code },
                            update: {},
                            create: {
                                name: dept.name,
                                code: dept.code,
                                description: dept.description,
                                parentId: deptMap["TECH"],
                                managerId: (_h = dept.managerId) !== null && _h !== void 0 ? _h : null,
                                sortOrder: dept.sortOrder,
                            },
                        })];
                case 19:
                    _j.sent();
                    console.log("  \u2705   \u2514\u2500 ".concat(dept.name, " (").concat(dept.code, ")"));
                    _j.label = 20;
                case 20:
                    _b++;
                    return [3 /*break*/, 18];
                case 21:
                    // ─── Seed Positions ───
                    console.log("\n💼 Seeding positions...\n");
                    positions = [
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
                    _c = 0, positions_1 = positions;
                    _j.label = 22;
                case 22:
                    if (!(_c < positions_1.length)) return [3 /*break*/, 25];
                    pos = positions_1[_c];
                    return [4 /*yield*/, prisma.position.upsert({
                            where: { code: pos.code },
                            update: {},
                            create: {
                                name: pos.name,
                                code: pos.code,
                                departmentId: pos.departmentId,
                                level: pos.level,
                            },
                        })];
                case 23:
                    _j.sent();
                    console.log("  \u2705 ".concat(pos.name, " (").concat(pos.code, ")"));
                    _j.label = 24;
                case 24:
                    _c++;
                    return [3 /*break*/, 22];
                case 25:
                    // ─── Update user departmentId ───
                    console.log("\n🔗 Linking users to departments...\n");
                    userDeptLinks = [
                        { email: "director@company.vn", deptCode: "BGD" },
                        { email: "hr.manager@company.vn", deptCode: "HR" },
                        { email: "hr.staff@company.vn", deptCode: "HR" },
                        { email: "dept.manager@company.vn", deptCode: "TECH" },
                        { email: "team.leader@company.vn", deptCode: "TECH" },
                        { email: "employee@company.vn", deptCode: "TECH" },
                        { email: "accountant@company.vn", deptCode: "FIN" },
                        { email: "it.admin@company.vn", deptCode: "IT" },
                    ];
                    _d = 0, userDeptLinks_1 = userDeptLinks;
                    _j.label = 26;
                case 26:
                    if (!(_d < userDeptLinks_1.length)) return [3 /*break*/, 30];
                    link = userDeptLinks_1[_d];
                    return [4 /*yield*/, prisma.department.findUnique({
                            where: { code: link.deptCode },
                        })];
                case 27:
                    dept = _j.sent();
                    if (!dept) return [3 /*break*/, 29];
                    return [4 /*yield*/, prisma.user.updateMany({
                            where: { email: link.email },
                            data: { departmentId: dept.id },
                        })];
                case 28:
                    _j.sent();
                    console.log("  \u2705 ".concat(link.email, " \u2192 ").concat(link.deptCode));
                    _j.label = 29;
                case 29:
                    _d++;
                    return [3 /*break*/, 26];
                case 30:
                    console.log("\n🎉 Seed hoàn tất!");
                    console.log("\n📋 Thông tin đăng nhập:");
                    console.log("─".repeat(60));
                    for (_e = 0, DEMO_USERS_2 = DEMO_USERS; _e < DEMO_USERS_2.length; _e++) {
                        user = DEMO_USERS_2[_e];
                        console.log("  ".concat(user.email.padEnd(25), " | ").concat(user.password));
                    }
                    console.log("─".repeat(60));
                    return [2 /*return*/];
            }
        });
    });
}
seed()
    .then(function () { return process.exit(0); })
    .catch(function (err) {
    console.error("Seed thất bại:", err);
    process.exit(1);
});

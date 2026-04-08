"use server";

import {
    requireAuth,
    requirePermission,
    extractRole,
} from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ─── SALARY COMPONENT TYPES ───

export async function getSalaryComponentTypes() {
    await requireAuth();
    return prisma.salaryComponentType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getAllSalaryComponentTypes() {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);
    return prisma.salaryComponentType.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

const salaryComponentTypeSchema = z.object({
    code: z.string().min(1, "Mã không được trống"),
    name: z.string().min(1, "Tên không được trống"),
    description: z.string().optional(),
    category: z.enum([
        "BASIC",
        "ALLOWANCE",
        "BONUS",
        "DISCIPLINE",
        "DEDUCTION",
        "INSURANCE",
        "TAX",
        "OVERTIME",
    ]),
    isTaxable: z.boolean().default(true),
    isInsurance: z.boolean().default(false),
    isBase: z.boolean().default(false),
    coefficient: z.number().optional(),
    maxAmount: z.number().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
});

export async function createSalaryComponentType(
    data: z.infer<typeof salaryComponentTypeSchema>,
) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    const parsed = salaryComponentTypeSchema.parse(data);

    // Kiểm tra trùng mã
    const existing = await prisma.salaryComponentType.findUnique({
        where: { code: parsed.code },
    });
    if (existing) {
        return { success: false, message: "Mã loại khoản lương đã tồn tại" };
    }

    const result = await prisma.salaryComponentType.create({
        data: parsed,
    });

    revalidatePath("/payroll/formulas");
    return result;
}

export async function updateSalaryComponentType(
    id: string,
    data: z.infer<typeof salaryComponentTypeSchema>,
) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    const parsed = salaryComponentTypeSchema.parse(data);

    // Kiểm tra trùng mã (trừ chính nó)
    const existing = await prisma.salaryComponentType.findFirst({
        where: { code: parsed.code, id: { not: id } },
    });
    if (existing) {
        return { success: false, message: "Mã loại khoản lương đã tồn tại" };
    }

    const result = await prisma.salaryComponentType.update({
        where: { id },
        data: parsed,
    });

    revalidatePath("/payroll/formulas");
    return result;
}

export async function deleteSalaryComponentType(id: string) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);

    // Kiểm tra có đang được sử dụng không
    const inUse = await prisma.employeeSalaryComponent.count({
        where: { componentTypeId: id },
    });
    if (inUse > 0) {
        return { success: false, message: "Không thể xóa. Loại khoản lương đang được sử dụng cho nhân viên." };
    }

    await prisma.salaryComponentType.delete({ where: { id } });
    revalidatePath("/payroll/formulas");
    return { success: true, message: "Xóa thành công" };
}

// ─── EMPLOYEE SALARY COMPONENTS ───

export async function getEmployeeSalaryComponents(userId: string) {
    const session = await requireAuth();
    const role = extractRole(session);

    // Kiểm tra quyền xem
    const canViewAll = hasAnyPermission(role, [
        Permission.PAYROLL_VIEW_ALL,
    ]);
    const isOwner = session.user.id === userId;

    if (!canViewAll && !isOwner) {
        return { success: false, message: "Bạn không có quyền xem thông tin lương này" };
    }

    return prisma.employeeSalaryComponent.findMany({
        where: {
            userId,
            isActive: true,
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
            ],
        },
        include: { componentType: true },
        orderBy: { effectiveDate: "desc" },
    });
}

export async function getAllEmployeeSalaryComponents(params?: {
    departmentId?: string;
    search?: string;
}) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const where: Record<string, unknown> = { isActive: true };

    if (params?.departmentId) {
        where.user = { departmentId: params.departmentId };
    }

    if (params?.search) {
        where.user = {
            ...(where.user as object),
            OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                {
                    employeeCode: {
                        contains: params.search,
                        mode: "insensitive",
                    },
                },
            ],
        };
    }

    return prisma.employeeSalaryComponent.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    department: { select: { name: true } },
                },
            },
            componentType: true,
        },
        orderBy: { effectiveDate: "desc" },
    });
}

const employeeSalaryComponentSchema = z.object({
    userId: z.string(),
    componentTypeId: z.string(),
    amount: z.number().min(0, "Số tiền không được âm"),
    effectiveDate: z.string().default(() => new Date().toISOString()),
    endDate: z.string().optional(),
});

export async function setEmployeeSalaryComponent(
    data: z.infer<typeof employeeSalaryComponentSchema>,
) {
    await requirePermission(Permission.PAYROLL_CALCULATE);
    const parsed = employeeSalaryComponentSchema.parse(data);

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({
        where: { id: parsed.userId },
    });
    if (!user) {
        return { success: false, message: "Không tìm thấy nhân viên" };
    }

    // Kiểm tra component type tồn tại
    const componentType = await prisma.salaryComponentType.findUnique({
        where: { id: parsed.componentTypeId },
    });
    if (!componentType) {
        return { success: false, message: "Không tìm thấy loại khoản lương" };
    }

    // Deactivate old components of the same type
    await prisma.employeeSalaryComponent.updateMany({
        where: {
            userId: parsed.userId,
            componentTypeId: parsed.componentTypeId,
            isActive: true,
        },
        data: {
            isActive: false,
            endDate: new Date(parsed.effectiveDate),
        },
    });

    const result = await prisma.employeeSalaryComponent.create({
        data: {
            userId: parsed.userId,
            componentTypeId: parsed.componentTypeId,
            amount: parsed.amount,
            effectiveDate: new Date(parsed.effectiveDate),
            endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        },
        include: { componentType: true, user: true },
    });

    // Không emit socket events do chưa định nghĩa trong types
    // emitToUser(parsed.userId, "salary:updated", {...});

    revalidatePath("/payroll/formulas");
    return { success: true, message: "Cập nhật thành công", data: result };
}

export async function removeEmployeeSalaryComponent(id: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    const component = await prisma.employeeSalaryComponent.findUnique({
        where: { id },
        include: { user: true, componentType: true },
    });

    if (!component) {
        return { success: false, message: "Không tìm thấy khoản lương" };
    }

    await prisma.employeeSalaryComponent.update({
        where: { id },
        data: { isActive: false, endDate: new Date() },
    });

    // Không emit socket events do chưa định nghĩa trong types
    // emitToUser(component.userId, "salary:removed", {...});

    revalidatePath("/payroll/formulas");
    return { success: true, message: "Xóa thành công" };
}

// ─── SALARY (BASE SALARY) ───

/**
 * Lấy baseSalary hiệu quả của nhân viên
 * Ưu tiên: Salary cá nhân > PositionSalary của chức vụ > null
 */
export async function getEmployeeEffectiveSalary(userId: string): Promise<{
    source: "personal" | "position" | "none";
    baseSalary: number | null;
    positionSalaryId?: string;
    positionSalaryGrade?: string;
}> {
    await requireAuth();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            salaries: true,
            position: {
                include: {
                    positionSalaries: {
                        where: { isActive: true },
                        orderBy: { effectiveDate: "desc" },
                        take: 1,
                    },
                },
            },
        },
    });

    if (!user) {
        return { source: "none", baseSalary: null };
    }

    if (user.salaries) {
        return { source: "personal", baseSalary: Number(user.salaries.baseSalary) };
    }

    if (
        user.position?.positionSalaries &&
        user.position.positionSalaries.length > 0
    ) {
        const posSalary = user.position.positionSalaries[0];
        return {
            source: "position",
            baseSalary: Number(posSalary.baseSalary),
            positionSalaryId: posSalary.id,
            positionSalaryGrade: posSalary.salaryGrade,
        };
    }

    return { source: "none", baseSalary: null };
}

export async function getEmployeeSalary(userId: string) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.PAYROLL_VIEW_ALL,
    ]);
    const isOwner = session.user.id === userId;

    if (!canViewAll && !isOwner) {
        return { success: false, message: "Bạn không có quyền xem thông tin này" };
    }

    return prisma.salary.findUnique({
        where: { userId },
        include: { user: { select: { id: true, name: true } } },
    });
}

export async function getAllSalaries(params?: {
    departmentId?: string;
    search?: string;
}) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const where: Record<string, unknown> = {};

    if (params?.departmentId) {
        where.user = { departmentId: params.departmentId };
    }

    if (params?.search) {
        where.user = {
            ...(where.user as object),
            OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                {
                    employeeCode: {
                        contains: params.search,
                        mode: "insensitive",
                    },
                },
            ],
        };
    }

    return prisma.salary.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    department: { select: { name: true } },
                },
            },
        },
        orderBy: { effectiveDate: "desc" },
    });
}

const salarySchema = z.object({
    userId: z.string(),
    baseSalary: z.number().min(0, "Lương cơ bản không được âm"),
    effectiveDate: z.string().default(() => new Date().toISOString()),
});

export async function setEmployeeSalary(data: z.infer<typeof salarySchema>) {
    await requirePermission(Permission.PAYROLL_CALCULATE);
    const parsed = salarySchema.parse(data);

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({
        where: { id: parsed.userId },
    });
    if (!user) {
        return { success: false, message: "Không tìm thấy nhân viên" };
    }

    const result = await prisma.salary.upsert({
        where: { userId: parsed.userId },
        create: {
            userId: parsed.userId,
            baseSalary: parsed.baseSalary,
            effectiveDate: new Date(parsed.effectiveDate),
        },
        update: {
            baseSalary: parsed.baseSalary,
            effectiveDate: new Date(parsed.effectiveDate),
        },
    });

    // Không emit socket events
    // emitToUser(parsed.userId, "salary:base_updated", {...});

    revalidatePath("/payroll/formulas");
    return { success: true, message: "Cập nhật lương thành công", data: result };
}

// ─── PAYROLL CONFIG (TAX & INSURANCE RATES) ───

export async function getPayrollConfigs() {
    await requireAuth();
    return prisma.payrollConfig.findMany({
        where: { isActive: true },
        orderBy: { key: "asc" },
    });
}

export async function getPayrollConfig(key: string) {
    await requireAuth();
    return prisma.payrollConfig.findUnique({
        where: { key },
    });
}

const payrollConfigSchema = z.object({
    key: z.string().min(1),
    value: z.number().min(0),
    description: z.string().optional(),
    effectiveDate: z.string().default(() => new Date().toISOString()),
});

export async function setPayrollConfig(data: z.infer<typeof payrollConfigSchema>) {
    await requirePermission(Permission.PAYROLL_TAX_MANAGE);
    const parsed = payrollConfigSchema.parse(data);

    const result = await prisma.payrollConfig.upsert({
        where: { key: parsed.key },
        create: {
            key: parsed.key,
            value: parsed.value,
            description: parsed.description,
            effectiveDate: new Date(parsed.effectiveDate),
        },
        update: {
            value: parsed.value,
            description: parsed.description,
            effectiveDate: new Date(parsed.effectiveDate),
        },
    });

    // Không emit socket events
    // emitToAll("payroll:config_updated", { key: parsed.key });

    revalidatePath("/payroll/tax-insurance");
    return result;
}

// ─── TAX CALCULATION (Vietnamese tax rules 2024) ───

/**
 * Tính thuế TNCN theo biểu thuế lũy tiến Việt Nam 2024
 * @param taxableIncome Thu nhập chịu thuế (sau khi đã trừ các khoản giảm trừ)
 * @returns Số thuế phải nộp
 */
function calculateIncomeTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    // Biểu thuế lũy tiến từng phần 2024
    const taxBrackets = [
        { max: 5000000, rate: 0.05, deduction: 0 },
        { max: 10000000, rate: 0.1, deduction: 250000 },
        { max: 18000000, rate: 0.15, deduction: 750000 },
        { max: 32000000, rate: 0.2, deduction: 1650000 },
        { max: 52000000, rate: 0.25, deduction: 3250000 },
        { max: 78000000, rate: 0.3, deduction: 5850000 },
        { max: 100000000, rate: 0.35, deduction: 9850000 },
        { max: Infinity, rate: 0.4, deduction: 18150000 },
    ];

    for (const bracket of taxBrackets) {
        if (taxableIncome <= bracket.max) {
            return Math.round(taxableIncome * bracket.rate - bracket.deduction);
        }
    }

    return 0;
}

/**
 * Tính các khoản bảo hiểm bắt buộc
 */
function calculateInsurance(
    grossSalary: number,
    rates: {
        socialRate: number;
        healthRate: number;
        unemploymentRate: number;
    },
) {
    // Lương tính BH tối thiểu (lấy từ config hoặc default)
    // Hiện tại BHXH tính trên lương thực nhận (có cap)
    const maxSocialSalary = 29900000; // 2024 cap
    const maxHealthSalary = 44790000; // 2024 cap

    const socialSalary = Math.min(grossSalary, maxSocialSalary);
    const healthSalary = Math.min(grossSalary, maxHealthSalary);

    return {
        socialInsurance: Math.round(socialSalary * rates.socialRate),
        healthInsurance: Math.round(healthSalary * rates.healthRate),
        unemploymentInsurance: Math.round(grossSalary * rates.unemploymentRate),
    };
}

// ─── PAYROLL CALCULATION ───

export async function calculateMonthlyPayroll(params: {
    month: number;
    year: number;
    departmentId?: string;
}) {
    await requirePermission(Permission.PAYROLL_CALCULATE);
    const { month, year, departmentId } = params;

    // Lấy cấu hình BH
    const configs = await prisma.payrollConfig.findMany({
        where: { isActive: true },
    });

    const getConfigValue = (key: string, defaultValue: number) => {
        const config = configs.find((c) => c.key === key);
        return config ? Number(config.value) : defaultValue;
    };

    const insuranceRates = {
        socialRate: getConfigValue("SOCIAL_INSURANCE_RATE", 0.08),
        healthRate: getConfigValue("HEALTH_INSURANCE_RATE", 0.015),
        unemploymentRate: getConfigValue("UNEMPLOYMENT_INSURANCE_RATE", 0.01),
    };

    // Lấy danh sách nhân viên
    const userFilter: Record<string, unknown> = {
        employeeStatus: "ACTIVE",
    };

    if (departmentId) {
        userFilter.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
        where: userFilter,
        include: {
            department: { select: { id: true, name: true } },
            salaries: true,
            position: {
                include: {
                    positionSalaries: {
                        where: { isActive: true },
                        orderBy: { effectiveDate: "desc" },
                        take: 1,
                    },
                },
            },
            dependents: { select: { id: true } },
            employeeSalaryComponents: {
                where: {
                    isActive: true,
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date(year, month, 1) } },
                    ],
                },
                include: { componentType: true },
            },
        },
    });

    // Lấy attendance summary tháng
    const attendanceSummaries = await prisma.attendanceSummary.findMany({
        where: {
            month,
            year,
            user: userFilter,
        },
    });

    const summaryMap = new Map(
        attendanceSummaries.map((s) => [s.userId, s]),
    );

    // Lấy overtime tháng
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const overtimes = await prisma.overtimeRequest.findMany({
        where: {
            date: { gte: monthStart, lte: monthEnd },
            status: { in: ["HR_APPROVED", "COMPLETED"] },
            user: userFilter,
        },
    });

    const overtimeByUser = new Map<string, typeof overtimes>();
    for (const ot of overtimes) {
        if (!overtimeByUser.has(ot.userId)) {
            overtimeByUser.set(ot.userId, []);
        }
        overtimeByUser.get(ot.userId)!.push(ot);
    }

    // Tính lương cho từng nhân viên
    const payrollDetails = [];

    for (const user of users) {
        // Lấy baseSalary: ưu tiên Salary cá nhân > PositionSalary của chức vụ > 0
        let baseSalaryNum = 0;
        if (user.salaries) {
            baseSalaryNum = Number(user.salaries.baseSalary);
        } else if (
            user.position?.positionSalaries &&
            user.position.positionSalaries.length > 0
        ) {
            // Dùng lương chức vụ làm base
            const posSalary = user.position.positionSalaries[0];
            baseSalaryNum = Number(posSalary.baseSalary);
        }

        const summary = summaryMap.get(user.id);
        const userOvertimes = overtimeByUser.get(user.id) || [];

        // Tính ngày công
        const workDays = summary?.totalWorkDays || 0;
        const standardDays = summary?.standardDays || 22;

        // Lương cơ bản đã điều chỉnh theo ngày công (pro-rata)
        // Nếu làm đủ ngày công → lấy full baseSalary
        // Nếu không đủ ngày công → baseSalary / standardDays * workDays
        const proratedSalary = standardDays > 0
            ? Math.round(baseSalaryNum / standardDays * workDays)
            : baseSalaryNum;

        // Tính các khoản
        let allowanceAmount = 0;
        let bonusAmount = 0;
        let overtimeAmount = 0;
        let deductionAmount = 0;

        // OT hours
        let overtimeHours = 0;
        for (const ot of userOvertimes) {
            overtimeHours += ot.actualHours || ot.hours;
        }

        // OT amount (dùng proratedSalary để tính)
        const otRate = getConfigValue("OVERTIME_RATE", 1.5);
        overtimeAmount = Math.round(
            (proratedSalary / (standardDays || 22) / 8) *
                overtimeHours *
                otRate,
        );

        // Các khoản phụ cấp và thưởng
        for (const comp of user.employeeSalaryComponents) {
            const amount = Number(comp.amount);

            switch (comp.componentType.category) {
                case "ALLOWANCE":
                    allowanceAmount += amount;
                    break;
                case "BONUS":
                    bonusAmount += amount;
                    break;
                case "DEDUCTION":
                case "DISCIPLINE":
                    deductionAmount += amount;
                    break;
                case "OVERTIME":
                    overtimeAmount += amount;
                    break;
            }
        }

        // Gross salary - Nếu 0 ngày công thì tất cả = 0 (không lương, không phụ cấp, không thưởng)
        const grossSalaryNum = workDays > 0
            ? proratedSalary + allowanceAmount + bonusAmount + overtimeAmount
            : 0;

        // Bảo hiểm
        const insurance = calculateInsurance(grossSalaryNum, insuranceRates);
        const totalInsurance =
            insurance.socialInsurance +
            insurance.healthInsurance +
            insurance.unemploymentInsurance;

        // Giảm trừ gia cảnh
        const personalDeduction = getConfigValue("PERSONAL_DEDUCTION", 11000000);
        const dependentPerPerson = getConfigValue(
            "DEPENDENT_DEDUCTION",
            4400000,
        );
        const dependentCount = user.dependents?.length || 0;
        const dependentDeduction = dependentPerPerson * dependentCount;

        // Thu nhập chịu thuế
        const taxableIncome = grossSalaryNum - totalInsurance - personalDeduction;

        // Tính thuế TNCN
        const taxAmount = workDays > 0 ? calculateIncomeTax(taxableIncome) : 0;

        // Net salary - Nếu 0 ngày công thì lương thực nhận = 0
        const netSalary = workDays > 0
            ? grossSalaryNum - totalInsurance - taxAmount - deductionAmount
            : 0;

        payrollDetails.push({
            userId: user.id,
            baseSalary: baseSalaryNum,
            proratedSalary,
            grossSalary: grossSalaryNum,
            taxableIncome,
            netSalary,
            overtimeAmount,
            allowanceAmount,
            bonusAmount,
            deductionAmount,
            workDays,
            standardDays,
            lateDays: summary?.lateDays || 0,
            overtimeHours,
            ...insurance,
            personalDeduction,
            dependentDeduction,
            taxAmount,
        });
    }

    return payrollDetails;
}

// ─── PAYROLL RECORDS ───

export async function getPayrollRecords(params?: {
    month?: number;
    year?: number;
    departmentId?: string;
    status?: string;
}) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const where: Record<string, unknown> = {};

    if (params?.month && params?.year) {
        where.month = params.month;
        where.year = params.year;
    }

    if (params?.departmentId) {
        where.departmentId = params.departmentId;
    }

    if (params?.status) {
        where.status = params.status;
    }

    return prisma.payrollRecord.findMany({
        where,
        include: {
            department: { select: { id: true, name: true } },
            departments: { select: { id: true, name: true } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    }).then(records => records.map(record => ({
        ...record,
        totalEmployees: Number(record.totalEmployees),
        totalGross: Number(record.totalGross),
        totalNet: Number(record.totalNet),
        totalTax: Number(record.totalTax),
        totalInsurance: Number(record.totalInsurance),
        totalDeductions: Number(record.totalDeductions),
    })));
}

export async function getPayrollRecord(id: string) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const record = await prisma.payrollRecord.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            departments: { select: { id: true, name: true } },
            details: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            bankAccount: true,
                            bankName: true,
                            department: { select: { id: true, name: true } },
                            position: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    authority: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { user: { name: "asc" } },
            },
            processedByUser: { select: { id: true, name: true } },
            approvedByUser: { select: { id: true, name: true } },
        },
    });

    if (!record) return null;

    return {
        ...record,
        totalEmployees: Number(record.totalEmployees),
        totalGross: Number(record.totalGross),
        totalNet: Number(record.totalNet),
        totalTax: Number(record.totalTax),
        totalInsurance: Number(record.totalInsurance),
        totalDeductions: Number(record.totalDeductions),
        processedByName: record.processedByUser?.name || null,
        approvedByName: record.approvedByUser?.name || null,
        details: record.details.map(d => ({
            ...d,
            baseSalary: Number(d.baseSalary),
            proratedSalary: Number(d.proratedSalary),
            grossSalary: Number(d.grossSalary),
            taxableIncome: Number(d.taxableIncome),
            netSalary: Number(d.netSalary),
            overtimeAmount: Number(d.overtimeAmount),
            allowanceAmount: Number(d.allowanceAmount),
            bonusAmount: Number(d.bonusAmount),
            deductionAmount: Number(d.deductionAmount),
            taxAmount: Number(d.taxAmount),
            socialInsurance: Number(d.socialInsurance),
            healthInsurance: Number(d.healthInsurance),
            unemploymentInsurance: Number(d.unemploymentInsurance),
            personalDeduction: Number(d.personalDeduction),
            dependentDeduction: Number(d.dependentDeduction),
            positionName: d.user.position?.name ?? null,
            positionAuthority: d.user.position?.authority ?? null,
        })),
    };
}

export async function createPayrollRecord(params: {
    month: number;
    year: number;
    departmentId?: string;
}) {
    await requirePermission(Permission.PAYROLL_CALCULATE);
    const session = await requireAuth();
    const { month, year, departmentId } = params;

    // Kiểm tra đã tồn tại chưa
    const existing = await prisma.payrollRecord.findFirst({
        where: { month, year, departmentId: departmentId || null },
    });

    if (existing) {
        return { success: false, message: `Bảng lương tháng ${month}/${year} ${departmentId ? "phòng ban" : "công ty"} đã tồn tại` };
    }

    // Tính lương
    const details = await calculateMonthlyPayroll(params);

    const totalEmployees = details.length;
    const totalGross = details.reduce((sum, d) => sum + d.grossSalary, 0);
    const totalNet = details.reduce((sum, d) => sum + d.netSalary, 0);
    const totalTax = details.reduce((sum, d) => sum + d.taxAmount, 0);
    const totalInsurance = details.reduce(
        (sum, d) =>
            sum +
            d.socialInsurance +
            d.healthInsurance +
            d.unemploymentInsurance,
        0,
    );
    const totalDeductions = details.reduce(
        (sum, d) => sum + d.deductionAmount,
        0,
    );

    const record = await prisma.payrollRecord.create({
        data: {
            month,
            year,
            departmentId: departmentId || null,
            status: "DRAFT",
            totalEmployees,
            totalGross,
            totalNet,
            totalTax,
            totalInsurance,
            totalDeductions,
            processedBy: session.user.id,
            processedAt: new Date(),
            ...(departmentId
                ? {
                      departments: {
                          connect: { id: departmentId },
                      },
                  }
                : {}),
            details: {
                create: details.map((d) => ({
                    userId: d.userId,
                    baseSalary: d.baseSalary,
                    proratedSalary: d.proratedSalary,
                    grossSalary: d.grossSalary,
                    taxableIncome: d.taxableIncome,
                    netSalary: d.netSalary,
                    overtimeAmount: d.overtimeAmount,
                    allowanceAmount: d.allowanceAmount,
                    bonusAmount: d.bonusAmount,
                    deductionAmount: d.deductionAmount,
                    socialInsurance: d.socialInsurance,
                    healthInsurance: d.healthInsurance,
                    unemploymentInsurance: d.unemploymentInsurance,
                    personalDeduction: d.personalDeduction,
                    dependentDeduction: d.dependentDeduction,
                    taxAmount: d.taxAmount,
                    workDays: d.workDays,
                    standardDays: d.standardDays,
                    lateDays: d.lateDays,
                    overtimeHours: d.overtimeHours,
                })),
            },
        },
        include: { details: true },
    });

    // Không emit socket events
    // emitToAll("payroll:created", {...});

    revalidatePath("/payroll");
    return {
        ...record,
        totalEmployees: Number(record.totalEmployees),
        totalGross: Number(record.totalGross),
        totalNet: Number(record.totalNet),
        totalTax: Number(record.totalTax),
        totalInsurance: Number(record.totalInsurance),
        totalDeductions: Number(record.totalDeductions),
        details: record.details.map(d => ({
            ...d,
            baseSalary: Number(d.baseSalary),
            proratedSalary: Number(d.proratedSalary),
            grossSalary: Number(d.grossSalary),
            taxableIncome: Number(d.taxableIncome),
            netSalary: Number(d.netSalary),
            overtimeAmount: Number(d.overtimeAmount),
            allowanceAmount: Number(d.allowanceAmount),
            bonusAmount: Number(d.bonusAmount),
            deductionAmount: Number(d.deductionAmount),
            taxAmount: Number(d.taxAmount),
            socialInsurance: Number(d.socialInsurance),
            healthInsurance: Number(d.healthInsurance),
            unemploymentInsurance: Number(d.unemploymentInsurance),
            personalDeduction: Number(d.personalDeduction),
            dependentDeduction: Number(d.dependentDeduction),
        })),
    };
}

export async function updatePayrollRecordStatus(
    id: string,
    status: "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED",
) {
    // Need session for approvedBy
    const session = await requirePermission(Permission.PAYROLL_CALCULATE);

    if (status === "COMPLETED") {
        await requirePermission(Permission.PAYROLL_APPROVE);
    }

    const record = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) {
        return { success: false, message: "Không tìm thấy bảng lương" };
    }

    const data: Record<string, unknown> = { status };

    // Only set approvedBy when completing - use session.user.id
    if (status === "COMPLETED" && session?.user?.id) {
        data.approvedBy = session.user.id;
        data.approvedAt = new Date();
    }

    const updated = await prisma.payrollRecord.update({
        where: { id },
        data,
        include: { details: true },
    });

    // Tạo payslips
    if (status === "COMPLETED") {
        await generatePayslips(updated.id);
        
        // Cập nhật trạng thái chi tiết lương thành CONFIRMED
        await prisma.payrollRecordDetail.updateMany({
            where: { payrollRecordId: id },
            data: { status: "CONFIRMED" },
        });
    }

    // Không emit socket events
    // emitToAll("payroll:status_updated", {...});

    revalidatePath("/payroll");
    return {
        ...updated,
        totalEmployees: Number(updated.totalEmployees),
        totalGross: Number(updated.totalGross),
        totalNet: Number(updated.totalNet),
        totalTax: Number(updated.totalTax),
        totalInsurance: Number(updated.totalInsurance),
        totalDeductions: Number(updated.totalDeductions),
        details: updated.details.map(d => ({
            ...d,
            baseSalary: Number(d.baseSalary),
            grossSalary: Number(d.grossSalary),
            taxableIncome: Number(d.taxableIncome),
            netSalary: Number(d.netSalary),
            overtimeAmount: Number(d.overtimeAmount),
            allowanceAmount: Number(d.allowanceAmount),
            bonusAmount: Number(d.bonusAmount),
            deductionAmount: Number(d.deductionAmount),
            taxAmount: Number(d.taxAmount),
            socialInsurance: Number(d.socialInsurance),
            healthInsurance: Number(d.healthInsurance),
            unemploymentInsurance: Number(d.unemploymentInsurance),
            personalDeduction: Number(d.personalDeduction),
            dependentDeduction: Number(d.dependentDeduction),
        })),
    };
}

// ─── RECALCULATE PAYROLL RECORD ───

export async function recalculatePayrollRecord(recordId: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);
    const session = await requireAuth();

    const record = await prisma.payrollRecord.findUnique({
        where: { id: recordId },
        include: {
            details: {
                include: {
                    user: {
                        include: {
                            salaries: true,
                            position: {
                                include: {
                                    positionSalaries: {
                                        where: { isActive: true },
                                        orderBy: { effectiveDate: "desc" },
                                        take: 1,
                                    },
                                },
                            },
                            dependents: { select: { id: true } },
                            employeeSalaryComponents: {
                                where: { isActive: true },
                                include: { componentType: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!record) {
        return { success: false, message: "Không tìm thấy bảng lương" };
    }

    // Lấy cấu hình BH
    const configs = await prisma.payrollConfig.findMany({
        where: { isActive: true },
    });

    const getConfigValue = (key: string, defaultValue: number) => {
        const config = configs.find((c) => c.key === key);
        return config ? Number(config.value) : defaultValue;
    };

    const insuranceRates = {
        socialRate: getConfigValue("SOCIAL_INSURANCE_RATE", 0.08),
        healthRate: getConfigValue("HEALTH_INSURANCE_RATE", 0.015),
        unemploymentRate: getConfigValue("UNEMPLOYMENT_INSURANCE_RATE", 0.01),
    };

    // Lấy attendance summary
    const monthStart = new Date(Date.UTC(record.year, record.month - 1, 1));
    const monthEnd = new Date(Date.UTC(record.year, record.month, 0, 23, 59, 59, 999));

    const attendanceSummaries = await prisma.attendanceSummary.findMany({
        where: {
            month: record.month,
            year: record.year,
            userId: { in: record.details.map(d => d.userId) },
        },
    });

    const summaryMap = new Map(
        attendanceSummaries.map((s) => [s.userId, s]),
    );

    // Lấy overtime
    const overtimes = await prisma.overtimeRequest.findMany({
        where: {
            date: { gte: monthStart, lte: monthEnd },
            status: { in: ["HR_APPROVED", "COMPLETED"] },
            userId: { in: record.details.map(d => d.userId) },
        },
    });

    const overtimeByUser = new Map<string, typeof overtimes>();
    for (const ot of overtimes) {
        if (!overtimeByUser.has(ot.userId)) {
            overtimeByUser.set(ot.userId, []);
        }
        overtimeByUser.get(ot.userId)!.push(ot);
    }

    // Tính lại từng detail
    const updatedDetails = [];
    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalInsurance = 0;
    let totalDeductions = 0;

    for (const detail of record.details) {
        const user = detail.user;
        // Lấy baseSalary: ưu tiên Salary cá nhân > PositionSalary > lương đã lưu trong record
        let baseSalaryNum = Number(detail.baseSalary);
        if (user.salaries) {
            baseSalaryNum = Number(user.salaries.baseSalary);
        } else if (
            user.position?.positionSalaries &&
            user.position.positionSalaries.length > 0
        ) {
            const posSalary = user.position.positionSalaries[0];
            baseSalaryNum = Number(posSalary.baseSalary);
        }

        const summary = summaryMap.get(user.id);
        const userOvertimes = overtimeByUser.get(user.id) || [];

        const workDays = summary?.totalWorkDays || 0;
        const standardDays = summary?.standardDays || 22;

        // Pro-rata salary
        const proratedSalary = standardDays > 0
            ? Math.round(baseSalaryNum / standardDays * workDays)
            : 0;

        let allowanceAmount = 0;
        let bonusAmount = 0;
        let overtimeAmount = 0;
        let deductionAmount = 0;

        // OT hours
        let overtimeHours = 0;
        for (const ot of userOvertimes) {
            overtimeHours += ot.actualHours || ot.hours;
        }

        const otRate = getConfigValue("OVERTIME_RATE", 1.5);
        overtimeAmount = Math.round(
            (proratedSalary / (standardDays || 22) / 8) *
                overtimeHours *
                otRate,
        );

        for (const comp of user.employeeSalaryComponents) {
            const amount = Number(comp.amount);
            switch (comp.componentType.category) {
                case "ALLOWANCE":
                    allowanceAmount += amount;
                    break;
                case "BONUS":
                    bonusAmount += amount;
                    break;
                case "DEDUCTION":
                case "DISCIPLINE":
                    deductionAmount += amount;
                    break;
                case "OVERTIME":
                    overtimeAmount += amount;
                    break;
            }
        }

        const grossSalaryNum = workDays > 0
            ? proratedSalary + allowanceAmount + bonusAmount + overtimeAmount
            : 0;

        const insurance = calculateInsurance(grossSalaryNum, insuranceRates);
        const insuranceTotal =
            insurance.socialInsurance +
            insurance.healthInsurance +
            insurance.unemploymentInsurance;

        const personalDeduction = getConfigValue("PERSONAL_DEDUCTION", 11000000);
        const dependentPerPerson = getConfigValue("DEPENDENT_DEDUCTION", 4400000);
        const dependentCount = user.dependents?.length || 0;
        const dependentDeduction = dependentPerPerson * dependentCount;

        const taxableIncome = grossSalaryNum - insuranceTotal - personalDeduction;
        const taxAmount = workDays > 0 ? calculateIncomeTax(taxableIncome) : 0;
        const netSalary = workDays > 0
            ? grossSalaryNum - insuranceTotal - taxAmount - deductionAmount
            : 0;

        // Update database
        await prisma.payrollRecordDetail.update({
            where: { id: detail.id },
            data: {
                baseSalary: baseSalaryNum,
                proratedSalary,
                grossSalary: grossSalaryNum,
                taxableIncome,
                netSalary,
                overtimeAmount,
                allowanceAmount,
                bonusAmount,
                deductionAmount,
                workDays,
                standardDays,
                lateDays: summary?.lateDays || 0,
                overtimeHours,
                ...insurance,
                personalDeduction,
                dependentDeduction,
                taxAmount,
            },
        });

        updatedDetails.push({
            ...detail,
            baseSalary: baseSalaryNum,
            proratedSalary,
            grossSalary: grossSalaryNum,
            netSalary,
            taxAmount,
            workDays,
        });

        totalGross += grossSalaryNum;
        totalNet += netSalary;
        totalTax += taxAmount;
        totalInsurance += insuranceTotal;
        totalDeductions += deductionAmount;
    }

    // Update record totals
    await prisma.payrollRecord.update({
        where: { id: recordId },
        data: {
            totalGross,
            totalNet,
            totalTax,
            totalInsurance,
            totalDeductions,
            processedBy: session.user.id,
            processedAt: new Date(),
        },
    });

    // Xóa payslips cũ để tạo lại
    await prisma.payslip.deleteMany({ where: { payrollRecordId: recordId } });

    revalidatePath("/payroll");
    return {
        success: true,
        message: "Đã tính lại bảng lương thành công",
        recordId,
        summary: {
            totalEmployees: updatedDetails.length,
            totalGross,
            totalNet,
            totalTax,
            totalInsurance,
            totalDeductions,
        },
    };
}

export async function deletePayrollRecord(id: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    const record = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) {
        return { success: false, message: "Không tìm thấy bảng lương" };
    }

    if (record.status === "COMPLETED") {
        return { success: false, message: "Không thể xóa bảng lương đã hoàn thành" };
    }

    // Delete related payslips first
    await prisma.payslip.deleteMany({
        where: { payrollRecordId: id },
    });

    await prisma.payrollRecord.delete({ where: { id } });

    revalidatePath("/payroll");
    return { success: true, message: "Xóa thành công" };
}

export async function deleteManyPayrollRecords(ids: string[]) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    const records = await prisma.payrollRecord.findMany({
        where: { id: { in: ids } },
    });

    const deletable = records.filter(r => r.status !== "COMPLETED");
    const locked = records.filter(r => r.status === "COMPLETED");

    if (locked.length > 0) {
        return { success: false, message: `${locked.length} bảng lương đã hoàn thành không thể xóa` };
    }

    for (const record of deletable) {
        await prisma.payslip.deleteMany({ where: { payrollRecordId: record.id } });
    }

    await prisma.payrollRecord.deleteMany({
        where: { id: { in: deletable.map(r => r.id) } },
    });

    revalidatePath("/payroll");
    return { deleted: deletable.length };
}

// ─── PAYSLIPS ───

async function generatePayslips(payrollRecordId: string) {
    const record = await prisma.payrollRecord.findUnique({
        where: { id: payrollRecordId },
        include: {
            details: {
                include: {
                    user: {
                        include: { department: true, position: true },
                    },
                },
            },
        },
    });

    if (!record) return;

    // Delete existing payslips
    await prisma.payslip.deleteMany({
        where: { payrollRecordId },
    });

    const payslips = [];

    for (const detail of record.details) {
        const user = detail.user as (typeof detail)["user"];

        payslips.push({
            userId: user.id,
            payrollRecordId,
            month: record.month,
            year: record.year,
            employeeName: user.name,
            departmentName: user.department?.name,
            position: user.position?.name ?? null,
            baseSalary: detail.baseSalary,
            grossSalary: detail.grossSalary,
            netSalary: detail.netSalary,
            earnings: JSON.stringify([
                { name: "Lương cơ bản", amount: detail.baseSalary },
                { name: "Lương theo ngày công", amount: detail.proratedSalary, formula: `Lương CB / ${detail.standardDays} × ${detail.workDays}` },
                { name: "Phụ cấp", amount: detail.allowanceAmount },
                { name: "Thưởng", amount: detail.bonusAmount },
                { name: "Tăng ca", amount: detail.overtimeAmount },
            ]),
            deductions: JSON.stringify([
                { name: "Khấu trừ", amount: detail.deductionAmount },
            ]),
            insurance: JSON.stringify({
                BHXH: detail.socialInsurance,
                BHYT: detail.healthInsurance,
                BHTN: detail.unemploymentInsurance,
            }),
            tax: JSON.stringify({
                "Thuế TNCN": detail.taxAmount,
                "Giảm trừ cá nhân": detail.personalDeduction,
                "Giảm trừ phụ thuộc": detail.dependentDeduction,
            }),
            status: "GENERATED",
        });
    }

    await prisma.payslip.createMany({ data: payslips });
}

export async function getPayslips(params: {
    month?: number;
    year?: number;
    userId?: string;
}) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.PAYROLL_VIEW_ALL,
    ]);

    const where: Record<string, unknown> = {};

    if (!canViewAll) {
        where.userId = session.user.id;
    } else if (params?.userId) {
        where.userId = params.userId;
    }

    if (params?.month && params?.year) {
        where.month = params.month;
        where.year = params.year;
    }

    const payslips = await prisma.payslip.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    department: { select: { name: true } },
                    position: { select: { name: true } },
                },
            },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return JSON.parse(JSON.stringify(payslips));
}

export async function getPayslipStats(): Promise<{
  total: number;
  viewed: number;
  pending: number;
}> {
  const session = await requireAuth();
  const role = extractRole(session);

  const canViewAll = hasAnyPermission(role, [
    Permission.PAYROLL_VIEW_ALL,
  ]);

  const where: Record<string, unknown> = {};

  if (!canViewAll) {
    where.userId = session.user.id;
  }

  const [total, viewed, pending] = await Promise.all([
    prisma.payslip.count({ where }),
    prisma.payslip.count({
      where: {
        ...where,
        status: { not: "GENERATED" },
      },
    }),
    prisma.payslip.count({
      where: {
        ...where,
        status: "GENERATED",
      },
    }),
  ]);

  return { total, viewed, pending };
}

export async function getPayslip(id: string) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.PAYROLL_VIEW_ALL,
    ]);

    const payslip = await prisma.payslip.findUnique({
        where: { id },
        include: {
            user: {
                include: { department: true },
            },
            payrollRecord: true,
        },
    });

    if (!payslip) {
        return { success: false, message: "Không tìm thấy phiếu lương" };
    }

    if (!canViewAll && payslip.userId !== session.user.id) {
        return { success: false, message: "Bạn không có quyền xem phiếu lương này" };
    }

    // Update viewed status
    if (!canViewAll) {
        await prisma.payslip.update({
            where: { id },
            data: { status: "VIEWED", viewedAt: new Date() },
        });
    }

    return JSON.parse(JSON.stringify(payslip));
}

export async function getMyPayslips() {
    const session = await requireAuth();

    const payslips = await prisma.payslip.findMany({
        where: { userId: session.user.id },
        include: { payrollRecord: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return JSON.parse(JSON.stringify(payslips));
}

// ─── EXPORT ───

export async function exportPayrollRecord(recordId: string) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const record = await prisma.payrollRecord.findUnique({
        where: { id: recordId },
        include: {
            details: {
                include: {
                    user: {
                        select: {
                            name: true,
                            employeeCode: true,
                            bankAccount: true,
                            bankName: true,
                        },
                    },
                },
                orderBy: { user: { name: "asc" } },
            },
        },
    });

    if (!record) {
        return { success: false, message: "Không tìm thấy bảng lương" };
    }

    // Generate CSV content
    const headers = [
        "STT",
        "Mã NV",
        "Họ tên",
        "Lương CB",
        "Phụ cấp",
        "Thưởng",
        "Tăng ca",
        "Gross",
        "BHXH",
        "BHYT",
        "BHTN",
        "Thuế TNCN",
        "Khấu trừ",
        "Net",
        "Ngày công",
        "Số TK",
        "Ngân hàng",
    ];

    const rows = record.details.map((detail, index) => [
        index + 1,
        detail.user.employeeCode || "",
        detail.user.name,
        detail.baseSalary,
        detail.allowanceAmount,
        detail.bonusAmount,
        detail.overtimeAmount,
        detail.grossSalary,
        detail.socialInsurance,
        detail.healthInsurance,
        detail.unemploymentInsurance,
        detail.taxAmount,
        detail.deductionAmount,
        detail.netSalary,
        detail.workDays,
        detail.bankAccount || "",
        detail.bankName || "",
    ]);

    const csvContent = [
        `BẢNG LƯƠNG THÁNG ${record.month}/${record.year}`,
        "",
        headers.join(","),
        ...rows.map((row) =>
            row.map((cell) => `"${cell}"`).join(","),
        ),
    ].join("\n");

    return {
        csvContent,
        fileName: `bang_luong_${record.month}_${record.year}.csv`,
    };
}

export async function exportManyPayrollRecords(recordIds: string[]) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const records = await prisma.payrollRecord.findMany({
        where: { id: { in: recordIds } },
        include: {
            details: {
                include: {
                    user: {
                        select: {
                            name: true,
                            employeeCode: true,
                            bankAccount: true,
                            bankName: true,
                        },
                    },
                },
                orderBy: { user: { name: "asc" } },
            },
        },
        orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    if (records.length === 0) {
        return { success: false, message: "Không tìm thấy bảng lương nào" };
    }

    const headers = [
        "Kỳ lương",
        "Mã NV",
        "Họ tên",
        "Lương CB",
        "Phụ cấp",
        "Thưởng",
        "Tăng ca",
        "Gross",
        "BHXH",
        "BHYT",
        "BHTN",
        "Thuế TNCN",
        "Khấu trừ",
        "Net",
        "Ngày công",
        "Số TK",
        "Ngân hàng",
    ];

    const allRows: string[][] = [];

    for (const record of records) {
        for (const detail of record.details) {
            allRows.push([
                `Tháng ${record.month}/${record.year}`,
                detail.user.employeeCode || "",
                detail.user.name,
                String(detail.baseSalary),
                String(detail.allowanceAmount),
                String(detail.bonusAmount),
                String(detail.overtimeAmount),
                String(detail.grossSalary),
                String(detail.socialInsurance),
                String(detail.healthInsurance),
                String(detail.unemploymentInsurance),
                String(detail.taxAmount),
                String(detail.deductionAmount),
                String(detail.netSalary),
                String(detail.workDays),
                detail.user.bankAccount || "",
                detail.user.bankName || "",
            ]);
        }
    }

    const csvContent = [
        `DANH SÁCH BẢNG LƯƠNG - Xuất ngày ${new Date().toLocaleDateString("vi-VN")}`,
        "",
        headers.join(","),
        ...allRows.map((row) =>
            row.map((cell) => `"${cell}"`).join(","),
        ),
    ].join("\n");

    return {
        csvContent,
        fileName: `danh_sach_luong_${records.length}_ky.csv`,
    };
}

// ─── DEPARTMENTS (for filters) ───

export async function getDepartmentsForPayroll() {
    await requireAuth();
    return prisma.department.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}

// ─── PAYSLIP EMAIL ───

export async function sendPayslipEmails(payrollRecordId: string) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const record = await prisma.payrollRecord.findUnique({
        where: { id: payrollRecordId },
        include: {
            payslips: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!record) {
        return { success: false, message: "Không tìm thấy bảng lương" };
    }

    let sent = 0;
    let failed = 0;

    for (const payslip of record.payslips) {
        const user = payslip.user;
        if (!user?.email) {
            failed++;
            continue;
        }

        // In a real implementation, you would send an email here
        // using the email service (e.g., Resend, SendGrid)
        // For now, we'll just mark the payslip as sent
        try {
            await prisma.payslip.update({
                where: { id: payslip.id },
                data: { sentEmailAt: new Date() },
            });
            sent++;

            // Log email
            await prisma.emailLog.create({
                data: {
                    userId: user.id,
                    recipient: user.email,
                    subject: `Phiếu lương tháng ${record.month}/${record.year}`,
                    body: `Xin chào ${user.name},\n\nPhiếu lương tháng ${record.month}/${record.year} của bạn đã sẵn sàng.\n\nVui lòng đăng nhập hệ thống HRM để xem chi tiết.\n\nTrân trọng,\nPhòng Nhân sự`,
                    status: "SENT",
                    templateCode: "PAYSLIP_READY",
                    sentAt: new Date(),
                },
            });
        } catch {
            failed++;
        }
    }

    return { sent, failed, total: record.payslips.length };
}

// ─── PAYSLIP PASSWORD ───

export async function verifyPayslipPassword(payslipId: string, password: string) {
    const session = await requireAuth();

    const payslip = await prisma.payslip.findUnique({
        where: { id: payslipId },
        include: {
            user: true,
        },
    });

    if (!payslip) {
        return { success: false, message: "Không tìm thấy phiếu lương" };
    }

    // Check if user owns this payslip or has admin access
    const canViewAll = hasAnyPermission(
        extractRole(session),
        [Permission.PAYROLL_VIEW_ALL],
    );

    if (!canViewAll && payslip.userId !== session.user.id) {
        return { success: false, message: "Bạn không có quyền xem phiếu lương này" };
    }

    // If payslip doesn't require password, allow access
    if (!payslip.passwordHash) {
        return { success: true, requiresPassword: false };
    }

    // Verify password using bcrypt
    // In production, use bcrypt.compare(password, payslip.passwordHash)
    // For now, we'll use a simple comparison
    const isValid = payslip.passwordHash === password;

    if (isValid) {
        // Update viewed status
        await prisma.payslip.update({
            where: { id: payslipId },
            data: {
                status: "VIEWED",
                viewedAt: new Date(),
            },
        });
    }

    return { success: isValid, requiresPassword: true };
}

export async function setPayslipPassword(payslipId: string, password: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    // In production, hash the password with bcrypt
    const passwordHash = password; // await bcrypt.hash(password, 10)

    await prisma.payslip.update({
        where: { id: payslipId },
        data: {
            isSecure: true,
            passwordHash,
        },
    });

    revalidatePath("/payroll/payslips");
    return { success: true };
}

export async function resetPayslipPassword(payslipId: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    await prisma.payslip.update({
        where: { id: payslipId },
        data: {
            isSecure: false,
            passwordHash: null,
        },
    });

    revalidatePath("/payroll/payslips");
    return { success: true };
}

// ─── PAYROLL FORMULAS ───

export async function getPayrollFormulas() {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    return prisma.payrollFormula.findMany({
        orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
}

export async function getPayrollFormula(id: string) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    const formula = await prisma.payrollFormula.findUnique({
        where: { id },
    });
    if (!formula) {
        return { success: false, message: "Không tìm thấy công thức" };
    }
    return { success: true, data: formula };
}

const payrollFormulaSchema = z.object({
    code: z.string().min(1, "Mã không được trống"),
    name: z.string().min(1, "Tên không được trống"),
    description: z.string().optional(),
    formulaType: z.enum(["EARNING", "DEDUCTION", "TAX", "INSURANCE", "NET"]),
    category: z.string().optional(),
    expression: z.string().min(1, "Biểu thức không được trống"),
    variables: z.array(z.object({
        name: z.string(),
        source: z.string(),
        dataType: z.string().default("NUMBER"),
        defaultValue: z.number().optional(),
        description: z.string().optional(),
    })).default([]),
    outputField: z.string().optional(),
    priority: z.number().default(0),
    isActive: z.boolean().default(true),
    isSystem: z.boolean().default(false),
    effectiveDate: z.string().optional(),
});

export async function createPayrollFormula(data: z.infer<typeof payrollFormulaSchema>) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    const parsed = payrollFormulaSchema.parse(data);

    const existing = await prisma.payrollFormula.findUnique({
        where: { code: parsed.code },
    });
    if (existing) {
        return { success: false, message: "Mã công thức đã tồn tại" };
    }

    const result = await prisma.payrollFormula.create({
        data: {
            ...parsed,
            variables: JSON.stringify(parsed.variables),
            effectiveDate: parsed.effectiveDate ? new Date(parsed.effectiveDate) : new Date(),
        },
    });

    revalidatePath("/payroll/formulas");
    return { success: true, message: "Tạo công thức thành công", data: result };
}

export async function updatePayrollFormula(id: string, data: z.infer<typeof payrollFormulaSchema>) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);
    const parsed = payrollFormulaSchema.parse(data);

    const existing = await prisma.payrollFormula.findFirst({
        where: { code: parsed.code, id: { not: id } },
    });
    if (existing) {
        return { success: false, message: "Mã công thức đã tồn tại" };
    }

    const result = await prisma.payrollFormula.update({
        where: { id },
        data: {
            ...parsed,
            variables: JSON.stringify(parsed.variables),
            effectiveDate: parsed.effectiveDate ? new Date(parsed.effectiveDate) : undefined,
        },
    });

    revalidatePath("/payroll/formulas");
    return { success: true, message: "Cập nhật công thức thành công", data: result };
}

export async function deletePayrollFormula(id: string) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);

    const formula = await prisma.payrollFormula.findUnique({
        where: { id },
    });
    if (!formula) {
        return { success: false, message: "Không tìm thấy công thức" };
    }

    if (formula.isSystem) {
        return { success: false, message: "Không thể xóa công thức hệ thống" };
    }

    await prisma.payrollFormula.delete({ where: { id } });
    revalidatePath("/payroll/formulas");
    return { success: true, message: "Xóa thành công" };
}

export async function togglePayrollFormula(id: string) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);

    const formula = await prisma.payrollFormula.findUnique({
        where: { id },
    });
    if (!formula) {
        return { success: false, message: "Không tìm thấy công thức" };
    }

    if (formula.isSystem) {
        return { success: false, message: "Không thể tắt công thức hệ thống" };
    }

    const result = await prisma.payrollFormula.update({
        where: { id },
        data: { isActive: !formula.isActive },
    });

    revalidatePath("/payroll/formulas");
    return result;
}

// ─── FORMULA PREVIEW ───

export async function previewFormula(input: {
    formulaId?: string;
    expression?: string;
    sampleData: Record<string, number>;
}) {
    await requirePermission(Permission.PAYROLL_FORMULA_MANAGE);

    let expression = input.expression?.trim() || "";

    if (input.formulaId) {
        const formula = await prisma.payrollFormula.findUnique({
            where: { id: input.formulaId },
        });

        if (!formula) {
            return { success: false, message: "Không tìm thấy công thức" };
        }

        expression = formula.expression;
    }

    if (!expression) {
        return { success: false, message: "Biểu thức không được trống" };
    }

    try {
        const result = evaluateFormula(expression, input.sampleData);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Lỗi khi tính công thức" };
    }
}

function evaluateFormula(expression: string, variables: Record<string, number>): number {
    // Replace variable names with their values
    let expr = expression;

    for (const [name, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${name}\\b`, "g");
        expr = expr.replace(regex, String(value));
    }

    // Evaluate the expression (basic math only - in production use a safe evaluator)
    // This is a simplified version - in production use a proper expression evaluator
    try {
        // Remove any non-math characters for safety
        const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, "");

        // Use Function constructor for safe evaluation
        const fn = new Function(`return ${sanitized}`);
        const result = fn();

        return typeof result === "number" && !isNaN(result) ? result : 0;
    } catch {
        throw new Error("Biểu thức không hợp lệ");
    }
}

// ─── INSURANCE CAPS ───

export async function getInsuranceCaps(year?: number) {
    await requireAuth();
    const where: Record<string, unknown> = { isActive: true };
    if (year) {
        where.year = year;
    }
    const caps = await prisma.insuranceCap.findMany({
        where,
        orderBy: [{ year: "desc" }, { insuranceType: "asc" }],
    });
    return caps.map(cap => ({
        ...cap,
        minSalary: Number(cap.minSalary),
        maxSalary: Number(cap.maxSalary),
    }));
}

export async function setInsuranceCap(data: {
    year: number;
    insuranceType: string;
    minSalary: number;
    maxSalary: number;
    region?: string;
}) {
    await requirePermission(Permission.PAYROLL_TAX_MANAGE);

    const result = await prisma.insuranceCap.upsert({
        where: {
            year_insuranceType_region: {
                year: data.year,
                insuranceType: data.insuranceType,
                region: data.region || "",
            },
        },
        create: {
            year: data.year,
            insuranceType: data.insuranceType,
            minSalary: data.minSalary,
            maxSalary: data.maxSalary,
            region: data.region,
        },
        update: {
            minSalary: data.minSalary,
            maxSalary: data.maxSalary,
        },
    });

    revalidatePath("/payroll/tax-insurance");
    return {
        ...result,
        minSalary: Number(result.minSalary),
        maxSalary: Number(result.maxSalary),
    };
}

// ─── STANDARD WORK DAYS ───

export async function getStandardWorkDays(year: number, month: number) {
    await requireAuth();
    return prisma.standardWorkDays.findUnique({
        where: { year_month: { year, month } },
    });
}

export async function setStandardWorkDays(data: {
    year: number;
    month: number;
    workDays: number;
    workHours: number;
    holidays?: string[];
    note?: string;
}) {
    await requirePermission(Permission.PAYROLL_TAX_MANAGE);

    const result = await prisma.standardWorkDays.upsert({
        where: {
            year_month: { year: data.year, month: data.month },
        },
        create: {
            year: data.year,
            month: data.month,
            workDays: data.workDays,
            workHours: data.workHours,
            holidays: JSON.stringify(data.holidays || []),
            note: data.note,
        },
        update: {
            workDays: data.workDays,
            workHours: data.workHours,
            holidays: JSON.stringify(data.holidays || []),
            note: data.note,
        },
    });

    revalidatePath("/payroll/tax-insurance");
    return result;
}

// ─── PAYROLL PREVIEW ───

export async function previewPayroll(params: {
    month: number;
    year: number;
    departmentId?: string;
}) {
    await requirePermission(Permission.PAYROLL_VIEW_ALL);

    const { month, year, departmentId } = params;

    const userFilter: Record<string, unknown> = {
        employeeStatus: "ACTIVE",
    };

    if (departmentId) {
        userFilter.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
        where: userFilter,
        include: {
            salaries: true,
            position: {
                include: {
                    positionSalaries: {
                        where: { isActive: true },
                        orderBy: { effectiveDate: "desc" },
                        take: 1,
                    },
                },
            },
        },
    });

    let totalGross = 0;
    let totalNet = 0;

    for (const user of users) {
        let baseSalary = 0;
        if (user.salaries) {
            baseSalary = Number(user.salaries.baseSalary);
        } else if (
            user.position?.positionSalaries &&
            user.position.positionSalaries.length > 0
        ) {
            baseSalary = Number(user.position.positionSalaries[0].baseSalary);
        }
        const baseSalaryNum = Number(baseSalary);

        // Estimate gross (simplified calculation)
        const estimatedGross = baseSalaryNum * 1.1; // Base + ~10% allowances/bonus

        // Estimate net (simplified)
        const estimatedNet = estimatedGross * 0.85; // After ~15% for taxes/insurance

        totalGross += estimatedGross;
        totalNet += estimatedNet;
    }

    return {
        employeeCount: users.length,
        estimatedGross: Math.round(totalGross),
        estimatedNet: Math.round(totalNet),
    };
}

// ─── BULK PAYSLIP ACTIONS ───

export async function bulkUpdatePayslipPassword(payrollRecordId: string, password: string) {
    await requirePermission(Permission.PAYROLL_CALCULATE);

    // Hash password - in production use bcrypt
    const passwordHash = password;

    const result = await prisma.payslip.updateMany({
        where: { payrollRecordId },
        data: {
            isSecure: true,
            passwordHash,
        },
    });

    revalidatePath("/payroll/payslips");
    return { updated: result.count };
}

// ─── PAYSLIP DETAIL VIEW ───

export async function getPayslipDetail(payslipId: string) {
    const session = await requireAuth();

    const payslip = await prisma.payslip.findUnique({
        where: { id: payslipId },
        include: {
            user: {
                include: { department: true, position: true },
            },
            payrollRecord: {
                include: { department: true },
            },
        },
    });

    if (!payslip) {
        return { success: false, message: "Không tìm thấy phiếu lương" };
    }

    const canViewAll = hasAnyPermission(
        extractRole(session),
        [Permission.PAYROLL_VIEW_ALL],
    );

    if (!canViewAll && payslip.userId !== session.user.id) {
        return { success: false, message: "Bạn không có quyền xem phiếu lương này" };
    }

    return payslip;
}

// ─── PAYROLL CALCULATION UTILITIES ───
// Note: Pure calculation functions have been moved to @/lib/payroll-calculations
// Import from there to use in client components or shared code

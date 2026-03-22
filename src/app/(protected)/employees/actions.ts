"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { getIO, emitToAll } from "@/lib/socket/server";

// Types
export interface GetEmployeesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    employmentType?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface EmployeeListItem {
    id: string;
    employeeCode: string | null;
    fullName: string | null;
    name: string;
    email: string;
    image: string | null;
    phone: string | null;
    position: string | null;
    departmentId: string | null;
    departmentName: string | null;
    employmentType: string | null;
    employeeStatus: string | null;
    hireDate: Date | null;
    gender: string | null;
}

export interface GetEmployeesResult {
    employees: EmployeeListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * Lấy danh sách nhân viên với pagination, search, filter, sort
 */
export async function getEmployees(
    params: GetEmployeesParams,
): Promise<GetEmployeesResult> {
    await requirePermission(Permission.EMPLOYEE_VIEW_ALL);

    const {
        page = 1,
        pageSize = 10,
        search,
        departmentId,
        status = "ALL",
        employmentType,
        sortBy = "name",
        sortOrder = "asc",
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Record<string, unknown> = {
        employeeCode: { not: null }, // Chỉ lấy user đã được tạo employee
    };

    if (status !== "ALL") {
        where.employeeStatus = status;
    }

    if (departmentId && departmentId !== "ALL") {
        where.departmentId = departmentId;
    }

    if (employmentType && employmentType !== "ALL") {
        where.employmentType = employmentType;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            {
                employeeCode: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
        ];
    }

    // Get employees with related data
    const [employees, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [sortBy === "fullName" ? "name" : sortBy]: sortOrder,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    // Transform to list items
    const items: EmployeeListItem[] = employees.map((emp) => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        name: emp.name,
        email: emp.email,
        image: emp.image,
        phone: emp.phone,
        position: emp.position,
        departmentId: emp.departmentId,
        departmentName: emp.department?.name || null,
        employmentType: emp.employmentType,
        employeeStatus: emp.employeeStatus,
        hireDate: emp.hireDate,
        gender: emp.gender,
    }));

    return {
        employees: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Lấy thông tin chi tiết một nhân viên
 */
export async function getEmployeeById(id: string) {
    await requirePermission(Permission.EMPLOYEE_VIEW_ALL);

    const employee = await prisma.user.findUnique({
        where: { id },
        include: {
            department: {
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            manager: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    image: true,
                    position: true,
                },
            },
        },
    });

    if (!employee) {
        return null;
    }

    // Get direct reports
    const directReports = await prisma.user.findMany({
        where: { managerId: id },
        select: {
            id: true,
            name: true,
            employeeCode: true,
            image: true,
            position: true,
        },
    });

    return {
        ...employee,
        directReports,
    };
}

/**
 * Tạo mới nhân viên
 */
export async function createEmployee(data: {
    name: string;
    email: string;
    employeeCode: string;
    fullName?: string;
    dateOfBirth?: Date;
    gender?: string;
    nationalId?: string;
    nationalIdDate?: Date;
    nationalIdPlace?: string;
    phone?: string;
    personalEmail?: string;
    address?: string;
    permanentAddress?: string;
    nationality?: string;
    religion?: string;
    ethnicity?: string;
    maritalStatus?: string;
    departmentId?: string;
    position?: string;
    jobTitleId?: string;
    managerId?: string;
    employmentType?: string;
    employeeStatus?: string;
    hireDate?: Date;
    probationEnd?: Date;
    bankName?: string;
    bankAccount?: string;
    bankBranch?: string;
    socialInsuranceNo?: string;
    healthInsuranceNo?: string;
    taxCode?: string;
    educationLevel?: string;
    major?: string;
    university?: string;
    avatar?: string;
    notes?: string;
}) {
    await requirePermission(Permission.EMPLOYEE_CREATE);

    const employee = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            employeeCode: data.employeeCode,
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            nationalId: data.nationalId,
            nationalIdDate: data.nationalIdDate,
            nationalIdPlace: data.nationalIdPlace,
            phone: data.phone,
            personalEmail: data.personalEmail,
            address: data.address,
            permanentAddress: data.permanentAddress,
            nationality: data.nationality,
            religion: data.religion,
            ethnicity: data.ethnicity,
            maritalStatus: data.maritalStatus,
            departmentId: data.departmentId,
            position: data.position,
            jobTitleId: data.jobTitleId,
            managerId: data.managerId,
            employmentType: data.employmentType,
            employeeStatus: data.employeeStatus || "ACTIVE",
            hireDate: data.hireDate,
            probationEnd: data.probationEnd,
            bankName: data.bankName,
            bankAccount: data.bankAccount,
            bankBranch: data.bankBranch,
            socialInsuranceNo: data.socialInsuranceNo,
            healthInsuranceNo: data.healthInsuranceNo,
            taxCode: data.taxCode,
            educationLevel: data.educationLevel,
            major: data.major,
            university: data.university,
            avatar: data.avatar,
            notes: data.notes,
        },
    });

    revalidatePath("/employees");
    return employee;
}

/**
 * Cập nhật nhân viên
 */
export async function updateEmployee(
    id: string,
    data: Partial<{
        name: string;
        email: string;
        employeeCode: string;
        fullName: string;
        dateOfBirth: Date;
        gender: string;
        nationalId: string;
        nationalIdDate: Date;
        nationalIdPlace: string;
        phone: string;
        personalEmail: string;
        address: string;
        permanentAddress: string;
        nationality: string;
        religion: string;
        ethnicity: string;
        maritalStatus: string;
        departmentId: string;
        position: string;
        jobTitleId: string;
        managerId: string;
        employmentType: string;
        employeeStatus: string;
        hireDate: Date;
        probationEnd: Date;
        resignDate: Date;
        bankName: string;
        bankAccount: string;
        bankBranch: string;
        socialInsuranceNo: string;
        healthInsuranceNo: string;
        taxCode: string;
        educationLevel: string;
        major: string;
        university: string;
        avatar: string;
        notes: string;
    }>,
) {
    await requirePermission(Permission.EMPLOYEE_UPDATE);

    const employee = await prisma.user.update({
        where: { id },
        data,
    });

    revalidatePath("/employees");
    revalidatePath(`/employees/${id}`);
    return employee;
}

/**
 * Xóa nhân viên (soft delete - chuyển status thành TERMINATED)
 */
export async function deleteEmployee(id: string) {
    await requirePermission(Permission.EMPLOYEE_DELETE);

    const employee = await prisma.user.update({
        where: { id },
        data: {
            employeeStatus: "TERMINATED",
        },
    });

    revalidatePath("/employees");
    return employee;
}

/**
 * Cập nhật phòng ban của nhân viên (chuyển phòng ban)
 */
export async function updateEmployeeDepartment(
    employeeId: string,
    departmentId: string,
) {
    await requirePermission(Permission.EMPLOYEE_UPDATE);

    const employee = await prisma.user.update({
        where: { id: employeeId },
        data: { departmentId },
    });

    revalidatePath("/employees");
    revalidatePath("/departments");
    return employee;
}

/**
 * Cập nhật phòng ban của nhiều nhân viên (batch chuyển phòng ban)
 */
export async function updateEmployeesDepartment(
    employeeIds: string[],
    departmentId: string,
) {
    await requirePermission(Permission.EMPLOYEE_UPDATE);

    const employees = await prisma.user.updateMany({
        where: { id: { in: employeeIds } },
        data: { departmentId },
    });

    revalidatePath("/employees");
    revalidatePath("/departments");

    const io = getIO();
    if (io) {
        employeeIds.forEach((empId) => {
            emitToAll("department:employee-moved", {
                employeeId: empId,
                targetDepartmentId: departmentId,
            });
        });
    }

    return employees.count;
}

/**
 * Lấy danh sách tất cả nhân viên cho dropdown
 */
export async function getAllEmployees() {
    await requirePermission(Permission.EMPLOYEE_VIEW_ALL);

    const employees = await prisma.user.findMany({
        where: {
            employeeCode: { not: null },
            employeeStatus: { not: "TERMINATED" },
        },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            employeeCode: true,
            image: true,
            position: true,
            departmentId: true,
        },
    });

    return employees;
}

/**
 * Lấy danh sách nhân viên chưa có phòng ban (để gán vào phòng ban)
 * Không yêu cầu quyền HR - ai cũng có thể xem nhân viên chưa được phân phòng
 */
export async function getAssignableEmployees(search?: string) {
    const where: Record<string, unknown> = {
        departmentId: null,
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            {
                employeeCode: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
        ];
    }

    const employees = await prisma.user.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            fullName: true,
            employeeCode: true,
            image: true,
            position: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            nationalId: true,
            address: true,
            employeeStatus: true,
            employmentType: true,
        },
    });

    return employees;
}

/**
 * Lấy danh sách tất cả phòng ban cho dropdown (không yêu cầu quyền)
 */
export async function getDepartmentOptions() {
    const departments = await prisma.department.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            name: true,
        },
    });

    return departments;
}

/**
 * Tạo mã nhân viên tự động theo format EMP-xxx
 */
export async function generateEmployeeCode(): Promise<string> {
    const lastEmployee = await prisma.user.findFirst({
        where: { employeeCode: { startsWith: "EMP-" } },
        orderBy: { employeeCode: "desc" },
        select: { employeeCode: true },
    });

    const nextNum = lastEmployee?.employeeCode
        ? parseInt(lastEmployee.employeeCode.replace("EMP-", "")) + 1
        : 1;

    return `EMP-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Batch import nhân viên từ file Excel/CSV
 */
export async function importEmployeesBatch(
    rows: Record<string, unknown>[],
): Promise<{ success: number; failed: number; errors: string[] }> {
    await requirePermission(Permission.EMPLOYEE_CREATE);

    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const row of rows) {
        try {
            const fullName = String(row["Họ và tên"] || "").trim();
            const nationalId = String(
                row["CCCD"] || row["Mã nhân viên"] || "",
            ).trim();

            if (!fullName) {
                errors.push(`Thiếu "Họ và tên" - dòng bị bỏ qua`);
                failed++;
                continue;
            }

            // Generate employee code
            const employeeCode = await generateEmployeeCode();

            // Generate email from name if not provided
            let email = String(row["Email"] || "").trim();
            if (!email) {
                const slug = fullName
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, ".")
                    .replace(/[^a-z0-9.]/g, "");
                email = `${slug}.${employeeCode.toLowerCase()}@placeholder.local`;
            }

            // Parse dates
            const dateOfBirth = parseDate(
                String(row["Ngày sinh"] || ""),
            );
            const nationalIdDate = parseDate(
                String(row["Ngày cấp CCCD"] || ""),
            );
            const hireDate = parseDate(
                String(row["Ngày vào làm"] || ""),
            );

            // Map gender
            const genderMap: Record<string, string> = {
                "Nam": "MALE",
                "Nữ": "FEMALE",
                "Khác": "OTHER",
            };
            const genderRaw = String(row["Giới tính"] || "").trim();
            const gender =
                genderMap[genderRaw] || genderRaw || undefined;

            // Map education
            const educationMap: Record<string, string> = {
                THPT: "HIGHSCHOOL",
                "Cao đẳng": "COLLEGE",
                "Đại học": "BACHELOR",
                "Thạc sĩ": "MASTER",
                "Tiến sĩ": "PHD",
            };
            const educationRaw = String(row["Trình độ"] || "").trim();
            const educationLevel =
                educationMap[educationRaw] ||
                educationRaw ||
                undefined;

            // Map employment type
            const employmentTypeMap: Record<string, string> = {
                "Toàn thời gian": "FULL_TIME",
                "Bán thời gian": "PART_TIME",
                "Hợp đồng": "CONTRACT",
                "Thực tập": "INTERN",
            };
            const employmentRaw = String(
                row["Loại hình"] || "",
            ).trim();
            const employmentType =
                employmentTypeMap[employmentRaw] ||
                employmentRaw ||
                "FULL_TIME";

            // Map status
            const statusMap: Record<string, string> = {
                "Đang làm": "ACTIVE",
                "Nghỉ phép": "ON_LEAVE",
                "Đã nghỉ": "RESIGNED",
                "Đã chấm dứt": "TERMINATED",
            };
            const statusRaw = String(row["Trạng thái"] || "").trim();
            const employeeStatus =
                statusMap[statusRaw] || statusRaw || "ACTIVE";

            await prisma.user.create({
                data: {
                    name: fullName,
                    email,
                    employeeCode,
                    fullName,
                    nationalId: nationalId || undefined,
                    dateOfBirth,
                    gender,
                    nationalIdDate,
                    nationalIdPlace:
                        String(row["Nơi cấp CCCD"] || "").trim() ||
                        undefined,
                    phone:
                        String(row["Số điện thoại"] || "").trim() ||
                        undefined,
                    personalEmail:
                        String(row["Email cá nhân"] || "").trim() ||
                        undefined,
                    address:
                        String(row["Địa chỉ"] || "").trim() ||
                        undefined,
                    nationality:
                        String(
                            row["Quốc tịch"] || "Việt Nam",
                        ).trim() || "Việt Nam",
                    ethnicity:
                        String(row["Dân tộc"] || "Kinh").trim() ||
                        "Kinh",
                    religion:
                        String(row["Tôn giáo"] || "").trim() ||
                        undefined,
                    maritalStatus:
                        String(
                            row["Tình trạng hôn nhân"] || "",
                        ).trim() || undefined,
                    departmentId:
                        String(row["Phòng ban"] || "").trim() ||
                        undefined,
                    position:
                        String(row["Chức vụ"] || "").trim() ||
                        undefined,
                    employmentType,
                    employeeStatus,
                    hireDate,
                    educationLevel,
                    major:
                        String(row["Chuyên ngành"] || "").trim() ||
                        undefined,
                    university:
                        String(row["Trường"] || "").trim() ||
                        undefined,
                    bankName:
                        String(row["Ngân hàng"] || "").trim() ||
                        undefined,
                    bankAccount:
                        String(row["Số tài khoản"] || "").trim() ||
                        undefined,
                    taxCode:
                        String(row["Mã số thuế"] || "").trim() ||
                        undefined,
                },
            });
            success++;
        } catch (err) {
            failed++;
            const error = err as Error;
            errors.push(`Lỗi dòng: ${error.message}`);
        }
    }

    revalidatePath("/employees");
    return { success, failed, errors };
}

function parseDate(dateStr: string): Date | undefined {
    if (!dateStr || dateStr === "null" || dateStr === "undefined")
        return undefined;
    const str = String(dateStr).trim();
    if (!str) return undefined;
    // Handle dd/MM/yyyy
    const parts = str.split("/");
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (day && month && year) {
            return new Date(year, month - 1, day);
        }
    }
    // Try ISO fallback
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return undefined;
}

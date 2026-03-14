"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";

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
    params: GetEmployeesParams
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
            { employeeCode: { contains: search, mode: "insensitive" } },
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
    }>
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

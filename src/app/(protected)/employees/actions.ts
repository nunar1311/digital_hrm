"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { getIO, emitToAll } from "@/lib/socket/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
  username: string | null;
  fullName: string | null;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  positionId: string | null;
  positionName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  employmentType: string | null;
  employeeStatus: string | null;
  hireDate: Date | null;
  gender: string | null;
  departmentRole: string | null;
  nationalId: string | null;
}

export interface GetEmployeesResult {
  employees: EmployeeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function maskLastFourDigits(input: string | number): string {
  // Chuyển đổi sang chuỗi nếu đầu vào là số
  const str = input.toString();

  // Kiểm tra nếu độ dài chuỗi nhỏ hơn hoặc bằng 4
  if (str.length <= 4) {
    return "****"; // Hoặc trả về chuỗi gốc tùy nhu cầu
  }

  // Lấy phần đầu, giữ nguyên, và thay thế 4 ký tự cuối bằng *
  const firstPart = str.slice(0, -4);
  const maskedPart = "****";

  return firstPart + maskedPart;
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
    username: { not: null }, // Chỉ lấy user đã được tạo employee
  };

  if (status !== "ALL") {
    where.employeeStatus = status;
  }

  if (departmentId && departmentId !== "ALL") {
    if (departmentId === "UNASSIGNED") {
      where.departmentId = null;
    } else {
      where.departmentId = departmentId;
    }
  }

  if (employmentType && employmentType !== "ALL") {
    where.employmentType = employmentType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      {
        username: {
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
        position: {
          select: {
            id: true,
            name: true,
            code: true,
            authority: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Transform to list items
  const items: EmployeeListItem[] = employees.map((emp) => ({
    id: emp.id,
    username: emp.username,
    fullName: emp.fullName,
    name: emp.name,
    email: emp.email,
    image: emp.image,
    phone: emp.phone,
    positionId: emp.position?.id ?? null,
    positionName: emp.position?.name ?? null,
    departmentId: emp.departmentId,
    departmentName: emp.department?.name || null,
    employmentType: emp.employmentType,
    employeeStatus: emp.employeeStatus,
    hireDate: emp.hireDate,
    gender: emp.gender,
    nationalId: maskLastFourDigits(emp.nationalId || ""),
    departmentRole:
      (emp as unknown as { departmentRole?: string | null }).departmentRole ??
      null,
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
          username: true,
          image: true,
          position: { select: { id: true, name: true } },
        },
      },
      position: {
        select: {
          id: true,
          name: true,
          code: true,
          authority: true,
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
      username: true,
      image: true,
      position: { select: { id: true, name: true } },
    },
  });

  return {
    ...employee,
    directReports,
    userId: id,
    status: employee.employeeStatus,
  };
}

/**
 * Kiểm tra CCCD đã tồn tại trong hệ thống hay chưa
 */
export async function checkNationalIdExists(
  nationalId: string,
): Promise<{ exists: boolean; employeeName?: string }> {
  if (!nationalId || nationalId.length < 9) {
    return { exists: false };
  }
  const user = await prisma.user.findFirst({
    where: { nationalId },
    select: { fullName: true, name: true },
  });
  if (!user) return { exists: false };
  return {
    exists: true,
    employeeName: user.fullName || user.name,
  };
}

/**
 * Tạo mật khẩu ngẫu nhiên an toàn cho nhân viên mới
 */
function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Tạo mới nhân viên và đồng thời tạo tài khoản better-auth
 */
export async function createEmployee(data: {
  name: string;
  email: string;
  username: string;
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
  positionId?: string;
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

  // Kiểm tra username đã tồn tại chưa
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email },
      ],
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Tên đăng nhập hoặc email đã tồn tại trong hệ thống");
  }

  // Validate positionId nếu được cung cấp
  let positionId = data.positionId;
  if (positionId) {
    const positionExists = await prisma.position.findUnique({
      where: { id: positionId },
      select: { id: true },
    });
    if (!positionExists) {
      positionId = undefined;
    }
  }

  // Validate departmentId nếu được cung cấp
  let departmentId = data.departmentId;
  let departmentName: string | undefined;
  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true },
    });
    if (!dept) {
      departmentId = undefined;
    } else {
      departmentName = dept.name;
    }
  }

  // Dùng username làm mật khẩu mặc định (để nhân viên đăng nhập bằng username/username)
  const plainPassword = data.username;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Tạo employee user trước
  const employee = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username: data.username,
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
      departmentId: departmentId,
      positionId: positionId,
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

  // Tạo Account record cho better-auth (để user có thể đăng nhập)
  // Lưu ý: better-auth sử dụng providerId = "credential" và accountId = user.id
  try {
    await prisma.account.create({
      data: {
        userId: employee.id,
        accountId: employee.id, // accountId phải là user.id cho credential provider
        providerId: "credential", // Provider ID cho email/password authentication
        password: hashedPassword,
      },
    });
  } catch (accountError) {
    // Nếu tạo Account thất bại, xóa user đã tạo
    await prisma.user.delete({ where: { id: employee.id } });
    throw new Error(`Tạo tài khoản thất bại: ${accountError instanceof Error ? accountError.message : "Lỗi không xác định"}`);
  }

  revalidatePath("/employees");

  // Emit sự kiện để thông báo cho các client
  const io = getIO();
  if (io) {
    emitToAll("employee:created", {
      employeeId: employee.id,
      employeeName: employee.name,
      departmentId: departmentId ?? "",
      departmentName: departmentName ?? "",
    });
  }

  // Trả về plainPassword để frontend hiển thị cho admin sau khi tạo
  return {
    employee,
    plainPassword,
  };
}

/**
 * Cập nhật mật khẩu nhân viên
 */
export async function updateEmployeePassword(
  employeeId: string,
  newPassword?: string,
) {
  await requirePermission(Permission.EMPLOYEE_UPDATE);

  const passwordToSet = newPassword || generateRandomPassword();

  // Sử dụng better-auth API để thay đổi mật khẩu
  await auth.api.setUserPassword({
    body: {
      userId: employeeId,
      newPassword: passwordToSet,
    },
    headers: await headers(),
  });

  return passwordToSet;
}

/**
 * Cập nhật nhân viên
 */
export async function updateEmployee(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    username: string;
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
    positionId: string;
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
    data: { departmentId, departmentRole: "MEMBER" } as { departmentId: string; departmentRole: "MEMBER" },
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
      username: { not: null },
      employeeStatus: { not: "TERMINATED" },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      position: { select: { id: true, name: true } },
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
        username: {
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
      username: true,
      image: true,
      position: { select: { id: true, name: true } },
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
export async function generateUsername(): Promise<string> {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${yy}${mm}${dd}`;

  // Retry loop để đảm bảo không trùng lặp (xử lý concurrency)
  for (let attempt = 0; attempt < 10; attempt++) {
    const lastEmployee = await prisma.user.findFirst({
      where: {
        username: {
          startsWith: datePrefix,
        },
      },
      orderBy: { username: "desc" },
      select: { username: true },
    });

    const nextSeq = lastEmployee?.username
      ? parseInt(lastEmployee.username.slice(-3)) + 1
      : 1;

    const candidateCode = `${datePrefix}${String(nextSeq).padStart(3, "0")}`;

    // Kiểm tra mã có thực sự tồn tại không (phòng trường hợp race condition)
    const exists = await prisma.user.findUnique({
      where: { username: candidateCode },
      select: { id: true },
    });

    if (!exists) {
      return candidateCode;
    }
    // Nếu trùng, lặp lại để lấy số tiếp theo
  }

  throw new Error("Không thể tạo mã nhân viên không trùng lặp");
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
      const username = await generateUsername();

      // Generate email from name if not provided
      let email = String(row["Email"] || "").trim();
      if (!email) {
        const slug = fullName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "");
        email = `${slug}.${username.toLowerCase()}@placeholder.local`;
      }

      // Parse dates
      const dateOfBirth = parseDate(String(row["Ngày sinh"] || ""));
      const nationalIdDate = parseDate(String(row["Ngày cấp CCCD"] || ""));
      const hireDate = parseDate(String(row["Ngày vào làm"] || ""));

      // Map gender
      const genderMap: Record<string, string> = {
        Nam: "MALE",
        Nữ: "FEMALE",
        Khác: "OTHER",
      };
      const genderRaw = String(row["Giới tính"] || "").trim();
      const gender = genderMap[genderRaw] || genderRaw || undefined;

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
        educationMap[educationRaw] || educationRaw || undefined;

      // Map employment type
      const employmentTypeMap: Record<string, string> = {
        "Toàn thời gian": "FULL_TIME",
        "Bán thời gian": "PART_TIME",
        "Hợp đồng": "CONTRACT",
        "Thực tập": "INTERN",
      };
      const employmentRaw = String(row["Loại hình"] || "").trim();
      const employmentType =
        employmentTypeMap[employmentRaw] || employmentRaw || "FULL_TIME";

      // Map status
      const statusMap: Record<string, string> = {
        "Đang làm": "ACTIVE",
        "Nghỉ phép": "ON_LEAVE",
        "Đã nghỉ": "RESIGNED",
        "Đã chấm dứt": "TERMINATED",
      };
      const statusRaw = String(row["Trạng thái"] || "").trim();
      const employeeStatus = statusMap[statusRaw] || statusRaw || "ACTIVE";

      // Dùng username làm mật khẩu mặc định (nhân viên đăng nhập bằng username/username)
      const plainPassword = username;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Tạo employee user và account trong một transaction
      await prisma.$transaction(async (tx) => {
        const employee = await tx.user.create({
          data: {
            name: fullName,
            email,
            username,
            fullName,
            nationalId: nationalId || undefined,
            dateOfBirth,
            gender,
            nationalIdDate,
            nationalIdPlace:
              String(row["Nơi cấp CCCD"] || "").trim() || undefined,
            phone: String(row["Số điện thoại"] || "").trim() || undefined,
            personalEmail: String(row["Email cá nhân"] || "").trim() || undefined,
            address: String(row["Địa chỉ"] || "").trim() || undefined,
            nationality:
              String(row["Quốc tịch"] || "Việt Nam").trim() || "Việt Nam",
            ethnicity: String(row["Dân tộc"] || "Kinh").trim() || "Kinh",
            religion: String(row["Tôn giáo"] || "").trim() || undefined,
            maritalStatus:
              String(row["Tình trạng hôn nhân"] || "").trim() || undefined,
            departmentId: String(row["Phòng ban"] || "").trim() || undefined,
            positionId: String(row["Chức vụ"] || "").trim() || undefined,
            employmentType,
            employeeStatus,
            hireDate,
            educationLevel,
            major: String(row["Chuyên ngành"] || "").trim() || undefined,
            university: String(row["Trường"] || "").trim() || undefined,
            bankName: String(row["Ngân hàng"] || "").trim() || undefined,
            bankAccount: String(row["Số tài khoản"] || "").trim() || undefined,
            taxCode: String(row["Mã số thuế"] || "").trim() || undefined,
          },
        });

        // Tạo Account record cho better-auth
        await tx.account.create({
          data: {
            userId: employee.id,
            accountId: employee.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
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

/**
 * Xuất danh sách nhân viên ra Excel
 * Lấy tất cả nhân viên (không phân trang) theo filter hiện tại
 */
export async function exportEmployees(params: {
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;
}) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);

  const { search, departmentId, status = "ALL", employmentType } = params;

  const where: Record<string, unknown> = {
    username: { not: null },
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
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const employees = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      department: {
        select: { id: true, name: true },
      },
      position: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    username: emp.username,
    fullName: emp.fullName,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    positionId: emp.position?.id ?? null,
    positionName: emp.position?.name ?? null,
    departmentId: emp.departmentId,
    departmentName: emp.department?.name ?? null,
    employmentType: emp.employmentType,
    employeeStatus: emp.employeeStatus,
    hireDate: emp.hireDate,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    address: emp.address,
    personalEmail: emp.personalEmail,
    nationalId: emp.nationalId,
    nationalIdDate: emp.nationalIdDate,
    nationalIdPlace: emp.nationalIdPlace,
    bankName: emp.bankName,
    bankAccount: emp.bankAccount,
    bankBranch: emp.bankBranch,
    socialInsuranceNo: emp.socialInsuranceNo,
    healthInsuranceNo: emp.healthInsuranceNo,
    taxCode: emp.taxCode,
    educationLevel: emp.educationLevel,
    major: emp.major,
    university: emp.university,
    maritalStatus: emp.maritalStatus,
    ethnicity: emp.ethnicity,
    religion: emp.religion,
    nationality: emp.nationality,
    avatar: emp.image,
    notes: emp.notes,
    createdAt: emp.createdAt?.toISOString() ?? null,
  }));
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

// ==================== HỒ SƠ 360° SERVER ACTIONS ====================

/**
 * Lấy lịch sử công tác (work history) của nhân viên
 */
export async function getWorkHistories(userId: string) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  return prisma.workHistory.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
}

/**
 * Lấy danh sách khen thưởng / kỷ luật
 */
export async function getRewards(userId: string) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  return prisma.reward.findMany({
    where: { userId },
    orderBy: { decisionDate: "desc" },
  });
}

/**
 * Lấy liên hệ khẩn cấp
 */
export async function getEmergencyContacts(userId: string) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  return prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Lấy người phụ thuộc (gia cảnh)
 */
export async function getDependents(userId: string) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  return prisma.dependent.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Lấy timeline sự kiện của nhân viên
 */
export async function getEmployeeTimeline(userId: string) {
  await requirePermission(Permission.EMPLOYEE_VIEW_ALL);
  return prisma.employeeTimeline.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

// ─── Position ↔ Role Suggestion for Employees ───

/**
 * Lấy role được suggest cho user dựa trên position mapping
 * Trả về thông tin gợi ý khi user được gán position
 */
export async function getSuggestedRoleForUser(userId: string): Promise<{
  suggestedRoleKey: string | null;
  suggestedRoleName: string | null;
  currentRoleKey: string | null;
  positionName: string | null;
  hasMismatch: boolean;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      positionId: true,
      position: {
        select: {
          name: true,
          authority: true,
          roleMapping: {
            select: { roleKey: true },
          },
        },
      },
      roleAssignments: {
        select: {
          role: {
            select: { key: true, name: true },
          },
        },
      },
    },
  });

  if (!user?.positionId || !user.position) {
    return null;
  }

  const mappedRole = user.position.roleMapping?.roleKey ?? null;
  const currentRole = user.roleAssignments[0]?.role.key ?? null;
  const suggestedRoleKey = mappedRole;

  // Lấy thông tin role để hiển thị tên
  let suggestedRoleName: string | null = null;
  if (suggestedRoleKey) {
    const role = await prisma.role.findUnique({
      where: { key: suggestedRoleKey },
      select: { name: true },
    });
    suggestedRoleName = role?.name ?? suggestedRoleKey;
  }

  const hasMismatch = !!(
    suggestedRoleKey &&
    currentRole &&
    suggestedRoleKey !== currentRole
  );

  return {
    suggestedRoleKey,
    suggestedRoleName,
    currentRoleKey: currentRole,
    positionName: user.position.name,
    hasMismatch,
  };
}

/**
 * Gợi ý role cho user khi position thay đổi
 * Dùng trong employee form dialog khi user chọn position mới
 */
export async function suggestRoleForPositionChange(
  userId: string,
  newPositionId: string,
): Promise<{
  roleKey: string | null;
  roleName: string | null;
  positionName: string | null;
  currentRoleKey: string | null;
  shouldSuggest: boolean;
}> {
  const [user, position] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        roleAssignments: {
          select: {
            role: { select: { key: true, name: true } },
          },
        },
      },
    }),
    prisma.position.findUnique({
      where: { id: newPositionId },
      select: {
        name: true,
        roleMapping: {
          select: { roleKey: true },
        },
      },
    }),
  ]);

  const currentRoleKey = user?.roleAssignments[0]?.role.key ?? null;
  const mappedRoleKey = position?.roleMapping?.roleKey ?? null;

  let roleName: string | null = null;
  if (mappedRoleKey) {
    const role = await prisma.role.findUnique({
      where: { key: mappedRoleKey },
      select: { name: true },
    });
    roleName = role?.name ?? mappedRoleKey;
  }

  const shouldSuggest =
    !!mappedRoleKey &&
    !!currentRoleKey &&
    mappedRoleKey !== currentRoleKey;

  return {
    roleKey: mappedRoleKey,
    roleName,
    positionName: position?.name ?? null,
    currentRoleKey,
    shouldSuggest,
  };
}

/**
 * Cập nhật vai trò (role) của user theo position mapping
 * Xóa role cũ và gán role mới từ position
 */
export async function updateUserRoleFromPosition(
  userId: string,
  positionId: string,
): Promise<{ success: boolean; roleKey?: string; error?: string }> {
  try {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: { roleMapping: { select: { roleKey: true } } },
    });

    const mappedRoleKey = position?.roleMapping?.roleKey ?? null;

    if (!mappedRoleKey) {
      return { success: true };
    }

    const role = await prisma.role.findUnique({
      where: { key: mappedRoleKey },
      select: { id: true },
    });

    if (!role) {
      return { success: false, error: "Không tìm thấy vai trò" };
    }

    // Xóa tất cả role assignment hiện tại
    await prisma.userCustomRoleAssignment.deleteMany({
      where: { userId },
    });

    // Gán role mới
    await prisma.userCustomRoleAssignment.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    return { success: true, roleKey: mappedRoleKey };
  } catch (err) {
    console.error("updateUserRoleFromPosition error:", err);
    return { success: false, error: "Lỗi khi cập nhật vai trò" };
  }
}

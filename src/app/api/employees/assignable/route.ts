import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";

/**
 * GET /api/employees/assignable
 * Lấy danh sách nhân viên có thể phân công (chưa có phòng ban hoặc đang ở phòng ban khác)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(Permission.EMPLOYEE_VIEW_ALL);

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";

        const where: Record<string, unknown> = {
            employeeCode: { not: null },
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { employeeCode: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const employees = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                employeeCode: true,
                position: true,
                image: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: "asc" },
            take: 100,
        });

        const result = employees.map((emp) => ({
            id: emp.id,
            name: emp.name,
            employeeCode: emp.employeeCode,
            position: emp.position,
            image: emp.image,
            departmentId: emp.department?.id || null,
            departmentName: emp.department?.name || null,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching assignable employees:", error);
        return NextResponse.json(
            { error: "Failed to fetch employees" },
            { status: 500 }
        );
    }
}

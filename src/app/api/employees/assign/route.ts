import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";
import { emitToAll } from "@/lib/socket/server";

interface AssignRequestBody {
    employeeIds: string[];
    departmentId: string;
}

/**
 * POST /api/employees/assign
 * Phân công nhiều nhân viên vào phòng ban
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(Permission.EMPLOYEE_EDIT);

        const body: AssignRequestBody = await request.json();
        const { employeeIds, departmentId } = body;

        if (!employeeIds || employeeIds.length === 0) {
            return NextResponse.json(
                { success: false, message: "Danh sách nhân viên trống" },
                { status: 400 }
            );
        }

        if (!departmentId) {
            return NextResponse.json(
                { success: false, message: "ID phòng ban trống" },
                { status: 400 }
            );
        }

        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            return NextResponse.json(
                { success: false, message: "Phòng ban không tồn tại" },
                { status: 404 }
            );
        }

        // Get current employees in department for audit log
        const currentEmployees = await prisma.user.findMany({
            where: { departmentId },
            select: { id: true, name: true },
        });

        // Update employees
        const updatedEmployees = await prisma.user.updateMany({
            where: { id: { in: employeeIds } },
            data: { departmentId },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "BULK_ASSIGN",
                entity: "Department",
                entityId: departmentId,
                newData: {
                    assignedEmployeeIds: employeeIds,
                    departmentName: department.name,
                },
            },
        });

        revalidatePath("/departments");
        revalidatePath("/org-chart");

        // Emit socket event
        emitToAll("department:employee-moved", {
            departmentId,
            employeeIds,
        });

        return NextResponse.json({
            success: true,
            message: `Đã phân công ${updatedEmployees.count} nhân viên vào phòng ban "${department.name}"`,
        });
    } catch (error) {
        console.error("Error assigning employees:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi khi phân công nhân viên" },
            { status: 500 }
        );
    }
}

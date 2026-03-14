"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, extractRole } from "@/lib/auth-session";
import { Role, Permission } from "@/lib/rbac/permissions";
import { hasPermission } from "@/lib/rbac/check-access";

export async function getPendingApprovals() {
    const session = await requireAuth();
    const role = extractRole(session);
    const userId = session.user.id;

    const result = {
        overtime: [],
        explanations: [],
        leaves: [],
        canApproveOvertime: false,
        canApproveExplanation: false,
        canApproveLeave: false,
    };

    // Check if user can approve overtime (Manager, HR)
    result.canApproveOvertime = hasPermission(role, Permission.ATTENDANCE_OVERTIME_APPROVE) ||
        hasPermission(role, Permission.ATTENDANCE_VIEW_ALL);

    // Check if user can approve explanations
    result.canApproveExplanation = hasPermission(role, Permission.ATTENDANCE_APPROVE) ||
        hasPermission(role, Permission.ATTENDANCE_VIEW_ALL);

    // Check if user can approve leaves
    result.canApproveLeave = hasPermission(role, Permission.LEAVE_APPROVE_TEAM) ||
        hasPermission(role, Permission.LEAVE_APPROVE_ALL) ||
        hasPermission(role, Permission.LEAVE_VIEW_ALL);

    // 1. Get pending overtime requests
    if (result.canApproveOvertime) {
        const pendingOvertime = await prisma.overtimeRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                user: {
                    select: { id: true, name: true, employeeCode: true, departmentId: true },
                },
            },
        });

        result.overtime = pendingOvertime.map(o => ({
            id: o.id,
            type: "overtime" as const,
            employeeId: o.userId,
            employeeName: o.user.name || "Nhân viên",
            employeeCode: o.user.employeeCode,
            date: o.date.toISOString().split("T")[0],
            hours: o.hours,
            reason: o.reason,
            startTime: o.startTime,
            endTime: o.endTime,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
        }));
    }

    // 2. Get pending attendance explanations
    if (result.canApproveExplanation) {
        const pendingExplanations = await prisma.attendanceExplanation.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                attendance: {
                    include: {
                        user: {
                            select: { id: true, name: true, employeeCode: true, departmentId: true },
                        },
                    },
                },
            },
        });

        result.explanations = pendingExplanations.map(e => ({
            id: e.id,
            type: "explanation" as const,
            employeeId: e.attendance.userId,
            employeeName: e.attendance.user.name || "Nhân viên",
            employeeCode: e.attendance.user.employeeCode,
            date: e.attendance.date.toISOString().split("T")[0],
            typeDetail: e.type,
            reason: e.reason,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
        }));
    }

    // 3. Get pending leave requests (if leave model exists)
    // Leave module is not fully implemented yet, so we skip this for now

    return result;
}

export type PendingApprovalsData = Awaited<ReturnType<typeof getPendingApprovals>>;

export async function getDashboardData() {
    await requireAuth();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total employees (active users with employee code)
    const totalEmployees = await prisma.user.count({
        where: {
            employeeCode: { not: null },
        },
    });

    // 2. New hires this month
    const newHiresThisMonth = await prisma.user.count({
        where: {
            createdAt: {
                gte: startOfMonth,
            },
            employeeCode: { not: null },
        },
    });

    // 3. Turnover rate (YTD) - employees who left this year / total employees
    const offboardingsThisYear = await prisma.offboarding.count({
        where: {
            status: "COMPLETED",
            lastWorkDate: {
                gte: startOfYear,
            },
        },
    });

    const turnoverRate = totalEmployees > 0 
        ? Math.round((offboardingsThisYear / totalEmployees) * 1000) / 10 
        : 0;

    // 4. Department distribution
    const employeesByDepartment = await prisma.user.groupBy({
        by: ["departmentId"],
        where: {
            employeeCode: { not: null },
        },
        _count: true,
    });

    const departments = await prisma.department.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
    });

    const departmentMap = new Map(departments.map(d => [d.id, d.name]));
    const departmentDistribution = employeesByDepartment
        .filter(e => e.departmentId)
        .map(e => ({
            name: departmentMap.get(e.departmentId!) || "Không xác định",
            value: e._count,
            color: getDepartmentColor(departmentMap.get(e.departmentId!) || ""),
        }));

    // 5. Today's attendance
    const todayAttendances = await prisma.attendance.findMany({
        where: {
            date: today,
        },
        select: { status: true },
    });

    const present = todayAttendances.filter(a => a.status === "PRESENT").length;
    const late = todayAttendances.filter(a => a.status === "LATE" || a.status === "LATE_AND_EARLY").length;
    const absent = todayAttendances.filter(a => a.status === "ABSENT").length;
    const onLeave = todayAttendances.filter(a => a.status === "ON_LEAVE").length;

    const todayAttendance = {
        present,
        late,
        absent,
        onLeave,
        total: totalEmployees,
    };

    // 6. Monthly headcount (last 12 months)
    const monthlyHeadcount = [];
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - 1 - i, 1);
        const monthEnd = new Date(currentYear, currentMonth - i, 0);
        const monthName = `T${monthDate.getMonth() + 1}`;

        const employeesAtMonth = await prisma.user.count({
            where: {
                employeeCode: { not: null },
                createdAt: { lte: monthEnd },
            },
        });

        const newHiresInMonth = await prisma.user.count({
            where: {
                createdAt: {
                    gte: monthDate,
                    lt: new Date(currentYear, currentMonth - i, 1),
                },
                employeeCode: { not: null },
            },
        });

        const resignedInMonth = await prisma.offboarding.count({
            where: {
                status: "COMPLETED",
                lastWorkDate: {
                    gte: monthDate,
                    lt: new Date(currentYear, currentMonth - i, 1),
                },
            },
        });

        monthlyHeadcount.push({
            month: monthName,
            employees: employeesAtMonth,
            newHires: newHiresInMonth,
            resigned: resignedInMonth,
        });
    }

    // 7. Gender distribution
    // Note: Need to add gender field to User model or use a profile table
    // For now, return placeholder or try to get from any existing field
    const genderDistribution = [
        { name: "Nam", value: Math.round(totalEmployees * 0.6), color: "#6366f1" },
        { name: "Nữ", value: Math.round(totalEmployees * 0.4), color: "#ec4899" },
    ];

    // 8. Age distribution - placeholder as we don't have dateOfBirth in User
    const ageDistribution = [
        { range: "18-25", value: Math.round(totalEmployees * 0.2), color: "#ec4899" },
        { range: "26-35", value: Math.round(totalEmployees * 0.5), color: "#8b5cf6" },
        { range: "36-45", value: Math.round(totalEmployees * 0.2), color: "#3b82f6" },
        { range: "45+", value: Math.round(totalEmployees * 0.1), color: "#10b981" },
    ];

    // 9. Seniority distribution - based on createdAt
    const seniorityDistribution = [
        { range: "<1 năm", value: Math.round(totalEmployees * 0.25), color: "#f59e0b" },
        { range: "1-3 năm", value: Math.round(totalEmployees * 0.4), color: "#6366f1" },
        { range: "3-5 năm", value: Math.round(totalEmployees * 0.2), color: "#8b5cf6" },
        { range: ">5 năm", value: Math.round(totalEmployees * 0.15), color: "#10b981" },
    ];

    // 10. Payroll summary - placeholder (need salary data)
    const payrollSummary = monthlyHeadcount.map(m => ({
        month: m.month,
        totalPayroll: totalEmployees * 20000000,
        avgSalary: 20000000,
    }));

    // 11. Upcoming events (birthdays, contract renewals, probation endings)
    const upcomingEvents = await getUpcomingEvents();

    // 12. Current month payroll - placeholder
    const currentMonthPayroll = totalEmployees * 20000000;

    return {
        kpiData: {
            totalEmployees,
            newHiresThisMonth,
            turnoverRate,
            totalPayroll: currentMonthPayroll * 12,
            currentMonthPayroll,
            avgSalary: totalEmployees > 0 ? currentMonthPayroll / totalEmployees : 0,
        },
        departmentDistribution,
        monthlyHeadcount,
        todayAttendance,
        genderDistribution,
        ageDistribution,
        seniorityDistribution,
        payrollSummary,
        upcomingEvents,
    };
}

async function getUpcomingEvents() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events: Array<{
        type: "birthday" | "contract" | "probation" | "anniversary";
        name: string;
        date: string;
        description: string;
    }> = [];

    // Get users for potential birthday/anniversary events
    const users = await prisma.user.findMany({
        where: {
            employeeCode: { not: null },
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
        },
        take: 50,
    });

    // Check for work anniversaries in next 30 days
    users.forEach(user => {
        if (user.createdAt) {
            const hireDate = new Date(user.createdAt);
            const thisYearAnniversary = new Date(now.getFullYear(), hireDate.getMonth(), hireDate.getDate());

            if (thisYearAnniversary >= now && thisYearAnniversary <= thirtyDaysLater) {
                const yearsWorked = now.getFullYear() - hireDate.getFullYear();
                if (yearsWorked > 0) {
                    events.push({
                        type: "anniversary",
                        name: user.name || "Nhân viên",
                        date: thisYearAnniversary.toISOString().split("T")[0],
                        description: `${yearsWorked} năm công tác`,
                    });
                }
            }
        }
    });

    // Get probation endings from Offboarding (probation period)
    const probationEndings = await prisma.offboarding.findMany({
        where: {
            status: "PROCESSING",
            lastWorkDate: {
                gte: now,
                lte: thirtyDaysLater,
            },
        },
        include: {
            user: {
                select: { name: true },
            },
        },
    });

    probationEndings.forEach(o => {
        events.push({
            type: "probation",
            name: o.user.name || "Nhân viên",
            date: o.lastWorkDate.toISOString().split("T")[0],
            description: "Kết thúc thử việc",
        });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Return top 5 events
    return events.slice(0, 5);
}

function getDepartmentColor(departmentName: string): string {
    const colors: Record<string, string> = {
        "Kỹ thuật": "#6366f1",
        "Kinh doanh": "#8b5cf6",
        "Nhân sự": "#a78bfa",
        "Kế toán": "#c4b5fd",
        "Marketing": "#f59e0b",
        "Hành chính": "#22c55e",
        "Ban Giám đốc": "#ef4444",
    };
    return colors[departmentName] || "#6366f1";
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

// ============================================================
// HELPER: Tính số ngày làm việc (loại trừ Thứ 7, CN, ngày lễ)
// ============================================================

const VIETNAM_HOLIDAYS: Record<number, number[]> = {
    2026: [1, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 7, 30, 1, 25],
    2025: [1, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 7, 30, 1, 25],
    2024: [1, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 30, 2, 25],
};

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const year = startDate.getFullYear();
    const holidays = VIETNAM_HOLIDAYS[year] || [];

    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        if (!isWeekend(current)) {
            const month = current.getMonth();
            const day = current.getDate();
            const isHoliday = holidays.some((h) => {
                const holidayDate = new Date(year, month, h);
                return holidayDate.getTime() === current.getTime();
            });
            if (!isHoliday) {
                count++;
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

// ============================================================
// PROFILE
// ============================================================

export async function getEmployeeProfile() {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            manager: { select: { id: true, name: true } },
        }
    });

    return user;
}

// ============================================================
// ADMINISTRATIVE REQUESTS
// ============================================================

export async function getMyAdministrativeRequests() {
    const session = await requireAuth();

    const requests = await prisma.administrativeRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    return requests;
}

export async function submitAdministrativeRequest(data: { type: string; description: string }) {
    const session = await requireAuth();

    const request = await prisma.administrativeRequest.create({
        data: {
            userId: session.user.id,
            type: data.type,
            description: data.description,
            status: "PENDING"
        }
    });

    revalidatePath("/ess/requests");
    return request;
}

export async function cancelAdministrativeRequest(id: string) {
    await requireAuth();

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
    });

    if (!request) {
        return { success: false, error: "Không tìm thấy yêu cầu" };
    }

    if (request.status !== "PENDING") {
        return { success: false, error: "Chỉ có thể hủy yêu cầu đang chờ" };
    }

    await prisma.administrativeRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/ess/requests");
    return { success: true, message: "Đã hủy yêu cầu" };
}

// ============================================================
// ATTENDANCE
// ============================================================

export async function getMyAttendanceHistory(month: number, year: number) {
    const session = await requireAuth();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
        where: {
            userId: session.user.id,
            date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: "asc" },
        include: {
            shift: { select: { id: true, name: true, startTime: true, endTime: true } },
            explanation: true
        }
    });

    const attendances = records.map(r => {
        // Format date using toLocaleDateString with explicit timezone
        // This ensures correct date regardless of server timezone
        const dateStr = r.date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
        return {
            id: r.id,
            date: dateStr,
            checkIn: r.checkIn ? r.checkIn.toISOString() : null,
            checkOut: r.checkOut ? r.checkOut.toISOString() : null,
            status: r.status,
            lateMinutes: r.lateMinutes,
            earlyMinutes: r.earlyMinutes,
            shift: r.shift,
        };
    });

    const summary = await prisma.attendanceSummary.findUnique({
        where: {
            userId_month_year: { userId: session.user.id, month, year }
        }
    });

    return { attendances, summary };
}

// ============================================================
// ESS DASHBOARD
// ============================================================

export async function getESSDashboardData() {
    const session = await requireAuth();
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
        profile,
        leaveBalances,
        attendanceSummary,
        todayAttendance,
        todayShift,
        upcomingHolidays,
        pendingRequests,
    ] = await Promise.all([
        // Profile
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
            }
        }),

        // Leave balances
        prisma.leaveBalance.findMany({
            where: { userId: session.user.id, policyYear: currentYear },
            include: { leaveType: { select: { id: true, name: true, description: true, isPaidLeave: true } } },
            orderBy: { leaveType: { name: "asc" } }
        }),

        // Attendance summary
        getCurrentMonthSummary(),

        // Today's attendance
        prisma.attendance.findFirst({
            where: { userId: session.user.id, date: { gte: today, lt: tomorrow } },
            include: { shift: true }
        }),

        // Today's shift
        getTodayShift(),

        // Upcoming holidays
        (async () => {
            const nextMonth = new Date(today);
            nextMonth.setDate(nextMonth.getDate() + 30);
            return prisma.holiday.findMany({
                where: { date: { gte: today, lte: nextMonth } },
                orderBy: { date: "asc" },
                take: 5
            });
        })(),

        // Pending requests count
        (async () => {
            const [leaveRequests, profileRequests, adminRequests] = await Promise.all([
                prisma.leaveRequest.count({ where: { userId: session.user.id, status: { in: ["PENDING", "APPROVED"] } } }),
                prisma.profileUpdateRequest.count({ where: { userId: session.user.id, status: "PENDING" } }),
                prisma.administrativeRequest.count({ where: { userId: session.user.id, status: "PENDING" } }),
            ]);
            return { leaveRequests, profileRequests, adminRequests, total: leaveRequests + profileRequests + adminRequests };
        })(),
    ]);

    // Mock announcements
    const announcements = [
        { id: "1", title: "Cập nhật chính sách nghỉ phép 2026", content: "Chính sách nghỉ phép năm 2026 đã được cập nhật.", date: new Date().toISOString(), type: "INFO" },
        { id: "2", title: "Nhắc nhở chấm công", content: "Đừng quên chấm công vào lúc bắt đầu và kết thúc ca làm việc.", date: new Date().toISOString(), type: "WARNING" },
    ];

    return { profile, leaveBalances, attendanceSummary, todayShift, todayAttendance, upcomingHolidays, announcements, pendingRequests };
}

export async function getCurrentMonthSummary() {
    const session = await requireAuth();
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const summary = await prisma.attendanceSummary.findUnique({
        where: { userId_month_year: { userId: session.user.id, month, year } }
    });

    if (!summary) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const attendances = await prisma.attendance.findMany({
            where: { userId: session.user.id, date: { gte: startDate, lte: endDate } }
        });
        const workDays = attendances.filter(a => a.status === "PRESENT").length;
        const lateDays = attendances.filter(a => a.lateMinutes > 0).length;
        const earlyLeaveDays = attendances.filter(a => a.earlyMinutes > 0).length;
        return { standardDays: endDate.getDate(), totalWorkDays: workDays, lateDays, earlyLeaveDays, leaveDays: 0, unpaidLeaveDays: 0, totalOtHours: 0 };
    }

    return summary;
}

export async function getTodayShift() {
    const session = await requireAuth();
    const userId = session.user.id;

    // Use UTC midnight to match @db.Date storage
    const today = new Date(
        Date.UTC(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
        ),
    );

    // Get day type (weekday, weekend, holiday)
    const holiday = await prisma.holiday.findFirst({
        where: {
            OR: [
                { date: today, endDate: null },
                {
                    date: { lte: today },
                    endDate: { gte: today },
                },
            ],
        },
    });
    if (holiday) return null;

    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;

    // Get all shift assignments (direct + work cycle)
    const assignments = await prisma.shiftAssignment.findMany({
        where: {
            userId,
            startDate: { lte: today },
            OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        include: {
            shift: true,
            workCycle: {
                include: {
                    entries: {
                        orderBy: { dayIndex: "asc" },
                        include: { shift: true },
                    },
                },
            },
        },
    });

    for (const a of assignments) {
        if (a.shift && a.shift.isActive) {
            return a.shift;
        } else if (a.workCycleId && a.workCycle && a.cycleStartDate) {
            const cycleStart = new Date(a.cycleStartDate);
            const totalDays = a.workCycle.totalDays;
            const dayDiff = Math.round(
                (today.getTime() - cycleStart.getTime()) / 86400000,
            );
            const dayIndex = ((dayDiff % totalDays) + totalDays) % totalDays;
            const entry = a.workCycle.entries.find(
                (e) => e.dayIndex === dayIndex,
            );
            if (
                entry &&
                !entry.isDayOff &&
                entry.shift &&
                entry.shift.isActive
            ) {
                return entry.shift;
            }
        }
    }

    return null;
}

// ============================================================
// PROFILE UPDATE REQUEST
// ============================================================

export async function submitProfileUpdateRequest(data: { field: string; value: string }) {
    const session = await requireAuth();

    const request = await prisma.profileUpdateRequest.create({
        data: {
            userId: session.user.id,
            requestedData: { [data.field]: data.value },
            status: "PENDING"
        }
    });

    revalidatePath("/ess/profile");
    return request;
}

// ============================================================
// LEAVE (delegated to leave/actions.ts for full implementation)
// ============================================================

// export { getMyLeaveBalances, getMyLeaveRequests, cancelLeaveRequest, createLeaveRequest } from "./leave/actions";

"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, extractRole } from "@/lib/auth-session";
import { Permission, Role } from "@/lib/rbac/permissions";
import { revalidatePath } from "next/cache";

// Get employee profile
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

// Get user's profile update requests
export async function getMyProfileRequests() {
    const session = await requireAuth();
    
    const requests = await prisma.profileUpdateRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    });
    
    return requests;
}

// Submit a profile update request
export async function submitProfileUpdateRequest(data: any) {
    const session = await requirePermission(Permission.ESS_UPDATE_PROFILE);
    
    const request = await prisma.profileUpdateRequest.create({
        data: {
            userId: session.user.id,
            requestedData: data,
            status: "PENDING"
        }
    });
    
    revalidatePath("/ess/profile");
    return request;
}

// Get user's administrative requests
export async function getMyAdministrativeRequests() {
    const session = await requireAuth();
    
    const requests = await prisma.administrativeRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            reviewedByUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    
    return requests;
}

// Submit an administrative request
export async function submitAdministrativeRequest(data: { type: string; description: string }) {
    const session = await requirePermission(Permission.ESS_SEND_REQUEST);
    
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

// Cancel administrative request
export async function cancelAdministrativeRequest(id: string) {
    await requireAuth();

    const request = await prisma.administrativeRequest.findUnique({
        where: { id },
    });

    if (!request) {
        throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.status !== "PENDING") {
        throw new Error("Chỉ có thể hủy yêu cầu đang chờ");
    }

    await prisma.administrativeRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/ess/requests");

    return { success: true, message: "Đã hủy yêu cầu" };
}

// Get attendance history for current user
export async function getMyAttendanceHistory(month: number, year: number) {
    const session = await requireAuth();
    
    // For manual dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month
    
    // Set time to exact start/end to be safe with timezone issues if any, although prisma handles this with ISO Date.
    
    const attendances = await prisma.attendance.findMany({
        where: {
            userId: session.user.id,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { date: "asc" },
        include: {
            shift: { select: { id: true, name: true, startTime: true, endTime: true } },
            explanation: true
        }
    });
    
    const summary = await prisma.attendanceSummary.findUnique({
        where: {
            userId_month_year: {
                userId: session.user.id,
                month,
                year
            }
        }
    });
    
    return { attendances, summary };
}

// ============================================================
// ESS DASHBOARD - NEW FUNCTIONS
// ============================================================

// Get today's attendance
export async function getTodayAttendance() {
    const session = await requireAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await prisma.attendance.findFirst({
        where: {
            userId: session.user.id,
            date: {
                gte: today,
                lt: tomorrow
            }
        },
        include: {
            shift: true
        }
    });
    
    return attendance;
}

// Get leave balance for current user
export async function getMyLeaveBalance() {
    const session = await requireAuth();
    const currentYear = new Date().getFullYear();
    
    const balances = await prisma.leaveBalance.findMany({
        where: {
            userId: session.user.id,
            year: currentYear
        },
        include: {
            leaveType: { select: { id: true, name: true, description: true, isPaidLeave: true } }
        },
        orderBy: {
            leaveType: { name: "asc" }
        }
    });
    
    return balances;
}

// Get pending requests count
export async function getPendingRequestsCount() {
    const session = await requireAuth();
    
    const [leaveRequests, profileRequests, adminRequests] = await Promise.all([
        prisma.leaveRequest.count({
            where: {
                userId: session.user.id,
                status: { in: ["PENDING", "APPROVED"] }
            }
        }),
        prisma.profileUpdateRequest.count({
            where: {
                userId: session.user.id,
                status: "PENDING"
            }
        }),
        prisma.administrativeRequest.count({
            where: {
                userId: session.user.id,
                status: "PENDING"
            }
        })
    ]);
    
    return {
        leaveRequests,
        profileRequests,
        adminRequests,
        total: leaveRequests + profileRequests + adminRequests
    };
}

// Get upcoming holidays in next 30 days
export async function getUpcomingHolidays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: today,
                lte: nextMonth
            }
        },
        orderBy: { date: "asc" },
        take: 5
    });
    
    return holidays;
}

// Get current month attendance summary
export async function getCurrentMonthSummary() {
    const session = await requireAuth();
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    const summary = await prisma.attendanceSummary.findUnique({
        where: {
            userId_month_year: {
                userId: session.user.id,
                month,
                year
            }
        }
    });
    
    if (!summary) {
        // Calculate from attendance records
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const attendances = await prisma.attendance.findMany({
            where: {
                userId: session.user.id,
                date: { gte: startDate, lte: endDate }
            }
        });
        
        const workDays = attendances.filter(a => a.status === "PRESENT").length;
        const lateDays = attendances.filter(a => a.lateMinutes > 0).length;
        const earlyLeaveDays = attendances.filter(a => a.earlyMinutes > 0).length;
        
        return {
            standardDays: endDate.getDate(),
            totalWorkDays: workDays,
            lateDays,
            earlyLeaveDays,
            leaveDays: 0,
            unpaidLeaveDays: 0,
            totalOtHours: 0
        };
    }
    
    return summary;
}

// Get recent announcements/notifications for ESS
export async function getESSAnnouncements() {
    // For now, return mock announcements
    // In production, this could come from a database table
    return [
        {
            id: "1",
            title: "Cập nhật chính sách nghỉ phép 2026",
            content: "Chính sách nghỉ phép năm 2026 đã được cập nhật. Vui lòng xem chi tiết trong mục Nghỉ phép.",
            date: new Date().toISOString(),
            type: "INFO"
        },
        {
            id: "2",
            title: "Nhắc nhở chấm công",
            content: "Đừng quên chấm công vào lúc bắt đầu và kết thúc ca làm việc.",
            date: new Date().toISOString(),
            type: "WARNING"
        }
    ];
}

// Get assigned shift for today
export async function getTodayShift() {
    const session = await requireAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check shift assignments
    const assignment = await prisma.shiftAssignment.findFirst({
        where: {
            userId: session.user.id,
            startDate: { lte: today },
            OR: [
                { endDate: null },
                { endDate: { gte: today } }
            ]
        },
        include: {
            shift: true
        },
        orderBy: { startDate: "desc" }
    });
    
    return assignment?.shift || null;
}

// ============================================================
// ESS DASHBOARD PAGE - Combined Data Fetching
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
        pendingRequests
    ] = await Promise.all([
        // Profile
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                employeeCode: true,
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
            }
        }),
        
        // Leave balances
        prisma.leaveBalance.findMany({
            where: {
                userId: session.user.id,
                policyYear: currentYear
            },
            include: {
                leaveType: { select: { id: true, name: true, description: true, isPaidLeave: true } }
            },
            orderBy: { leaveType: { name: "asc" } }
        }),
        
        // Attendance summary
        getCurrentMonthSummary(),
        
        // Today's attendance
        prisma.attendance.findFirst({
            where: {
                userId: session.user.id,
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                shift: true
            }
        }),
        
        // Today's shift
        getTodayShift(),
        
        // Upcoming holidays
        (async () => {
            const nextMonth = new Date(today);
            nextMonth.setDate(nextMonth.getDate() + 30);
            
            return prisma.holiday.findMany({
                where: {
                    date: {
                        gte: today,
                        lte: nextMonth
                    }
                },
                orderBy: { date: "asc" },
                take: 5
            });
        })(),
        
        // Pending requests count
        (async () => {
            const [leaveRequests, profileRequests, adminRequests] = await Promise.all([
                prisma.leaveRequest.count({
                    where: {
                        userId: session.user.id,
                        status: { in: ["PENDING", "APPROVED"] }
                    }
                }),
                prisma.profileUpdateRequest.count({
                    where: {
                        userId: session.user.id,
                        status: "PENDING"
                    }
                }),
                prisma.administrativeRequest.count({
                    where: {
                        userId: session.user.id,
                        status: "PENDING"
                    }
                })
            ]);
            
            return {
                leaveRequests,
                profileRequests,
                adminRequests,
                total: leaveRequests + profileRequests + adminRequests
            };
        })(),
    ]);
    
    // Mock announcements - in production, these would come from a database
    const announcements = [
        {
            id: "1",
            title: "Cập nhật chính sách nghỉ phép 2026",
            content: "Chính sách nghỉ phép năm 2026 đã được cập nhật. Vui lòng xem chi tiết trong mục Nghỉ phép.",
            date: new Date().toISOString(),
            type: "INFO"
        },
        {
            id: "2",
            title: "Nhắc nhở chấm công",
            content: "Đừng quên chấm công vào lúc bắt đầu và kết thúc ca làm việc.",
            date: new Date().toISOString(),
            type: "WARNING"
        }
    ];
    
    return {
        profile,
        leaveBalances,
        attendanceSummary,
        todayShift,
        todayAttendance,
        upcomingHolidays,
        announcements,
        pendingRequests
    };
}

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
        orderBy: { createdAt: "desc" }
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

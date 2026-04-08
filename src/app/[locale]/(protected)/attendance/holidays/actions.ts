"use server";

import { requirePermission } from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================
// HolidayCalendar - Lịch nghỉ lễ
// ============================================================

export async function getHolidayCalendars() {
    await requirePermission(Permission.HOLIDAY_VIEW);

    return prisma.holidayCalendar.findMany({
        include: {
            holidays: {
                orderBy: { date: "asc" },
            },
            _count: {
                select: {
                    holidays: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getHolidayCalendarById(id: string) {
    await requirePermission(Permission.HOLIDAY_VIEW);

    return prisma.holidayCalendar.findUnique({
        where: { id },
        include: {
            holidays: {
                orderBy: { date: "asc" },
            },
        },
    });
}

export async function createHolidayCalendar(data: {
    name: string;
    description?: string;
    year: number;
    isDefault?: boolean;
}) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    const calendar = await prisma.holidayCalendar.create({
        data: {
            name: data.name,
            description: data.description,
            year: data.year,
            isDefault: data.isDefault ?? false,
        },
    });

    // If set as default, unset other defaults
    if (data.isDefault) {
        await prisma.holidayCalendar.updateMany({
            where: {
                id: { not: calendar.id },
                isDefault: true,
            },
            data: { isDefault: false },
        });
    }

    revalidatePath("/attendance/holidays");
    return calendar;
}

export async function updateHolidayCalendar(
    id: string,
    data: {
        name?: string;
        description?: string;
        year?: number;
        isDefault?: boolean;
    }
) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    const calendar = await prisma.holidayCalendar.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            year: data.year,
            isDefault: data.isDefault,
        },
    });

    // If set as default, unset other defaults
    if (data.isDefault) {
        await prisma.holidayCalendar.updateMany({
            where: {
                id: { not: id },
                isDefault: true,
            },
            data: { isDefault: false },
        });
    }

    revalidatePath("/attendance/holidays");
    return calendar;
}

export async function deleteHolidayCalendar(id: string) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    await prisma.holidayCalendar.delete({
        where: { id },
    });

    revalidatePath("/attendance/holidays");
    return { success: true };
}

export async function copyHolidayCalendar(
    sourceId: string,
    targetYear: number,
    targetName?: string
) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    // Get source calendar with holidays
    const source = await prisma.holidayCalendar.findUnique({
        where: { id: sourceId },
        include: {
            holidays: true,
        },
    });

    if (!source) {
        throw new Error("Không tìm thấy lịch nguồn");
    }

    // Calculate year difference
    const yearDiff = targetYear - source.year;

    // Create new calendar
    const newCalendar = await prisma.holidayCalendar.create({
        data: {
            name: targetName || `${source.name.replace(/\d{4}/, String(targetYear))}`,
            description: source.description,
            year: targetYear,
            isDefault: false,
            holidays: {
                create: source.holidays.map((h) => ({
                    name: h.name,
                    date: new Date(
                        new Date(h.date).setFullYear(
                            new Date(h.date).getFullYear() + yearDiff
                        )
                    ),
                    halfDay: h.halfDay,
                })),
            },
        },
        include: {
            holidays: true,
        },
    });

    revalidatePath("/attendance/holidays");
    return newCalendar;
}

// ============================================================
// Holiday - Ngày nghỉ lễ
// ============================================================

export async function createHoliday(data: {
    holidayCalendarId: string;
    name: string;
    date: Date;
    endDate?: Date;
    isRecurring?: boolean;
    halfDay?: "FULL" | "MORNING" | "AFTERNOON";
}) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    const holiday = await prisma.holiday.create({
        data: {
            holidayCalendarId: data.holidayCalendarId,
            name: data.name,
            date: data.date,
            endDate: data.endDate,
            isRecurring: data.isRecurring ?? false,
            halfDay: data.halfDay || "FULL",
        },
    });

    revalidatePath("/attendance/holidays");
    return holiday;
}

export async function updateHoliday(
    id: string,
    data: {
        name?: string;
        date?: Date;
        endDate?: Date | null;
        isRecurring?: boolean;
        halfDay?: "FULL" | "MORNING" | "AFTERNOON";
    }
) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    const holiday = await prisma.holiday.update({
        where: { id },
        data: {
            name: data.name,
            date: data.date,
            endDate: data.endDate,
            isRecurring: data.isRecurring,
            halfDay: data.halfDay,
        },
    });

    revalidatePath("/attendance/holidays");
    return holiday;
}

export async function deleteHoliday(id: string) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    await prisma.holiday.delete({
        where: { id },
    });

    revalidatePath("/attendance/holidays");
    return { success: true };
}

// ============================================================
// Vietnam Holiday Templates
// ============================================================

const VIETNAM_HOLIDAYS_2025 = [
    { name: "Tết Dương lịch", date: new Date("2025-01-01"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-01-28"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-01-29"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-01-30"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-01-31"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-02-01"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2025-02-02"), halfDay: "FULL" as const },
    { name: "Giỗ Tổ Hùng Vương", date: new Date("2025-04-07"), halfDay: "FULL" as const },
    { name: "Ngày Thống nhất", date: new Date("2025-04-30"), halfDay: "FULL" as const },
    { name: "Ngày Quốc tế Lao động", date: new Date("2025-05-01"), halfDay: "FULL" as const },
    { name: "Ngày Quốc khánh", date: new Date("2025-09-02"), halfDay: "FULL" as const },
];

const VIETNAM_HOLIDAYS_2026 = [
    { name: "Tết Dương lịch", date: new Date("2026-01-01"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-16"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-17"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-18"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-19"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-20"), halfDay: "FULL" as const },
    { name: "Tết Nguyên Đán", date: new Date("2026-02-21"), halfDay: "FULL" as const },
    { name: "Giỗ Tổ Hùng Vương", date: new Date("2026-03-27"), halfDay: "FULL" as const },
    { name: "Ngày Thống nhất", date: new Date("2026-04-30"), halfDay: "FULL" as const },
    { name: "Ngày Quốc tế Lao động", date: new Date("2026-05-01"), halfDay: "FULL" as const },
    { name: "Ngày Quốc khánh", date: new Date("2026-09-02"), halfDay: "FULL" as const },
];

export async function createFromVietnamTemplate(
    year: number,
    calendarName?: string
) {
    await requirePermission(Permission.HOLIDAY_MANAGE);

    const holidays = year === 2025 ? VIETNAM_HOLIDAYS_2025 : VIETNAM_HOLIDAYS_2026;

    const calendar = await prisma.holidayCalendar.create({
        data: {
            name: calendarName || `Lịch nghỉ lễ Việt Nam ${year}`,
            description: `Lịch nghỉ lễ chính thức Việt Nam năm ${year}`,
            year,
            isDefault: true,
            holidays: {
                create: holidays.map((h: { name: string; date: Date; halfDay: string }) => ({
                    name: h.name,
                    date: h.date,
                    halfDay: h.halfDay || "FULL",
                })),
            },
        },
        include: {
            holidays: true,
        },
    });

    // Unset other defaults
    await prisma.holidayCalendar.updateMany({
        where: {
            id: { not: calendar.id },
            isDefault: true,
        },
        data: { isDefault: false },
    });

    revalidatePath("/attendance/holidays");
    return calendar;
}

// ============================================================
// Holidays (flat list)
// ============================================================

export async function getHolidays() {
    await requirePermission(Permission.HOLIDAY_VIEW);

    return prisma.holiday.findMany({
        orderBy: { date: "asc" },
    });
}

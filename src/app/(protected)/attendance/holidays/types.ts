// Types cho module Lịch nghỉ lễ (Holiday Calendar)

// ============================================================
// Base Types (dựa trên Prisma Schema)
// ============================================================

export interface Holiday {
    id: string;
    holidayCalendarId: string | null;
    name: string;
    date: Date;
    endDate: Date | null;
    isRecurring: boolean;
    year: number | null;
    halfDay: string | null;
    createdAt: Date;
}

export interface HolidayCalendar {
    id: string;
    name: string;
    description: string | null;
    year: number;
    isDefault: boolean;
    createdAt: Date;
}

// ============================================================
// Extended Types
// ============================================================

export interface HolidayWithRelations extends Holiday {
    holidayCalendar?: HolidayCalendar | null;
}

export interface HolidayCalendarWithRelations extends HolidayCalendar {
    holidays: Holiday[];
    _count?: {
        holidays: number;
    };
}

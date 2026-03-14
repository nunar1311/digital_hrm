"use server";

import {
    requireAuth,
    requirePermission,
    extractRole,
} from "@/lib/auth-session";
import { Permission } from "@/lib/rbac/permissions";
import { hasAnyPermission } from "@/lib/rbac/check-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { emitToAll, emitToUser } from "@/lib/socket/server";

// ─── HELPERS ───

function getDateRange(date: Date) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    // Use UTC to avoid timezone mismatch with @db.Date columns
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    return { start, end };
}

function getTodayDateRange() {
    return getDateRange(new Date());
}

/** Tính khoảng cách GPS theo công thức Haversine (đơn vị: mét) */
function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/** Parse time string "HH:mm" to { hours, minutes } */
function parseTime(timeStr: string) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
}

/** Tính số phút chênh lệch giữa 2 thời điểm */
function minutesDiff(a: Date, b: Date) {
    return Math.round((a.getTime() - b.getTime()) / 60000);
}

/** Xác định ngày thường / cuối tuần / lễ */
async function getDayType(
    date: Date,
): Promise<"WEEKDAY" | "WEEKEND" | "HOLIDAY"> {
    // Use UTC for @db.Date comparison
    const dateOnly = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    const holiday = await prisma.holiday.findFirst({
        where: {
            OR: [
                { date: dateOnly, endDate: null },
                {
                    date: { lte: dateOnly },
                    endDate: { gte: dateOnly },
                },
            ],
        },
    });
    if (holiday) return "HOLIDAY";

    const day = dateOnly.getDay();
    if (day === 0 || day === 6) return "WEEKEND";
    return "WEEKDAY";
}

/** Lấy hệ số OT theo loại ngày */
async function getOtCoefficient(
    dayType: "WEEKDAY" | "WEEKEND" | "HOLIDAY",
) {
    const config = await prisma.attendanceConfig.findFirst();
    if (!config) {
        return dayType === "HOLIDAY"
            ? 3.0
            : dayType === "WEEKEND"
              ? 2.0
              : 1.5;
    }
    switch (dayType) {
        case "HOLIDAY":
            return config.otHolidayCoeff;
        case "WEEKEND":
            return config.otWeekendCoeff;
        default:
            return config.otWeekdayCoeff;
    }
}

// ─── ATTENDANCE CONFIG ───

export async function getAttendanceConfig() {
    await requireAuth();
    const config = await prisma.attendanceConfig.findFirst({
        include: { wifiWhitelist: true },
    });
    return config;
}

export async function updateAttendanceConfig(data: {
    requireGps: boolean;
    requireWifi: boolean;
    requireSelfie: boolean;
    maxGpsDistanceMeters: number;
    officeLat: number | null;
    officeLng: number | null;
    standardWorkHours: number;
    standardWorkDays: number;
    otWeekdayCoeff: number;
    otWeekendCoeff: number;
    otHolidayCoeff: number;
}) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const existing = await prisma.attendanceConfig.findFirst();
    let config;
    if (existing) {
        config = await prisma.attendanceConfig.update({
            where: { id: existing.id },
            data,
        });
    } else {
        config = await prisma.attendanceConfig.create({ data });
    }

    emitToAll("config:updated", {
        configId: config.id,
        changes: data as Record<string, unknown>,
    });

    return config;
}

export async function addWifiWhitelist(
    configId: string,
    ssid: string,
    bssid?: string,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.wifiWhitelist.create({
        data: { configId, ssid, bssid },
    });
}

export async function removeWifiWhitelist(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.wifiWhitelist.delete({ where: { id } });
}

// ─── ANTI-FRAUD VERIFICATION ───

const CheckInMethodSchema = z.enum([
    "GPS",
    "WIFI",
    "FACE_ID",
    "MANUAL",
    "QR",
]);

const checkInOutSchema = z.object({
    method: CheckInMethodSchema,
    location: z.string().optional(),
    photo: z.string().optional(),
    wifiSsid: z.string().optional(),
    wifiBssid: z.string().optional(),
    shiftId: z.string().optional(),
});

async function verifyAntiFraud(
    data: z.infer<typeof checkInOutSchema>,
): Promise<{
    verified: boolean;
    errors: string[];
}> {
    const config = await prisma.attendanceConfig.findFirst({
        include: { wifiWhitelist: true },
    });
    if (!config) return { verified: true, errors: [] };

    const errors: string[] = [];

    // 1) GPS check
    if (config.requireGps && config.officeLat && config.officeLng) {
        if (!data.location) {
            errors.push("Yêu cầu bật GPS để chấm công.");
        } else {
            const [lat, lng] = data.location.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                const distance = haversineDistance(
                    lat,
                    lng,
                    config.officeLat,
                    config.officeLng,
                );
                if (distance > config.maxGpsDistanceMeters) {
                    errors.push(
                        `Bạn đang ở cách văn phòng ${Math.round(distance)}m (giới hạn: ${config.maxGpsDistanceMeters}m). Không thể chấm công từ xa.`,
                    );
                }
            }
        }
    }

    // 2) WiFi check
    if (config.requireWifi && config.wifiWhitelist.length > 0) {
        if (!data.wifiSsid) {
            errors.push("Yêu cầu kết nối WiFi công ty để chấm công.");
        } else {
            const matched = config.wifiWhitelist.some(
                (w) =>
                    w.ssid === data.wifiSsid ||
                    (w.bssid && w.bssid === data.wifiBssid),
            );
            if (!matched) {
                errors.push(
                    `WiFi "${data.wifiSsid}" không nằm trong danh sách WiFi được phép.`,
                );
            }
        }
    }

    // 3) Selfie check
    if (config.requireSelfie && !data.photo) {
        errors.push("Yêu cầu chụp ảnh selfie để chấm công.");
    }

    return { verified: errors.length === 0, errors };
}

// ─── CHECK-IN / CHECK-OUT ───

/** Lấy tất cả ca làm việc được phân công cho user trong ngày */
async function getTodayShiftsForUser(userId: string) {
    const now = new Date();
    // Use UTC midnight to match @db.Date storage
    const today = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

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

    const shifts: NonNullable<(typeof assignments)[0]["shift"]>[] =
        [];

    for (const a of assignments) {
        if (a.shift && a.shift.isActive) {
            // Direct shift assignment
            shifts.push(a.shift);
        } else if (a.workCycleId && a.workCycle && a.cycleStartDate) {
            // Work cycle assignment: resolve shift for today
            // cycleStartDate from @db.Date is already UTC midnight
            const cycleStart = new Date(a.cycleStartDate);
            const totalDays = a.workCycle.totalDays;
            const dayDiff = Math.round(
                (today.getTime() - cycleStart.getTime()) / 86400000,
            );
            const dayIndex =
                ((dayDiff % totalDays) + totalDays) % totalDays;
            const entry = a.workCycle.entries.find(
                (e) => e.dayIndex === dayIndex,
            );
            if (
                entry &&
                !entry.isDayOff &&
                entry.shift &&
                entry.shift.isActive
            ) {
                shifts.push(entry.shift);
            }
        }
    }

    // Sort by startTime and deduplicate by shift id
    const seen = new Set<string>();
    return shifts
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });
}

/** Từ danh sách ca, chọn ca phù hợp nhất theo thời gian hiện tại */
function detectCurrentShift<
    T extends { startTime: string; endTime: string },
>(shifts: T[]): T | null {
    if (shifts.length === 0) return null;
    if (shifts.length === 1) return shifts[0];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Ưu tiên 1: Ca đang diễn ra (có buffer 30 phút trước giờ bắt đầu)
    const activeShift = shifts.find((s) => {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        const shiftStart = sh * 60 + sm;
        const shiftEnd = eh * 60 + em;
        return (
            currentMinutes >= shiftStart - 30 &&
            currentMinutes <= shiftEnd + 15
        );
    });
    if (activeShift) return activeShift;

    // Ưu tiên 2: Ca sắp tới gần nhất
    const upcomingShift = shifts.find((s) => {
        const [sh, sm] = s.startTime.split(":").map(Number);
        return sh * 60 + sm > currentMinutes;
    });
    if (upcomingShift) return upcomingShift;

    // Fallback: Ca cuối cùng trong ngày
    return shifts[shifts.length - 1];
}

export async function getTodayAttendance() {
    const session = await requireAuth();
    const userId = session.user.id;
    const { start, end } = getTodayDateRange();

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId,
            date: { gte: start, lte: end },
        },
        include: { shift: true, explanation: true },
    });

    // Lấy tất cả ca làm được phân công hôm nay
    const todayShifts = await getTodayShiftsForUser(userId);
    const hasShiftToday = todayShifts.length > 0;

    // Xác định ca hiện tại: ưu tiên ca đã ghi trong attendance, rồi auto-detect
    let assignedShift = attendance?.shift ?? null;
    if (!assignedShift && hasShiftToday) {
        assignedShift = detectCurrentShift(todayShifts);
    }

    return {
        attendance,
        assignedShift,
        todayShifts,
        hasShiftToday,
    };
}

// ─── ATTENDANCE STATISTICS ───

export interface AttendanceStats {
    userId: string;
    periodType: "week" | "month";
    totalDays: number;
    presentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    absentDays: number;
    onLeaveDays: number;
    holidayDays: number;
    onTimeRate: number; // Tỷ lệ đúng giờ (không muộn, không sớm)
    lateRate: number;
    earlyLeaveRate: number;
    absentRate: number;
}

/**
 * Lấy thống kê chấm công theo tuần hoặc tháng
 * Dùng cho dashboard hiển thị tỷ lệ đúng giờ
 */
export async function getAttendanceStats(
    periodType: "week" | "month",
): Promise<AttendanceStats> {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (periodType === "week") {
        // Lấy tuần hiện tại (từ thứ 2 đến chủ nhật)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else {
        // Lấy tháng hiện tại
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Lấy holidays trong khoảng thời gian
    const holidays = await prisma.holiday.findMany({
        where: {
            OR: [
                { date: { gte: startDate, lte: endDate } },
                { endDate: { gte: startDate, lte: endDate } },
            ],
        },
    });

    const holidayDates = new Set<string>();
    for (const h of holidays) {
        const start = new Date(h.date);
        const end = h.endDate ? new Date(h.endDate) : start;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            holidayDates.add(d.toISOString().split("T")[0]);
        }
    }

    // Lấy attendance records trong khoảng thời gian
    const attendances = await prisma.attendance.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate },
        },
    });

    // Đếm số ngày trong tuần/tháng (trừ chủ nhật)
    let totalWorkDays = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
        if (current.getDay() !== 0 && !holidayDates.has(current.toISOString().split("T")[0])) {
            totalWorkDays++;
        }
        current.setDate(current.getDate() + 1);
    }

    // Thống kê theo status
    let presentDays = 0;
    let lateDays = 0;
    let earlyLeaveDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;

    for (const att of attendances) {
        switch (att.status) {
            case "PRESENT":
                presentDays++;
                break;
            case "LATE":
                lateDays++;
                break;
            case "EARLY_LEAVE":
                earlyLeaveDays++;
                break;
            case "LATE_AND_EARLY":
                lateDays++;
                earlyLeaveDays++;
                break;
            case "ABSENT":
                absentDays++;
                break;
            case "ON_LEAVE":
                onLeaveDays++;
                break;
            case "HALF_DAY":
                presentDays += 0.5;
                break;
        }
    }

    const holidayDays = holidayDates.size;

    // Tính tỷ lệ (chỉ tính trên ngày làm việc thực tế)
    const onTimeRate = totalWorkDays > 0 
        ? Math.round((presentDays / totalWorkDays) * 100 * 10) / 10 
        : 0;
    const lateRate = totalWorkDays > 0 
        ? Math.round((lateDays / totalWorkDays) * 100 * 10) / 10 
        : 0;
    const earlyLeaveRate = totalWorkDays > 0 
        ? Math.round((earlyLeaveDays / totalWorkDays) * 100 * 10) / 10 
        : 0;
    const absentRate = totalWorkDays > 0 
        ? Math.round((absentDays / totalWorkDays) * 100 * 10) / 10 
        : 0;

    return {
        userId,
        periodType,
        totalDays: totalWorkDays,
        presentDays,
        lateDays,
        earlyLeaveDays,
        absentDays,
        onLeaveDays,
        holidayDays,
        onTimeRate,
        lateRate,
        earlyLeaveRate,
        absentRate,
    };
}

const uploadPhoto = async (base64Data: string) => {
    return base64Data;
};

export async function checkIn(
    data: z.infer<typeof checkInOutSchema>,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_CHECKIN,
    );
    const userId = session.user.id;

    const parsedData = checkInOutSchema.parse(data);

    // Anti-fraud verification
    const verification = await verifyAntiFraud(parsedData);
    if (!verification.verified) {
        throw new Error(verification.errors.join("\n"));
    }

    let photoUrl = null;
    if (parsedData.photo) {
        photoUrl = await uploadPhoto(parsedData.photo);
    }

    const { start, end } = getTodayDateRange();

    const existing = await prisma.attendance.findFirst({
        where: { userId, date: { gte: start, lte: end } },
    });

    if (existing?.checkIn) {
        throw new Error("Bạn đã check-in cho ngày hôm nay rồi!");
    }

    const now = new Date();

    // ─── Kiểm tra ca làm việc ───
    // Chỉ cho phép check-in khi nhân viên có ca được phân công hôm nay
    const todayShifts = await getTodayShiftsForUser(userId);

    if (todayShifts.length === 0) {
        throw new Error(
            "Bạn không có ca làm việc hôm nay. Vui lòng liên hệ quản lý để được phân ca.",
        );
    }

    // Xác định ca: ưu tiên shiftId từ client, nếu không thì auto-detect
    let shift;
    if (parsedData.shiftId) {
        shift = todayShifts.find((s) => s.id === parsedData.shiftId);
        if (!shift) {
            throw new Error(
                "Ca làm việc được chọn không hợp lệ cho ngày hôm nay.",
            );
        }
    } else {
        shift = detectCurrentShift(todayShifts);
        if (!shift) {
            throw new Error(
                "Không xác định được ca làm việc. Vui lòng chọn ca cụ thể.",
            );
        }
    }

    // Kiểm tra check-in quá sớm — CHẶN nếu vượt quá giới hạn
    const config = await prisma.attendanceConfig.findFirst();
    const earlyCheckinLimit = config?.earlyCheckinMinutes ?? 60;

    const shiftStartParsed = parseTime(shift.startTime);
    const shiftStartDate = new Date(now);
    shiftStartDate.setHours(
        shiftStartParsed.hours,
        shiftStartParsed.minutes,
        0,
        0,
    );

    // Tính số phút đi muộn
    let lateMinutes = 0;
    let status = "PRESENT";
    const threshold = shift.lateThreshold;
    const diffMins = minutesDiff(now, shiftStartDate);

    // Chặn check-in quá sớm: nếu đến sớm hơn earlyCheckinLimit phút
    if (diffMins < -earlyCheckinLimit) {
        const minutesUntilAllowed =
            Math.abs(diffMins) - earlyCheckinLimit;
        const hoursLeft = Math.floor(minutesUntilAllowed / 60);
        const minsLeft = minutesUntilAllowed % 60;
        const timeStr =
            hoursLeft > 0
                ? `${hoursLeft} giờ ${minsLeft} phút`
                : `${minsLeft} phút`;
        throw new Error(
            `Check-in quá sớm! Ca "${shift.name}" bắt đầu lúc ${shift.startTime}. ` +
                `Bạn chỉ được check-in sớm tối đa ${earlyCheckinLimit} phút trước giờ ca. ` +
                `Vui lòng quay lại sau ${timeStr} nữa.`,
        );
    }

    if (diffMins > threshold) {
        lateMinutes = diffMins;
        status = "LATE";
    }

    const attendance = await prisma.attendance.upsert({
        where: { userId_date: { userId, date: start } },
        update: {
            checkIn: now,
            checkInMethod: parsedData.method,
            checkInLocation: parsedData.location,
            checkInPhoto: photoUrl,
            checkInVerified: verification.verified,
            lateMinutes,
            status,
            shiftId: shift.id,
            source: "WEB",
        },
        create: {
            userId,
            date: start,
            checkIn: now,
            checkInMethod: parsedData.method,
            checkInLocation: parsedData.location,
            checkInPhoto: photoUrl,
            checkInVerified: verification.verified,
            lateMinutes,
            status,
            shiftId: shift.id,
            source: "WEB",
        },
    });

    // Emit realtime event
    emitToAll("attendance:check-in", {
        attendanceId: attendance.id,
        userId,
        userName: session.user.name || "Unknown",
        checkInTime: now.toISOString(),
        status,
        lateMinutes,
        shiftName: shift.name,
    });

    revalidatePath("/attendance");
    return attendance;
}

export async function checkOut(
    data: z.infer<typeof checkInOutSchema>,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_CHECKIN,
    );
    const userId = session.user.id;

    const parsedData = checkInOutSchema.parse(data);

    // Anti-fraud
    const verification = await verifyAntiFraud(parsedData);
    if (!verification.verified) {
        throw new Error(verification.errors.join("\n"));
    }

    let photoUrl = null;
    if (parsedData.photo) {
        photoUrl = await uploadPhoto(parsedData.photo);
    }

    const { start, end } = getTodayDateRange();

    const existing = await prisma.attendance.findFirst({
        where: { userId, date: { gte: start, lte: end } },
        include: { shift: true },
    });

    if (!existing || !existing.checkIn) {
        throw new Error("Bạn chưa check-in ngày hôm nay!");
    }
    if (existing.checkOut) {
        throw new Error("Bạn đã check-out hôm nay rồi!");
    }
    if (!existing.shift) {
        throw new Error(
            "Bản ghi chấm công không có ca làm việc. Vui lòng liên hệ quản lý.",
        );
    }

    const now = new Date();
    const shift = existing.shift;

    // Tính giờ làm
    let workHours = 0;
    if (existing.checkIn) {
        const diffMs = now.getTime() - existing.checkIn.getTime();
        const breakMins = shift.breakMinutes;
        workHours = Math.max(
            0,
            Math.round(
                (diffMs / (1000 * 60 * 60) - breakMins / 60) * 100,
            ) / 100,
        );
    }

    // Tính về sớm
    let earlyMinutes = 0;
    let newStatus = existing.status;
    const shiftEnd = parseTime(shift.endTime);
    const shiftEndDate = new Date(now);
    shiftEndDate.setHours(shiftEnd.hours, shiftEnd.minutes, 0, 0);

    const earlyThreshold = shift.earlyThreshold;
    const diffMins = minutesDiff(shiftEndDate, now);
    if (diffMins > earlyThreshold) {
        earlyMinutes = diffMins;
        newStatus =
            existing.lateMinutes > 0
                ? "LATE_AND_EARLY"
                : "EARLY_LEAVE";
    }

    const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
            checkOut: now,
            checkOutMethod: parsedData.method,
            checkOutLocation: parsedData.location,
            checkOutPhoto: photoUrl,
            checkOutVerified: verification.verified,
            workHours,
            earlyMinutes,
            status: newStatus,
        },
    });

    // Emit realtime event
    emitToAll("attendance:check-out", {
        attendanceId: attendance.id,
        userId,
        userName: session.user.name || "Unknown",
        checkOutTime: now.toISOString(),
        status: newStatus,
        earlyMinutes,
        workHours,
        shiftName: shift.name,
    });

    revalidatePath("/attendance");
    return attendance;
}

// ─── SHIFTS ───

const shiftSchema = z.object({
    name: z.string().min(1, "Tên ca không được trống"),
    code: z.string().min(1, "Mã ca không được trống"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
    breakMinutes: z.coerce.number().min(0).default(60),
    lateThreshold: z.coerce.number().min(0).default(15),
    earlyThreshold: z.coerce.number().min(0).default(15),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

export async function getShifts() {
    await requirePermission(Permission.ATTENDANCE_VIEW_SELF);
    return prisma.shift.findMany({
        orderBy: { startTime: "asc" },
        include: {
            _count: {
                select: { attendances: true, shiftAssignments: true },
            },
        },
    });
}

export async function createShift(data: z.infer<typeof shiftSchema>) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    const parsed = shiftSchema.parse(data);

    if (parsed.isDefault) {
        await prisma.shift.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }

    const shift = await prisma.shift.create({ data: parsed });

    emitToAll("shift:updated", {
        shiftId: shift.id,
        shiftName: shift.name,
        action: "created",
    });

    revalidatePath("/attendance/shifts");
    return shift;
}

export async function updateShift(
    id: string,
    data: z.infer<typeof shiftSchema>,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    const parsed = shiftSchema.parse(data);

    if (parsed.isDefault) {
        await prisma.shift.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const shift = await prisma.shift.update({
        where: { id },
        data: parsed,
    });

    emitToAll("shift:updated", {
        shiftId: shift.id,
        shiftName: shift.name,
        action: "updated",
    });

    revalidatePath("/attendance/shifts");
    return shift;
}

export async function deleteShift(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const count = await prisma.attendance.count({
        where: { shiftId: id },
    });
    if (count > 0) {
        throw new Error(
            "Không thể xóa ca đã có dữ liệu chấm công. Vui lòng vô hiệu hóa thay vì xóa.",
        );
    }

    await prisma.shift.delete({ where: { id } });

    emitToAll("shift:updated", {
        shiftId: id,
        shiftName: "",
        action: "deleted",
    });

    revalidatePath("/attendance/shifts");
}

// ─── SHIFT ASSIGNMENTS ───

export async function assignShift(
    userId: string,
    shiftId: string,
    startDate: string,
    endDate?: string,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const assignment = await prisma.shiftAssignment.create({
        data: {
            userId,
            shiftId,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
        },
        include: { shift: true },
    });

    emitToUser(userId, "shift:assigned", {
        userId,
        shiftId,
        shiftName: assignment.shift?.name ?? "N/A",
        startDate,
        endDate,
    });

    return assignment;
}

export async function assignWorkCycle(
    userId: string,
    workCycleId: string,
    cycleStartDate: string,
    endDate?: string,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const cycle = await prisma.workCycle.findUnique({
        where: { id: workCycleId },
        include: { entries: { orderBy: { dayIndex: "asc" } } },
    });
    if (!cycle) throw new Error("Không tìm thấy chu kỳ làm việc");
    if (!cycle.isActive) throw new Error("Chu kỳ đã bị vô hiệu hóa");

    // Kiểm tra trùng lặp: user đã có cycle assignment chồng chéo?
    const existing = await prisma.shiftAssignment.findFirst({
        where: {
            userId,
            workCycleId: { not: null },
            startDate: {
                lte: endDate
                    ? new Date(endDate)
                    : new Date("2099-12-31"),
            },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date(cycleStartDate) } },
            ],
        },
    });
    if (existing) {
        throw new Error(
            "Nhân viên đã có chu kỳ làm việc trong khoảng thời gian này",
        );
    }

    const assignment = await prisma.shiftAssignment.create({
        data: {
            userId,
            workCycleId,
            cycleStartDate: new Date(cycleStartDate),
            startDate: new Date(cycleStartDate),
            endDate: endDate ? new Date(endDate) : null,
        },
        include: {
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

    emitToUser(userId, "shift:assigned", {
        userId,
        workCycleId,
        cycleName: cycle.name,
        cycleStartDate,
        endDate,
    });

    return assignment;
}

export async function assignWorkCycleToDepartment(
    departmentId: string,
    workCycleId: string,
    cycleStartDate: string,
    endDate?: string,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const cycle = await prisma.workCycle.findUnique({
        where: { id: workCycleId },
        include: { entries: { orderBy: { dayIndex: "asc" } } },
    });
    if (!cycle) throw new Error("Không tìm thấy chu kỳ làm việc");
    if (!cycle.isActive) throw new Error("Chu kỳ đã bị vô hiệu hóa");

    const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true },
    });
    if (!dept) throw new Error("Không tìm thấy phòng ban");

    const usersInDept = await prisma.user.findMany({
        where: { departmentId },
        select: { id: true, name: true },
    });
    if (usersInDept.length === 0) {
        throw new Error("Phòng ban không có nhân viên nào");
    }

    const endDateObj = endDate
        ? new Date(endDate)
        : new Date("2099-12-31");

    // Find users who already have an overlapping cycle assignment
    const existingAssignments = await prisma.shiftAssignment.findMany(
        {
            where: {
                userId: { in: usersInDept.map((u) => u.id) },
                workCycleId: { not: null },
                startDate: { lte: endDateObj },
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date(cycleStartDate) } },
                ],
            },
            select: { userId: true },
        },
    );
    const alreadyAssigned = new Set(
        existingAssignments.map((a) => a.userId),
    );
    const eligibleUsers = usersInDept.filter(
        (u) => !alreadyAssigned.has(u.id),
    );

    if (eligibleUsers.length === 0) {
        throw new Error(
            "Tất cả nhân viên trong phòng ban đã có chu kỳ làm việc trong khoảng thời gian này",
        );
    }

    // Batch create assignments for all eligible users
    await prisma.shiftAssignment.createMany({
        data: eligibleUsers.map((u) => ({
            userId: u.id,
            workCycleId,
            cycleStartDate: new Date(cycleStartDate),
            startDate: new Date(cycleStartDate),
            endDate: endDate ? new Date(endDate) : null,
        })),
    });

    // Emit WebSocket notifications to each user
    for (const u of eligibleUsers) {
        emitToUser(u.id, "shift:assigned", {
            userId: u.id,
            workCycleId,
            cycleName: cycle.name,
            cycleStartDate,
            endDate,
        });
    }

    const skipped = usersInDept.length - eligibleUsers.length;
    return {
        assigned: eligibleUsers.length,
        skipped,
        departmentName: dept.name,
    };
}

export async function getShiftAssignments(params?: {
    userId?: string;
    shiftId?: string;
}) {
    await requirePermission(Permission.ATTENDANCE_VIEW_SELF);
    return prisma.shiftAssignment.findMany({
        where: {
            ...(params?.userId && { userId: params.userId }),
            ...(params?.shiftId && { shiftId: params.shiftId }),
        },
        include: { user: true, shift: true },
        orderBy: { startDate: "desc" },
    });
}

/**
 * Get shift assignments for a date range (used by the calendar view).
 * Returns all assignments that overlap with [rangeStart, rangeEnd].
 */
export async function getShiftAssignmentsForRange(
    rangeStart: string,
    rangeEnd: string,
    departmentId?: string,
) {
    await requirePermission(Permission.ATTENDANCE_VIEW_SELF);

    const start = new Date(rangeStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(rangeEnd);
    end.setHours(23, 59, 59, 999);

    return prisma.shiftAssignment.findMany({
        where: {
            // assignment overlaps with the requested range
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
            ...(departmentId && {
                user: { departmentId },
            }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    departmentId: true,
                    image: true,
                },
            },
            shift: true,
            workCycle: {
                include: {
                    entries: {
                        orderBy: { dayIndex: "asc" },
                        include: {
                            shift: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    startTime: true,
                                    endTime: true,
                                    breakMinutes: true,
                                    lateThreshold: true,
                                    earlyThreshold: true,
                                    isDefault: true,
                                    isActive: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [{ user: { name: "asc" } }, { startDate: "asc" }],
    });
}

/**
 * Remove a shift assignment by id.
 */
export async function removeShiftAssignment(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const assignment = await prisma.shiftAssignment.findUnique({
        where: { id },
        include: { shift: true },
    });
    if (!assignment) throw new Error("Không tìm thấy phân ca");

    await prisma.shiftAssignment.delete({ where: { id } });

    emitToUser(assignment.userId, "shift:assigned", {
        userId: assignment.userId,
        action: "removed",
    });

    revalidatePath("/attendance/shifts");
    return { success: true };
}

// ─── OVERTIME ───

const overtimeSchema = z.object({
    date: z.string(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
    reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự"),
    targetUserId: z.string().optional(), // Quản lý tạo hộ cho NV
});

/** Kiểm tra giới hạn OT theo luật lao động */
async function validateOtLimits(
    userId: string,
    date: Date,
    hours: number,
) {
    const config = await prisma.attendanceConfig.findFirst();
    const standardHours = config?.standardWorkHours ?? 8;

    // Giới hạn 1: Không quá 50% giờ làm bình thường/ngày
    const maxDailyOt = standardHours * 0.5;
    if (hours > maxDailyOt) {
        throw new Error(
            `Số giờ OT không được vượt quá ${maxDailyOt}h/ngày (50% giờ làm chuẩn ${standardHours}h).`,
        );
    }

    // Giới hạn 2: Không quá 40 giờ/tháng
    const monthStart = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), 1),
    );
    const monthEnd = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
        ),
    );

    const monthlyOt = await prisma.overtimeRequest.aggregate({
        where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
            status: {
                in: [
                    "PENDING",
                    "MANAGER_APPROVED",
                    "HR_APPROVED",
                    "COMPLETED",
                ],
            },
        },
        _sum: { hours: true },
    });

    const currentMonthHours = monthlyOt._sum.hours ?? 0;
    if (currentMonthHours + hours > 40) {
        throw new Error(
            `Tổng giờ OT tháng này sẽ vượt quá 40 giờ (hiện tại: ${currentMonthHours}h, đăng ký: ${hours}h).`,
        );
    }
}

export async function createOvertimeRequest(
    data: z.infer<typeof overtimeSchema>,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_CHECKIN,
    );
    const role = extractRole(session);
    const parsed = overtimeSchema.parse(data);

    // Xác định NV làm OT: chính mình hoặc Quản lý tạo hộ
    let targetUserId = session.user.id;
    if (
        parsed.targetUserId &&
        parsed.targetUserId !== session.user.id
    ) {
        const canManage = hasAnyPermission(role, [
            Permission.ATTENDANCE_OVERTIME_APPROVE,
        ]);
        if (!canManage)
            throw new Error(
                "Bạn không có quyền tạo đơn OT cho người khác.",
            );
        targetUserId = parsed.targetUserId;
    }

    const requestDate = new Date(parsed.date);
    const dateUTC = new Date(
        Date.UTC(
            requestDate.getFullYear(),
            requestDate.getMonth(),
            requestDate.getDate(),
        ),
    );

    const start = parseTime(parsed.startTime);
    const end = parseTime(parsed.endTime);
    const hours = Math.max(
        0,
        (end.hours * 60 +
            end.minutes -
            start.hours * 60 -
            start.minutes) /
            60,
    );

    if (hours <= 0)
        throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");

    // Kiểm tra giới hạn luật lao động
    await validateOtLimits(targetUserId, dateUTC, hours);

    const dayType = await getDayType(dateUTC);
    const coefficient = await getOtCoefficient(dayType);

    const existing = await prisma.overtimeRequest.findFirst({
        where: {
            userId: targetUserId,
            date: dateUTC,
            status: {
                in: [
                    "PENDING",
                    "MANAGER_APPROVED",
                    "HR_APPROVED",
                    "COMPLETED",
                ],
            },
        },
    });
    if (existing)
        throw new Error(
            targetUserId === session.user.id
                ? "Bạn đã có đơn OT cho ngày này."
                : "Nhân viên này đã có đơn OT cho ngày này.",
        );

    const result = await prisma.overtimeRequest.create({
        data: {
            userId: targetUserId,
            requestedBy: session.user.id,
            date: dateUTC,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            hours,
            reason: parsed.reason,
            dayType,
            coefficient,
        },
    });

    emitToAll("overtime:requested", {
        requestId: result.id,
        userId: targetUserId,
        userName: session.user.name || "Unknown",
        date: dateUTC.toISOString(),
        hours,
        status: "PENDING",
    });

    revalidatePath("/attendance/overtime");
    return result;
}

export async function getOvertimeRequests(params?: {
    status?: string | string[];
    userId?: string;
    month?: number;
    year?: number;
    cursor?: string;
    pageSize?: number;
}) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canApprove = hasAnyPermission(role, [
        Permission.ATTENDANCE_OVERTIME_APPROVE,
    ]);
    const canHrReview = hasAnyPermission(role, [
        Permission.ATTENDANCE_OVERTIME_HR_REVIEW,
    ]);
    const canViewAll =
        hasAnyPermission(role, [Permission.ATTENDANCE_VIEW_ALL]) ||
        canApprove ||
        canHrReview;

    // DEPT_MANAGER: chỉ có APPROVE nhưng không có HR_REVIEW
    const isDeptManagerOnly = canApprove && !canHrReview;

    const where: Record<string, unknown> = {};

    if (!canViewAll) {
        // Nhân viên thường: chỉ xem đơn của mình
        where.userId = session.user.id;
    } else if (params?.userId) {
        where.userId = params.userId;
    } else if (isDeptManagerOnly && !params?.userId) {
        // DEPT_MANAGER: chỉ xem đơn từ nhân viên trong phòng ban mình quản lý
        const managedDepts = await prisma.department.findMany({
            where: { managerId: session.user.id },
            select: { id: true },
        });
        const managedDeptIds = managedDepts.map((d) => d.id);

        if (managedDeptIds.length > 0) {
            where.user = { departmentId: { in: managedDeptIds } };
        } else {
            // Không quản lý phòng ban nào → chỉ xem đơn của mình
            where.userId = session.user.id;
        }
    }

    if (params?.status) {
        where.status = Array.isArray(params.status)
            ? { in: params.status }
            : params.status;
    }

    if (params?.month && params?.year) {
        const startDate = new Date(
            Date.UTC(params.year, params.month - 1, 1),
        );
        const endDate = new Date(
            Date.UTC(params.year, params.month, 0, 23, 59, 59, 999),
        );
        where.date = { gte: startDate, lte: endDate };
    }

    const take = Math.min(params?.pageSize ?? 20, 100);

    const items = await prisma.overtimeRequest.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    employeeCode: true,
                    image: true,
                    departmentId: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(params?.cursor
            ? { cursor: { id: params.cursor }, skip: 1 }
            : {}),
    });

    const hasMore = items.length > take;
    if (hasMore) items.pop();

    return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
}

/** Quản lý trực tiếp duyệt/từ chối đơn OT (Bước 2) */
export async function managerApproveOvertimeRequest(
    id: string,
    action: "APPROVE" | "REJECT",
    note?: string,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_OVERTIME_APPROVE,
    );
    const role = extractRole(session);

    const request = await prisma.overtimeRequest.findUnique({
        where: { id },
        include: {
            user: { select: { departmentId: true } },
        },
    });
    if (!request) throw new Error("Đơn OT không tồn tại.");
    if (request.status !== "PENDING")
        throw new Error(
            "Đơn OT không ở trạng thái chờ duyệt quản lý.",
        );

    // DEPT_MANAGER chỉ được duyệt đơn từ nhân viên trong phòng ban mình quản lý
    const canHrReview = hasAnyPermission(role, [
        Permission.ATTENDANCE_OVERTIME_HR_REVIEW,
    ]);
    if (!canHrReview) {
        // Không phải DIRECTOR/HR_MANAGER → kiểm tra phòng ban
        const employeeDeptId = request.user?.departmentId;
        if (!employeeDeptId) {
            throw new Error(
                "Nhân viên chưa thuộc phòng ban nào, không thể duyệt.",
            );
        }
        const managedDept = await prisma.department.findFirst({
            where: {
                id: employeeDeptId,
                managerId: session.user.id,
            },
        });
        if (!managedDept) {
            throw new Error(
                "Bạn chỉ có thể duyệt đơn OT của nhân viên trong phòng ban bạn quản lý.",
            );
        }
    }

    if (action === "REJECT") {
        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedBy: session.user.id,
                rejectedAt: new Date(),
                rejectedReason: note || undefined,
                rejectedStep: "MANAGER",
            },
        });
        emitToUser(request.userId, "overtime:rejected", {
            requestId: id,
            rejectedBy: session.user.name || "Unknown",
            step: "MANAGER",
        });
        revalidatePath("/attendance/overtime");
        return updated;
    }

    // Kiểm tra giới hạn luật lao động trước khi duyệt
    await validateOtLimits(
        request.userId,
        request.date,
        request.hours,
    );

    const updated = await prisma.overtimeRequest.update({
        where: { id },
        data: {
            status: "MANAGER_APPROVED",
            managerApprovedBy: session.user.id,
            managerApprovedAt: new Date(),
            managerNote: note || undefined,
        },
    });

    emitToAll("overtime:manager-approved", {
        requestId: id,
        userId: request.userId,
        approvedBy: session.user.name || "Unknown",
        status: "MANAGER_APPROVED",
    });

    revalidatePath("/attendance/overtime");
    return updated;
}

/** HR kiểm soát và duyệt/từ chối đơn OT (Bước 3) */
export async function hrReviewOvertimeRequest(
    id: string,
    action: "APPROVE" | "REJECT",
    note?: string,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_OVERTIME_HR_REVIEW,
    );

    const request = await prisma.overtimeRequest.findUnique({
        where: { id },
    });
    if (!request) throw new Error("Đơn OT không tồn tại.");
    if (request.status !== "MANAGER_APPROVED")
        throw new Error(
            "Đơn OT chưa được quản lý duyệt hoặc đã xử lý.",
        );

    if (action === "REJECT") {
        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedBy: session.user.id,
                rejectedAt: new Date(),
                rejectedReason: note || undefined,
                rejectedStep: "HR",
            },
        });
        emitToUser(request.userId, "overtime:rejected", {
            requestId: id,
            rejectedBy: session.user.name || "Unknown",
            step: "HR",
        });
        revalidatePath("/attendance/overtime");
        return updated;
    }

    const updated = await prisma.overtimeRequest.update({
        where: { id },
        data: {
            status: "HR_APPROVED",
            hrApprovedBy: session.user.id,
            hrApprovedAt: new Date(),
            hrNote: note || undefined,
        },
    });

    emitToUser(request.userId, "overtime:hr-approved", {
        requestId: id,
        userId: request.userId,
        approvedBy: session.user.name || "Unknown",
        status: "HR_APPROVED",
    });

    revalidatePath("/attendance/overtime");
    return updated;
}

/** NV xác nhận giờ OT thực tế sau khi hoàn thành (Bước 4) */
export async function confirmOvertimeActualHours(
    id: string,
    data: {
        actualStartTime: string;
        actualEndTime: string;
    },
) {
    const session = await requireAuth();

    const request = await prisma.overtimeRequest.findUnique({
        where: { id },
    });
    if (!request) throw new Error("Đơn OT không tồn tại.");
    if (request.userId !== session.user.id)
        throw new Error("Bạn không có quyền xác nhận đơn này.");
    if (request.status !== "HR_APPROVED")
        throw new Error("Đơn OT chưa được HR duyệt.");

    const start = parseTime(data.actualStartTime);
    const end = parseTime(data.actualEndTime);
    const actualHours = Math.max(
        0,
        (end.hours * 60 +
            end.minutes -
            start.hours * 60 -
            start.minutes) /
            60,
    );

    if (actualHours <= 0)
        throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");

    const updated = await prisma.overtimeRequest.update({
        where: { id },
        data: {
            status: "COMPLETED",
            actualStartTime: data.actualStartTime,
            actualEndTime: data.actualEndTime,
            actualHours,
            confirmedAt: new Date(),
        },
    });

    emitToAll("overtime:completed", {
        requestId: id,
        userId: request.userId,
        actualHours,
    });

    revalidatePath("/attendance/overtime");
    return updated;
}

export async function cancelOvertimeRequest(id: string) {
    const session = await requireAuth();
    const request = await prisma.overtimeRequest.findUnique({
        where: { id },
    });

    if (!request) throw new Error("Đơn OT không tồn tại.");

    // Cho phép hủy nếu: là người tạo/NV được tạo hộ & đơn chưa hoàn thành
    const isOwner =
        request.userId === session.user.id ||
        request.requestedBy === session.user.id;
    if (!isOwner) throw new Error("Bạn không có quyền hủy đơn này.");
    if (
        request.status === "COMPLETED" ||
        request.status === "CANCELLED"
    )
        throw new Error(
            "Không thể hủy đơn đã hoàn thành hoặc đã hủy.",
        );

    const updated = await prisma.overtimeRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/attendance/overtime");
    return updated;
}

/** Lấy tổng hợp OT tháng cho userId */
export async function getOvertimeMonthlySummary(
    userId: string,
    month: number,
    year: number,
) {
    await requireAuth();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(
        Date.UTC(year, month, 0, 23, 59, 59, 999),
    );

    const requests = await prisma.overtimeRequest.findMany({
        where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
            status: { in: ["HR_APPROVED", "COMPLETED"] },
        },
    });

    let weekdayHours = 0;
    let weekendHours = 0;
    let holidayHours = 0;

    for (const r of requests) {
        const h = r.actualHours ?? r.hours;
        switch (r.dayType) {
            case "HOLIDAY":
                holidayHours += h;
                break;
            case "WEEKEND":
                weekendHours += h;
                break;
            default:
                weekdayHours += h;
        }
    }

    return {
        weekdayHours,
        weekendHours,
        holidayHours,
        totalHours: weekdayHours + weekendHours + holidayHours,
        count: requests.length,
    };
}

// ─── EXPLANATIONS ───

/**
 * Lấy danh sách bản ghi chấm công bất thường của user
 * (LATE, EARLY_LEAVE, LATE_AND_EARLY, ABSENT, HALF_DAY)
 * mà chưa có giải trình hoặc giải trình bị từ chối — để user có thể tạo giải trình mới.
 */
export async function getMyExplainableAttendances() {
    const session = await requireAuth();
    const userId = session.user.id;

    return prisma.attendance.findMany({
        where: {
            userId,
            status: {
                in: [
                    "LATE",
                    "EARLY_LEAVE",
                    "LATE_AND_EARLY",
                    "ABSENT",
                    "HALF_DAY",
                ],
            },
            OR: [
                { explanation: null },
                { explanation: { status: "REJECTED" } },
            ],
        },
        include: { shift: true, explanation: true },
        orderBy: { date: "desc" },
        take: 30,
    });
}

const explanationSchema = z.object({
    attendanceId: z.string(),
    type: z
        .enum([
            "LATE",
            "EARLY_LEAVE",
            "ABSENT",
            "FORGOT_CHECKOUT",
            "OTHER",
        ])
        .default("OTHER"),
    reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự"),
    attachment: z.string().optional(),
});

export async function submitExplanation(
    data: z.infer<typeof explanationSchema>,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_EXPLANATION,
    );
    const userId = session.user.id;

    const { attendanceId, type, reason, attachment } =
        explanationSchema.parse(data);

    const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
    });
    if (!attendance || attendance.userId !== userId) {
        throw new Error("Không tìm thấy bản ghi chấm công hợp lệ.");
    }

    const existing = await prisma.attendanceExplanation.findUnique({
        where: { attendanceId },
    });
    if (existing && existing.status === "APPROVED") {
        throw new Error("Giải trình đã được duyệt, không thể sửa.");
    }

    const explanation = await prisma.attendanceExplanation.upsert({
        where: { attendanceId },
        update: {
            type,
            reason,
            attachment,
            status: "PENDING",
            approvedBy: null,
            approvedAt: null,
            rejectedReason: null,
        },
        create: {
            attendanceId,
            type,
            reason,
            attachment,
        },
    });

    emitToAll("explanation:submitted", {
        explanationId: explanation.id,
        userId,
        userName: session.user.name || "Unknown",
        type,
        date: attendance.date.toISOString(),
    });

    revalidatePath("/attendance/explanations");
    return explanation;
}

export async function approveExplanation(
    explanationId: string,
    action: "APPROVED" | "REJECTED",
    rejectedReason?: string,
) {
    const session = await requirePermission(
        Permission.ATTENDANCE_APPROVE,
    );

    const explanation = await prisma.attendanceExplanation.update({
        where: { id: explanationId },
        data: {
            status: action,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            rejectedReason:
                action === "REJECTED" ? rejectedReason : null,
        },
        include: { attendance: true },
    });

    // Nếu duyệt: cập nhật lại status attendance về PRESENT
    if (action === "APPROVED" && explanation.attendance) {
        await prisma.attendance.update({
            where: { id: explanation.attendance.id },
            data: {
                status: "PRESENT",
                lateMinutes: 0,
                earlyMinutes: 0,
            },
        });
    }

    emitToUser(
        explanation.attendance?.userId || "",
        "explanation:approved",
        {
            explanationId,
            userId: explanation.attendance?.userId || "",
            approvedBy: session.user.name || "Unknown",
            status: action,
        },
    );

    revalidatePath("/attendance/explanations");
    return explanation;
}

export async function getMyExplanations() {
    const session = await requireAuth();

    return prisma.attendanceExplanation.findMany({
        where: { attendance: { userId: session.user.id } },
        include: {
            attendance: { include: { shift: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPendingExplanations() {
    await requirePermission(Permission.ATTENDANCE_APPROVE);

    return prisma.attendanceExplanation.findMany({
        where: { status: "PENDING" },
        include: {
            attendance: { include: { user: true, shift: true } },
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function getAllExplanations(params?: {
    status?: string;
}) {
    await requirePermission(Permission.ATTENDANCE_VIEW_ALL);

    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;

    return prisma.attendanceExplanation.findMany({
        where,
        include: {
            attendance: { include: { user: true, shift: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

// ─── MONTHLY ATTENDANCE ───

export async function getMonthlyAttendance(params: {
    month: number;
    year: number;
    departmentId?: string;
}) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.ATTENDANCE_VIEW_ALL,
    ]);
    const canViewTeam = hasAnyPermission(role, [
        Permission.ATTENDANCE_VIEW_TEAM,
    ]);

    const startDate = new Date(
        Date.UTC(params.year, params.month - 1, 1),
    );
    const endDate = new Date(
        Date.UTC(params.year, params.month, 0, 23, 59, 59, 999),
    );

    let userFilter: Record<string, unknown> = {};

    if (canViewAll) {
        if (params.departmentId) {
            userFilter = { departmentId: params.departmentId };
        }
    } else if (canViewTeam) {
        userFilter = {
            departmentId: session.user.departmentId || undefined,
        };
    } else {
        userFilter = { id: session.user.id };
    }

    const users = await prisma.user.findMany({
        where: userFilter,
        select: {
            id: true,
            name: true,
            employeeCode: true,
            departmentId: true,
        },
        orderBy: { name: "asc" },
    });

    const userIds = users.map((u) => u.id);
    const attendances = await prisma.attendance.findMany({
        where: {
            userId: { in: userIds },
            date: { gte: startDate, lte: endDate },
        },
        include: { shift: true, explanation: true },
        orderBy: { date: "asc" },
    });

    const overtimes = await prisma.overtimeRequest.findMany({
        where: {
            userId: { in: userIds },
            date: { gte: startDate, lte: endDate },
            status: "APPROVED",
        },
    });

    const holidays = await prisma.holiday.findMany({
        where: {
            OR: [
                { date: { gte: startDate, lte: endDate } },
                {
                    date: { lte: endDate },
                    endDate: { gte: startDate },
                },
            ],
        },
    });

    const daysInMonth = new Date(
        Date.UTC(params.year, params.month, 0),
    ).getUTCDate();

    // ─── Compute scheduled work days per user (shift assignments + work cycles) ───
    const shiftAssignments = await prisma.shiftAssignment.findMany({
        where: {
            userId: { in: userIds },
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
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

    const scheduledWorkDays: Record<string, number[]> = {};
    for (const a of shiftAssignments) {
        if (!scheduledWorkDays[a.userId])
            scheduledWorkDays[a.userId] = [];
        const workDaysSet = new Set(scheduledWorkDays[a.userId]);

        for (let d = 1; d <= daysInMonth; d++) {
            // Use UTC to match @db.Date storage
            const dayDate = new Date(
                Date.UTC(params.year, params.month - 1, d),
            );

            // Prisma @db.Date values are already UTC midnight
            const aStart = new Date(a.startDate);
            const aEnd = a.endDate ? new Date(a.endDate) : null;

            if (dayDate < aStart || (aEnd && dayDate > aEnd))
                continue;

            if (a.shift && a.shift.isActive) {
                // Direct shift assignment → scheduled to work
                workDaysSet.add(d);
            } else if (
                a.workCycleId &&
                a.workCycle &&
                a.cycleStartDate
            ) {
                // Work cycle → resolve based on day index
                // cycleStartDate from @db.Date is already UTC midnight
                const cycleStart = new Date(a.cycleStartDate);
                const totalDays = a.workCycle.totalDays;
                const dayDiff = Math.round(
                    (dayDate.getTime() - cycleStart.getTime()) /
                        86400000,
                );
                const dayIndex =
                    ((dayDiff % totalDays) + totalDays) % totalDays;
                const entry = a.workCycle.entries.find(
                    (e) => e.dayIndex === dayIndex,
                );
                if (
                    entry &&
                    !entry.isDayOff &&
                    entry.shift?.isActive
                ) {
                    workDaysSet.add(d);
                }
            }
        }

        scheduledWorkDays[a.userId] = [...workDaysSet];
    }

    return {
        users,
        attendances,
        overtimes,
        holidays,
        daysInMonth,
        month: params.month,
        year: params.year,
        scheduledWorkDays,
    };
}

// ─── ATTENDANCE SUMMARY ───

export async function calculateMonthlySummary(params: {
    month: number;
    year: number;
}) {
    await requirePermission(Permission.ATTENDANCE_VIEW_ALL);

    const { month, year } = params;
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(
        Date.UTC(year, month, 0, 23, 59, 59, 999),
    );

    const config = await prisma.attendanceConfig.findFirst();
    const standardWorkDays = config?.standardWorkDays || 22;

    const users = await prisma.user.findMany({
        select: { id: true },
    });

    const summaries = [];

    for (const user of users) {
        const attendances = await prisma.attendance.findMany({
            where: {
                userId: user.id,
                date: { gte: startDate, lte: endDate },
            },
        });

        const overtimes = await prisma.overtimeRequest.findMany({
            where: {
                userId: user.id,
                date: { gte: startDate, lte: endDate },
                status: "APPROVED",
            },
        });

        let totalWorkDays = 0;
        let lateDays = 0;
        let earlyLeaveDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        const unpaidLeaveDays = 0;
        let totalWorkHours = 0;

        for (const att of attendances) {
            if (
                [
                    "PRESENT",
                    "LATE",
                    "EARLY_LEAVE",
                    "LATE_AND_EARLY",
                ].includes(att.status)
            ) {
                totalWorkDays += 1;
            } else if (att.status === "HALF_DAY") {
                totalWorkDays += 0.5;
            } else if (att.status === "ON_LEAVE") {
                leaveDays += 1;
            } else if (att.status === "ABSENT") {
                absentDays += 1;
            }

            if (att.lateMinutes > 0) lateDays += 1;
            if (att.earlyMinutes > 0) earlyLeaveDays += 1;
            if (att.workHours) totalWorkHours += att.workHours;
        }

        let otHoursWeekday = 0;
        let otHoursWeekend = 0;
        let otHoursHoliday = 0;

        for (const ot of overtimes) {
            switch (ot.dayType) {
                case "WEEKDAY":
                    otHoursWeekday += ot.hours;
                    break;
                case "WEEKEND":
                    otHoursWeekend += ot.hours;
                    break;
                case "HOLIDAY":
                    otHoursHoliday += ot.hours;
                    break;
            }
        }

        const holidays = await prisma.holiday.findMany({
            where: {
                OR: [
                    { date: { gte: startDate, lte: endDate } },
                    {
                        date: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });

        let holidayDays = 0;
        for (const h of holidays) {
            if (h.endDate) {
                const hStart =
                    h.date > startDate ? h.date : startDate;
                const hEnd =
                    h.endDate < endDate ? h.endDate : endDate;
                holidayDays +=
                    Math.ceil(
                        (hEnd.getTime() - hStart.getTime()) /
                            (1000 * 60 * 60 * 24),
                    ) + 1;
            } else {
                holidayDays += 1;
            }
        }

        const totalOtHours =
            otHoursWeekday + otHoursWeekend + otHoursHoliday;

        const summaryData = {
            totalWorkDays,
            standardDays: standardWorkDays,
            lateDays,
            earlyLeaveDays,
            absentDays,
            leaveDays,
            unpaidLeaveDays,
            holidayDays,
            otHoursWeekday,
            otHoursWeekend,
            otHoursHoliday,
            totalOtHours,
            totalWorkHours,
        };

        const summary = await prisma.attendanceSummary.upsert({
            where: {
                userId_month_year: { userId: user.id, month, year },
            },
            update: summaryData,
            create: { userId: user.id, month, year, ...summaryData },
        });

        summaries.push(summary);
    }

    revalidatePath("/attendance/monthly");
    return summaries;
}

export async function getAttendanceSummaries(params: {
    month: number;
    year: number;
    departmentId?: string;
}) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.ATTENDANCE_VIEW_ALL,
    ]);

    let userFilter: Record<string, unknown> = {};
    if (canViewAll) {
        if (params.departmentId) {
            userFilter = { departmentId: params.departmentId };
        }
    } else {
        userFilter = { id: session.user.id };
    }

    const users = await prisma.user.findMany({
        where: userFilter,
        select: { id: true },
    });

    return prisma.attendanceSummary.findMany({
        where: {
            userId: { in: users.map((u) => u.id) },
            month: params.month,
            year: params.year,
        },
        include: {
            user: {
                select: { id: true, name: true, employeeCode: true },
            },
        },
        orderBy: { user: { name: "asc" } },
    });
}

export async function lockMonthlySummary(params: {
    month: number;
    year: number;
}) {
    const session = await requirePermission(
        Permission.ATTENDANCE_VIEW_ALL,
    );

    await prisma.attendanceSummary.updateMany({
        where: { month: params.month, year: params.year },
        data: {
            isLocked: true,
            lockedBy: session.user.id,
            lockedAt: new Date(),
        },
    });

    revalidatePath("/attendance/monthly");
}

// ─── EXPORT ATTENDANCE ───

export interface ExportAttendanceParams {
    month: number;
    year: number;
    departmentId?: string;
}

/**
 * Export bảng công tháng ra CSV (có thể mở trong Excel)
 */
export async function exportMonthlyAttendance(params: ExportAttendanceParams) {
    const session = await requireAuth();
    
    // Lấy dữ liệu monthly attendance
    const data = await getMonthlyAttendance(params);
    
    if (!data || !data.users || data.users.length === 0) {
        throw new Error("Không có dữ liệu để xuất");
    }

    const { users, attendances, holidays, daysInMonth, year, month } = data;
    
    // Tạo map ngày lễ
    const holidayDates = new Set<string>();
    for (const h of holidays || []) {
        const start = new Date(h.date);
        const end = h.endDate ? new Date(h.endDate) : start;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            holidayDates.add(d.toISOString().split("T")[0]);
        }
    }

    // Map attendance theo userId và ngày
    const attendanceMap = new Map<string, Record<string, string>>();
    for (const att of attendances || []) {
        const dateKey = new Date(att.date).toISOString().split("T")[0];
        if (!attendanceMap.has(att.userId)) {
            attendanceMap.set(att.userId, {});
        }
        attendanceMap.get(att.userId)![dateKey] = att.status;
    }

    // Tạo header CSV
    const headers = ["STT", "Mã NV", "Họ tên"];
    for (let d = 1; d <= daysInMonth; d++) {
        headers.push(`${d}`);
    }
    headers.push("Tổng công", "Đi muộn", "Về sớm", "Vắng mặt");

    // Map status sang ký hiệu
    const statusSymbols: Record<string, string> = {
        PRESENT: "✓",
        LATE: "M",
        EARLY_LEAVE: "S",
        LATE_AND_EARLY: "MS",
        ABSENT: "X",
        HALF_DAY: "0.5",
        ON_LEAVE: "P",
        HOLIDAY: "L",
    };

    // Tạo rows
    const rows: string[][] = [];
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userAttendance = attendanceMap.get(user.id) || {};
        
        const row: string[] = [
            String(i + 1),
            user.employeeCode || "",
            user.name,
        ];
        
        let totalWorkDays = 0;
        let lateDays = 0;
        let earlyLeaveDays = 0;
        let absentDays = 0;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const date = new Date(year, month - 1, d);
            const dayOfWeek = date.getDay();
            
            let symbol = "—";
            
            // Nếu là ngày lễ
            if (holidayDates.has(dateStr)) {
                symbol = "L";
            } 
            // Nếu là cuối tuần
            else if (dayOfWeek === 0 || dayOfWeek === 6) {
                symbol = "—";
            }
            // Ngày trong tương lai
            else if (date > new Date()) {
                symbol = "—";
            }
            else {
                const status = userAttendance[dateStr];
                if (status) {
                    symbol = statusSymbols[status] || status;
                    
                    // Đếm thống kê
                    if (status === "PRESENT" || status === "LATE" || status === "EARLY_LEAVE" || status === "LATE_AND_EARLY") {
                        totalWorkDays++;
                    }
                    if (status === "LATE" || status === "LATE_AND_EARLY") {
                        lateDays++;
                    }
                    if (status === "EARLY_LEAVE" || status === "LATE_AND_EARLY") {
                        earlyLeaveDays++;
                    }
                    if (status === "ABSENT") {
                        absentDays++;
                    }
                    if (status === "HALF_DAY") {
                        totalWorkDays += 0.5;
                    }
                } else {
                    // Không có attendance = vắng mặt (nếu là ngày trong quá khứ)
                    if (date < new Date()) {
                        symbol = "X";
                        absentDays++;
                    }
                }
            }
            
            row.push(symbol);
        }
        
        row.push(String(totalWorkDays));
        row.push(String(lateDays));
        row.push(String(earlyLeaveDays));
        row.push(String(absentDays));
        
        rows.push(row);
    }

    // Tạo CSV content
    const csvContent = [
        `BẢNG CHẤM CÔNG THÁNG ${month}/${year}`,
        "",
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return {
        csvContent,
        fileName: `bang_cong_${month}_${year}.csv`
    };
}

// ─── HOLIDAYS ───

export async function getHolidays(year?: number) {
    await requireAuth();
    return prisma.holiday.findMany({
        where: year
            ? { OR: [{ year }, { isRecurring: true }] }
            : undefined,
        orderBy: { date: "asc" },
    });
}

export async function createHoliday(data: {
    name: string;
    date: string;
    endDate?: string;
    isRecurring?: boolean;
}) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);

    const dateObj = new Date(data.date);
    return prisma.holiday.create({
        data: {
            name: data.name,
            date: dateObj,
            endDate: data.endDate ? new Date(data.endDate) : null,
            isRecurring: data.isRecurring || false,
            year: dateObj.getFullYear(),
        },
    });
}

export async function deleteHoliday(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.holiday.delete({ where: { id } });
}

// ─── TIMEKEEPER DEVICES ───

export async function getTimekeeperDevices() {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.timekeeperDevice.findMany({
        orderBy: { name: "asc" },
    });
}

export async function createTimekeeperDevice(data: {
    name: string;
    code: string;
    type: string;
    location?: string;
    ipAddress?: string;
    apiKey?: string;
}) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.timekeeperDevice.create({ data });
}

export async function updateTimekeeperDevice(
    id: string,
    data: {
        name?: string;
        type?: string;
        location?: string;
        ipAddress?: string;
        apiKey?: string;
        isActive?: boolean;
    },
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.timekeeperDevice.update({ where: { id }, data });
}

export async function deleteTimekeeperDevice(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.timekeeperDevice.delete({ where: { id } });
}

// ─── UTILITY ───

export async function getDepartments() {
    await requireAuth();
    return prisma.department.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
    });
}

export async function getUsers(departmentId?: string) {
    await requireAuth();
    return prisma.user.findMany({
        where: departmentId ? { departmentId } : undefined,
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            employeeCode: true,
            departmentId: true,
        },
    });
}

export async function getUsersPaginated({
    page = 1,
    pageSize = 10,
    search = "",
    departmentId,
}: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
}) {
    await requireAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (departmentId) {
        where.departmentId = departmentId;
    }

    if (search.trim()) {
        where.OR = [
            {
                name: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
            {
                employeeCode: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
        ];
    }

    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { name: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                name: true,
                employeeCode: true,
                departmentId: true,
                image: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return { users, totalCount, page, pageSize };
}

// ─── WORK CYCLES (Chu kỳ làm việc linh động) ───

const workCycleEntrySchema = z.object({
    dayIndex: z.number().min(0),
    shiftId: z.string().nullable(),
    isDayOff: z.boolean(),
});

const workCycleSchema = z.object({
    name: z.string().min(1, "Tên chu kỳ không được trống"),
    description: z.string().optional(),
    totalDays: z
        .number()
        .min(1, "Chu kỳ tối thiểu 1 ngày")
        .max(90, "Chu kỳ tối đa 90 ngày"),
    entries: z.array(workCycleEntrySchema),
});

export async function getWorkCycles() {
    await requirePermission(Permission.ATTENDANCE_VIEW_SELF);
    return prisma.workCycle.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            entries: {
                orderBy: { dayIndex: "asc" },
                include: {
                    shift: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                },
            },
        },
    });
}

export async function createWorkCycle(
    data: z.infer<typeof workCycleSchema>,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    const parsed = workCycleSchema.parse(data);

    if (parsed.entries.length !== parsed.totalDays) {
        throw new Error(
            `Số ngày trong entries (${parsed.entries.length}) không khớp totalDays (${parsed.totalDays})`,
        );
    }

    const cycle = await prisma.workCycle.create({
        data: {
            name: parsed.name,
            description: parsed.description,
            totalDays: parsed.totalDays,
            entries: {
                create: parsed.entries.map((e) => ({
                    dayIndex: e.dayIndex,
                    shiftId: e.isDayOff ? null : e.shiftId,
                    isDayOff: e.isDayOff,
                })),
            },
        },
        include: {
            entries: {
                orderBy: { dayIndex: "asc" },
                include: { shift: true },
            },
        },
    });

    revalidatePath("/attendance/settings");
    return cycle;
}

export async function updateWorkCycle(
    id: string,
    data: z.infer<typeof workCycleSchema>,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    const parsed = workCycleSchema.parse(data);

    if (parsed.entries.length !== parsed.totalDays) {
        throw new Error(
            `Số ngày trong entries (${parsed.entries.length}) không khớp totalDays (${parsed.totalDays})`,
        );
    }

    // Delete old entries, recreate
    await prisma.workCycleEntry.deleteMany({
        where: { workCycleId: id },
    });

    const cycle = await prisma.workCycle.update({
        where: { id },
        data: {
            name: parsed.name,
            description: parsed.description,
            totalDays: parsed.totalDays,
            entries: {
                create: parsed.entries.map((e) => ({
                    dayIndex: e.dayIndex,
                    shiftId: e.isDayOff ? null : e.shiftId,
                    isDayOff: e.isDayOff,
                })),
            },
        },
        include: {
            entries: {
                orderBy: { dayIndex: "asc" },
                include: { shift: true },
            },
        },
    });

    revalidatePath("/attendance/settings");
    return cycle;
}

export async function deleteWorkCycle(id: string) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    await prisma.workCycle.delete({ where: { id } });
    revalidatePath("/attendance/settings");
}

export async function toggleWorkCycleActive(
    id: string,
    isActive: boolean,
) {
    await requirePermission(Permission.ATTENDANCE_SHIFT_MANAGE);
    return prisma.workCycle.update({
        where: { id },
        data: { isActive },
    });
}

// ─── ATTENDANCE RECORDS (Admin detail view) ───

export async function getAttendanceRecords(params: {
    page?: number;
    pageSize?: number;
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
    userId?: string;
    status?: string;
    method?: string;
    verifiedOnly?: boolean;
}) {
    const session = await requireAuth();
    const role = extractRole(session);

    const canViewAll = hasAnyPermission(role, [
        Permission.ATTENDANCE_VIEW_ALL,
    ]);
    const canViewTeam = hasAnyPermission(role, [
        Permission.ATTENDANCE_VIEW_TEAM,
    ]);

    if (!canViewAll && !canViewTeam) {
        throw new Error("Bạn không có quyền xem nhật ký chấm công.");
    }

    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    // Build user filter
    const userWhere: Record<string, unknown> = {};
    if (canViewAll) {
        if (params.departmentId) {
            userWhere.departmentId = params.departmentId;
        }
        if (params.userId) {
            userWhere.id = params.userId;
        }
    } else if (canViewTeam) {
        userWhere.departmentId =
            session.user.departmentId || undefined;
        if (params.userId) {
            userWhere.id = params.userId;
        }
    }

    // Build attendance filter
    const where: Record<string, unknown> = {};

    if (Object.keys(userWhere).length > 0) {
        where.user = userWhere;
    }

    // Date range filter
    if (params.dateFrom || params.dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (params.dateFrom)
            dateFilter.gte = new Date(params.dateFrom);
        if (params.dateTo) {
            const to = new Date(params.dateTo);
            to.setHours(23, 59, 59, 999);
            dateFilter.lte = to;
        }
        where.date = dateFilter;
    }

    if (params.status) {
        where.status = params.status;
    }

    if (params.method) {
        where.OR = [
            { checkInMethod: params.method },
            { checkOutMethod: params.method },
        ];
    }

    if (params.verifiedOnly !== undefined) {
        if (params.verifiedOnly) {
            where.checkInVerified = true;
        } else {
            where.OR = [
                { checkInVerified: false },
                { checkOutVerified: false },
            ];
        }
    }

    const [records, total] = await Promise.all([
        prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        employeeCode: true,
                        image: true,
                    },
                },
                shift: true,
                explanation: true,
            },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            skip,
            take: pageSize,
        }),
        prisma.attendance.count({ where }),
    ]);

    return {
        records,
        total,
        page,
        pageSize,
    };
}

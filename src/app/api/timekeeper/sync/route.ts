import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook endpoint cho máy chấm công (vân tay, khuôn mặt, thẻ từ, QR).
 *
 * Payload:
 * {
 *   "employeeCode": "NV001",
 *   "timestamp": "2026-03-06T08:00:00Z",
 *   "deviceId": "DEVICE_01",
 *   "apiKey": "device-secret-key"   // optional if device auth enabled
 * }
 */

/** Parse "HH:mm" to { hours, minutes } */
function parseTime(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    return { hours: h, minutes: m };
}

/** Minutes between two dates */
function minutesDiff(a: Date, b: Date) {
    return Math.round((a.getTime() - b.getTime()) / 60000);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { employeeCode, timestamp, deviceId, apiKey } = body;

        if (!employeeCode || !timestamp) {
            return NextResponse.json(
                { error: "Missing employeeCode or timestamp" },
                { status: 400 },
            );
        }

        // ── Device Authentication ──
        let device = null;
        if (deviceId) {
            device = await prisma.timekeeperDevice.findUnique({
                where: { code: deviceId },
            });

            if (device) {
                // Check API key if device has one
                if (device.apiKey && device.apiKey !== apiKey) {
                    return NextResponse.json(
                        { error: "Invalid API key for device" },
                        { status: 401 },
                    );
                }

                if (!device.isActive) {
                    return NextResponse.json(
                        { error: "Device is deactivated" },
                        { status: 403 },
                    );
                }

                // Update device lastSync
                await prisma.timekeeperDevice.update({
                    where: { id: device.id },
                    data: { lastSync: new Date() },
                });
            }
        }

        const dateObj = new Date(timestamp);

        // ── Find user ──
        const user = await prisma.user.findUnique({
            where: { employeeCode },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Employee not found" },
                { status: 404 },
            );
        }

        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23, 59, 59, 999);

        // ── Get assigned shift ──
        const assignment = await prisma.shiftAssignment.findFirst({
            where: {
                userId: user.id,
                startDate: { lte: startOfDay },
                OR: [
                    { endDate: null },
                    { endDate: { gte: startOfDay } },
                ],
            },
            include: { shift: true },
            orderBy: { startDate: "desc" },
        });

        const shift =
            assignment?.shift ||
            (await prisma.shift.findFirst({
                where: { isDefault: true, isActive: true },
            }));

        // ── Check existing record ──
        const existingRecord = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                date: { gte: startOfDay, lte: endOfDay },
            },
        });

        if (!existingRecord) {
            // ── CHECK-IN (first punch) ──
            let lateMinutes = 0;
            let status = "PRESENT";

            if (shift) {
                const shiftStart = parseTime(shift.startTime);
                const shiftStartDate = new Date(dateObj);
                shiftStartDate.setHours(
                    shiftStart.hours,
                    shiftStart.minutes,
                    0,
                    0,
                );

                const diff = minutesDiff(dateObj, shiftStartDate);

                // Chặn check-in quá sớm
                const config =
                    await prisma.attendanceConfig.findFirst();
                const earlyCheckinLimit =
                    config?.earlyCheckinMinutes ?? 60;
                if (diff < -earlyCheckinLimit) {
                    return NextResponse.json(
                        { error: "Check-in quá sớm so với giờ ca" },
                        { status: 400 },
                    );
                }

                if (diff > shift.lateThreshold) {
                    lateMinutes = diff;
                    status = "LATE";
                }
            }

            await prisma.attendance.create({
                data: {
                    userId: user.id,
                    date: startOfDay,
                    checkIn: dateObj,
                    checkInMethod: "DEVICE",
                    checkInLocation: device
                        ? `${device.name} (${device.location || deviceId})`
                        : `Device: ${deviceId}`,
                    checkInVerified: true,
                    checkInDeviceId: device?.id,
                    lateMinutes,
                    status,
                    shiftId: shift?.id,
                    source: "DEVICE",
                },
            });

            return NextResponse.json(
                { message: "Check-in recorded", status, lateMinutes },
                { status: 201 },
            );
        } else {
            // ── CHECK-OUT (subsequent punch) ──
            let workHours = 0;
            if (existingRecord.checkIn) {
                const diffMs =
                    dateObj.getTime() -
                    existingRecord.checkIn.getTime();
                const breakMins = shift?.breakMinutes || 60;
                workHours = Math.max(
                    0,
                    Math.round(
                        (diffMs / (1000 * 60 * 60) - breakMins / 60) *
                            100,
                    ) / 100,
                );
            }

            let earlyMinutes = 0;
            let newStatus = existingRecord.status;

            if (shift) {
                const shiftEnd = parseTime(shift.endTime);
                const shiftEndDate = new Date(dateObj);
                shiftEndDate.setHours(
                    shiftEnd.hours,
                    shiftEnd.minutes,
                    0,
                    0,
                );

                const diff = minutesDiff(shiftEndDate, dateObj);
                if (diff > shift.earlyThreshold) {
                    earlyMinutes = diff;
                    newStatus =
                        existingRecord.lateMinutes > 0
                            ? "LATE_AND_EARLY"
                            : "EARLY_LEAVE";
                }
            }

            await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: {
                    checkOut: dateObj,
                    checkOutMethod: "DEVICE",
                    checkOutLocation: device
                        ? `${device.name} (${device.location || deviceId})`
                        : `Device: ${deviceId}`,
                    checkOutVerified: true,
                    checkOutDeviceId: device?.id,
                    workHours,
                    earlyMinutes,
                    status: newStatus,
                },
            });

            return NextResponse.json(
                {
                    message: "Check-out recorded",
                    status: newStatus,
                    workHours,
                    earlyMinutes,
                },
                { status: 200 },
            );
        }
    } catch (error: unknown) {
        const msg =
            error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

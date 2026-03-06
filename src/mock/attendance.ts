// =============================================================================
// Mock Attendance Data — Shifts, Records, OT
// =============================================================================

import type { Shift, Attendance, OvertimeRequest } from '@/types';
import { mockEmployees } from './employees';

export const mockShifts: Shift[] = [
    { id: 'shift-001', name: 'Ca hành chính', code: 'HC', startTime: '08:00', endTime: '17:00', breakMinutes: 60, isDefault: true, isActive: true },
    { id: 'shift-002', name: 'Ca sáng', code: 'CS', startTime: '06:00', endTime: '14:00', breakMinutes: 30, isDefault: false, isActive: true },
    { id: 'shift-003', name: 'Ca chiều', code: 'CC', startTime: '14:00', endTime: '22:00', breakMinutes: 30, isDefault: false, isActive: true },
];

const ATT_STATUSES: Attendance['status'][] = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'];

export function generateMonthlyAttendance(month: number, year: number): Attendance[] {
    const records: Attendance[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const employees = mockEmployees.slice(0, 10);

    employees.forEach(emp => {
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

            const status = ATT_STATUSES[Math.floor(Math.random() * ATT_STATUSES.length)];
            const late = status === 'LATE' ? Math.floor(Math.random() * 30) + 5 : 0;
            const checkInH = 8 + (late > 0 ? 0 : 0);
            const checkInM = late > 0 ? late : Math.floor(Math.random() * 5);

            records.push({
                id: `att-${emp.id}-${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`,
                employeeId: emp.id,
                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                shiftId: 'shift-001',
                checkIn: status === 'ABSENT' ? null : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(checkInH).padStart(2, '0')}:${String(checkInM).padStart(2, '0')}:00`,
                checkOut: status === 'ABSENT' ? null : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T17:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`,
                checkInMethod: status === 'ABSENT' ? null : 'MANUAL',
                checkOutMethod: status === 'ABSENT' ? null : 'MANUAL',
                workHours: status === 'ABSENT' ? 0 : status === 'HALF_DAY' ? 4 : 8,
                overtimeHours: Math.random() > 0.85 ? Math.round(Math.random() * 3 * 10) / 10 : 0,
                status,
                note: null, isLocked: false,
                createdAt: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T08:00:00Z`,
                employeeName: emp.fullName, employeeCode: emp.employeeCode,
                shiftName: 'Ca hành chính',
            });
        }
    });
    return records;
}

export const mockAttendance: Attendance[] = generateMonthlyAttendance(3, 2026);

export const mockOvertimeRequests: OvertimeRequest[] = [
    { id: 'ot-001', employeeId: 'emp-004', date: '2026-03-01', startTime: '17:30', endTime: '20:00', hours: 2.5, reason: 'Hoàn thành dự án gấp', status: 'APPROVED', approvedBy: 'emp-001', approvedAt: '2026-02-28T16:00:00Z', coefficient: 1.5, createdAt: '2026-02-28T10:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004' },
    { id: 'ot-002', employeeId: 'emp-007', date: '2026-03-05', startTime: '17:30', endTime: '19:30', hours: 2, reason: 'Fix bug production', status: 'PENDING', approvedBy: null, approvedAt: null, coefficient: 1.5, createdAt: '2026-03-04T15:00:00Z', employeeName: 'Trần Thị Linh', employeeCode: 'NV-007' },
    { id: 'ot-003', employeeId: 'emp-004', date: '2026-03-08', startTime: '08:00', endTime: '12:00', hours: 4, reason: 'Deploy hệ thống cuối tuần', status: 'APPROVED', approvedBy: 'emp-001', approvedAt: '2026-03-07T09:00:00Z', coefficient: 2.0, createdAt: '2026-03-06T14:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004' },
];

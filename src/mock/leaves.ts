// =============================================================================
// Mock Leave Data — Types, Balances, Requests
// =============================================================================

import type { LeaveType, LeaveBalance, LeaveRequest } from '@/types';
import { mockEmployees } from './employees';

export const mockLeaveTypes: LeaveType[] = [
    { id: 'lt-001', name: 'Nghỉ phép năm', code: 'ANNUAL', defaultDays: 12, isPaid: true, isCarryOver: true, maxCarryOverDays: 5, requireApproval: true, color: '#6366f1', isActive: true },
    { id: 'lt-002', name: 'Nghỉ ốm', code: 'SICK', defaultDays: 30, isPaid: true, isCarryOver: false, maxCarryOverDays: null, requireApproval: true, color: '#ef4444', isActive: true },
    { id: 'lt-003', name: 'Nghỉ cưới', code: 'WEDDING', defaultDays: 3, isPaid: true, isCarryOver: false, maxCarryOverDays: null, requireApproval: true, color: '#ec4899', isActive: true },
    { id: 'lt-004', name: 'Nghỉ thai sản', code: 'MATERNITY', defaultDays: 180, isPaid: true, isCarryOver: false, maxCarryOverDays: null, requireApproval: true, color: '#f59e0b', isActive: true },
    { id: 'lt-005', name: 'Nghỉ không lương', code: 'UNPAID', defaultDays: 0, isPaid: false, isCarryOver: false, maxCarryOverDays: null, requireApproval: true, color: '#6b7280', isActive: true },
    { id: 'lt-006', name: 'Nghỉ việc riêng', code: 'PERSONAL', defaultDays: 3, isPaid: false, isCarryOver: false, maxCarryOverDays: null, requireApproval: true, color: '#8b5cf6', isActive: true },
];

export function generateLeaveBalances(): LeaveBalance[] {
    const balances: LeaveBalance[] = [];
    mockEmployees.slice(0, 15).forEach(emp => {
        mockLeaveTypes.forEach(lt => {
            const used = lt.code === 'ANNUAL' ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3);
            balances.push({
                id: `lb-${emp.id}-${lt.id}`,
                employeeId: emp.id, leaveTypeId: lt.id, year: 2026,
                totalDays: lt.defaultDays, usedDays: used, remainDays: lt.defaultDays - used,
                leaveTypeName: lt.name, leaveTypeColor: lt.color || undefined,
            });
        });
    });
    return balances;
}

export const mockLeaveBalances: LeaveBalance[] = generateLeaveBalances();

const STATUSES: LeaveRequest['status'][] = ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'];

export const mockLeaveRequests: LeaveRequest[] = [
    { id: 'lr-001', employeeId: 'emp-007', leaveTypeId: 'lt-001', startDate: '2026-03-10', endDate: '2026-03-11', totalDays: 2, reason: 'Về quê thăm gia đình', status: 'PENDING', approvedBy: null, approvedAt: null, rejectedReason: null, attachmentUrl: null, createdAt: '2026-03-05T08:00:00Z', updatedAt: '2026-03-05T08:00:00Z', employeeName: 'Trần Thị Linh', employeeCode: 'NV-007', departmentName: 'Phòng Kỹ thuật', leaveTypeName: 'Nghỉ phép năm', leaveTypeColor: '#6366f1', approverName: undefined },
    { id: 'lr-002', employeeId: 'emp-004', leaveTypeId: 'lt-002', startDate: '2026-02-20', endDate: '2026-02-21', totalDays: 2, reason: 'Khám bệnh', status: 'APPROVED', approvedBy: 'emp-001', approvedAt: '2026-02-19T10:00:00Z', rejectedReason: null, attachmentUrl: null, createdAt: '2026-02-18T09:00:00Z', updatedAt: '2026-02-19T10:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004', departmentName: 'Phòng Kỹ thuật', leaveTypeName: 'Nghỉ ốm', leaveTypeColor: '#ef4444', approverName: 'Nguyễn Văn An' },
    { id: 'lr-003', employeeId: 'emp-015', leaveTypeId: 'lt-001', startDate: '2026-03-15', endDate: '2026-03-19', totalDays: 5, reason: 'Du lịch gia đình', status: 'APPROVED', approvedBy: 'emp-001', approvedAt: '2026-03-10T14:00:00Z', rejectedReason: null, attachmentUrl: null, createdAt: '2026-03-08T07:30:00Z', updatedAt: '2026-03-10T14:00:00Z', employeeName: 'Lê Thị Mai', employeeCode: 'NV-015', departmentName: 'Phòng Nhân sự', leaveTypeName: 'Nghỉ phép năm', leaveTypeColor: '#6366f1', approverName: 'Nguyễn Văn An' },
    { id: 'lr-004', employeeId: 'emp-030', leaveTypeId: 'lt-006', startDate: '2026-03-07', endDate: '2026-03-07', totalDays: 1, reason: 'Việc cá nhân', status: 'REJECTED', approvedBy: 'emp-004', approvedAt: null, rejectedReason: 'Đang trong thời gian thử việc', attachmentUrl: null, createdAt: '2026-03-06T08:00:00Z', updatedAt: '2026-03-06T10:00:00Z', employeeName: 'Hoàng Minh Đạt', employeeCode: 'NV-030', departmentName: 'Phòng Kỹ thuật', leaveTypeName: 'Nghỉ việc riêng', leaveTypeColor: '#8b5cf6', approverName: 'Phạm Đức Cường' },
];

// =============================================================================
// Mock Timeline Events — Employee Activity History
// =============================================================================

import type { TimelineEvent } from '@/types';

export const mockTimelineEvents: TimelineEvent[] = [
    // emp-001 (Giám đốc)
    { id: 'tl-001', employeeId: 'emp-001', date: '2018-01-15', type: 'HIRED', title: 'Gia nhập công ty', description: 'Nhận chức Giám đốc điều hành' },
    { id: 'tl-002', employeeId: 'emp-001', date: '2024-10-05', type: 'REWARD', title: 'Khen thưởng', description: 'Lãnh đạo công ty đạt doanh thu kỷ lục 2024', metadata: { amount: 20_000_000 } },

    // emp-004 (Trưởng phòng KT)
    { id: 'tl-003', employeeId: 'emp-004', date: '2019-06-01', type: 'HIRED', title: 'Gia nhập công ty', description: 'Nhận việc tại Phòng Kỹ thuật, vị trí Senior Developer' },
    { id: 'tl-004', employeeId: 'emp-004', date: '2020-06-01', type: 'CONTRACT_RENEWED', title: 'Gia hạn hợp đồng', description: 'Chuyển từ HĐ có thời hạn sang không thời hạn' },
    { id: 'tl-005', employeeId: 'emp-004', date: '2021-01-01', type: 'PROMOTED', title: 'Thăng chức', description: 'Từ Senior Developer lên Trưởng phòng Kỹ thuật', metadata: { fromPosition: 'Senior Developer', toPosition: 'Trưởng phòng Kỹ thuật' } },
    { id: 'tl-006', employeeId: 'emp-004', date: '2021-01-01', type: 'SALARY_CHANGE', title: 'Điều chỉnh lương', description: 'Tăng lương nhân dịp thăng chức', metadata: { oldSalary: 30_000_000, newSalary: 45_000_000 } },
    { id: 'tl-007', employeeId: 'emp-004', date: '2026-01-15', type: 'REWARD', title: 'Nhân viên xuất sắc Q4/2025', description: 'Hoàn thành xuất sắc dự án Digital HRM', metadata: { amount: 5_000_000 } },
    { id: 'tl-008', employeeId: 'emp-004', date: '2026-02-10', type: 'TRAINING', title: 'Hoàn thành khóa học', description: 'Kỹ năng quản lý thời gian — Điểm: 8.5/10' },

    // emp-007 (Junior Dev)
    { id: 'tl-009', employeeId: 'emp-007', date: '2023-03-01', type: 'HIRED', title: 'Gia nhập công ty', description: 'Nhận việc tại Phòng Kỹ thuật, vị trí Junior Developer' },
    { id: 'tl-010', employeeId: 'emp-007', date: '2023-05-01', type: 'CONTRACT_RENEWED', title: 'Kết thúc thử việc', description: 'Ký hợp đồng lao động chính thức' },
    { id: 'tl-011', employeeId: 'emp-007', date: '2024-03-01', type: 'SALARY_CHANGE', title: 'Review lương hàng năm', description: 'Điều chỉnh lương theo kết quả đánh giá', metadata: { oldSalary: 12_000_000, newSalary: 15_000_000 } },
    { id: 'tl-012', employeeId: 'emp-007', date: '2026-02-01', type: 'REWARD', title: 'Sáng kiến cải tiến', description: 'Đề xuất CI/CD pipeline giảm 50% thời gian deploy', metadata: { amount: 3_000_000 } },

    // emp-015 (Trưởng phòng NS)
    { id: 'tl-013', employeeId: 'emp-015', date: '2020-02-01', type: 'HIRED', title: 'Gia nhập công ty', description: 'Nhận việc tại Phòng Nhân sự, vị trí Nhân viên Nhân sự' },
    { id: 'tl-014', employeeId: 'emp-015', date: '2022-02-01', type: 'PROMOTED', title: 'Thăng chức', description: 'Từ Nhân viên Nhân sự lên Trưởng phòng Nhân sự' },
    { id: 'tl-015', employeeId: 'emp-015', date: '2025-03-01', type: 'LEAVE', title: 'Nghỉ phép', description: 'Nghỉ phép năm 5 ngày — Du lịch gia đình' },

    // emp-030 (Thực tập sinh)
    { id: 'tl-016', employeeId: 'emp-030', date: '2025-09-01', type: 'HIRED', title: 'Gia nhập công ty', description: 'Bắt đầu thực tập tại Phòng Kỹ thuật' },
    { id: 'tl-017', employeeId: 'emp-030', date: '2026-01-20', type: 'TRAINING', title: 'Hoàn thành khóa học', description: 'An toàn thông tin cơ bản — Điểm: 9.0/10' },
    { id: 'tl-018', employeeId: 'emp-030', date: '2026-03-01', type: 'DISCIPLINE', title: 'Nhắc nhở kỷ luật', description: 'Vi phạm quy định giờ làm việc — đi muộn 3 lần trong tháng' },
];

/** Get timeline events for a specific employee */
export function getEmployeeTimeline(employeeId: string): TimelineEvent[] {
    return mockTimelineEvents
        .filter(e => e.employeeId === employeeId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

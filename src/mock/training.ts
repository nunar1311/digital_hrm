// =============================================================================
// Mock Training & Performance Data
// =============================================================================

import type { TrainingCourse, TrainingParticipant, PerformanceCycle, PerformanceReview } from '@/types';

export const mockTrainingCourses: TrainingCourse[] = [
    { id: 'tc-001', name: 'Next.js 16 & React Server Components', description: 'Khóa học nâng cao về Next.js App Router và RSC', trainer: 'Phạm Đức Cường', startDate: '2026-03-15', endDate: '2026-03-17', location: 'Phòng họp A3', maxSlots: 20, status: 'PLANNED', createdAt: '2026-02-20T00:00:00Z', participantCount: 8 },
    { id: 'tc-002', name: 'Kỹ năng quản lý thời gian', description: 'Workshop soft skills cho toàn bộ nhân viên', trainer: 'Chuyên gia bên ngoài', startDate: '2026-02-10', endDate: '2026-02-10', location: 'Hội trường lớn', maxSlots: 50, status: 'COMPLETED', createdAt: '2026-01-15T00:00:00Z', participantCount: 35 },
    { id: 'tc-003', name: 'An toàn thông tin cơ bản', description: 'Bắt buộc cho tất cả nhân viên mới', trainer: 'IT Admin', startDate: '2026-01-20', endDate: '2026-01-20', location: 'Online', maxSlots: 100, status: 'COMPLETED', createdAt: '2026-01-05T00:00:00Z', participantCount: 40 },
    { id: 'tc-004', name: 'Kỹ năng lãnh đạo cho quản lý', description: 'Dành cho cấp trưởng phòng', trainer: 'Chuyên gia bên ngoài', startDate: '2026-04-01', endDate: '2026-04-03', location: 'Khách sạn Rex', maxSlots: 10, status: 'PLANNED', createdAt: '2026-03-01T00:00:00Z', participantCount: 0 },
];

export const mockTrainingParticipants: TrainingParticipant[] = [
    { id: 'tp-001', courseId: 'tc-001', employeeId: 'emp-007', status: 'ENROLLED', score: null, feedback: null, employeeName: 'Trần Thị Linh', employeeCode: 'NV-007', courseName: 'Next.js 16 & React Server Components' },
    { id: 'tp-002', courseId: 'tc-001', employeeId: 'emp-030', status: 'ENROLLED', score: null, feedback: null, employeeName: 'Hoàng Minh Đạt', employeeCode: 'NV-030', courseName: 'Next.js 16 & React Server Components' },
    { id: 'tp-003', courseId: 'tc-002', employeeId: 'emp-004', status: 'COMPLETED', score: 8.5, feedback: 'Nội dung thực tế, áp dụng được ngay', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004', courseName: 'Kỹ năng quản lý thời gian' },
    { id: 'tp-004', courseId: 'tc-003', employeeId: 'emp-030', status: 'COMPLETED', score: 9.0, feedback: 'Bổ ích', employeeName: 'Hoàng Minh Đạt', employeeCode: 'NV-030', courseName: 'An toàn thông tin cơ bản' },
];

export const mockPerformanceCycles: PerformanceCycle[] = [
    { id: 'pc-001', name: 'Đánh giá Q4/2025', startDate: '2025-10-01', endDate: '2025-12-31', status: 'CLOSED', reviewCount: 35 },
    { id: 'pc-002', name: 'Đánh giá Q1/2026', startDate: '2026-01-01', endDate: '2026-03-31', status: 'ACTIVE', reviewCount: 10 },
];

export const mockPerformanceReviews: PerformanceReview[] = [
    { id: 'pv-001', cycleId: 'pc-001', employeeId: 'emp-004', reviewerId: 'emp-001', selfScore: 8.5, managerScore: 9.0, finalScore: 8.8, strengths: 'Kỹ năng lãnh đạo tốt, giải quyết vấn đề nhanh', improvements: 'Cần cải thiện documentation', goals: 'Đào tạo 2 junior developers', status: 'COMPLETED', createdAt: '2026-01-10T00:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004', reviewerName: 'Nguyễn Văn An', cycleName: 'Đánh giá Q4/2025' },
    { id: 'pv-002', cycleId: 'pc-001', employeeId: 'emp-007', reviewerId: 'emp-004', selfScore: 7.0, managerScore: 7.5, finalScore: 7.3, strengths: 'Học hỏi nhanh, code sạch', improvements: 'Cần tự tin hơn trong giao tiếp', goals: 'Nâng level lên Mid-level', status: 'COMPLETED', createdAt: '2026-01-12T00:00:00Z', employeeName: 'Trần Thị Linh', employeeCode: 'NV-007', reviewerName: 'Phạm Đức Cường', cycleName: 'Đánh giá Q4/2025' },
    { id: 'pv-003', cycleId: 'pc-002', employeeId: 'emp-004', reviewerId: 'emp-001', selfScore: null, managerScore: null, finalScore: null, strengths: null, improvements: null, goals: null, status: 'SELF_REVIEW', createdAt: '2026-03-01T00:00:00Z', employeeName: 'Phạm Đức Cường', employeeCode: 'NV-004', reviewerName: 'Nguyễn Văn An', cycleName: 'Đánh giá Q1/2026' },
];

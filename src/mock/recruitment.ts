// =============================================================================
// Mock Recruitment Data — Job Postings + Candidates
// =============================================================================

import type { JobPosting, Candidate } from '@/types';

export const mockJobPostings: JobPosting[] = [
    { id: 'jp-001', title: 'Senior Frontend Developer', departmentId: 'dept-002', positionId: 'pos-004', description: 'Tìm kiếm Senior Frontend Developer có kinh nghiệm React/Next.js', requirements: '3+ năm kinh nghiệm React, TypeScript, Tailwind CSS', salaryMin: 25_000_000, salaryMax: 40_000_000, headcount: 2, employmentType: 'FULL_TIME', status: 'OPEN', deadline: '2026-04-30', createdBy: 'emp-004', createdAt: '2026-02-15T00:00:00Z', departmentName: 'Phòng Kỹ thuật', positionName: 'Senior Developer', candidateCount: 5 },
    { id: 'jp-002', title: 'Nhân viên Kinh doanh', departmentId: 'dept-003', positionId: 'pos-010', description: 'Tuyển NV kinh doanh phụ trách khu vực phía Nam', requirements: '1+ năm kinh nghiệm sales B2B', salaryMin: 12_000_000, salaryMax: 20_000_000, headcount: 3, employmentType: 'FULL_TIME', status: 'OPEN', deadline: '2026-04-15', createdBy: 'emp-015', createdAt: '2026-02-20T00:00:00Z', departmentName: 'Phòng Kinh doanh', positionName: 'Nhân viên Kinh doanh', candidateCount: 8 },
    { id: 'jp-003', title: 'Thực tập sinh Marketing', departmentId: 'dept-006', positionId: null, description: 'Thực tập content marketing và social media', requirements: 'Sinh viên năm 3-4 ngành Marketing hoặc Truyền thông', salaryMin: 3_000_000, salaryMax: 5_000_000, headcount: 1, employmentType: 'INTERN', status: 'OPEN', deadline: '2026-03-31', createdBy: 'emp-015', createdAt: '2026-03-01T00:00:00Z', departmentName: 'Phòng Marketing', positionName: undefined, candidateCount: 2 },
];

export const mockCandidates: Candidate[] = [
    { id: 'cand-001', jobPostingId: 'jp-001', name: 'Phan Thanh Tú', email: 'tu.phan@gmail.com', phone: '0901111222', resumeUrl: null, source: 'LINKEDIN', stage: 'INTERVIEW', rating: 4, notes: 'Strong React skills', interviewDate: '2026-03-10', createdAt: '2026-02-20T00:00:00Z', jobTitle: 'Senior Frontend Developer' },
    { id: 'cand-002', jobPostingId: 'jp-001', name: 'Đỗ Minh Khôi', email: 'khoi.do@gmail.com', phone: '0912222333', resumeUrl: null, source: 'REFERRAL', stage: 'SCREENING', rating: 3, notes: null, interviewDate: null, createdAt: '2026-02-25T00:00:00Z', jobTitle: 'Senior Frontend Developer' },
    { id: 'cand-003', jobPostingId: 'jp-001', name: 'Lê Hoàng Yến', email: 'yen.le@gmail.com', phone: '0923333444', resumeUrl: null, source: 'WEBSITE', stage: 'OFFER', rating: 5, notes: 'Excellent portfolio', interviewDate: '2026-03-05', createdAt: '2026-02-18T00:00:00Z', jobTitle: 'Senior Frontend Developer' },
    { id: 'cand-004', jobPostingId: 'jp-002', name: 'Trần Quốc Bảo', email: 'bao.tran@gmail.com', phone: '0934444555', resumeUrl: null, source: 'WEBSITE', stage: 'APPLIED', rating: null, notes: null, interviewDate: null, createdAt: '2026-03-01T00:00:00Z', jobTitle: 'Nhân viên Kinh doanh' },
    { id: 'cand-005', jobPostingId: 'jp-002', name: 'Nguyễn Thị Hạnh', email: 'hanh.nguyen@gmail.com', phone: '0945555666', resumeUrl: null, source: 'LINKEDIN', stage: 'REJECTED', rating: 2, notes: 'Không đủ kinh nghiệm', interviewDate: null, createdAt: '2026-02-28T00:00:00Z', jobTitle: 'Nhân viên Kinh doanh' },
];

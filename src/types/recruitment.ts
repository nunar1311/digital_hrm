// =============================================================================
// Recruitment Types
// Mirrors Prisma models: JobPosting, Candidate
// =============================================================================

export interface JobPosting {
    id: string;
    title: string;
    departmentId: string | null;
    positionId: string | null;
    description: string;
    requirements: string;
    salaryMin: number | null;
    salaryMax: number | null;
    headcount: number;
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'INTERN';
    status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ON_HOLD';
    deadline: string | null;
    createdBy: string;
    createdAt: string;
    // Resolved
    departmentName?: string;
    positionName?: string;
    candidateCount?: number;
}

export interface Candidate {
    id: string;
    jobPostingId: string;
    name: string;
    email: string;
    phone: string | null;
    resumeUrl: string | null;
    source: 'WEBSITE' | 'LINKEDIN' | 'REFERRAL' | null;
    stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
    rating: number | null;
    notes: string | null;
    interviewDate: string | null;
    createdAt: string;
    // Resolved
    jobTitle?: string;
}

// =============================================================================
// Training & Performance Types
// Mirrors Prisma models: TrainingCourse, TrainingParticipant,
//                        PerformanceCycle, PerformanceReview
// =============================================================================

export interface TrainingCourse {
    id: string;
    name: string;
    description: string | null;
    trainer: string | null;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    maxSlots: number | null;
    status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    // Resolved
    participantCount?: number;
}

export interface TrainingParticipant {
    id: string;
    courseId: string;
    employeeId: string;
    status: 'ENROLLED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    score: number | null;
    feedback: string | null;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    courseName?: string;
}

export interface PerformanceCycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'CLOSED';
    // Resolved
    reviewCount?: number;
}

export interface PerformanceReview {
    id: string;
    cycleId: string;
    employeeId: string;
    reviewerId: string;
    selfScore: number | null;
    managerScore: number | null;
    finalScore: number | null;
    strengths: string | null;
    improvements: string | null;
    goals: string | null;
    status: 'DRAFT' | 'SELF_REVIEW' | 'MANAGER_REVIEW' | 'COMPLETED';
    createdAt: string;
    // Resolved
    employeeName?: string;
    employeeCode?: string;
    reviewerName?: string;
    cycleName?: string;
}

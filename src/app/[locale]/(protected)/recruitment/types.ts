// Recruitment Types

export type EmploymentType =
    | "FULL_TIME"
    | "PART_TIME"
    | "INTERN"
    | "CONTRACT";
export type JobPostingStatus =
    | "DRAFT"
    | "OPEN"
    | "ON_HOLD"
    | "CLOSED";
export type JobPostingPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type CandidateStage =
    | "APPLIED"
    | "SCREENING"
    | "INTERVIEW"
    | "OFFER"
    | "HIRED"
    | "REJECTED";
export type CandidateSource =
    | "WEBSITE"
    | "LINKEDIN"
    | "FACEBOOK"
    | "REFERRAL"
    | "AGENCY"
    | "OTHER";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type InterviewType = "ONSITE" | "ONLINE" | "PHONE";
export type InterviewMethod = "INDIVIDUAL" | "GROUP" | "PANEL";
export type InterviewStatus =
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
export type InterviewResult = "PASS" | "FAIL" | "PENDING";

export interface JobPostingBasic {
    id: string;
    title: string;
    departmentId: string | null;
    departmentName?: string;
    positionId: string | null;
    positionName?: string;
    description: string;
    requirements: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    headcount: number;
    employmentType: EmploymentType;
    status: JobPostingStatus;
    priority: JobPostingPriority;
    deadline: string | null;
    benefits: string | null;
    workLocation: string | null;
    interviewRounds: number;
    createdBy: string;
    createdByName?: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    closedBy: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface JobPostingWithStats extends JobPostingBasic {
    candidateCount: number;
    interviewCount: number;
    hiredCount: number;
}

export interface CandidateBasic {
    id: string;
    jobPostingId: string;
    jobPostingTitle?: string;
    name: string;
    email: string;
    phone: string | null;
    gender: Gender | null;
    dateOfBirth: string | null;
    address: string | null;
    cvUrl: string | null;
    cvFileName: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    source: CandidateSource;
    sourceDetail: string | null;
    stage: CandidateStage;
    rating: number | null;
    rejectionReason: string | null;
    hiredSalary: number | null;
    hiredDate: string | null;
    notes: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CandidateWithRelations extends CandidateBasic {
    interviews: InterviewBasic[];
    candidateTags: CandidateTag[];
}

export interface CandidateTag {
    id: string;
    name: string;
    color: string;
}

export interface InterviewBasic {
    id: string;
    candidateId: string;
    candidateName?: string;
    jobPostingId: string;
    jobPostingTitle?: string;
    round: number;
    type: InterviewType;
    method: InterviewMethod;
    scheduledDate: string;
    scheduledTime: string;
    endTime: string | null;
    duration: number;
    location: string | null;
    meetingLink: string | null;
    meetingId: string | null;
    interviewerIds: string[];
    interviewerNames: string[];
    status: InterviewStatus;
    result: InterviewResult | null;
    score: number | null;
    strengths: string | null;
    weaknesses: string | null;
    notes: string | null;
    googleEventId: string | null;
    calendarSync: boolean;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface InterviewWithRelations extends InterviewBasic {
    feedbacks: InterviewFeedbackResponse[];
}

// Interview feedback as returned from database (Date objects and string enums)
export interface InterviewFeedbackResponse {
    id: string;
    interviewId: string;
    userId: string;
    userName: string;
    score: number | null;
    result: string | null; // Database returns string
    technicalSkill: number | null;
    communication: number | null;
    problemSolving: number | null;
    cultureFit: number | null;
    strengths: string | null;
    improvements: string | null;
    notes: string | null;
    createdAt: Date; // Database returns Date object
    updatedAt: Date; // Database returns Date object
}

export interface Department {
    id: string;
    name: string;
}

export interface Position {
    id: string;
    name: string;
    code: string | null;
}

// Form types
export interface CreateJobPostingForm {
    title: string;
    departmentId?: string;
    positionId?: string;
    description: string;
    requirements: string;
    salaryMin?: number;
    salaryMax?: number;
    headcount: number;
    employmentType: EmploymentType;
    priority: JobPostingPriority;
    deadline?: string;
    benefits?: string;
    workLocation?: string;
    interviewRounds: number;
}

export interface UpdateJobPostingForm extends CreateJobPostingForm {
    id: string;
    status?: JobPostingStatus;
}

export interface CreateCandidateForm {
    jobPostingId: string;
    name: string;
    email: string;
    phone?: string;
    gender?: Gender;
    dateOfBirth?: string;
    address?: string;
    cvUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    source: CandidateSource;
    sourceDetail?: string;
    notes?: string;
    tags?: string[];
}

export interface UpdateCandidateForm extends CreateCandidateForm {
    id: string;
    stage?: CandidateStage;
    rating?: number;
    rejectionReason?: string;
    hiredSalary?: number;
    hiredDate?: string;
}

export interface CreateInterviewForm {
    candidateId: string;
    jobPostingId: string;
    round: number;
    type: InterviewType;
    method: InterviewMethod;
    scheduledDate: string;
    scheduledTime: string;
    endTime?: string;
    duration: number;
    location?: string;
    meetingLink?: string;
    meetingId?: string;
    interviewerIds: string[];
}

export interface UpdateInterviewForm extends CreateInterviewForm {
    id: string;
    status?: InterviewStatus;
    result?: InterviewResult;
    score?: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
}

export interface SubmitFeedbackForm {
    interviewId: string;
    score?: number;
    result?: InterviewResult;
    technicalSkill?: number;
    communication?: number;
    problemSolving?: number;
    cultureFit?: number;
    strengths?: string;
    improvements?: string;
    notes?: string;
}

// Dashboard stats
export interface RecruitmentStats {
    totalJobPostings: number;
    openJobPostings: number;
    totalCandidates: number;
    activeCandidates: number;
    totalInterviews: number;
    upcomingInterviews: number;
    hiredThisMonth: number;
    averageHiringTime: number | null;
}

// Filter types
export interface JobPostingFilters {
    status?: JobPostingStatus | "";
    priority?: JobPostingPriority | "";
    departmentId?: string;
    search?: string;
}

export interface CandidateFilters {
    stage?: CandidateStage | "";
    jobPostingId?: string;
    source?: CandidateSource | "";
    search?: string;
    tags?: string[];
}

export interface InterviewFilters {
    status?: InterviewStatus | "";
    jobPostingId?: string;
    candidateId?: string;
    fromDate?: string;
    toDate?: string;
}

// Server response types (with pagination and string types from database)
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Interview type as returned from server (string enums instead of typed enums)
export interface InterviewResponse {
    id: string;
    candidateId: string;
    candidateName?: string;
    jobPostingId: string;
    jobPostingTitle?: string;
    round: number;
    type: string; // Database returns string
    method: string; // Database returns string
    scheduledDate: string;
    scheduledTime: string;
    endTime: string | null;
    duration: number;
    location: string | null;
    meetingLink: string | null;
    meetingId: string | null;
    interviewerIds: string[];
    interviewerNames: string[];
    status: string; // Database returns string
    result: string | null;
    score: number | null;
    strengths: string | null;
    weaknesses: string | null;
    notes: string | null;
    googleEventId: string | null;
    calendarSync: boolean;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    feedbacks: InterviewFeedbackResponse[];
}

// Job posting type with stats as returned from server
export interface JobPostingResponse {
    id: string;
    title: string;
    departmentId: string | null;
    departmentName?: string | null;
    positionId: string | null;
    positionName?: string | null;
    description: string;
    requirements: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    headcount: number;
    employmentType: string; // Database returns string
    status: string; // Database returns string
    priority: string; // Database returns string
    deadline: string | null;
    benefits: string | null;
    workLocation: string | null;
    interviewRounds: number;
    createdBy: string;
    createdByName?: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    closedBy: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    candidateCount: number;
    interviewCount: number;
    hiredCount: number;
}

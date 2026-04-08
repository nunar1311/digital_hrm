export type JobPostingStatus = "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
export type JobPostingPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "INTERN" | "CONTRACT";
export type CandidateStage = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
export type CandidateSource = "WEBSITE" | "LINKEDIN" | "FACEBOOK" | "REFERRAL" | "AGENCY" | "OTHER";
export type InterviewType = "ONSITE" | "ONLINE" | "PHONE";
export type InterviewMethod = "INDIVIDUAL" | "GROUP" | "PANEL";
export type InterviewStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InterviewResult = "PASS" | "FAIL" | "PENDING";

export const JOB_POSTING_STATUS = {
    DRAFT: { label: "Nháp", color: "secondary" },
    OPEN: { label: "Đang tuyển", color: "default" },
    ON_HOLD: { label: "Tạm dừng", color: "outline" },
    CLOSED: { label: "Đã đóng", color: "destructive" },
} as const;

export const JOB_POSTING_PRIORITY = {
    LOW: { label: "Thấp", color: "secondary" },
    NORMAL: { label: "Bình thường", color: "default" },
    HIGH: { label: "Cao", color: "warning" },
    URGENT: { label: "Khẩn cấp", color: "destructive" },
} as const;

export const EMPLOYMENT_TYPE = {
    FULL_TIME: { label: "Toàn thời gian" },
    PART_TIME: { label: "Bán thời gian" },
    INTERN: { label: "Thực tập" },
    CONTRACT: { label: "Hợp đồng" },
} as const;

export const CANDIDATE_STAGE = {
    APPLIED: { label: "Ứng tuyển", color: "default", order: 1 },
    SCREENING: { label: "Sàng lọc", color: "warning", order: 2 },
    INTERVIEW: { label: "Phỏng vấn", color: "info", order: 3 },
    OFFER: { label: "Đề xuất", color: "purple", order: 4 },
    HIRED: { label: "Đã tuyển", color: "success", order: 5 },
    REJECTED: { label: "Từ chối", color: "destructive", order: 6 },
} as const;

export const CANDIDATE_SOURCE = {
    WEBSITE: { label: "Website" },
    LINKEDIN: { label: "LinkedIn" },
    FACEBOOK: { label: "Facebook" },
    REFERRAL: { label: "Giới thiệu" },
    AGENCY: { label: "Đại lý" },
    OTHER: { label: "Khác" },
} as const;

export const INTERVIEW_TYPE = {
    ONSITE: { label: "Trực tiếp" },
    ONLINE: { label: "Online" },
    PHONE: { label: "Điện thoại" },
} as const;

export const INTERVIEW_METHOD = {
    INDIVIDUAL: { label: "Cá nhân" },
    GROUP: { label: "Nhóm" },
    PANEL: { label: "Hội đồng" },
} as const;

export const INTERVIEW_STATUS = {
    SCHEDULED: { label: "Đã lên lịch", color: "default" },
    IN_PROGRESS: { label: "Đang diễn ra", color: "warning" },
    COMPLETED: { label: "Hoàn thành", color: "success" },
    CANCELLED: { label: "Đã hủy", color: "destructive" },
    NO_SHOW: { label: "Không đến", color: "destructive" },
} as const;

export const INTERVIEW_RESULT = {
    PASS: { label: "Đạt", color: "success" },
    FAIL: { label: "Không đạt", color: "destructive" },
    PENDING: { label: "Chờ kết quả", color: "warning" },
} as const;

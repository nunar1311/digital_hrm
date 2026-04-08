// =============================================================================
// Onboarding Types - Tiếp nhận nhân sự
// =============================================================================

// ─── Enums / Constants ─────────────────────────────────────────────────────

export const ONBOARDING_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];

export const ONBOARDING_CATEGORY = {
  GENERAL: "GENERAL",
  EQUIPMENT: "EQUIPMENT",
  ACCOUNT: "ACCOUNT",
  DOCUMENTS: "DOCUMENTS",
  TRAINING: "TRAINING",
} as const;

export type OnboardingCategory = (typeof ONBOARDING_CATEGORY)[keyof typeof ONBOARDING_CATEGORY];

export const ONBOARDING_ASSIGNEE_ROLE = {
  IT_ADMIN: "IT_ADMIN",
  HR: "HR",
  ADMIN: "ADMIN",
  DEPT_MANAGER: "DEPT_MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type OnboardingAssigneeRole =
  (typeof ONBOARDING_ASSIGNEE_ROLE)[keyof typeof ONBOARDING_ASSIGNEE_ROLE];

export const CATEGORY_LABELS: Record<OnboardingCategory, string> = {
  GENERAL: "Chung",
  EQUIPMENT: "Trang thiết bị",
  ACCOUNT: "Tài khoản",
  DOCUMENTS: "Tài liệu",
  TRAINING: "Đào tạo",
};

export const ASSIGNEE_ROLE_LABELS: Record<OnboardingAssigneeRole, string> = {
  IT_ADMIN: "IT",
  HR: "HR",
  ADMIN: "Admin",
  DEPT_MANAGER: "Trưởng phòng",
  EMPLOYEE: "Nhân viên",
};

export const STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: "Chờ bắt đầu",
  IN_PROGRESS: "Đang tiếp nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

// ─── Prisma Types ──────────────────────────────────────────────────────────

export interface OnboardingTemplateDB {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks?: OnboardingTaskDB[];
}

export interface OnboardingTaskDB {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  category: string;
  assigneeRole: string | null;
  dueDays: number;
  sortOrder: number;
  isRequired: boolean;
  createdAt: Date;
}

export interface OnboardingDB {
  id: string;
  userId: string;
  templateId: string | null;
  candidateId: string | null;
  startDate: Date;
  completedDate: Date | null;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  checklist?: OnboardingChecklistDB[];
  template?: OnboardingTemplateDB | null;
  user?: OnboardingUserInfo;
  candidate?: OnboardingCandidateInfo;
}

export interface OnboardingChecklistDB {
  id: string;
  onboardingId: string;
  taskTitle: string;
  taskDescription: string | null;
  category: string;
  assigneeId: string | null;
  assigneeRole: string | null;
  isCompleted: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  dueDate: Date | null;
  notes: string | null;
  createdAt: Date;
  assignee?: OnboardingUserInfo | null;
  completedByUser?: OnboardingUserInfo | null;
}

export interface OnboardingUserInfo {
  id: string;
  name: string;
  email: string;
  employeeCode?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  position?: {
    id: string;
    name: string;
  } | null;
}

export interface OnboardingCandidateInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: string;
  jobPosting?: {
    id: string;
    title: string;
  };
}

// ─── UI Types ──────────────────────────────────────────────────────────────

export interface OnboardingWithProgress extends OnboardingDB {
  progress: number;
  completedCount: number;
  totalCount: number;
  checklistByCategory?: Record<string, OnboardingChecklistDB[]>;
}

export interface OnboardingListParams {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OnboardingListResult {
  data: OnboardingWithProgress[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Hire Candidate Types ─────────────────────────────────────────────────

export interface HireCandidateData {
  candidateId: string;
  departmentId: string;
  positionId: string;
  hireDate: Date;
  employmentType?: string;
  probationEndDate?: Date;
  salary?: number;
  sendWelcomeEmail?: boolean;
  startOnboarding?: boolean;
}

// ─── Onboarding Form Types ─────────────────────────────────────────────────

export interface CreateOnboardingData {
  userId: string;
  templateId?: string;
  startDate: Date;
  notes?: string;
}

export interface UpdateOnboardingData {
  status?: OnboardingStatus;
  notes?: string;
}

export interface UpdateChecklistData {
  isCompleted?: boolean;
  assigneeId?: string | null;
  notes?: string;
  completedBy?: string;
}

// ─── Template Management Types ────────────────────────────────────────────

export interface CreateTemplateData {
  name: string;
  description?: string;
  tasks?: CreateTaskData[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category?: OnboardingCategory;
  assigneeRole?: OnboardingAssigneeRole;
  dueDays?: number;
  sortOrder?: number;
  isRequired?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ─── Import/Export Types ────────────────────────────────────────────────

export interface ExportedTemplate {
  name: string;
  description: string;
  tasks: Array<{
    title: string;
    description: string;
    category: string;
    assigneeRole: string;
    dueDays: number;
    isRequired: boolean;
  }>;
}

export interface ImportedTemplateData {
  name: string;
  description?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    category?: string;
    assigneeRole?: string;
    dueDays?: number;
    isRequired?: boolean;
  }>;
}

// ─── Welcome Portal Types ─────────────────────────────────────────────────

export interface WelcomePortalData {
  onboarding: OnboardingDB;
  user: OnboardingUserInfo;
  checklistByCategory: Record<string, OnboardingChecklistDB[]>;
  completedTasks: number;
  totalTasks: number;
  assignedUsers: Record<string, OnboardingUserInfo>;
}
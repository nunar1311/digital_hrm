// ============================================================
// ONBOARDING TYPES — Tiếp nhận nhân sự
// ============================================================

export type OnboardingStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface OnboardingUserInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
}

export interface OnboardingItem {
  id: string;
  userId: string;
  user: OnboardingUserInfo;
  startDate: string;
  completedDate?: string | null;
  status: OnboardingStatus;
  notes?: string | null;
  progress: number;
  completedCount: number;
  totalCount: number;
  template?: { id: string; name: string } | null;
  createdAt: string;
}

export interface OnboardingPage {
  items: OnboardingItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OnboardingStats {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  total: number;
}

// ============================================================
// CONSTANTS
// ============================================================

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: "Chờ bắt đầu",
  IN_PROGRESS: "Đang tiếp nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ONBOARDING_STATUS_COLORS: Record<OnboardingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

import { z } from "zod";

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, "Phải chọn loại nghỉ phép"),
  startDate: z.date({ message: "Phải chọn ngày bắt đầu" }),
  endDate: z.date({ message: "Phải chọn ngày kết thúc" }),
  reason: z.string().optional(),
  documentUrl: z.string().optional(),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

// ============================================================
// SHARED TYPES for ESS Leave Module
// ============================================================

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  isPaidLeave: boolean;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  available: number;
  policyYear: number;
}

export interface LeaveTypeMinimal {
  id: string;
  name: string;
  isPaidLeave: boolean;
}

export interface LeaveRequestItem {
  id: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  documentUrl: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  leaveType: LeaveTypeMinimal | null;
  approvedByUser?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

export interface LeaveRequestsPage {
  items: LeaveRequestItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ESSLeaveClientProps {
  initialBalances: LeaveBalance[];
  initialRequests: LeaveRequestsPage;
}

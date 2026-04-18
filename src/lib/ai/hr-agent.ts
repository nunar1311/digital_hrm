"use client";

/**
 * HR Agent - Client-side agent orchestrator & types
 * Manages tool execution results, action state, and conversation context
 * for the AI-First HRM experience.
 */
import {
  FilePlus,
  PieChart,
  Users,
  CheckSquare,
  AlertTriangle,
  Flame,
  FileText,
  Megaphone,
  Activity,
  MessageSquare,
  Calendar,
  Search, // Thêm Search icon
  type LucideIcon,
} from "lucide-react";

// =====================
// Type Definitions
// =====================

export type ActionStatus =
  | "pending_confirmation"
  | "success"
  | "error"
  | "requires_info"
  | "executing";

export interface ActionProposal {
  id: string;
  tool: string;
  description: string;
  status: ActionStatus;
  displayMessage: string;
  data?: Record<string, unknown>;
  confirmationRequired: boolean;
  confirmationData?: Record<string, unknown>;
  error?: string | null;
  autoExecuted?: boolean;
}

export interface SmartChatResult {
  success: boolean;
  content?: string;
  dataSources?: string[];
  actions?: ActionProposal[];
  needsFollowup?: boolean;
  provider?: string;
  model?: string;
  usage?: Record<string, unknown>;
  error?: string;
}

export interface ExecuteActionResult {
  success: boolean;
  actionId: string;
  tool: string;
  status: string;
  displayMessage: string;
  data?: Record<string, unknown>;
  error?: string;
}

// =====================
// Quick Action Templates
// =====================

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
  category: "approval" | "risk" | "document" | "copilot" | "general" | "search";
  color: string;
  description: string;
  isNew?: boolean;
}

export const MANAGER_QUICK_ACTIONS: QuickAction[] = [
  // Phase 1 — HR Agent
  {
    id: "leave_balance",
    label: "Kiểm tra phép",
    icon: PieChart,
    prompt: "Kiểm tra số dư nghỉ phép của tôi",
    category: "general",
    color: "text-green-500",
    description: "Xem số ngày phép còn lại",
  },
  {
    id: "leave_request",
    label: "Tạo đơn nghỉ",
    icon: FilePlus,
    prompt: "Tôi muốn tạo đơn xin nghỉ phép",
    category: "general",
    color: "text-blue-500",
    description: "Soạn và gửi yêu cầu nghỉ",
  },
  {
    id: "query_employee",
    label: "Tra cứu nhân sự",
    icon: Search,
    prompt: "Tra cứu thông tin và số dư phép của nhân viên: ",
    category: "general",
    color: "text-purple-500",
    description: "Tìm thông tin & lượng phép",
  },

  // Phase 2 — Approval
  {
    id: "pending_approvals",
    label: "Đơn chờ duyệt",
    icon: CheckSquare,
    prompt: "Hiển thị các đơn nghỉ phép đang chờ tôi duyệt",
    category: "approval",
    color: "text-amber-500",
    description: "Phân tích & duyệt đơn",
    isNew: true,
  },

  // Phase 3 — Risk
  {
    id: "risk_assessment",
    label: "Cảnh báo rủi ro",
    icon: AlertTriangle,
    prompt: "Đánh giá rủi ro nghỉ việc của phòng ban tôi",
    category: "risk",
    color: "text-red-500",
    description: "Phát hiện nhân sự rời đi",
  },
  {
    id: "burnout_check",
    label: "Đồ thị Burnout",
    icon: Flame,
    prompt: "Phân tích nguy cơ kiệt sức (burnout) trong team",
    category: "risk",
    color: "text-orange-500",
    description: "Dựa trên OT & ngày làm",
    isNew: true,
  },

  // Phase 4 — Document
  {
    id: "generate_jd",
    label: "Tạo báo cáo",
    icon: FileText,
    prompt: "Tổng hợp báo cáo tình hình nhân sự tháng này",
    category: "document",
    color: "text-indigo-500",
    description: "Lên báo cáo nhanh",
  },
  {
    id: "generate_announcement",
    label: "Soạn thông báo",
    icon: Megaphone,
    prompt: "Soạn thông báo nội bộ về việc nghỉ lễ sắp tới",
    category: "document",
    color: "text-teal-500",
    description: "Tạo văn bản nội bộ",
    isNew: true,
  },

  // Phase 5 — Copilot
  {
    id: "team_health",
    label: "Tổng quan Team",
    icon: Users,
    prompt: "Cho tôi xem tổng quan danh sách và trạng thái team",
    category: "copilot",
    color: "text-emerald-500",
    description: "Danh sách thành viên",
    isNew: true,
  },
  {
    id: "1on1_prep",
    label: "Gợi ý 1-on-1",
    icon: MessageSquare,
    prompt: "Liệt kê các điểm cần lưu ý khi họp 1-on-1 với nhân viên tuần này",
    category: "copilot",
    color: "text-cyan-500",
    description: "Chuẩn bị Review",
  },
  {
    id: "deep_search",
    label: "Deep Search",
    icon: Search,
    prompt: "Tìm kiếm chuyên sâu trong toàn bộ hệ thống...",
    category: "search",
    color: "text-fuchsia-500",
    description: "Tìm kiếm thông tin nâng cao",
    isNew: true,
  }
];

export const EMPLOYEE_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "leave_balance",
    label: "Kiểm tra phép",
    icon: PieChart,
    prompt: "Kiểm tra số dư nghỉ phép của tôi",
    category: "general",
    color: "text-green-500",
    description: "Xem số ngày phép còn lại",
  },
  {
    id: "leave_request",
    label: "Tạo đơn nghỉ",
    icon: FilePlus,
    prompt: "Tôi muốn tạo đơn xin nghỉ phép",
    category: "general",
    color: "text-blue-500",
    description: "Soạn và gửi yêu cầu nghỉ",
  },
  {
    id: "payslip_check",
    label: "Xem lương",
    icon: Activity,
    prompt: "Cho tôi xem tổng quan phiếu lương gần nhất",
    category: "general",
    color: "text-amber-500",
    description: "Lương tháng vừa qua",
    isNew: true,
  },
  {
    id: "policy_search",
    label: "Hỏi đáp chính sách",
    icon: Megaphone,
    prompt: "Chính sách công tác phí của công ty là gì?",
    category: "search",
    color: "text-purple-500",
    description: "Tìm kiếm quy định nhân sự",
  },
  {
    id: "support_ticket",
    label: "Cần hỗ trợ",
    icon: MessageSquare,
    prompt: "Tôi cần hỗ trợ từ Phòng Nhân Sự hoặc IT",
    category: "copilot",
    color: "text-cyan-500",
    description: "Gửi yêu cầu hỗ trợ",
    isNew: true,
  }
];

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  general: "Đề xuất",
  approval: "Duyệt đơn",
  risk: "Phân tích rủi ro",
  document: "Tài liệu",
  copilot: "Nổi bật",
  search: "Tìm kiếm",
};

// =====================
// Response Parser Utilities
// =====================

/**
 * Parse the raw API response into structured SmartChatResult
 */
export function parseSmartChatResponse(raw: Record<string, unknown>): SmartChatResult {
  const actions: ActionProposal[] = [];

  if (Array.isArray(raw.actions)) {
    for (const a of raw.actions) {
      const action = a as Record<string, unknown>;
      actions.push({
        id: (action.id as string) || "",
        tool: (action.tool as string) || "",
        description: (action.description as string) || "",
        status: (action.status as ActionStatus) || "pending_confirmation",
        displayMessage: (action.display_message as string) || "",
        data: action.data as Record<string, unknown> | undefined,
        confirmationRequired: (action.confirmation_required as boolean) || false,
        confirmationData: action.confirmation_data as Record<string, unknown> | undefined,
        error: action.error as string | null | undefined,
        autoExecuted: (action.auto_executed as boolean) || false,
      });
    }
  }

  return {
    success: raw.success as boolean,
    content: raw.content as string | undefined,
    dataSources: raw.data_sources as string[] | undefined,
    actions: actions.length > 0 ? actions : undefined,
    needsFollowup: (raw.needs_followup as boolean) || false,
    provider: raw.provider as string | undefined,
    model: raw.model as string | undefined,
    error: raw.error as string | undefined,
  };
}

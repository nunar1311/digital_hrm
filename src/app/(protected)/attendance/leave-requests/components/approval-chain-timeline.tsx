"use client";

import { CheckCircle2, XCircle, Clock, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Re-exported so parent can import type from here
export interface ApprovalStepRecord {
  stepOrder: number;
  stepType: "APPROVER" | "CONDITION";
  approverType?: string;
  approverIds?: string[];
  approverNames?: string[];
  approvalMethod?: "ALL_MUST_APPROVE" | "FIRST_APPROVES";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  actedBy?: string;
  actedByName?: string;
  actedAt?: string;
  comment?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STEP_STATUS_CONFIG = {
  APPROVED: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-700 border-green-200",
    label: "Đã duyệt",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Từ chối",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Chờ duyệt",
  },
  SKIPPED: {
    icon: ChevronRight,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    badge: "bg-muted text-muted-foreground",
    label: "Bỏ qua",
  },
} as const;

const APPROVER_TYPE_LABELS: Record<string, string> = {
  DIRECT_MANAGER: "Quản lý trực tiếp",
  DEPT_HEAD: "Trưởng phòng",
  CUSTOM_LIST: "Người duyệt chỉ định",
};

interface ApprovalChainTimelineProps {
  chain: ApprovalStepRecord[];
  currentStep: number;
}

export function ApprovalChainTimeline({
  chain,
  currentStep,
}: ApprovalChainTimelineProps) {
  if (!chain || chain.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        Không có luồng duyệt đa cấp cho đơn này.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {chain.map((step, idx) => {
        const config = STEP_STATUS_CONFIG[step.status as keyof typeof STEP_STATUS_CONFIG] ?? STEP_STATUS_CONFIG.PENDING;
        const Icon = config.icon;
        const isActive = idx === currentStep && step.status === "PENDING";
        const isLast = idx === chain.length - 1;

        return (
          <div key={idx} className="flex gap-3">
            {/* Left: icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                  config.bg,
                  config.border,
                  isActive && "ring-2 ring-amber-400 ring-offset-1"
                )}
              >
                <Icon className={cn("size-3.5", config.color)} />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 mt-1 mb-1 min-h-[20px]",
                    step.status === "APPROVED"
                      ? "bg-green-300 dark:bg-green-700"
                      : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Right: content */}
            <div
              className={cn(
                "flex-1 border rounded-lg p-3 mb-2 text-sm transition-colors",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs">
                    Bước {step.stepOrder}
                  </span>
                  {step.approverType && (
                    <span className="text-xs text-muted-foreground">
                      · {APPROVER_TYPE_LABELS[step.approverType] ?? step.approverType}
                    </span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] shrink-0", config.badge)}
                >
                  {config.label}
                </Badge>
              </div>

              {/* Approver list */}
              {step.approverNames && step.approverNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {step.approverNames.map((name: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 text-xs bg-background/70 rounded-md px-1.5 py-0.5 border"
                    >
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[8px]">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      {name}
                    </div>
                  ))}
                </div>
              )}

              {/* Acted by */}
              {step.actedBy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="size-3" />
                  <span>
                    {step.actedByName ?? step.actedBy}
                    {step.actedAt && (
                      <span className="ml-1 opacity-70">
                        · {formatDate(step.actedAt)}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Comment / rejection reason */}
              {step.comment && (
                <div className="mt-2 text-xs bg-background/60 rounded p-2 border italic text-muted-foreground">
                  &ldquo;{step.comment}&rdquo;
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Đang chờ duyệt tại bước này
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

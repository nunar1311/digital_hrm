"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/contract";

const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PENDING_SIGN: "Chờ ký",
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Hết hạn",
  TERMINATED: "Đã chấm dứt",
};

const STATUS_CLASSES: Record<ContractStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-transparent",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-transparent",
  APPROVED: "bg-blue-100 text-blue-800 border-transparent",
  PENDING_SIGN: "bg-purple-100 text-purple-800 border-transparent",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-transparent",
  EXPIRED: "bg-slate-200 text-slate-700 border-transparent",
  TERMINATED: "bg-rose-100 text-rose-800 border-transparent",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_CLASSES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

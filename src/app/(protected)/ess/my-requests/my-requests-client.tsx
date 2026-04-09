"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Briefcase,
  Search,
  ListFilter,
  Info,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ─── Mobile Detection ─────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
  leaveBalance?: {
    leaveType: {
      id: string;
      name: string;
      isPaidLeave: boolean;
    };
  } | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
}

interface AdminRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  reviewedByUser?: { id: string; name: string | null; email: string } | null;
}

interface OvertimeRequest {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: string;
  managerApprovedBy: string | null;
  managerApprovedAt: string | null;
  hrApprovedBy: string | null;
  hrApprovedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

type RequestItem = LeaveRequest | AdminRequest | OvertimeRequest;

interface ESSMyRequestsClientProps {
  leaveRequests: LeaveRequest[];
  adminRequests: AdminRequest[];
  overtimeRequests: OvertimeRequest[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequestType(request: RequestItem): "leave" | "admin" | "overtime" {
  if ("leaveBalance" in request) return "leave";
  if ("date" in request && "startTime" in request) return "overtime";
  return "admin";
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  PENDING: {
    label: "Đang chờ",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800",
  },
  APPROVED: {
    label: "Đã duyệt",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800",
  },
  REJECTED: {
    label: "Từ chối",
    variant: "destructive",
    className: "bg-red-100 text-red-800",
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "outline",
    className: "text-muted-foreground",
  },
  PROCESSING: {
    label: "Đang xử lý",
    variant: "secondary",
  },
};

const ADMIN_REQUEST_TYPES: Record<string, { label: string }> = {
  SALARY_CONFIRMATION: { label: "Xác nhận lương" },
  WORK_CERTIFICATE: { label: "Giấy xác nhận lao động" },
  TAX_CONFIRMATION: { label: "Xác nhận thuế" },
  SOCIAL_INSURANCE: { label: "Sổ BHXH" },
  RESIGNATION_LETTER: { label: "Đơn xin nghỉ việc" },
  RECOMMENDATION_LETTER: { label: "Thư giới thiệu" },
  OTHER: { label: "Khác" },
};

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Leave Request Detail ────────────────────────────────────────────────────

function LeaveRequestDetail({
  request,
  onClose,
}: {
  request: LeaveRequest;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const leaveTypeName = request.leaveBalance?.leaveType?.name || "Nghỉ phép";
  const isPaid = request.leaveBalance?.leaveType?.isPaidLeave;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-600" />
            Chi tiết đơn nghỉ phép
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={cfg.variant} className={cfg.className}>
              {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tạo: {formatDateTime(request.createdAt)}
            </span>
          </div>

          {/* Date Card */}
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Thời gian nghỉ</p>
                <p className="text-sm font-semibold">
                  {formatDate(request.startDate)} — {formatDate(request.endDate)}
                </p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {request.totalDays} ngày
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-t-lg">
              <span className="text-xs font-semibold">Thông tin đơn</span>
            </div>
            <div className="border border-t-0 border-border divide-y rounded-b-lg">
              <DetailRow label="Loại nghỉ phép" value={leaveTypeName} />
              <DetailRow
                label="Hưởng lương"
                value={isPaid ? "Có" : "Không"}
              />
              {request.reason && (
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1">Lý do</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {request.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Approval info */}
          {request.status === "APPROVED" && request.approvedAt && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Đã duyệt lúc {formatDateTime(request.approvedAt)}</span>
            </div>
          )}

          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Lý do từ chối</span>
              </div>
              <p className="text-sm text-red-800">{request.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Admin Request Detail ────────────────────────────────────────────────────

function AdminRequestDetail({
  request,
  onClose,
}: {
  request: AdminRequest;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const typeConfig = ADMIN_REQUEST_TYPES[request.type] || ADMIN_REQUEST_TYPES.OTHER;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-teal-600" />
            Chi tiết yêu cầu HC
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={cfg.variant} className={cfg.className}>
              {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tạo: {formatDateTime(request.createdAt)}
            </span>
          </div>

          {/* Type Card */}
          <Card className="bg-teal-50/50 border-teal-100">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Loại yêu cầu</p>
                <p className="text-lg font-bold text-teal-700">{typeConfig.label}</p>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-t-lg">
              <span className="text-xs font-semibold">Thông tin yêu cầu</span>
            </div>
            <div className="border border-t-0 border-border divide-y rounded-b-lg">
              {request.description && (
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {request.description}
                  </p>
                </div>
              )}
              {request.reviewedAt && (
                <DetailRow
                  label="Người duyệt"
                  value={request.reviewedByUser?.name || request.reviewedBy || "-"}
                />
              )}
              {request.reviewedAt && (
                <DetailRow
                  label="Ngày duyệt"
                  value={formatDateTime(request.reviewedAt)}
                />
              )}
            </div>
          </div>

          {request.status === "REJECTED" && request.rejectReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Lý do từ chối</span>
              </div>
              <p className="text-sm text-red-800">{request.rejectReason}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overtime Request Detail ─────────────────────────────────────────────────

function OvertimeRequestDetail({
  request,
  onClose,
}: {
  request: OvertimeRequest;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Chi tiết yêu cầu OT
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={cfg.variant} className={cfg.className}>
              {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tạo: {formatDateTime(request.createdAt)}
            </span>
          </div>

          {/* Hours Card */}
          <Card className="bg-orange-50/50 border-orange-100">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Số giờ OT</p>
                <p className="text-3xl font-bold text-orange-700">
                  {request.hours} <span className="text-base font-normal">giờ</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-t-lg">
              <span className="text-xs font-semibold">Thông tin OT</span>
            </div>
            <div className="border border-t-0 border-border divide-y rounded-b-lg">
              <DetailRow label="Ngày" value={formatDate(request.date)} />
              <DetailRow label="Giờ bắt đầu" value={request.startTime} />
              <DetailRow label="Giờ kết thúc" value={request.endTime} />
              <DetailRow label="Lý do" value={request.reason || "-"} />
            </div>
          </div>

          {request.managerApprovedAt && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>QL duyệt lúc {formatDateTime(request.managerApprovedAt)}</span>
            </div>
          )}

          {request.status === "REJECTED" && request.rejectedReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Lý do từ chối</span>
              </div>
              <p className="text-sm text-red-800">{request.rejectedReason}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mobile Detail Sheet ─────────────────────────────────────────────────────

function RequestDetailSheet({
  request,
  onClose,
}: {
  request: RequestItem | null;
  onClose: () => void;
}) {
  if (!request) return null;

  const type = getRequestType(request);

  if (type === "leave") {
    return (
      <Sheet open onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-3">
          <SheetHeader className="sr-only">
            <SheetTitle>Chi tiết đơn nghỉ phép</SheetTitle>
          </SheetHeader>
          <LeaveRequestDetail request={request as LeaveRequest} onClose={onClose} />
        </SheetContent>
      </Sheet>
    );
  }

  if (type === "admin") {
    return (
      <Sheet open onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-3">
          <SheetHeader className="sr-only">
            <SheetTitle>Chi tiết yêu cầu HC</SheetTitle>
          </SheetHeader>
          <AdminRequestDetail request={request as AdminRequest} onClose={onClose} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-3">
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết yêu cầu OT</SheetTitle>
        </SheetHeader>
        <OvertimeRequestDetail request={request as OvertimeRequest} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
}

// ─── Mobile Request Card ─────────────────────────────────────────────────────

function MobileRequestCard({
  request,
  onClick,
}: {
  request: RequestItem;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const type = getRequestType(request);

  let title = "";
  let subtitle = "";
  let Icon = FileText;
  let iconBgColor = "bg-muted";
  let iconTextColor = "text-muted-foreground";

  if (type === "leave") {
    const r = request as LeaveRequest;
    title = r.leaveBalance?.leaveType?.name || "Nghỉ phép";
    subtitle = `${formatDate(r.startDate)} — ${formatDate(r.endDate)} • ${r.totalDays} ngày`;
    Icon = CalendarDays;
    iconBgColor = "bg-purple-100";
    iconTextColor = "text-purple-600";
  } else if (type === "admin") {
    const r = request as AdminRequest;
    const typeConfig = ADMIN_REQUEST_TYPES[r.type] || ADMIN_REQUEST_TYPES.OTHER;
    title = typeConfig.label;
    subtitle = formatDateTime(r.createdAt);
    Icon = Briefcase;
    iconBgColor = "bg-teal-100";
    iconTextColor = "text-teal-600";
  } else {
    const r = request as OvertimeRequest;
    title = "Yêu cầu OT";
    subtitle = `${formatDate(r.date)} • ${r.hours} giờ`;
    Icon = Clock;
    iconBgColor = "bg-orange-100";
    iconTextColor = "text-orange-600";
  }

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBgColor, iconTextColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">{title}</p>
            <Badge variant={cfg.variant} className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}>
              {cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {type === "leave" && (request as LeaveRequest).reason && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {(request as LeaveRequest).reason}
            </p>
          )}
          {type === "admin" && (request as AdminRequest).description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {(request as AdminRequest).description}
            </p>
          )}
          {type === "overtime" && (request as OvertimeRequest).reason && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {(request as OvertimeRequest).reason}
            </p>
          )}
        </div>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Desktop Leave Request Card ──────────────────────────────────────────────

function LeaveRequestCard({ request }: { request: LeaveRequest }) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const leaveTypeName = request.leaveBalance?.leaveType?.name || "Nghỉ phép";

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow cursor-pointer",
      request.status === "PENDING" && "border-amber-200",
      request.status === "APPROVED" && "border-emerald-200",
      request.status === "REJECTED" && "border-red-200",
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              request.status === "PENDING" ? "bg-amber-100 text-amber-600" :
              request.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
              request.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-muted"
            )}>
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{leaveTypeName}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatDate(request.startDate)} — {formatDate(request.endDate)}
              </p>
            </div>
          </div>
          <Badge variant={cfg.variant} className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số ngày</span>
            <span className="font-semibold">{request.totalDays} ngày</span>
          </div>
          {request.reason && (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Lý do</span>
              <p className="text-muted-foreground line-clamp-2">{request.reason}</p>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngày tạo</span>
            <span className="text-muted-foreground">{formatDate(request.createdAt)}</span>
          </div>
          {request.status === "APPROVED" && request.approvedAt && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px]">Đã duyệt: {formatDateTime(request.approvedAt)}</span>
            </div>
          )}
          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="bg-red-50 rounded p-1.5 mt-1">
              <p className="text-[10px] text-red-700 font-medium">Lý do từ chối: {request.rejectionReason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Desktop Admin Request Card ──────────────────────────────────────────────

function AdminRequestCard({ request }: { request: AdminRequest }) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const typeConfig = ADMIN_REQUEST_TYPES[request.type] || ADMIN_REQUEST_TYPES.OTHER;

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow cursor-pointer",
      request.status === "PENDING" && "border-amber-200",
      request.status === "APPROVED" && "border-emerald-200",
      request.status === "REJECTED" && "border-red-200",
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              request.status === "PENDING" ? "bg-amber-100 text-amber-600" :
              request.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
              request.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-600"
            )}>
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{typeConfig.label}</p>
              <p className="text-[11px] text-muted-foreground">{formatDateTime(request.createdAt)}</p>
            </div>
          </div>
          <Badge variant={cfg.variant} className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          {request.description && (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Mô tả</span>
              <p className="text-muted-foreground line-clamp-2">{request.description}</p>
            </div>
          )}
          {request.reviewedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người duyệt</span>
              <span className="text-muted-foreground truncate max-w-32">{request.reviewedByUser?.name || request.reviewedBy || "-"}</span>
            </div>
          )}
          {request.status === "REJECTED" && request.rejectReason && (
            <div className="bg-red-50 rounded p-1.5 mt-1">
              <p className="text-[10px] text-red-700 font-medium">Lý do từ chối: {request.rejectReason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Desktop Overtime Request Card ──────────────────────────────────────────

function OvertimeRequestCard({ request }: { request: OvertimeRequest }) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow cursor-pointer",
      request.status === "PENDING" && "border-amber-200",
      request.status === "APPROVED" && "border-emerald-200",
      request.status === "REJECTED" && "border-red-200",
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              request.status === "PENDING" ? "bg-amber-100 text-amber-600" :
              request.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
              request.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
            )}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Yêu cầu OT</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(request.date)}</p>
            </div>
          </div>
          <Badge variant={cfg.variant} className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số giờ</span>
            <span className="font-bold text-orange-700">{request.hours} giờ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ca</span>
            <span className="text-muted-foreground">{request.startTime} — {request.endTime}</span>
          </div>
          {request.reason && (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Lý do</span>
              <p className="text-muted-foreground line-clamp-2">{request.reason}</p>
            </div>
          )}
          {request.managerApprovedAt && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px]">QL duyệt: {formatDateTime(request.managerApprovedAt)}</span>
            </div>
          )}
          {request.status === "REJECTED" && request.rejectedReason && (
            <div className="bg-red-50 rounded p-1.5 mt-1">
              <p className="text-[10px] text-red-700 font-medium">Lý do từ chối: {request.rejectedReason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 px-4">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground text-center mb-1 font-medium">{title}</p>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ESSMyRequestsClient({
  leaveRequests,
  adminRequests,
  overtimeRequests,
}: ESSMyRequestsClientProps) {
  const isMobile = useIsMobile();
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const allRequests = useMemo(
    () => [...leaveRequests, ...adminRequests, ...overtimeRequests],
    [leaveRequests, adminRequests, overtimeRequests],
  );

  // Filter logic
  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      let matchesSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if ("leaveBalance" in r) {
          const lr = r as LeaveRequest;
          matchesSearch =
            (lr.leaveBalance?.leaveType?.name || "").toLowerCase().includes(term) ||
            lr.reason?.toLowerCase().includes(term) ||
            false;
        } else if ("date" in r && "startTime" in r) {
          const or = r as OvertimeRequest;
          matchesSearch =
            or.reason.toLowerCase().includes(term) ||
            formatDate(or.date).includes(term) ||
            false;
        } else {
          const ar = r as AdminRequest;
          matchesSearch =
            (ADMIN_REQUEST_TYPES[ar.type]?.label || "").toLowerCase().includes(term) ||
            ar.description.toLowerCase().includes(term) ||
            false;
        }
      }
      return matchesStatus && matchesSearch;
    });
  }, [allRequests, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === "PENDING").length,
      approved: allRequests.filter((r) => r.status === "APPROVED").length,
      rejected: allRequests.filter((r) => r.status === "REJECTED").length,
    }),
    [allRequests],
  );

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchTerm("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedRequest(null);
  }, []);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* ── Header ── */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">Đơn của tôi</h1>
          </header>

          {/* Stats row */}
          <div className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Tổng</p>
                  <p className="text-sm font-bold leading-tight">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Chờ duyệt</p>
                  <p className="text-sm font-bold leading-tight text-amber-700">{stats.pending}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Đã duyệt</p>
                  <p className="text-sm font-bold leading-tight text-emerald-700">{stats.approved}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Từ chối</p>
                  <p className="text-sm font-bold leading-tight text-red-700">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-2">
            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm..."
                className={cn(
                  "h-7 sm:h-8 text-xs transition-all duration-300 ease-in-out pr-7",
                  searchExpanded ? "w-32 sm:w-48 pl-3" : "w-0 opacity-0 pl-0",
                )}
              />
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Status Filter */}
            <Button
              variant={statusFilter !== "ALL" ? "outline" : "ghost"}
              size="xs"
              onClick={() => setStatusFilter(statusFilter === "ALL" ? "PENDING" : statusFilter === "PENDING" ? "APPROVED" : statusFilter === "APPROVED" ? "REJECTED" : "ALL")}
              className={cn(
                statusFilter !== "ALL" && "bg-primary/10 border-primary text-primary hover:text-primary",
              )}
            >
              <ListFilter className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">
                {statusFilter === "ALL" ? "Trạng thái" :
                 statusFilter === "PENDING" ? "Chờ duyệt" :
                 statusFilter === "APPROVED" ? "Đã duyệt" : "Từ chối"}
              </span>
            </Button>

            {/* Quick filter pills */}
            <div className="hidden sm:flex items-center gap-1">
              {[
                { value: "ALL", label: "Tất cả" },
                { value: "PENDING", label: "Chờ" },
                { value: "APPROVED", label: "Đã duyệt" },
                { value: "REJECTED", label: "Từ chối" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setStatusFilter(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex-1" />
          </div>
        </section>

        {/* ── Content ── */}
        <div className="flex-1 relative h-full min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {isMobile ? (
              /* ── Mobile Card List View ── */
              <div className="overflow-auto h-full">
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    title="Không tìm thấy yêu cầu"
                    description={
                      searchTerm || statusFilter !== "ALL"
                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                        : "Bạn chưa có yêu cầu nào"
                    }
                  />
                ) : (
                  <div className="divide-y divide-border">
                    {filteredRequests.map((request) => (
                      <MobileRequestCard
                        key={request.id}
                        request={request}
                        onClick={() => setSelectedRequest(request)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── Desktop Grid View ── */
              <div className="overflow-auto h-full p-3">
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    title="Không tìm thấy yêu cầu"
                    description={
                      searchTerm || statusFilter !== "ALL"
                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                        : "Bạn chưa có yêu cầu nào"
                    }
                  />
                ) : (
                  <div className="space-y-5">
                    {/* Leave Requests */}
                    {leaveRequests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="p-1 rounded-md bg-purple-100 text-purple-600">
                            <CalendarDays className="h-3.5 w-3.5" />
                          </div>
                          <h3 className="text-xs font-semibold">Nghỉ phép</h3>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                            {leaveRequests.length}
                          </Badge>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                          {leaveRequests.map((request) => (
                            <div
                              key={request.id}
                              onClick={() => setSelectedRequest(request)}
                            >
                              <LeaveRequestCard request={request} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Requests */}
                    {adminRequests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="p-1 rounded-md bg-teal-100 text-teal-600">
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <h3 className="text-xs font-semibold">Yêu cầu HC</h3>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                            {adminRequests.length}
                          </Badge>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                          {adminRequests.map((request) => (
                            <div
                              key={request.id}
                              onClick={() => setSelectedRequest(request)}
                            >
                              <AdminRequestCard request={request} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overtime Requests */}
                    {overtimeRequests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="p-1 rounded-md bg-orange-100 text-orange-600">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <h3 className="text-xs font-semibold">Làm thêm giờ</h3>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                            {overtimeRequests.length}
                          </Badge>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                          {overtimeRequests.map((request) => (
                            <div
                              key={request.id}
                              onClick={() => setSelectedRequest(request)}
                            >
                              <OvertimeRequestCard request={request} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Card */}
                    <Card className="bg-blue-50/50 border-blue-100">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium text-blue-900">Lưu ý</p>
                            <ul className="mt-1.5 space-y-0.5 text-blue-800">
                              <li>• Nhấn vào thẻ để xem chi tiết yêu cầu</li>
                              <li>• Đơn có trạng thái &quot;Đang chờ&quot; có thể được hủy</li>
                              <li>• Liên hệ HCNS nếu cần hỗ trợ thêm</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Bottom bar */}
            {filteredRequests.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-3 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredRequests.length}</strong> / <strong>{allRequests.length}</strong> yêu cầu
                </p>
                {statusFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Lọc: {
                      statusFilter === "PENDING" ? "Chờ duyệt" :
                      statusFilter === "APPROVED" ? "Đã duyệt" : "Từ chối"
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sheet / Dialog */}
      {isMobile ? (
        <RequestDetailSheet request={selectedRequest} onClose={handleCloseDetail} />
      ) : selectedRequest ? (
        (() => {
          const type = getRequestType(selectedRequest);
          if (type === "leave") return <LeaveRequestDetail request={selectedRequest as LeaveRequest} onClose={handleCloseDetail} />;
          if (type === "admin") return <AdminRequestDetail request={selectedRequest as AdminRequest} onClose={handleCloseDetail} />;
          return <OvertimeRequestDetail request={selectedRequest as OvertimeRequest} onClose={handleCloseDetail} />;
        })()
      ) : null}
    </div>
  );
}

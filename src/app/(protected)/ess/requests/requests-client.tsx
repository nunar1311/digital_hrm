"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ChevronRight,
  Briefcase,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { submitAdministrativeRequest, cancelAdministrativeRequest } from "../actions";

interface AdministrativeRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  responseAttachment: string | null;
  reviewedByUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ESSRequestsClientProps {
  initialRequests: AdministrativeRequest[];
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const requestTypes = [
  { value: "SALARY_CONFIRMATION", label: "Xác nhận lương" },
  { value: "WORK_CERTIFICATE", label: "Giấy xác nhận lao động" },
  { value: "TAX_CONFIRMATION", label: "Xác nhận thuế" },
  { value: "SOCIAL_INSURANCE", label: "Sổ BHXH/Sổ bảo hiểm" },
  { value: "RESIGNATION_LETTER", label: "Đơn xin nghỉ việc" },
  { value: "RECOMMENDATION_LETTER", label: "Thư giới thiệu" },
  { value: "OTHER", label: "Khác" },
];

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Đang chờ",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Đã duyệt",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Từ chối",
    variant: "destructive",
    className: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "outline",
    className: "text-muted-foreground",
    icon: XCircle,
  },
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type: string) {
  return requestTypes.find((t) => t.value === type)?.label || type;
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Request Detail Dialog (Desktop) ───────────────────────────────────────────

function RequestDetailDialog({
  request,
  onCancel,
  isCancelling,
}: {
  request: AdministrativeRequest | null;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  if (!request) return null;

  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Dialog open={!!request} onOpenChange={(v) => !v && onCancel("")}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Chi tiết yêu cầu HC
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Status & Type */}
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
                <p className="text-lg font-bold text-teal-700">
                  {getTypeLabel(request.type)}
                </p>
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
                <>
                  <DetailRow
                    label="Người duyệt"
                    value={
                      request.reviewedByUser?.name ||
                      request.reviewedBy ||
                      "-"
                    }
                  />
                  <DetailRow
                    label="Ngày duyệt"
                    value={formatDateTime(request.reviewedAt)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {request.status === "REJECTED" && request.rejectReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Lý do từ chối</span>
              </div>
              <p className="text-sm text-red-800">{request.rejectReason}</p>
            </div>
          )}

          {/* Approved info */}
          {request.status === "APPROVED" && request.reviewedAt && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Đã duyệt lúc {formatDateTime(request.reviewedAt)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onCancel("")}>
              Đóng
            </Button>
            {request.status === "PENDING" && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onCancel(request.id)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Hủy yêu cầu"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Detail Sheet (Mobile) ───────────────────────────────────────────

function RequestDetailSheet({
  request,
  onCancel,
  isCancelling,
}: {
  request: AdministrativeRequest | null;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  if (!request) return null;

  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Sheet open={!!request} onOpenChange={(v) => !v && onCancel("")}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-3">
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết yêu cầu HC</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{getTypeLabel(request.type)}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={cfg.variant} className={cfg.className}>
                  {cfg.label}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Type Card */}
          <Card className="bg-teal-50/50 border-teal-100">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Loại yêu cầu</p>
                <p className="text-lg font-bold text-teal-700">
                  {getTypeLabel(request.type)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
                Mô tả
              </p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">
                {request.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Review Info */}
          {request.reviewedAt && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người duyệt</span>
                <span className="font-medium">
                  {request.reviewedByUser?.name || request.reviewedBy || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày duyệt</span>
                <span className="font-medium">{formatDateTime(request.reviewedAt)}</span>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {request.status === "REJECTED" && request.rejectReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Lý do từ chối</span>
              </div>
              <p className="text-sm text-red-800">{request.rejectReason}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ngày tạo</span>
              <span>{formatDateTime(request.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onCancel("")}>
              Đóng
            </Button>
            {request.status === "PENDING" && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onCancel(request.id)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Hủy yêu cầu"
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Mobile Request Card ──────────────────────────────────────────────────────

function MobileRequestCard({
  request,
  onClick,
}: {
  request: AdministrativeRequest;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            request.status === "PENDING"
              ? "bg-amber-100 text-amber-600"
              : request.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-600"
                : request.status === "REJECTED"
                  ? "bg-red-100 text-red-600"
                  : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">
              {getTypeLabel(request.type)}
            </p>
            <Badge
              variant={cfg.variant}
              className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}
            >
              {cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(request.createdAt)}
          </p>
          {request.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {request.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Desktop Request Card ────────────────────────────────────────────────────

function RequestCard({
  request,
  onClick,
}: {
  request: AdministrativeRequest;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer",
        request.status === "PENDING" && "border-amber-200",
        request.status === "APPROVED" && "border-emerald-200",
        request.status === "REJECTED" && "border-red-200",
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                request.status === "PENDING"
                  ? "bg-amber-100 text-amber-600"
                  : request.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-600"
                    : request.status === "REJECTED"
                      ? "bg-red-100 text-red-600"
                      : "bg-muted text-muted-foreground",
              )}
            >
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                {getTypeLabel(request.type)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatDateTime(request.createdAt)}
              </p>
            </div>
          </div>
          <Badge
            variant={cfg.variant}
            className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}
          >
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          {request.description && (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Mô tả</span>
              <p className="text-muted-foreground line-clamp-2">
                {request.description}
              </p>
            </div>
          )}
          {request.reviewedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người duyệt</span>
              <span className="text-muted-foreground truncate max-w-32">
                {request.reviewedByUser?.name || request.reviewedBy || "-"}
              </span>
            </div>
          )}
          {request.status === "REJECTED" && request.rejectReason && (
            <div className="bg-red-50 rounded p-1.5 mt-1">
              <p className="text-[10px] text-red-700 font-medium">
                Lý do từ chối: {request.rejectReason}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 px-4">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground text-center mb-1 font-medium">{title}</p>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ESSRequestsClient({ initialRequests }: ESSRequestsClientProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AdministrativeRequest | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return cancelAdministrativeRequest(requestId);
    },
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu");
      queryClient.invalidateQueries({ queryKey: ["my-admin-requests"] });
    },
    onError: () => {
      toast.error("Không thể hủy yêu cầu");
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const result = await submitAdministrativeRequest({
        type: selectedType,
        description,
      });
      return result;
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu thành công!");
      setIsDialogOpen(false);
      setSelectedType("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["my-admin-requests"] });
    },
    onError: () => {
      toast.error("Không thể gửi yêu cầu");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!selectedType) {
      toast.error("Vui lòng chọn loại yêu cầu");
      return;
    }
    setIsSubmitting(true);
    submitMutation.mutate();
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return initialRequests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        getTypeLabel(r.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [initialRequests, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      total: initialRequests.length,
      pending: initialRequests.filter((r) => r.status === "PENDING").length,
      approved: initialRequests.filter((r) => r.status === "APPROVED").length,
      rejected: initialRequests.filter((r) => r.status === "REJECTED").length,
    }),
    [initialRequests],
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

  const handleCancelRequest = useCallback(
    (id: string) => {
      if (id) {
        cancelMutation.mutate(id);
      }
      setSelectedRequest(null);
    },
    [cancelMutation],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">Yêu cầu hành chính</h1>
          </header>

          {/* Stats row */}
          <div className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tổng yêu cầu
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Đang chờ
                  </p>
                  <p className="text-sm font-bold leading-tight text-amber-700">
                    {stats.pending}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Đã duyệt
                  </p>
                  <p className="text-sm font-bold leading-tight text-emerald-700">
                    {stats.approved}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Từ chối
                  </p>
                  <p className="text-sm font-bold leading-tight text-red-700">
                    {stats.rejected}
                  </p>
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

            {/* Status Filter Dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "h-7 sm:h-8 text-xs w-auto min-w-[80px]",
                  statusFilter !== "ALL" &&
                    "bg-primary/10 border-primary text-primary",
                )}
              >
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick filter pills (desktop) */}
            <div className="hidden sm:flex items-center gap-1">
              {STATUS_FILTERS.slice(1).map((opt) => (
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

            <Button size="xs" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Tạo yêu cầu</span>
            </Button>
          </div>
        </section>

        {/* Content */}
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
                    {/* Requests Grid */}
                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          onClick={() => setSelectedRequest(request)}
                        />
                      ))}
                    </div>

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
                  Hiển thị <strong>{filteredRequests.length}</strong> /{" "}
                  <strong>{initialRequests.length}</strong> yêu cầu
                </p>
                {statusFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Lọc: {STATUS_FILTERS.find((s) => s.value === statusFilter)?.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog / Sheet */}
      {isMobile ? (
        <RequestDetailSheet
          request={selectedRequest}
          onCancel={handleCancelRequest}
          isCancelling={cancelMutation.isPending}
        />
      ) : (
        <RequestDetailDialog
          request={selectedRequest}
          onCancel={handleCancelRequest}
          isCancelling={cancelMutation.isPending}
        />
      )}

      {/* Create Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hành chính</DialogTitle>
            <DialogDescription>
              Chọn loại yêu cầu và nhập mô tả chi tiết để gửi đến bộ phận HCNS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại yêu cầu *</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại yêu cầu" />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả chi tiết</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả chi tiết yêu cầu của bạn..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedType || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

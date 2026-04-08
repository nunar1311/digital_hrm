"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Settings,
  Search,
  ListFilter,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getMyLeaveBalances,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getMyLeaveTypes,
} from "./actions";
import { LeaveRequestDialog } from "./components/leave-request-dialog";
import { ESSLeaveClientProps, LeaveBalance, LeaveRequestItem } from "./types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
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

type LeaveStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return formatDate(start);
  return `${formatDate(start)} → ${formatDate(end)}`;
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

// ─── Balance Row (compact) ────────────────────────────────────────────────────

function BalanceBadge({ balance }: { balance: LeaveBalance }) {
  const used = balance.usedDays + balance.pendingDays;
  const pct = balance.totalDays > 0 ? (used / balance.totalDays) * 100 : 0;
  const isLow = balance.available <= 2;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-default transition-colors">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate max-w-[120px]">
              {balance.leaveTypeName}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  "text-sm font-bold",
                  isLow ? "text-amber-600" : "text-emerald-600",
                )}
              >
                {balance.available}
              </span>
              <span className="text-xs text-muted-foreground">
                / {balance.totalDays}
              </span>
              {balance.isPaidLeave ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1 rounded">
                  Có lương
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">KL</span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "w-8 h-1.5 rounded-full shrink-0",
              pct > 80
                ? "bg-red-300"
                : pct > 50
                  ? "bg-amber-300"
                  : "bg-emerald-300",
            )}
            style={{ width: 32 }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-xs space-y-1">
          <div className="font-medium">{balance.leaveTypeName}</div>
          <div>
            Đã dùng: <strong>{balance.usedDays}</strong> ngày
          </div>
          {balance.pendingDays > 0 && (
            <div>
              Chờ duyệt:{" "}
              <strong className="text-amber-600">{balance.pendingDays}</strong>{" "}
              ngày
            </div>
          )}
          <div>
            Tổng cộng: <strong>{balance.totalDays}</strong> ngày
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Detail Dialog ─────────────────────────────────────────────────────────────

function LeaveDetailDialog({
  request,
  onCancel,
  isCancelling,
  isMobile,
}: {
  request: LeaveRequestItem | null;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  isMobile?: boolean;
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (!request) return null;

  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  // Mobile Bottom Sheet Layout
  if (isMobile) {
    return (
      <>
        <Sheet open={!!request} onOpenChange={(v) => !v && onCancel("")}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
            <SheetHeader className="sr-only">
              <SheetTitle>Chi tiết yêu cầu nghỉ phép</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {request.leaveType?.name ?? "N/A"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={cfg.variant}
                      className={cn("gap-1 text-xs", cfg.className)}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                    {request.leaveType?.isPaidLeave ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Có lương
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Không lương
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onCancel("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Date Card */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Thời gian nghỉ
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatDateRange(request.startDate, request.endDate)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {request.totalDays} ngày
                </div>
              </Card>

              {/* Reason */}
              {request.reason && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Lý do
                    </h3>
                    <p className="text-sm bg-muted/50 rounded-lg p-2.5">
                      {request.reason}
                    </p>
                  </div>
                </>
              )}

              {/* Rejection Reason */}
              {request.status === "REJECTED" && request.rejectionReason && (
                <>
                  <Separator />
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-red-700 mb-1.5">
                      <AlertCircle />
                      <span className="text-sm font-medium">Lý do từ chối</span>
                    </div>
                    <p className="text-sm text-red-800">
                      {request.rejectionReason}
                    </p>
                  </div>
                </>
              )}

              {/* Approver Info */}
              {request.approvedByUser && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                      {request.approvedByUser.name.split(" ").pop()?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Người duyệt
                      </p>
                      <p className="text-sm font-medium">
                        {request.approvedByUser.name}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Timestamps */}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ngày đăng ký</span>
                  <span>{formatDateTime(request.createdAt)}</span>
                </div>
                {request.approvedAt && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ngày duyệt</span>
                    <span>{formatDateTime(request.approvedAt)}</span>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {request.status === "PENDING" && (
                <>
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Hủy yêu cầu
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này không? Hành động
                này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onCancel(request.id);
                  setShowCancelDialog(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Hủy yêu cầu"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Desktop Dialog Layout
  return (
    <>
      <Dialog open={!!request} onOpenChange={(v) => !v && onCancel("")}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Chi tiết yêu cầu nghỉ phép
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <DetailRow
              label="Loại nghỉ phép"
              value={
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {request.leaveType?.name ?? "N/A"}
                  </span>
                  {request.leaveType?.isPaidLeave ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                      Có lương
                    </span>
                  ) : (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      Không lương
                    </span>
                  )}
                </div>
              }
            />
            <div className="h-px bg-border" />
            <DetailRow
              label="Thời gian"
              value={
                <span className="font-medium">
                  {formatDateRange(request.startDate, request.endDate)}
                </span>
              }
            />
            <DetailRow
              label="Số ngày"
              value={<strong>{request.totalDays} ngày</strong>}
            />
            <div className="h-px bg-border" />
            <DetailRow
              label="Trạng thái"
              value={
                <Badge
                  variant={cfg.variant}
                  className={cn("gap-1 text-xs", cfg.className)}
                >
                  <StatusIcon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
              }
            />
            <DetailRow
              label="Ngày đăng ký"
              value={formatDateTime(request.createdAt)}
            />
            {request.approvedAt && (
              <DetailRow
                label="Ngày duyệt"
                value={formatDateTime(request.approvedAt)}
              />
            )}
            {request.reason && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lý do</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-2.5">
                    {request.reason}
                  </p>
                </div>
              </>
            )}
            {request.status === "REJECTED" && request.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-red-700 mb-1.5">
                  <AlertCircle />
                  <span className="text-sm font-medium">Lý do từ chối</span>
                </div>
                <p className="text-sm text-red-800">
                  {request.rejectionReason}
                </p>
              </div>
            )}
            {request.approvedByUser && (
              <>
                <div className="h-px bg-border" />
                <DetailRow
                  label="Người duyệt"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                        {request.approvedByUser.name.split(" ").pop()?.[0] ??
                          "?"}
                      </div>
                      <span className="font-medium">
                        {request.approvedByUser.name}
                      </span>
                    </div>
                  }
                />
              </>
            )}
            {request.status === "PENDING" && (
              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Hủy yêu cầu
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này không? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancel(request.id);
                setShowCancelDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang hủy...
                </>
              ) : (
                "Hủy yêu cầu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Mobile Leave Card ──────────────────────────────────────────────────────────

function MobileLeaveCard({
  request,
  onClick,
}: {
  request: LeaveRequestItem;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Leave Type Row */}
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
                request.leaveType?.isPaidLeave
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <CalendarDays />
            </div>
            <span className="text-sm font-medium truncate">
              {request.leaveType?.name ?? "N/A"}
            </span>
            <Badge
              variant={cfg.variant}
              className={cn(
                "gap-1 text-[10px] py-0 h-5 shrink-0",
                cfg.className,
              )}
            >
              <Icon className="h-2.5 w-2.5" />
              {cfg.label}
            </Badge>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-sm mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs sm:text-sm">
              {formatDateRange(request.startDate, request.endDate)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({request.totalDays} ngày)
            </span>
          </div>

          {/* Reason */}
          {request.reason && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {request.reason}
            </p>
          )}
        </div>

        <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
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
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ESSLeaveClient({
  initialBalances,
  initialRequests,
}: ESSLeaveClientProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<LeaveStatus>("ALL");
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LeaveRequestItem | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    leaveType: true,
    dateRange: true,
    totalDays: true,
    reason: false,
    status: true,
    createdAt: false,
    approvedAt: false,
  });

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const { data: leaveTypesData } = useQuery({
    queryKey: ["my-leave-types"],
    queryFn: getMyLeaveTypes,
  });

  const { data: balances = initialBalances } = useQuery({
    queryKey: ["my-leave-balances", selectedYear],
    queryFn: () => getMyLeaveBalances(),
    initialData: initialBalances,
  });

  const { data: requestsData = initialRequests, isLoading: isLoadingRequests } =
    useQuery({
      queryKey: ["my-leave-requests", selectedYear, statusFilter],
      queryFn: () =>
        getMyLeaveRequests({
          year: selectedYear,
          status: statusFilter as
            | "PENDING"
            | "APPROVED"
            | "REJECTED"
            | "CANCELLED"
            | "ALL",
          page: 1,
          pageSize: 100,
        }),
      initialData: initialRequests,
    });

  useSocketEvents(
    [
      "overtime:requested",
      "overtime:approved",
      "overtime:rejected",
      "overtime:completed",
    ],
    () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
    },
  );

  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requestsData.items;
    const q = search.toLowerCase();
    return requestsData.items.filter((r) => {
      const typeName = r.leaveType?.name?.toLowerCase() ?? "";
      const reason = r.reason?.toLowerCase() ?? "";
      const dateRange = formatDateRange(r.startDate, r.endDate).toLowerCase();
      return (
        typeName.includes(q) || reason.includes(q) || dateRange.includes(q)
      );
    });
  }, [requestsData.items, search]);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const toggleAll = useCallback(() => {
    setSelectedIds(
      selectedIds.size === filteredRequests.length
        ? new Set()
        : new Set(filteredRequests.map((r) => r.id)),
    );
  }, [selectedIds.size, filteredRequests]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const columns = useMemo<ColumnDef<LeaveRequestItem>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              filteredRequests.length > 0 &&
              selectedIds.size === filteredRequests.length
                ? true
                : selectedIds.size > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={toggleAll}
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleOne(row.original.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
            aria-label={`Chọn yêu cầu ${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "leaveType",
        header: "Loại nghỉ phép",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                row.original.leaveType?.isPaidLeave
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {row.original.leaveType?.name ?? "N/A"}
              </span>
              {row.original.leaveType?.isPaidLeave ? (
                <span className="text-xs text-emerald-600">Có lương</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Không lương
                </span>
              )}
            </div>
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: "dateRange",
        header: "Thời gian",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatDateRange(row.original.startDate, row.original.endDate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(row.original.startDate).toLocaleDateString("vi-VN", {
                weekday: "short",
              })}
              {" → "}
              {new Date(row.original.endDate).toLocaleDateString("vi-VN", {
                weekday: "short",
              })}
            </span>
          </div>
        ),
        size: 220,
      },
      {
        accessorKey: "totalDays",
        header: "Số ngày",
        cell: ({ row }) => (
          <span className="text-sm font-mono font-medium">
            {row.original.totalDays}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "reason",
        header: "Lý do",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.reason || "—"}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg =
            STATUS_CONFIG[row.original.status] ?? STATUS_CONFIG.PENDING;
          const Icon = cfg.icon;
          return (
            <Badge
              variant={cfg.variant}
              className={cn("gap-1 text-xs", cfg.className)}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </Badge>
          );
        },
        size: 130,
      },
      {
        accessorKey: "createdAt",
        header: "Ngày đăng ký",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "approvedAt",
        header: "Ngày duyệt",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.approvedAt
              ? formatDate(row.original.approvedAt)
              : "—"}
          </span>
        ),
        size: 120,
      },
    ],
    [filteredRequests, selectedIds, toggleAll, toggleOne],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRequests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu nghỉ phép");
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể hủy yêu cầu");
    },
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">Nghỉ phép</h1>
          </header>

          <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 py-2">
            {/* Left: Year Navigator */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setSelectedYear((y) => y - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[60px] sm:min-w-[80px] text-center">
                {selectedYear}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setSelectedYear((y) => y + 1)}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setSelectedYear(new Date().getFullYear())}
              >
                Hiện tại
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                    size="xs"
                    className={cn(
                      "px-1 sm:px-2",
                      statusFilter !== "ALL" &&
                        "bg-primary/10 border-primary text-primary hover:text-primary",
                    )}
                  >
                    <ListFilter className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label ?? "Trạng thái"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Trạng thái
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as LeaveStatus)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={statusFilter === opt.value}
                        onCheckedChange={() =>
                          setStatusFilter(opt.value as LeaveStatus)
                        }
                        className="text-sm"
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <div className="relative flex items-center" ref={mergedSearchRef}>
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm..."
                  className={cn(
                    "h-6 sm:h-8 text-xs transition-all duration-300 ease-in-out pr-6",
                    searchExpanded
                      ? "w-28 sm:w-48 opacity-100 pl-3"
                      : "w-0 opacity-0 pl-0",
                  )}
                />
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleSearchToggle}
                  className={cn(
                    "absolute right-0.5 z-10",
                    searchExpanded && "[&_svg]:text-primary",
                  )}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon-xs"
                className="hidden sm:flex"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-3 w-3" />
              </Button>

              <Separator
                orientation="vertical"
                className="h-4! hidden sm:block"
              />

              <Button size="xs" onClick={() => setIsDialogOpen(true)}>
                <Plus />
                <span className="hidden sm:inline">Đăng ký</span>
              </Button>
            </div>
          </div>

          <TableSettingsPanel
            className="top-10"
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            defaultVisibleColumns={{
              leaveType: true,
              dateRange: true,
              totalDays: true,
              reason: false,
              status: true,
              createdAt: false,
              approvedAt: false,
            }}
            columnOptions={[
              { key: "leaveType", label: "Loại nghỉ phép", icon: CalendarDays },
              { key: "dateRange", label: "Thời gian", icon: Calendar },
              { key: "totalDays", label: "Số ngày", icon: Clock },
              { key: "reason", label: "Lý do", icon: FileText },
              { key: "status", label: "Trạng thái", icon: AlertCircle },
              { key: "createdAt", label: "Ngày đăng ký", icon: Clock },
              { key: "approvedAt", label: "Ngày duyệt", icon: CheckCircle2 },
            ]}
            disabledColumnIndices={[1]}
            hiddenColumnIndices={[]}
          />
        </section>

        {/* Balances Row */}
        {balances.length > 0 && (
          <section className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-muted-foreground shrink-0">
                Số dư:
              </span>
              {balances.map((b) => (
                <BalanceBadge key={b.id} balance={b} />
              ))}
            </div>
          </section>
        )}

        {/* Content */}
        <section className="flex-1 relative h-full min-h-0 overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
              <span className="text-xs text-muted-foreground mr-1">
                Đã chọn{" "}
                <strong className="text-foreground">{selectedIds.size}</strong>{" "}
                yêu cầu
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto h-6 w-6"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="h-full flex flex-col pb-8">
            {isMobile ? (
              /* Mobile Card List View */
              <div className="overflow-auto h-full">
                {isLoadingRequests ? (
                  <div className="p-2 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredRequests.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredRequests.map((request) => (
                      <MobileLeaveCard
                        key={request.id}
                        request={request}
                        onClick={() => setSelectedRecord(request)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Không tìm thấy yêu cầu nào.
                    </p>
                    {(search || statusFilter !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto h-full">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "h-7 px-2 select-none z-10 relative",
                              header.column.id === "actions" && "text-right",
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoadingRequests ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {columns.map((col, j) => (
                            <TableCell
                              key={j}
                              style={{ width: col.size }}
                              className="p-2"
                            >
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group/row cursor-pointer"
                          onClick={() => setSelectedRecord(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Calendar className="h-8 w-8 text-muted-foreground/50" />
                            <p>Không tìm thấy yêu cầu nào.</p>
                            {(search || statusFilter !== "ALL") && (
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearch("");
                                  setStatusFilter("ALL");
                                }}
                              >
                                Xóa bộ lọc
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoadingRequests && filteredRequests.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredRequests.length}</strong> /{" "}
                  <strong>{requestsData.total}</strong> yêu cầu
                </p>
                {statusFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Đang lọc:{" "}
                    {
                      STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Leave Request Dialog */}
      <LeaveRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        leaveTypes={leaveTypesData?.leaveTypes || []}
        manager={leaveTypesData?.manager}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
          queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
          queryClient.invalidateQueries({ queryKey: ["my-leave-types"] });
        }}
      />

      {/* Detail Dialog */}
      <LeaveDetailDialog
        request={selectedRecord}
        onCancel={(id) => {
          if (id && id !== "") {
            cancelMutation.mutate(id);
          }
          setSelectedRecord(null);
        }}
        isCancelling={cancelMutation.isPending}
        isMobile={isMobile}
      />
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  User,
  Building2,
  Timer,
  Settings,
  X,
  ListFilter,
} from "lucide-react";
import {
  getPendingAdjustmentApprovals,
  approveAttendanceAdjustment,
  rejectAttendanceAdjustment,
} from "../actions";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SOCKET_EVENTS } from "@/lib/socket";
import { useTimezone } from "@/hooks/use-timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface ApproverDashboardClientProps {
  currentUserId: string;
}

interface PendingRequest {
  id: string;
  attendanceId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  departmentName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  reason: string;
  attachment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPROVED" | "CANCELLED";
  currentStep: number;
  approvalChain?: Array<{
    stepOrder: number;
    approverId: string;
    approverName: string;
    action?: string;
    actionAt?: string;
    note?: string;
  }>;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  autoApprovedReason?: string;
  createdAt: string;
  updatedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getRelativeTime(
  dateStr: string,
  timezone: string,
  t: ReturnType<typeof useTranslations>,
): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("attendanceApproverDashboardRelativeJustNow");
    if (diffMins < 60)
      return t("attendanceApproverDashboardRelativeMinutesAgo", {
        minutes: diffMins,
      });
    if (diffHours < 24)
      return t("attendanceApproverDashboardRelativeHoursAgo", {
        hours: diffHours,
      });
    if (diffDays < 7)
      return t("attendanceApproverDashboardRelativeDaysAgo", {
        days: diffDays,
      });
    return formatDate(dateStr, timezone);
  } catch {
    return dateStr;
  }
}

// ─── Stat Card Component ────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden py-2", className)}>
      <div className="absolute inset-0 bg-linear-to-br from-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-2">
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs mt-1 font-medium",
                trend.value >= 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter Popover ────────────────────────────────────────────────
function FilterPopover({
  departments,
  filterDepartment,
  setFilterDepartment,
  sortBy,
  setSortBy,
  onReset,
}: {
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  onReset: () => void;
}) {
  const t = useTranslations("ProtectedPages");
  const [open, setOpen] = useState(false);
  const hasFilters = filterDepartment !== "all";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className={cn(hasFilters && "border-primary bg-primary/5")}
        >
          <ListFilter />
          {t("attendanceApproverDashboardFilterButton")}
          {hasFilters && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 p-0 justify-center text-[10px]"
            >
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">
              {t("attendanceApproverDashboardFilterTitle")}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                {t("attendanceApproverDashboardFilterReset")}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("attendanceApproverDashboardFilterDepartment")}
            </Label>
            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("attendanceApproverDashboardFilterSelectDepartment")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("attendanceApproverDashboardFilterAllDepartments")}
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("attendanceApproverDashboardFilterSortBy")}
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">
                  {t("attendanceApproverDashboardSortDateDesc")}
                </SelectItem>
                <SelectItem value="date_asc">
                  {t("attendanceApproverDashboardSortDateAsc")}
                </SelectItem>
                <SelectItem value="name_asc">
                  {t("attendanceApproverDashboardSortNameAsc")}
                </SelectItem>
                <SelectItem value="name_desc">
                  {t("attendanceApproverDashboardSortNameDesc")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function ApproverDashboardClient({
  currentUserId,
}: ApproverDashboardClientProps) {
  const t = useTranslations("ProtectedPages");
  const { timezone } = useTimezone();
  const queryClient = useQueryClient();

  // ─── Socket Events ───
  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_REQUESTED, () => {
    toast.info(t("attendanceApproverDashboardToastNewRequest"));
    queryClient.invalidateQueries({ queryKey: ["attendance", "adjustments"] });
  });

  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_APPROVED, () => {
    queryClient.invalidateQueries({ queryKey: ["attendance", "adjustments"] });
  });

  useSocketEvent(SOCKET_EVENTS.ATTENDANCE_ADJUSTMENT_REJECTED, () => {
    queryClient.invalidateQueries({ queryKey: ["attendance", "adjustments"] });
  });

  // ─── State ───
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ─── Click outside to close search ───
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectStepOrder, setRejectStepOrder] = useState<number | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [approveStepOrder, setApproveStepOrder] = useState<number | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveNote, setBulkApproveNote] = useState("");

  // ─── Query ───
  const {
    data: pendingData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["attendance", "adjustments", "pending", "approver"],
    queryFn: () => getPendingAdjustmentApprovals(),
    refetchInterval: 30000,
  });

  // ─── Mutations ───
  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      stepOrder,
      note,
    }: {
      requestId: string;
      stepOrder: number;
      note?: string;
    }) => approveAttendanceAdjustment(requestId, stepOrder, note),
    onSuccess: () => {
      toast.success(t("attendanceApproverDashboardToastApproveSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["attendance", "adjustments"],
      });
      setApproveDialogOpen(false);
      setApproveNote("");
      setApproveRequestId(null);
      setApproveStepOrder(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("attendanceApproverDashboardToastApproveError"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      requestId,
      stepOrder,
      reason,
    }: {
      requestId: string;
      stepOrder: number;
      reason: string;
    }) => rejectAttendanceAdjustment(requestId, stepOrder, reason),
    onSuccess: () => {
      toast.success(t("attendanceApproverDashboardToastRejectSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["attendance", "adjustments"],
      });
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectRequestId(null);
      setRejectStepOrder(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("attendanceApproverDashboardToastRejectError"));
    },
  });

  // ─── Handlers ───
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openApproveDialog = useCallback(
    (request: PendingRequest) => {
      const userStep = request.approvalChain?.find(
        (e) => e.approverId === currentUserId && e.action === "PENDING",
      );
      setApproveRequestId(request.id);
      setApproveStepOrder(userStep?.stepOrder ?? 1);
      setApproveDialogOpen(true);
    },
    [currentUserId],
  );

  const openRejectDialog = useCallback(
    (request: PendingRequest) => {
      const userStep = request.approvalChain?.find(
        (e) => e.approverId === currentUserId && e.action === "PENDING",
      );
      setRejectRequestId(request.id);
      setRejectStepOrder(userStep?.stepOrder ?? 1);
      setRejectDialogOpen(true);
    },
    [currentUserId],
  );

  const handleApprove = useCallback(() => {
    if (approveRequestId && approveStepOrder !== null) {
      approveMutation.mutate({
        requestId: approveRequestId,
        stepOrder: approveStepOrder,
        note: approveNote || undefined,
      });
    }
  }, [approveRequestId, approveStepOrder, approveNote, approveMutation]);

  const handleReject = useCallback(() => {
    if (rejectRequestId && rejectStepOrder !== null && rejectReason.trim()) {
      rejectMutation.mutate({
        requestId: rejectRequestId,
        stepOrder: rejectStepOrder,
        reason: rejectReason.trim(),
      });
    }
  }, [rejectRequestId, rejectStepOrder, rejectReason, rejectMutation]);

  const resetFilters = useCallback(() => {
    setFilterDepartment("all");
    setSortBy("date_desc");
    setSearch("");
    setShowOnlyMine(false);
  }, []);

  // ─── Search & Keyboard Shortcuts ───
  const handleSearchToggle = useCallback(() => {
    setSearchExpanded((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearch("");
      }
      return next;
    });
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchExpanded(false);
        setSearch("");
        searchInputRef.current?.blur();
      } else if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        const firstCard = document.querySelector("[data-request-card]");
        if (firstCard) {
          (firstCard as HTMLElement).focus();
          (firstCard as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    },
    [],
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputFocused) return;

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        handleSearchToggle();
      }

      if (e.key === "Escape" && searchExpanded) {
        setSearchExpanded(false);
        setSearch("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [searchExpanded, handleSearchToggle]);

  // ─── Computed ───
  const pendingCount = pendingData?.length ?? 0;

  const filteredItems = useMemo(() => {
    let items = (pendingData ?? []) as PendingRequest[];

    // Filter by department
    if (filterDepartment !== "all") {
      items = items.filter((r) => r.departmentName === filterDepartment);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.departmentName.toLowerCase().includes(q),
      );
    }

    // Filter by my step
    if (showOnlyMine) {
      items = items.filter((r) =>
        r.approvalChain?.some(
          (e) => e.approverId === currentUserId && e.action === "PENDING",
        ),
      );
    }

    // Sort
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date_asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name_asc":
          return a.userName.localeCompare(b.userName);
        case "name_desc":
          return b.userName.localeCompare(a.userName);
        default:
          return 0;
      }
    });

    return items;
  }, [
    pendingData,
    filterDepartment,
    search,
    sortBy,
    showOnlyMine,
    currentUserId,
  ]);

  const departments = useMemo(() => {
    return [
      ...new Set(
        (pendingData ?? []).map((r: PendingRequest) => r.departmentName),
      ),
    ];
  }, [pendingData]);

  // ─── Table Settings State ───
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    userName: true,
    departmentName: true,
    date: true,
    checkInOut: true,
    reason: true,
    step: true,
    createdAt: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Column Definitions ───
  const columns = useMemo<ColumnDef<PendingRequest>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              filteredItems.length > 0 &&
              selectedIds.size === filteredItems.length
                ? true
                : selectedIds.size > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={() => {
              if (selectedIds.size === filteredItems.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(filteredItems.map((r) => r.id)));
              }
            }}
            aria-label={t("attendanceApproverDashboardAriaSelectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleSelect(row.original.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label={t("attendanceApproverDashboardAriaSelectRow", {
              userName: row.original.userName,
            })}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableHiding: false,
      },
      {
        accessorKey: "userName",
        header: t("attendanceApproverDashboardHeadEmployee"),
        size: 220,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={row.original.userAvatar || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(row.original.userName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">
              {row.original.userName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "departmentName",
        header: t("attendanceApproverDashboardHeadDepartment"),
        size: 160,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <Building2 className="h-2.5 w-2.5 mr-0.5" />
            {row.original.departmentName}
          </Badge>
        ),
      },
      {
        accessorKey: "date",
        header: t("attendanceApproverDashboardHeadDate"),
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(row.original.date, timezone)}
          </div>
        ),
      },
      {
        id: "checkInOut",
        header: t("attendanceApproverDashboardHeadCheckInOut"),
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.checkInTime || "—"}</span>
            <span className="text-muted-foreground mx-0.5">/</span>
            <span>{row.original.checkOutTime || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: t("attendanceApproverDashboardHeadReason"),
        size: 200,
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {row.original.reason}
          </div>
        ),
      },
      {
        id: "step",
        header: t("attendanceApproverDashboardHeadStep"),
        size: 80,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-400"
          >
            <Timer className="h-2.5 w-2.5 mr-0.5" />
            {t("attendanceApproverDashboardStepPrefix", {
              step: row.original.currentStep,
            })}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("attendanceApproverDashboardHeadSubmittedAt"),
        size: 130,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(row.original.createdAt, timezone, t)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("attendanceApproverDashboardHeadActions"),
        size: 120,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                openApproveDialog(row.original);
              }}
            >
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                openRejectDialog(row.original);
              }}
              title={t("attendanceApproverDashboardActionReject")}
            >
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row.original.id);
              }}
              title={
                expandedIds.has(row.original.id)
                  ? t("attendanceApproverDashboardActionCollapse")
                  : t("attendanceApproverDashboardActionExpand")
              }
            >
              {expandedIds.has(row.original.id) ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [
      filteredItems,
      selectedIds,
      toggleSelect,
      timezone,
      t,
      expandedIds,
      openApproveDialog,
      openRejectDialog,
      toggleExpand,
    ],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold">{t("attendanceApproverDashboardTitle")}</h1>
          </header>
        </section>

        {/* ─── Stats Cards ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-2 shrink-0">
          <StatCard
            title={t("attendanceApproverDashboardStatPendingTitle")}
            value={pendingCount}
            icon={Clock}
            subtitle={t("attendanceApproverDashboardStatPendingSubtitle")}
            className="border-yellow-200 dark:border-yellow-800 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30"
          />
          <StatCard
            title={t("attendanceApproverDashboardStatTodayTitle")}
            value={Math.min(pendingCount, 3)}
            icon={CheckCircle2}
            subtitle={t("attendanceApproverDashboardStatTodaySubtitle")}
            className="border-blue-200 dark:border-blue-800 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
          />
          <StatCard
            title={t("attendanceApproverDashboardStatApprovedWeekTitle")}
            value={7}
            icon={CheckCircle}
            subtitle={t("attendanceApproverDashboardStatApprovedWeekSubtitle", {
              count: 7,
            })}
            trend={{
              value: 14,
              label: t("attendanceApproverDashboardStatApprovedWeekTrend"),
            }}
            className="border-green-200 dark:border-green-800 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
          />
          <StatCard
            title={t("attendanceApproverDashboardStatRejectedWeekTitle")}
            value={2}
            icon={XCircle}
            subtitle={t("attendanceApproverDashboardStatRejectedWeekSubtitle", {
              count: 2,
            })}
            className="border-red-200 dark:border-red-800 bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
          />
        </div>

        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-end gap-2 px-2 py-2 shrink-0 w-full">
          <Button
            variant="outline"
            size="xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
            />
            {t("attendanceApproverDashboardRefresh")}
          </Button>

          <FilterPopover
            departments={departments}
            filterDepartment={filterDepartment}
            setFilterDepartment={setFilterDepartment}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={resetFilters}
          />

          <Button
            variant={showOnlyMine ? "default" : "outline"}
            size="xs"
            onClick={() => setShowOnlyMine(!showOnlyMine)}
          >
            <User />
            {t("attendanceApproverDashboardOnlyMine")}
          </Button>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant="outline"
            size="xs"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
          </Button>

          {/* Search */}
          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("attendanceApproverDashboardSearchPlaceholder")}
              className={cn(
                "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                searchExpanded ? "w-50 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
              )}
            />

            <Button
              size={"icon-xs"}
              variant={"ghost"}
              onClick={handleSearchToggle}
              className={cn(
                "absolute right-0.5 z-10",
                searchExpanded && "[&_svg]:text-primary",
              )}
            >
              <Search />
            </Button>
          </div>
        </div>

        <TableSettingsPanel
          open={settingsOpen}
          onClose={setSettingsOpen}
          columnVisibility={columnVisibility}
          className="top-10"
          setColumnVisibility={setColumnVisibility}
          columnOptions={[
            {
              key: "userName",
              label: t("attendanceApproverDashboardHeadEmployee"),
              icon: User,
            },
            {
              key: "departmentName",
              label: t("attendanceApproverDashboardHeadDepartment"),
              icon: Building2,
            },
            { key: "date", label: t("attendanceApproverDashboardHeadDate"), icon: Calendar },
            {
              key: "checkInOut",
              label: t("attendanceApproverDashboardHeadCheckInOutCompact"),
              icon: Clock,
            },
            { key: "reason", label: t("attendanceApproverDashboardHeadReason"), icon: FileText },
            { key: "step", label: t("attendanceApproverDashboardHeadStep"), icon: Timer },
            {
              key: "createdAt",
              label: t("attendanceApproverDashboardHeadSubmittedAt"),
              icon: Clock,
            },
          ]}
          defaultVisibleColumns={{
            userName: true,
            departmentName: true,
            date: true,
            checkInOut: true,
            reason: false,
            step: true,
            createdAt: false,
          }}
          hiddenColumnIndices={[0]}
        />
      </div>

      {/* ─── Table Section ─── */}

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
          <span className="text-xs text-muted-foreground mr-1">
            {t("attendanceApproverDashboardSelectedLabel", {
              count: selectedIds.size,
            })}
          </span>
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-xs"
            onClick={() => setBulkApproveOpen(true)}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("attendanceApproverDashboardSelectedApprove", {
              count: selectedIds.size,
            })}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto h-6 w-6"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="h-full flex flex-col flex-1">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-7 px-2 select-none z-10 relative"
                    style={{ width: header.getSize() }}
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
            {isLoading ? (
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
                  className="group/row cursor-default"
                  onClick={() => toggleExpand(row.original.id)}
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
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p>{t("attendanceApproverDashboardEmpty")}</p>
                    {search && (
                      <Button variant="link" size="sm" onClick={resetFilters}>
                        {t("attendanceApproverDashboardClearSearch")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Summary */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-2 py-2 border-t shrink-0">
            <p className="text-xs text-muted-foreground">
              {t("attendanceApproverDashboardShowing", {
                count: filteredItems.length,
              })}
            </p>
          </div>
        )}
      </div>

      {/* ─── Approve Dialog ─── */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle>
                  {t("attendanceApproverDashboardApproveDialogTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("attendanceApproverDashboardApproveDialogDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="approve-note" className="text-sm">
                {t("attendanceApproverDashboardApproveDialogNote")}
              </Label>
              <Textarea
                id="approve-note"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder={t("attendanceApproverDashboardApproveDialogNotePlaceholder")}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              {t("attendanceApproverDashboardCancel")}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t("attendanceApproverDashboardApproveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Dialog ─── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle>
                  {t("attendanceApproverDashboardRejectDialogTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("attendanceApproverDashboardRejectDialogDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="reject-reason" className="text-sm">
                {t("attendanceApproverDashboardRejectDialogReason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("attendanceApproverDashboardRejectDialogReasonPlaceholder")}
                rows={3}
                className="mt-1.5"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              {t("attendanceApproverDashboardCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t("attendanceApproverDashboardRejectConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Approve Dialog ─── */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle>
                  {t("attendanceApproverDashboardBulkDialogTitle", {
                    count: selectedIds.size,
                  })}
                </DialogTitle>
                <DialogDescription>
                  {t("attendanceApproverDashboardBulkDialogDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="bulk-approve-note" className="text-sm">
                {t("attendanceApproverDashboardBulkDialogNote")}
              </Label>
              <Textarea
                id="bulk-approve-note"
                value={bulkApproveNote}
                onChange={(e) => setBulkApproveNote(e.target.value)}
                placeholder={t("attendanceApproverDashboardBulkDialogNotePlaceholder")}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkApproveOpen(false)}>
              {t("attendanceApproverDashboardCancel")}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("attendanceApproverDashboardProcessing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

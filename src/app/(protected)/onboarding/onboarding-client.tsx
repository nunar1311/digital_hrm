"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  RefreshCw,
  Settings,
  X,
  Loader2,
  Building2,
  User,
  Calendar,
  ListFilter,
  Plus,
  FileCheck,
  Eye,
  Trash2,
} from "lucide-react";
import {
  getOnboardings,
  deleteOnboarding,
  updateOnboarding,
} from "./actions";
import {
  type OnboardingItem,
  type OnboardingPage,
  type OnboardingStats,
  type OnboardingStatus,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_COLORS,
} from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateOnboardingDialog } from "@/components/onboarding/create-onboarding-dialog";
import { HireCandidateDialog } from "@/components/onboarding/hire-candidate-dialog";
import { useRightSidebar } from "@/contexts/sidebar-context";

// ============================================================
// TYPES
// ============================================================

interface OnboardingClientProps {
  initialOnboardings: OnboardingPage;
  initialStats: OnboardingStats;
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

function getRelativeTime(dateStr: string | Date): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return formatDate(dateStr);
  } catch {
    return formatDate(dateStr);
  }
}

function getUserName(user: OnboardingItem["user"]): string {
  return user.name || "N/A";
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow py-2", className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "p-2 rounded-lg shrink-0",
            className?.includes("yellow")
              ? "bg-yellow-100 text-yellow-600"
              : className?.includes("green")
                ? "bg-green-100 text-green-600"
                : className?.includes("blue")
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FILTER POPOVER
// ============================================================

function FilterPopover({
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  onReset,
}: {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasFilters = filterStatus !== "ALL" || sortBy !== "date_desc";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className={cn(hasFilters && "border-primary bg-primary/5")}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Bộ lọc
          {hasFilters && (
            <Badge
              variant="default"
              className="ml-1 h-4 w-4 p-0 justify-center text-[10px]"
            >
              {hasFilters ? 1 : 0}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Bộ lọc</p>
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
                Đặt lại
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trạng thái</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ bắt đầu</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang tiếp nhận</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Sắp xếp theo
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Mới nhất</SelectItem>
                <SelectItem value="date_asc">Cũ nhất</SelectItem>
                <SelectItem value="name_asc">Tên A → Z</SelectItem>
                <SelectItem value="name_desc">Tên Z → A</SelectItem>
                <SelectItem value="progress_desc">
                  Tiến độ cao → thấp
                </SelectItem>
                <SelectItem value="progress_asc">Tiến độ thấp → cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function OnboardingClient({
  initialOnboardings,
  initialStats,
}: OnboardingClientProps) {
  const queryClient = useQueryClient();

  // ─── Filters ───
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | "ALL">(
    "ALL",
  );
  const [sortBy, setSortBy] = useState("date_desc");
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Column visibility ───
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    userName: true,
    department: true,
    startDate: true,
    progress: true,
    status: true,
    createdAt: true,
  });

  // ─── Selection ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Dialogs ───
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ─── Right sidebar ───
  const { openRightSidebar } = useRightSidebar();

  // ─── Click outside to close search ───
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // ─── Queries ───
  const {
    data: onboardingsData = initialOnboardings,
    isLoading,
    isFetching,
  } = useQuery<OnboardingPage>({
    queryKey: ["onboardings", statusFilter, search],
    queryFn: () =>
      getOnboardings({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search || undefined,
        page: 1,
        pageSize: 100,
      }),
    placeholderData: initialOnboardings,
    staleTime: 0,
  });

  const { data: statsData = initialStats } = useQuery<OnboardingStats>({
    queryKey: ["onboarding-stats"],
    queryFn: async () => {
      const { getOnboardingStats } = await import("./actions");
      return getOnboardingStats();
    },
    placeholderData: initialStats,
    staleTime: 0,
  });

  // ─── Mutations ───
  const deleteMutation = useMutation({
    mutationFn: deleteOnboarding,
    onSuccess: () => {
      toast.success("Đã xóa onboarding");
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-stats"] });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "IN_PROGRESS" | "COMPLETED";
    }) => updateOnboarding(id, { status }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-detail"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-stats"] });
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  // ─── Tab filter ───
  const tabValue =
    statusFilter === "ALL"
      ? "all"
      : statusFilter === "PENDING"
        ? "pending"
        : statusFilter === "IN_PROGRESS"
          ? "in_progress"
          : statusFilter === "COMPLETED"
            ? "completed"
            : "all";

  const handleTabChange = (val: string) => {
    if (val === "all") setStatusFilter("ALL");
    else if (val === "pending") setStatusFilter("PENDING");
    else if (val === "in_progress") setStatusFilter("IN_PROGRESS");
    else if (val === "completed") setStatusFilter("COMPLETED");
    else setStatusFilter("ALL");
  };

  // ─── Tab counts & Data ───
  const tabData = useMemo(() => {
    const items = onboardingsData.items;
    switch (tabValue) {
      case "pending":
        return items.filter((r: OnboardingItem) => r.status === "PENDING");
      case "in_progress":
        return items.filter((r: OnboardingItem) => r.status === "IN_PROGRESS");
      case "completed":
        return items.filter((r: OnboardingItem) => r.status === "COMPLETED");
      default:
        return items;
    }
  }, [onboardingsData.items, tabValue]);

  // ─── Column Definitions ───
  const columns = useMemo<ColumnDef<OnboardingItem>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const selectedCount = tabData.filter((r: OnboardingItem) =>
            selectedIds.has(r.id),
          ).length;
          const isAllSelected =
            tabData.length > 0 && selectedCount === tabData.length;
          const isIndeterminate =
            selectedCount > 0 && selectedCount < tabData.length;

          return (
            <Checkbox
              checked={
                isAllSelected ? true : isIndeterminate ? "indeterminate" : false
              }
              onCheckedChange={() => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (isAllSelected) {
                    tabData.forEach((r: OnboardingItem) => next.delete(r.id));
                  } else {
                    tabData.forEach((r: OnboardingItem) => next.add(r.id));
                  }
                  return next;
                });
              }}
              aria-label="Chọn tất cả"
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(row.original.id)) {
                  next.delete(row.original.id);
                } else {
                  next.add(row.original.id);
                }
                return next;
              })
            }
            aria-label={`Chọn onboarding của ${getUserName(row.original.user)}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableHiding: false,
      },
      {
        accessorKey: "userName",
        id: "userName",
        header: "Nhân viên",
        size: 220,
        cell: ({ row }) => {
          const user = row.original.user;
          const name = getUserName(user);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.username || user.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        id: "department",
        header: "Phòng ban",
        size: 150,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px]">
            {row.original.user.department?.name || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "startDate",
        id: "startDate",
        header: "Ngày bắt đầu",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.startDate)}</span>
        ),
      },
      {
        id: "progress",
        header: "Tiến độ",
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground min-w-[36px]">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) => {
          const status = row.original.status as OnboardingStatus;
          return (
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 whitespace-nowrap",
                ONBOARDING_STATUS_COLORS[status],
              )}
            >
              {ONBOARDING_STATUS_LABELS[status]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: "Tạo",
        size: 110,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 120,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRightSidebar("onboarding", { id: row.original.id });
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết</TooltipContent>
            </Tooltip>

            {row.original.status === "PENDING" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMutation.mutate({
                        id: row.original.id,
                        status: "IN_PROGRESS",
                      });
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bắt đầu onboarding</TooltipContent>
              </Tooltip>
            )}

            {row.original.status === "IN_PROGRESS" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMutation.mutate({
                        id: row.original.id,
                        status: "COMPLETED",
                      });
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hoàn thành onboarding</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(row.original.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xóa</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [tabData, selectedIds, updateMutation, openRightSidebar],
  );

  const resetFilters = useCallback(() => {
    setStatusFilter("ALL");
    setSortBy("date_desc");
    setSearch("");
  }, []);

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
      }
    },
    [],
  );

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInputFocused) return;
      if (e.key === "/") {
        e.preventDefault();
        handleSearchToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSearchToggle]);

  // ─── Sort data ───
  const sortedData = useMemo(() => {
    const sorted = [...tabData];
    switch (sortBy) {
      case "date_asc":
        sorted.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        break;
      case "date_desc":
        sorted.sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );
        break;
      case "name_asc":
        sorted.sort((a, b) =>
          (a.user.name || "").localeCompare(b.user.name || ""),
        );
        break;
      case "name_desc":
        sorted.sort((a, b) =>
          (b.user.name || "").localeCompare(a.user.name || ""),
        );
        break;
      case "progress_desc":
        sorted.sort((a, b) => b.progress - a.progress);
        break;
      case "progress_asc":
        sorted.sort((a, b) => a.progress - b.progress);
        break;
    }
    return sorted;
  }, [tabData, sortBy]);

  // ─── Table with sorted data ───
  const tableForRender = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-2">
              Tiếp nhận nhân sự
            </h1>
          </header>
        </section>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
          <StatCard
            title="Chờ bắt đầu"
            value={statsData.pending}
            icon={Clock}
            className="yellow"
          />
          <StatCard
            title="Đang tiếp nhận"
            value={statsData.inProgress}
            icon={Users}
            className="blue"
          />
          <StatCard
            title="Hoàn thành"
            value={statsData.completed}
            icon={CheckCircle2}
            className="green"
          />
          <StatCard title="Tổng cộng" value={statsData.total} icon={FileText} />
        </div>

        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowHireDialog(true)}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Tuyển ứng viên
          </Button>

          <Button size="xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tạo onboarding
          </Button>

          <Separator orientation="vertical" className="h-4!" />

          <FilterPopover
            filterStatus={statusFilter}
            setFilterStatus={(v) =>
              setStatusFilter(v as OnboardingStatus | "ALL")
            }
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={resetFilters}
          />

          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["onboardings"] })
            }
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
          </Button>

          {/* Search */}
          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm nhân viên..."
              className={cn(
                "h-6 text-xs transition-all duration-300 ease-in-out pr-6",
                searchExpanded ? "w-48 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
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
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ─── Table Settings ─── */}
        <TableSettingsPanel
          open={settingsOpen}
          onClose={setSettingsOpen}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          defaultVisibleColumns={{
            userName: true,
            department: true,
            startDate: true,
            progress: true,
            status: true,
            createdAt: true,
          }}
          columnOptions={[
            { key: "userName", label: "Nhân viên", icon: User },
            { key: "department", label: "Phòng ban", icon: Building2 },
            { key: "startDate", label: "Ngày bắt đầu", icon: Calendar },
            { key: "progress", label: "Tiến độ", icon: FileCheck },
            { key: "status", label: "Trạng thái", icon: Clock },
            { key: "createdAt", label: "Ngày tạo", icon: Clock },
          ]}
          className="top-10"
          hiddenColumnIndices={[]}
          disabledColumnIndices={[]}
        />
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex items-center px-2 pb-0 border-b bg-background shrink-0">
        {(
          [
            { value: "all", label: "Tất cả", count: statsData.total },
            {
              value: "pending",
              label: "Chờ bắt đầu",
              count: statsData.pending,
            },
            {
              value: "in_progress",
              label: "Đang tiếp nhận",
              count: statsData.inProgress,
            },
            {
              value: "completed",
              label: "Hoàn thành",
              count: statsData.completed,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px",
              tabValue === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}{" "}
            <Badge
              className={cn(
                "p-0 px-1 text-[10px]",
                tabValue === tab.value
                  ? "bg-primary "
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* ─── Batch Actions Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20 shrink-0">
          <span className="text-xs text-muted-foreground">
            Đã chọn{" "}
            <strong className="text-foreground">{selectedIds.size}</strong> mục
          </span>
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

      {/* ─── Table ─── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            {tableForRender.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-7 px-2 select-none z-10 relative bg-background"
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
            ) : tableForRender.getRowModel().rows?.length ? (
              tableForRender.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group/row cursor-pointer"
                  onClick={() => openRightSidebar("onboarding", { id: row.original.id })}
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
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>Không có nhân viên nào được tiếp nhận</p>
                    {search && (
                      <Button variant="link" size="sm" onClick={resetFilters}>
                        Xóa tìm kiếm
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Summary Footer ─── */}
      {!isLoading && onboardingsData.total > 0 && (
        <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{sortedData.length}</strong> /{" "}
            <strong>{onboardingsData.total}</strong> nhân viên
          </p>
          {statsData.pending > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700"
            >
              {statsData.pending} nhân viên chờ bắt đầu
            </Badge>
          )}
        </div>
      )}

      {/* ─── Create Dialog ─── */}
      <CreateOnboardingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["onboardings"] });
          queryClient.invalidateQueries({ queryKey: ["onboarding-stats"] });
        }}
      />

      {/* ─── Hire Dialog ─── */}
      <HireCandidateDialog
        open={showHireDialog}
        onOpenChange={setShowHireDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["onboardings"] });
          queryClient.invalidateQueries({ queryKey: ["onboarding-stats"] });
        }}
      />

      {/* ─── Delete Confirm ─── */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa onboarding này? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

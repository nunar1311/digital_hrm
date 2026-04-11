"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Receipt,
  Eye,
  Search,
  RefreshCw,
  Settings,
  ListFilter,
  FileText,
  CheckCircle2,
  Mail,
  X,
  Download,
  Send,
} from "lucide-react";
import {
  getPayslips,
  sendSpecificPayslipEmails,
  bulkUpdatePayslipPasswordByIds,
} from "../actions";
import {
  type Payslip,
  type PayslipStatus,
} from "@/app/(protected)/payroll/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

interface PayslipsClientProps {
  initialPayslips: Payslip[];
  isSelfService?: boolean;
}

type PayslipTab = "all" | "new" | "viewed" | "sent";

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
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

function getInitials(name: string | null | undefined): string {
  if (!name) return "NV";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_CONFIG: Record<PayslipStatus, { label: string; color: string }> = {
  GENERATED: {
    label: "Mới tạo",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  VIEWED: {
    label: "Đã xem",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DOWNLOADED: {
    label: "Đã tải",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

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
                  : className?.includes("amber")
                    ? "bg-amber-100 text-amber-600"
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
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  onReset,
}: {
  monthFilter: string;
  setMonthFilter: (v: string) => void;
  yearFilter: string;
  setYearFilter: (v: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasFilters = monthFilter !== "all" || yearFilter !== "all";

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className={cn(hasFilters && "border-primary bg-primary/5")}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Lọc
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
            <Label className="text-xs text-muted-foreground">Tháng</Label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    Tháng {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Năm</Label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
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

export default function PayslipsClient({
  initialPayslips,
  isSelfService = false,
}: PayslipsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ─── Filters ───
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Column visibility ───
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    period: true,
    username: true,
    employeeName: true,
    department: true,
    grossSalary: true,
    netSalary: true,
    status: true,
    actions: false,
  });

  // ─── Selection ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── State for batch actions ───
  const [isSending, setIsSending] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
    data: payslips = initialPayslips,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["payslips", monthFilter, yearFilter],
    queryFn: () =>
      getPayslips(
        monthFilter === "all" || yearFilter === "all"
          ? {}
          : {
              month: parseInt(monthFilter),
              year: parseInt(yearFilter),
            },
      ),
    initialData: initialPayslips,
    staleTime: 0,
  });

  // ─── Stats derived from payslips data ───
  const statsData = useMemo(() => {
    const all = payslips;
    return {
      total: all.length,
      viewed: all.filter((p: Payslip) => p.status !== "GENERATED").length,
      pending: all.filter((p: Payslip) => p.status === "GENERATED").length,
    };
  }, [payslips]);

  // ─── Tab filter ───
  const [tabValue, setTabValue] = useState<PayslipTab>("all");

  const handleTabChange = (val: string) => {
    setTabValue(val as PayslipTab);
  };

  // ─── Tab counts & data ───
  const tabData = useMemo(() => {
    const items = payslips;
    switch (tabValue) {
      case "new":
        return items.filter((p: Payslip) => p.status === "GENERATED");
      case "viewed":
        return items.filter(
          (p: Payslip) => p.status === "VIEWED" || p.status === "DOWNLOADED",
        );
      case "sent":
        return items.filter(
          (p: Payslip) => p.status === "DOWNLOADED" || p.status === "VIEWED",
        );
      default:
        return items;
    }
  }, [payslips, tabValue]);

  // ─── Column Definitions ───
  const columns = useMemo<ColumnDef<Payslip>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const selectedCount = tabData.filter((p: Payslip) =>
            selectedIds.has(p.id),
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
                    tabData.forEach((p: Payslip) => next.delete(p.id));
                  } else {
                    tabData.forEach((p: Payslip) => next.add(p.id));
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
            aria-label={`Chọn phiếu lương của ${row.original.employeeName}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableHiding: false,
      },
      {
        id: "period",
        header: "Kỳ lương",
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
              T{row.original.month}
            </div>
            <span className="text-sm font-medium">
              Tháng {row.original.month}/{row.original.year}
            </span>
          </div>
        ),
      },
      ...(isSelfService
        ? []
        : [
            {
              accessorKey: "username",
              id: "username",
              header: "Mã nhân viên",
              size: 100,
              cell: ({ row }: { row: { original: Payslip } }) => (
                <span className="font-mono text-xs text-muted-foreground">
                  {row.original.username || "—"}
                </span>
              ),
            } as ColumnDef<Payslip>,
          ]),
      ...(isSelfService
        ? []
        : [
            {
              id: "employeeName",
              accessorKey: "employeeName",
              header: "Nhân viên",
              size: 200,
              cell: ({ row }: { row: { original: Payslip } }) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(row.original.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {row.original.employeeName}
                    </div>
                  </div>
                </div>
              ),
            } as ColumnDef<Payslip>,
          ]),
      ...(isSelfService
        ? []
        : [
            {
              accessorKey: "departmentName",
              id: "department",
              header: "Phòng ban",
              size: 150,
              cell: ({ row }: { row: { original: Payslip } }) => (
                <Badge variant="secondary" className="text-[10px]">
                  {row.original.departmentName || "—"}
                </Badge>
              ),
            } as ColumnDef<Payslip>,
          ]),
      {
        accessorKey: "grossSalary",
        id: "grossSalary",
        header: "Lương Gross",
        size: 140,
        cell: ({ row }: { row: { original: Payslip } }) => (
          <span className="text-sm font-medium text-blue-600">
            {formatCurrency(row.original.grossSalary)}
          </span>
        ),
      },
      {
        accessorKey: "netSalary",
        id: "netSalary",
        header: "Lương Net",
        size: 140,
        cell: ({ row }: { row: { original: Payslip } }) => (
          <span className="text-sm font-semibold text-emerald-600">
            {formatCurrency(row.original.netSalary)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Trạng thái",
        size: 120,
        cell: ({ row }: { row: { original: Payslip } }) => {
          const cfg = STATUS_CONFIG[row.original.status] || {
            label: row.original.status,
            color: "",
          };
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 whitespace-nowrap",
                cfg.color,
              )}
            >
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        id: "createdAt",
        header: "Tạo",
        size: 110,
        cell: ({ row }: { row: { original: Payslip } }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 120,
        enableHiding: false,
        cell: ({ row }: { row: { original: Payslip } }) => (
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/payroll/payslips/${row.original.id}`);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết</TooltipContent>
            </Tooltip>

            {row.original.status === "GENERATED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success("Đã gửi phiếu lương qua email");
                    }}
                  >
                    <Send className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gửi email</TooltipContent>
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
                    router.push(
                      `/payroll/payslips/${row.original.id}?download=true`,
                    );
                  }}
                >
                  <Download className="h-3.5 w-3.5 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tải PDF</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [tabData, selectedIds, isSelfService, router],
  );

  const resetFilters = useCallback(() => {
    setMonthFilter("all");
    setYearFilter(new Date().getFullYear().toString());
    setSearch("");
    setTabValue("all");
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

  // ─── Filter data by search ───
  const filteredData = useMemo(() => {
    if (!search) return tabData;
    const s = search.toLowerCase();
    return tabData.filter(
      (p: Payslip) =>
        p.employeeName.toLowerCase().includes(s) ||
        p.username?.toLowerCase().includes(s) ||
        p.departmentName?.toLowerCase().includes(s),
    );
  }, [tabData, search]);

  // ─── Table with filtered data ───
  const tableForRender = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // ─── Batch send handler ───
  const handleBatchSend = useCallback(async () => {
    setIsSending(true);
    const idArray = Array.from(selectedIds);
    try {
      const res = await sendSpecificPayslipEmails(idArray);
      if (res.success) {
        toast.success(`Đã gửi thành công ${res.sent} phiếu lương qua email`);
        setSelectedIds(new Set());
      } else {
        toast.error(res.message || "Lỗi khi gửi email");
      }
    } catch (e) {
      toast.error("Lỗi khi gửi email");
    } finally {
      setIsSending(false);
    }
  }, [selectedIds]);

  // ─── Batch set password handler ───
  const handleBatchPasswordSubmit = async () => {
    setIsUpdatingPassword(true);
    const idArray = Array.from(selectedIds);
    try {
      const res = await bulkUpdatePayslipPasswordByIds(
        idArray,
        passwordValue || undefined,
      );
      if (res.success) {
        toast.success(
          passwordValue
            ? `Đã cài mật khẩu cho ${res.updated} phiếu lương`
            : `Đã xóa mật khẩu cho ${res.updated} phiếu lương`,
        );
        setShowPasswordDialog(false);
        queryClient.invalidateQueries({ queryKey: ["payslips"] });
      } else {
        toast.error("Thiết lập mật khẩu thất bại");
      }
    } catch (e) {
      toast.error("Lỗi server khi thiết lập mật khẩu");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ─── Batch download handler ───
  const handleBatchDownload = useCallback(() => {
    toast.success(`Đang tải ${selectedIds.size} phiếu lương...`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-2">
              {isSelfService ? "Phiếu lương của tôi" : "Phiếu lương"}
            </h1>
          </header>
        </section>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
          <StatCard
            title="Tổng phiếu"
            value={statsData.total}
            icon={FileText}
            className=""
          />
          <StatCard
            title="Mới tạo"
            value={statsData.pending}
            icon={Receipt}
            className="blue"
          />
          <StatCard
            title="Đã xem/tải"
            value={statsData.viewed}
            icon={CheckCircle2}
            className="green"
          />
          <StatCard
            title="Đã gửi email"
            value={0}
            icon={Mail}
            className="amber"
          />
        </div>

        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
          {!isSelfService && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={handleBatchSend}
                disabled={selectedIds.size === 0 || isSending}
              >
                <Mail className="mr-1 h-3.5 w-3.5" />
                {isSending ? "Đang gửi..." : "Gửi email"}{" "}
                {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setPasswordValue("");
                  setShowPasswordDialog(true);
                }}
                disabled={selectedIds.size === 0}
              >
                <Settings className="mr-1 h-3.5 w-3.5" />
                Cài mật khẩu{" "}
                {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={handleBatchDownload}
                disabled={selectedIds.size === 0}
              >
                <Download />
                Tải PDF {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>

              <Separator orientation="vertical" className="h-4!" />
            </>
          )}

          <FilterPopover
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            onReset={resetFilters}
          />

          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["payslips"] })
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
            period: true,
            username: true,
            employeeName: true,
            department: true,
            grossSalary: true,
            netSalary: true,
            status: true,
            createdAt: false,
          }}
          columnOptions={[
            { key: "period", label: "Kỳ lương", icon: FileText },
            { key: "username", label: "Mã nhân viên", icon: FileText },
            { key: "employeeName", label: "Nhân viên", icon: FileText },
            { key: "department", label: "Phòng ban", icon: FileText },
            { key: "grossSalary", label: "Lương Gross", icon: FileText },
            { key: "netSalary", label: "Lương Net", icon: FileText },
            { key: "status", label: "Trạng thái", icon: FileText },
            { key: "createdAt", label: "Ngày tạo", icon: FileText },
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
            { value: "new", label: "Mới tạo", count: statsData.pending },
            {
              value: "viewed",
              label: "Đã xem",
              count: statsData.viewed,
            },
            { value: "sent", label: "Đã tải", count: 0 },
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
                  ? "bg-primary"
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
                  onClick={() =>
                    router.push(`/payroll/payslips/${row.original.id}`)
                  }
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
                    <Receipt className="h-8 w-8 text-muted-foreground/50" />
                    <p>Không có phiếu lương nào</p>
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
      {!isLoading && payslips.length > 0 && (
        <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{filteredData.length}</strong> /{" "}
            <strong>{payslips.length}</strong> phiếu lương
          </p>
          {statsData.pending > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 border-blue-200 text-blue-700"
            >
              {statsData.pending} phiếu mới chưa xem
            </Badge>
          )}
        </div>
      )}

      {/* ─── Password Setup Dialog ─── */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cài đặt bảo mật phiếu lương</DialogTitle>
            <DialogDescription>
              Thiết lập mật khẩu chung cho {selectedIds.size} phiếu lương đã
              chọn. Nhân viên sẽ cần nhập mật khẩu này để xem chi tiết.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="password">
                Mật khẩu (Bỏ trống để xóa bảo mật)
              </Label>
              <Input
                id="password"
                type="text" // Show as text so HR can see the generated pin
                placeholder="Ví dụ: CMND/Mã NV/Ký tự tự chọn..."
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
              {!passwordValue && (
                <p className="text-xs text-amber-600">
                  Cảnh báo: Nếu để trống, bạn đang thao tác HỦY BỎ bảo vệ mật
                  khẩu trên các phiếu lương này.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleBatchPasswordSubmit}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

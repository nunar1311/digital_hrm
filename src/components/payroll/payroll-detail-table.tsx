"use client";

import {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
  Fragment,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FileDown,
  Search,
  MoreHorizontal,
  RefreshCw,
  ListFilter,
  Settings,
  User,
  BadgeCheck,
  Hash,
  Building2,
  Coins,
  Plus,
  Gift,
  Timer,
  DollarSign,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Minus,
  Banknote,
  CircleDot,
  CalendarDays,
} from "lucide-react";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import type {
  PayrollRecordDetail,
  PayrollDetailStatus,
} from "@/app/(protected)/payroll/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PAID", label: "Đã trả" },
];

export function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

interface PayrollDetailTableProps {
  details: PayrollRecordDetail[];
  departments: { id: string; name: string }[];
  departmentId: string | null;
  onViewPayslip: (userId: string) => void;
  onExportPayslip: (userId: string) => void;
  onViewEmployeeDetail: (detail: PayrollRecordDetail) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  totalDetails: number;
}

export function PayrollDetailTable({
  details,
  departments,
  departmentId,
  onViewPayslip,
  onExportPayslip,
  onViewEmployeeDetail,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  totalDetails,
}: PayrollDetailTableProps) {
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>(
    departmentId ?? "all",
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Column visibility settings
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    stt: true,
    username: true,
    name: true,
    department: true,
    position: true,
    baseSalary: true,
    salarySource: true,
    proratedSalary: true,
    allowanceAmount: true,
    bonusAmount: false,
    overtimeAmount: false,
    grossSalary: true,
    socialInsurance: false,
    healthInsurance: false,
    unemploymentInsurance: false,
    taxAmount: false,
    deductionAmount: false,
    netSalary: true,
    status: true,
    workDays: true,
  });

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wrapText, setWrapText] = useState(false);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  }, [searchExpanded, search]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const filteredDetails = useMemo(() => {
    return details.filter((detail) => {
      const matchesSearch =
        search === "" ||
        detail.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        detail.user?.username?.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        filterDepartment === "all" ||
        detail.user?.department?.name ===
          departments.find((d) => d.id === filterDepartment)?.name;

      const matchesStatus =
        filterStatus === "all" || detail.status === filterStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [details, search, filterDepartment, filterStatus, departments]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: PayrollDetailStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="bg-blue-50">
            Đã xác nhận
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="default" className="bg-green-600">
            Đã trả
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const activeFiltersCount = [
    filterDepartment !== "all",
    filterStatus !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterDepartment("all");
    setFilterStatus("all");
  };

  // ─── TanStack Table columns ──────────────────────────────────────────────

  const columns = useMemo<ColumnDef<PayrollRecordDetail>[]>(
    () => [
      {
        id: "expand",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover/row:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(row.original.id);
            }}
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronDown />
            ) : (
              <ChevronRight />
            )}
          </Button>
        ),
        enableSorting: false,
      },
      {
        id: "stt",
        header: "STT",
        size: 48,
        cell: ({ row }) => {
          const idx = filteredDetails.findIndex(
            (d) => d.id === row.original.id,
          );
          return (
            <span className="text-muted-foreground text-xs">{idx + 1}</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "user.username",
        id: "username",
        header: "Mã nhân viên",
        size: 112,
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.user?.username || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "user.name",
        id: "name",
        header: "Họ tên",
        size: 180,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user?.name || "—"}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "user.department.name",
        id: "department",
        header: "Phòng ban",
        size: 140,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.user?.department?.name || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "position",
        header: "Chức vụ",
        size: 140,
        cell: ({ row }) => {
          const name = row.original.positionName || row.original.user?.position?.name || "—";
          const authority = row.original.positionAuthority || row.original.user?.position?.authority;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm truncate">{name}</span>
              {authority && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 w-fit">
                  {authority}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "baseSalary",
        id: "baseSalary",
        header: "Lương CB",
        size: 130,
        cell: ({ row }) => (
          <span className="text-right block font-medium">
            {formatCurrency(row.original.baseSalary)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "proratedSalary",
        id: "proratedSalary",
        header: "Lương CK",
        size: 130,
        cell: ({ row }) => (
          <span
            className="text-right block"
            title="Lương cơ bản đã điều chỉnh theo ngày công thực tế"
          >
            {formatCurrency(row.original.proratedSalary)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "allowanceAmount",
        id: "allowanceAmount",
        header: "Phụ cấp",
        size: 110,
        cell: ({ row }) => (
          <span className="text-right block">
            {formatCurrency(row.original.allowanceAmount)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "bonusAmount",
        id: "bonusAmount",
        header: "Thưởng",
        size: 100,
        cell: ({ row }) => (
          <span className="text-right block">
            {formatCurrency(row.original.bonusAmount)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "overtimeAmount",
        id: "overtimeAmount",
        header: "Tăng ca",
        size: 100,
        cell: ({ row }) => (
          <span className="text-right block">
            {formatCurrency(row.original.overtimeAmount)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "grossSalary",
        id: "grossSalary",
        header: "Gross",
        size: 130,
        cell: ({ row }) => (
          <span className="text-right block font-medium text-green-700 bg-emerald-50/30 px-1.5 py-0.5 rounded">
            {formatCurrency(row.original.grossSalary)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "socialInsurance",
        id: "socialInsurance",
        header: "BHXH",
        size: 100,
        cell: ({ row }) => (
          <span className="text-right block text-red-600">
            {formatCurrency(row.original.socialInsurance)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "healthInsurance",
        id: "healthInsurance",
        header: "BHYT",
        size: 100,
        cell: ({ row }) => (
          <span className="text-right block text-red-600">
            {formatCurrency(row.original.healthInsurance)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "unemploymentInsurance",
        id: "unemploymentInsurance",
        header: "BHTN",
        size: 100,
        cell: ({ row }) => (
          <span className="text-right block text-red-600">
            {formatCurrency(row.original.unemploymentInsurance)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "taxAmount",
        id: "taxAmount",
        header: "Thuế TNCN",
        size: 110,
        cell: ({ row }) => (
          <span className="text-right block text-red-600">
            {formatCurrency(row.original.taxAmount)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "deductionAmount",
        id: "deductionAmount",
        header: "Khấu trừ",
        size: 110,
        cell: ({ row }) => (
          <span className="text-right block text-red-600">
            {formatCurrency(row.original.deductionAmount)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "netSalary",
        id: "netSalary",
        header: "Net",
        size: 130,
        cell: ({ row }) => {
          const isZeroNet = row.original.netSalary === 0;
          return (
            <span
              className={cn(
                "text-right block font-semibold px-1.5 py-0.5 rounded",
                isZeroNet
                  ? "text-red-600 bg-red-50"
                  : "text-green-600 bg-blue-50/30"
              )}
            >
              {formatCurrency(row.original.netSalary)}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Trạng thái",
        size: 120,
        cell: ({ row }) =>
          getStatusBadge(row.original.status as PayrollDetailStatus),
        enableSorting: false,
      },
      {
        id: "workDays",
        header: "Ngày công",
        size: 80,
        cell: ({ row }) => {
          const workDays = row.original.workDays;
          const standardDays = row.original.standardDays;
          const isZeroDays = workDays === 0;
          return (
            <div className="text-center">
              <Badge
                variant={isZeroDays ? "destructive" : "outline"}
                className="font-mono"
                title={isZeroDays ? "0 ngày công - không nhận lương" : ""}
              >
                {workDays}/{standardDays}
              </Badge>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        size: 48,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-50">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEmployeeDetail(row.original);
                  }}
                >
                  <Eye />
                  Xem phiếu lương
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportPayslip(row.original.userId);
                  }}
                >
                  <FileDown />
                  Tải PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [expandedRows, filteredDetails, onViewEmployeeDetail, onExportPayslip],
  );

  // TanStack Table setup
  // eslint-disable-next-line
  const table = useReactTable({
    data: filteredDetails,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 h-10 justify-end">
        {/* Status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filterStatus !== "all" ? "outline" : "ghost"}
              size="xs"
              className={cn(
                "h-7 text-xs",
                filterStatus !== "all" &&
                  "bg-primary/10 border-primary text-primary hover:text-primary",
              )}
            >
              <ListFilter className="h-3 w-3" />
              {filterStatus !== "all" && (
                <span className="ml-1 text-xs">
                  {STATUS_OPTIONS.find((s) => s.value === filterStatus)?.label}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Trạng thái
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Department filter */}
        {departmentId ? (
          <div className="flex items-center border rounded-md px-2 py-1">
            <span className="text-xs font-medium">
              {departments.find((d) => d.id === departmentId)?.name}
            </span>
          </div>
        ) : (
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger
              size="sm"
              className={cn(
                "text-xs w-[160px] h-6!",
                filterDepartment !== "all" &&
                  "bg-primary/10 border-primary text-primary",
              )}
            >
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Search expand */}
        <div className="relative flex items-center" ref={mergedSearchRef}>
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm theo mã NV, họ tên..."
            className={cn(
              "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
              searchExpanded ? "w-50 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
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

        <Separator orientation="vertical" className="h-4!" />

        {isFetchingNextPage && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <RefreshCw className="h-3 w-3 animate-spin" />
          </span>
        )}

        <Button
          size="icon-xs"
          variant="outline"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings />
        </Button>
      </div>

      {/* Settings Panel */}
      <TableSettingsPanel
        className="top-9"
        open={settingsOpen}
        onClose={setSettingsOpen}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultVisibleColumns={{
          stt: true,
          username: true,
          name: true,
          department: true,
          baseSalary: true,
          proratedSalary: true,
          allowanceAmount: true,
          bonusAmount: false,
          overtimeAmount: false,
          grossSalary: true,
          socialInsurance: false,
          healthInsurance: false,
          unemploymentInsurance: false,
          taxAmount: false,
          deductionAmount: false,
          netSalary: true,
          status: true,
          workDays: true,
        }}
        columnOptions={[
          {
            key: "stt",
            label: "STT",
            icon: Hash,
          },
          {
            key: "username",
            label: "Mã nhân viên",
            icon: BadgeCheck,
          },
          {
            key: "name",
            label: "Họ tên",
            icon: User,
          },
          {
            key: "department",
            label: "Phòng ban",
            icon: Building2,
          },
          {
            key: "baseSalary",
            label: "Lương CB",
            icon: Coins,
          },
          {
            key: "proratedSalary",
            label: "Lương CK",
            icon: Coins,
          },
          {
            key: "allowanceAmount",
            label: "Phụ cấp",
            icon: Plus,
          },
          {
            key: "bonusAmount",
            label: "Thưởng",
            icon: Gift,
          },
          {
            key: "overtimeAmount",
            label: "Tăng ca",
            icon: Timer,
          },
          {
            key: "grossSalary",
            label: "Gross",
            icon: DollarSign,
          },
          {
            key: "socialInsurance",
            label: "BHXH",
            icon: Shield,
          },
          {
            key: "healthInsurance",
            label: "BHYT",
            icon: ShieldCheck,
          },
          {
            key: "unemploymentInsurance",
            label: "BHTN",
            icon: Shield,
          },
          {
            key: "taxAmount",
            label: "Thuế TNCN",
            icon: Receipt,
          },
          {
            key: "deductionAmount",
            label: "Khấu trừ",
            icon: Minus,
          },
          {
            key: "netSalary",
            label: "Net",
            icon: Banknote,
          },
          {
            key: "status",
            label: "Trạng thái",
            icon: CircleDot,
          },
          {
            key: "workDays",
            label: "Ngày công",
            icon: CalendarDays,
          },
        ]}
        wrapText={wrapText}
        setWrapText={setWrapText}
        disabledColumnIndices={[0]}
        hiddenColumnIndices={[]}
      />

      {/* Table container */}
      <section className="flex-1 relative h-full min-h-0 overflow-hidden border-t">
        <div className="h-full relative flex flex-col pb-8">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-7 px-2 select-none z-10 relative",
                        header.column.id === "actions" ? "text-right" : "",
                        header.column.id === "baseSalary" ||
                          header.column.id === "proratedSalary" ||
                          header.column.id === "allowanceAmount" ||
                          header.column.id === "bonusAmount" ||
                          header.column.id === "overtimeAmount"
                          ? "text-center"
                          : "",
                        header.column.id === "grossSalary"
                          ? "text-center bg-emerald-50/50"
                          : "",
                        header.column.id === "socialInsurance" ||
                          header.column.id === "healthInsurance" ||
                          header.column.id === "unemploymentInsurance" ||
                          header.column.id === "taxAmount" ||
                          header.column.id === "deductionAmount"
                          ? "text-center"
                          : "",
                        header.column.id === "netSalary"
                          ? "text-center bg-blue-50/50 font-semibold"
                          : "",
                      )}
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
                        style={{ width: (col as { size?: number }).size }}
                        className="p-2"
                      >
                        <Skeleton className="h-3.5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Không có dữ liệu
                      </p>
                      {(search || activeFiltersCount > 0) && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            clearFilters();
                          }}
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      className="group/row cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => onViewEmployeeDetail(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={cn(
                            "p-2",
                            cell.column.id === "actions" ? "text-center" : "",
                            cell.column.id === "baseSalary" ||
                              cell.column.id === "proratedSalary" ||
                              cell.column.id === "allowanceAmount" ||
                              cell.column.id === "bonusAmount" ||
                              cell.column.id === "overtimeAmount" ||
                              cell.column.id === "socialInsurance" ||
                              cell.column.id === "healthInsurance" ||
                              cell.column.id === "unemploymentInsurance" ||
                              cell.column.id === "taxAmount" ||
                              cell.column.id === "deductionAmount"
                              ? "text-center"
                              : "",
                            cell.column.id === "grossSalary"
                              ? "text-right bg-emerald-50/20"
                              : "",
                            cell.column.id === "netSalary"
                              ? "text-right bg-blue-50/20"
                              : "",
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expanded detail row */}
                    {expandedRows.has(row.original.id) && (
                      <TableRow
                        key={`${row.id}-expanded`}
                        className="bg-muted/20"
                      >
                        <TableCell colSpan={columns.length} className="p-2">
                          <div className="bg-background rounded-lg border p-3 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-lg">
                                Chi tiết lương của {row.original.user?.name}
                              </h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewEmployeeDetail(row.original);
                                  }}
                                >
                                  Xem phiếu lương
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Lương cơ bản (gốc):
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(row.original.baseSalary)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Lương theo ngày công:
                                </p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(row.original.proratedSalary)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {row.original.workDays}/
                                  {row.original.standardDays} ngày
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Phụ cấp:
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(row.original.allowanceAmount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Thưởng:</p>
                                <p className="font-medium">
                                  {formatCurrency(row.original.bonusAmount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Tăng ca ({row.original.overtimeHours}h):
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(row.original.overtimeAmount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Tổng Gross:
                                </p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(row.original.grossSalary)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  BHXH (8%):
                                </p>
                                <p className="font-medium text-red-600">
                                  {formatCurrency(row.original.socialInsurance)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  BHYT (1.5%):
                                </p>
                                <p className="font-medium text-red-600">
                                  {formatCurrency(row.original.healthInsurance)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  BHTN (1%):
                                </p>
                                <p className="font-medium text-red-600">
                                  {formatCurrency(
                                    row.original.unemploymentInsurance,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Giảm trừ cá nhân:
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(
                                    row.original.personalDeduction,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Giảm trừ phụ thuộc:
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(
                                    row.original.dependentDeduction,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Thuế TNCN:
                                </p>
                                <p className="font-medium text-red-600">
                                  {formatCurrency(row.original.taxAmount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Khấu trừ khác:
                                </p>
                                <p className="font-medium text-red-600">
                                  {formatCurrency(row.original.deductionAmount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Ngày công:
                                </p>
                                <p className="font-medium">
                                  {row.original.workDays}/
                                  {row.original.standardDays}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Ngày muộn:
                                </p>
                                <p className="font-medium">
                                  {row.original.lateDays}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Số tài khoản:
                                </p>
                                <p className="font-medium font-mono">
                                  {row.original.bankAccount || "—"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  Ngân hàng:
                                </p>
                                <p className="font-medium">
                                  {row.original.bankName || "—"}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-start">
                              <div className="text-left flex items-center gap-x-2">
                                <p className="text-sm text-muted-foreground">
                                  Lương thực nhận (Net):
                                </p>
                                <p className="text-xl font-bold text-green-600">
                                  {formatCurrency(row.original.netSalary)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Load more sentinel */}
      {hasNextPage && (
        <LoadMoreSentinel
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={!!isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      )}

      {/* Summary bar */}
      {!isLoading && filteredDetails.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-2 border-t bg-background shrink-0">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{filteredDetails.length}</strong> /{" "}
            <strong>{totalDetails}</strong> nhân viên
          </p>
          {!hasNextPage && filteredDetails.length < totalDetails && (
            <span className="text-xs text-muted-foreground">Đã tải hết</span>
          )}
          {isFetchingNextPage && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Đang tải thêm...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LoadMoreSentinel ─────────────────────────────────────────────────────────

interface LoadMoreSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore?: () => void;
}

function LoadMoreSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: LoadMoreSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          onLoadMore?.();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return <div ref={sentinelRef} className="h-1" />;
}

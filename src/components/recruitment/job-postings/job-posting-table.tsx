"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostingWithStats, JobPostingStatus, JobPostingPriority } from "@/app/(protected)/recruitment/types";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface JobPostingTableProps {
  data: JobPostingWithStats[];
  isLoading?: boolean;
  onEdit: (posting: JobPostingWithStats) => void;
  onDelete: (posting: JobPostingWithStats) => void;
  onStatusChange: (id: string, status: JobPostingStatus) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  totalPostings: number;
}

const STATUS_LABELS: Record<JobPostingStatus, { label: string; color: string }> = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Đang tuyển", color: "bg-green-100 text-green-700" },
  ON_HOLD: { label: "Tạm dừng", color: "bg-yellow-100 text-yellow-700" },
  CLOSED: { label: "Đã đóng", color: "bg-red-100 text-red-700" },
};

const PRIORITY_LABELS: Record<JobPostingPriority, { label: string; color: string }> = {
  LOW: { label: "Thấp", color: "bg-gray-100 text-gray-700" },
  NORMAL: { label: "Bình thường", color: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERN: "Thực tập",
  CONTRACT: "Hợp đồng",
};

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "VND",
) {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return max ? `Đến ${fmt(max)}` : "Thỏa thuận";
}

export function JobPostingTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  columnVisibility = {},
  onColumnVisibilityChange,
  totalPostings,
}: JobPostingTableProps) {
  const columns = useMemo<ColumnDef<JobPostingWithStats>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Chọn"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          />
        ),
        size: 36,
        enableSorting: false,
      },
      {
        id: "title",
        header: "Tiêu đề",
        size: 280,
        cell: ({ row }) => {
          const posting = row.original;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">{posting.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {EMPLOYMENT_TYPE_LABELS[posting.employmentType] || posting.employmentType}
              </span>
            </div>
          );
        },
      },
      {
        id: "department",
        header: "Phòng ban",
        size: 160,
        cell: ({ row }) => (
          <span className="text-xs truncate block">
            {row.original.departmentName || "—"}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Lương",
        size: 160,
        cell: ({ row }) => (
          <span className="text-xs">
            {formatSalary(
              row.original.salaryMin,
              row.original.salaryMax,
              row.original.salaryCurrency,
            )}
          </span>
        ),
      },
      {
        id: "headcount",
        header: "Số lượng",
        size: 80,
        cell: ({ row }) => (
          <span className="text-xs">{row.original.headcount}</span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        size: 110,
        cell: ({ row }) => {
          const status = row.original.status as JobPostingStatus;
          return (
            <Badge
              className={cn(
                "px-1.5 border-0 font-normal whitespace-nowrap",
                STATUS_LABELS[status]?.color,
              )}
            >
              {STATUS_LABELS[status]?.label || status}
            </Badge>
          );
        },
      },
      {
        id: "priority",
        header: "Ưu tiên",
        size: 100,
        cell: ({ row }) => {
          const priority = row.original.priority as JobPostingPriority;
          return (
            <Badge
              variant="outline"
              className={cn(
                "px-1.5 font-normal whitespace-nowrap",
                PRIORITY_LABELS[priority]?.color,
              )}
            >
              {PRIORITY_LABELS[priority]?.label || priority}
            </Badge>
          );
        },
      },
      {
        id: "deadline",
        header: "Hạn nộp",
        size: 110,
        cell: ({ row }) => {
          const deadline = row.original.deadline;
          if (!deadline) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <span className="text-xs">
              {format(new Date(deadline), "dd/MM/yyyy", { locale: vi })}
            </span>
          );
        },
      },
      {
        id: "candidateCount",
        header: "Ứng viên",
        size: 80,
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.candidateCount}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const posting = row.original;
          const status = posting.status as JobPostingStatus;

          return (
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
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(posting)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {status === "DRAFT" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(posting.id, "OPEN")}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Đăng tin
                    </DropdownMenuItem>
                  )}
                  {status === "OPEN" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(posting.id, "ON_HOLD")}
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Tạm dừng
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(posting.id, "CLOSED")}
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Đóng tin
                      </DropdownMenuItem>
                    </>
                  )}
                  {status === "ON_HOLD" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(posting.id, "OPEN")}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Mở lại
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(posting)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onEdit, onDelete, onStatusChange],
  );

  // TanStack Table's useReactTable() returns unstable functions — known limitation.
  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function" ? updater(columnVisibility) : updater;
      onColumnVisibilityChange?.(newVisibility);
    },
  });

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
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
                  )}
                  style={{
                    width: header.getSize(),
                  }}
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
                    style={{
                      width: col.size,
                    }}
                    className="p-2"
                  >
                    <Skeleton className="h-3.5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <Briefcase className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Không có tin tuyển dụng nào
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="group/row cursor-default">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                    }}
                    className={cn(
                      "p-2",
                      cell.column.id === "actions" ? "text-right" : "",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {hasNextPage && (
        <LoadMoreSentinel
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={!!isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      )}

      {/* Summary */}
      {!isLoading && data.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{data.length}</strong> /{" "}
            <strong>{totalPostings}</strong> tin tuyển dụng
          </p>
          {!hasNextPage && data.length < totalPostings && (
            <span className="text-xs text-muted-foreground">Đã tải hết</span>
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

  return (
    <div ref={sentinelRef} className="h-1">
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-3 gap-2">
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Đang tải thêm...
          </span>
        </div>
      )}
    </div>
  );
}

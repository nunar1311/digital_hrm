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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CalendarCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewBasic, InterviewStatus, InterviewResult } from "@/app/(protected)/recruitment/types";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface InterviewTableProps {
  data: InterviewBasic[];
  isLoading?: boolean;
  onEdit: (interview: InterviewBasic) => void;
  onDelete: (interview: InterviewBasic) => void;
  onViewDetail: (interview: InterviewBasic) => void;
  onFeedback: (interview: InterviewBasic) => void;
  onStatusChange: (id: string, status: InterviewStatus) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  totalInterviews: number;
}

const STATUS_LABELS: Record<InterviewStatus, { label: string; color: string }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang phỏng vấn", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-700" },
  NO_SHOW: { label: "Không đến", color: "bg-red-100 text-red-700" },
};

const RESULT_LABELS: Record<InterviewResult, { label: string; color: string }> = {
  PASS: { label: "Đạt", color: "bg-green-100 text-green-700" },
  FAIL: { label: "Không đạt", color: "bg-red-100 text-red-700" },
  PENDING: { label: "Chờ kết quả", color: "bg-gray-100 text-gray-700" },
};

const TYPE_LABELS: Record<string, string> = {
  ONSITE: "Trực tiếp",
  ONLINE: "Online",
  PHONE: "Điện thoại",
};

export function InterviewTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetail,
  onFeedback,
  onStatusChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  columnVisibility = {},
  onColumnVisibilityChange,
  totalInterviews,
}: InterviewTableProps) {
  const columns = useMemo<ColumnDef<InterviewBasic>[]>(
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
        id: "candidate",
        header: "Ứng viên",
        size: 200,
        cell: ({ row }) => {
          const interview = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {interview.candidateName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">
                  {interview.candidateName || "—"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "jobPosting",
        header: "Vị trí",
        size: 200,
        cell: ({ row }) => (
          <span className="text-xs truncate block">
            {row.original.jobPostingTitle || "—"}
          </span>
        ),
      },
      {
        id: "round",
        header: "Vòng",
        size: 80,
        cell: ({ row }) => (
          <span className="text-xs">Vòng {row.original.round}</span>
        ),
      },
      {
        id: "datetime",
        header: "Ngày giờ",
        size: 150,
        cell: ({ row }) => {
          const date = row.original.scheduledDate;
          if (!date) return "—";
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs">
                {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {row.original.scheduledTime}
              </span>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Hình thức",
        size: 100,
        cell: ({ row }) => (
          <span className="text-xs">
            {TYPE_LABELS[row.original.type] || row.original.type}
          </span>
        ),
      },
      {
        id: "interviewers",
        header: "Người PV",
        size: 150,
        cell: ({ row }) => {
          const names = row.original.interviewerNames;
          if (!names || names.length === 0) return "—";
          return (
            <div className="flex flex-col gap-0.5">
              {names.slice(0, 2).map((name, i) => (
                <span key={i} className="text-xs truncate">
                  {name}
                </span>
              ))}
              {names.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{names.length - 2} người
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) => {
          const status = row.original.status as InterviewStatus;
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
        id: "result",
        header: "Kết quả",
        size: 120,
        cell: ({ row }) => {
          const result = row.original.result as InterviewResult | null;
          if (!result) return "—";
          return (
            <div className="flex items-center gap-1">
              <Badge
                className={cn(
                  "px-1.5 border-0 font-normal whitespace-nowrap",
                  RESULT_LABELS[result]?.color,
                )}
              >
                {RESULT_LABELS[result]?.label || result}
              </Badge>
              {row.original.score && (
                <span className="text-[10px] text-muted-foreground">
                  ({row.original.score}/10)
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const interview = row.original;
          const status = interview.status as InterviewStatus;

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
                  <DropdownMenuItem onClick={() => onViewDetail(interview)}>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(interview)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFeedback(interview)}>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Feedback
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {status === "SCHEDULED" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(interview.id, "COMPLETED")}
                      >
                        <CalendarCheck className="mr-2 h-3 w-3" />
                        Hoàn thành
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(interview.id, "NO_SHOW")}
                      >
                        <XCircle className="mr-2 h-3 w-3" />
                        Không đến
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(interview.id, "CANCELLED")}
                      >
                        <XCircle className="mr-2 h-3 w-3" />
                        Hủy
                      </DropdownMenuItem>
                    </>
                  )}
                  {status === "IN_PROGRESS" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(interview.id, "COMPLETED")}
                    >
                      <CalendarCheck className="mr-2 h-3 w-3" />
                      Hoàn thành
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(interview)}
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
    [onEdit, onDelete, onViewDetail, onFeedback, onStatusChange],
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
                  <CalendarCheck className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Chưa có lịch phỏng vấn nào
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
            <strong>{totalInterviews}</strong> lịch phỏng vấn
          </p>
          {!hasNextPage && data.length < totalInterviews && (
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

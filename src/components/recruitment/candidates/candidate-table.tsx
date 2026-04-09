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
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateBasic, CandidateStage } from "@/app/(protected)/recruitment/types";
import { Checkbox } from "@/components/ui/checkbox";

interface CandidateTableProps {
  data: CandidateBasic[];
  isLoading?: boolean;
  onEdit: (candidate: CandidateBasic) => void;
  onDelete: (candidate: CandidateBasic) => void;
  onViewDetail: (candidate: CandidateBasic) => void;
  onStageChange: (id: string, stage: string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  totalCandidates: number;
}

const STAGE_LABELS: Record<CandidateStage, { label: string; color: string }> = {
  APPLIED: { label: "Ứng tuyển", color: "bg-gray-100 text-gray-700" },
  SCREENING: { label: "Sàng lọc", color: "bg-blue-100 text-blue-700" },
  INTERVIEW: { label: "Phỏng vấn", color: "bg-yellow-100 text-yellow-700" },
  OFFER: { label: "Offer", color: "bg-purple-100 text-purple-700" },
  HIRED: { label: "Đã tuyển", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  REFERRAL: "Giới thiệu",
  AGENCY: "Agency",
  OTHER: "Khác",
};

const STAGE_ORDER: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export function CandidateTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetail,
  onStageChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  columnVisibility = {},
  onColumnVisibilityChange,
  totalCandidates,
}: CandidateTableProps) {
  const columns = useMemo<ColumnDef<CandidateBasic>[]>(
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
        id: "name",
        header: "Họ tên",
        size: 200,
        cell: ({ row }) => {
          const candidate = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {candidate.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">{candidate.name}</span>
                {candidate.email && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {candidate.email}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "phone",
        header: "Điện thoại",
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.phone || "—"}
          </span>
        ),
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
        id: "source",
        header: "Nguồn",
        size: 100,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {SOURCE_LABELS[row.original.source] || row.original.source || "—"}
          </span>
        ),
      },
      {
        id: "stage",
        header: "Trạng thái",
        size: 120,
        cell: ({ row }) => {
          const stage = row.original.stage as CandidateStage;
          return (
            <Badge
              className={cn(
                "px-1.5 border-0 font-normal whitespace-nowrap",
                STAGE_LABELS[stage]?.color,
              )}
            >
              {STAGE_LABELS[stage]?.label || stage}
            </Badge>
          );
        },
      },
      {
        id: "createdAt",
        header: "Ngày ứng tuyển",
        size: 120,
        cell: ({ row }) => {
          const date = row.original.createdAt;
          if (!date) return "—";
          const d = new Date(date);
          return (
            <span className="text-xs text-muted-foreground">
              {d.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const candidate = row.original;
          const currentStage = candidate.stage as CandidateStage;
          const currentIndex = STAGE_ORDER.indexOf(currentStage);

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
                  <DropdownMenuItem onClick={() => onViewDetail(candidate)}>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(candidate)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {STAGE_ORDER.slice(0, currentIndex).map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={() => onStageChange(candidate.id, stage)}
                      className="text-muted-foreground"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Chuyển → {STAGE_LABELS[stage]?.label}
                    </DropdownMenuItem>
                  ))}
                  {STAGE_ORDER.slice(currentIndex + 1).map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={() => onStageChange(candidate.id, stage)}
                    >
                      <UserCheck className="mr-2 h-3 w-3" />
                      {STAGE_LABELS[stage]?.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(candidate)}
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
    [onEdit, onDelete, onViewDetail, onStageChange],
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
                  <UserCheck className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Chưa có ứng viên nào
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
            <strong>{totalCandidates}</strong> ứng viên
          </p>
          {!hasNextPage && data.length < totalCandidates && (
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

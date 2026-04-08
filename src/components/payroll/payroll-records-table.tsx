"use client";

import { useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  FileSpreadsheet,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, getPayrollStatusConfig } from "./payroll-utils";

interface PayrollRecordLike {
  id: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalGross: number | bigint;
  totalNet: number | bigint;
  totalTax: number | bigint;
  totalInsurance: number | bigint;
  status: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  departments?: { id: string; name: string }[];
}

function formatPayrollDepartmentLabel(record: PayrollRecordLike): string {
  if (record.department?.name) {
    return record.department.name;
  }
  const names = record.departments?.map((d) => d.name).filter(Boolean);
  if (names?.length) {
    return names.join(", ");
  }
  return "Toàn công ty";
}

interface PayrollRecordsTableProps {
  records: PayrollRecordLike[];
  isLoading?: boolean;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onBatchExport?: (ids: string[]) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  totalRecords: number;
}

export function PayrollRecordsTable({
  records,
  isLoading,
  onDelete,
  onExport,
  onBatchDelete,
  onBatchExport,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  columnVisibility = {},
  onColumnVisibilityChange,
  totalRecords,
}: PayrollRecordsTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<PayrollRecordLike>[]>(
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
        id: "period",
        accessorFn: (row) =>
          `${row.year}-${String(row.month).padStart(2, "0")}`,
        header: "Kỳ lương",
        size: 140,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium">
                Tháng {record.month}/{record.year}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(record.year, record.month - 1).toLocaleDateString(
                  "vi-VN",
                  { month: "long", year: "numeric" },
                )}
              </span>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original;
          const b = rowB.original;
          const yearDiff = a.year - b.year;
          if (yearDiff !== 0) return yearDiff;
          return a.month - b.month;
        },
      },
      {
        id: "department",
        accessorKey: "department",
        header: "Phòng ban",
        size: 200,
        cell: ({ row }) => (
          <span className="text-xs truncate block text-muted-foreground">
            {formatPayrollDepartmentLabel(row.original)}
          </span>
        ),
      },
      {
        id: "employees",
        accessorKey: "totalEmployees",
        header: "Số nhân viên",
        size: 72,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="font-mono text-xs">
              {row.getValue<number>("employees")}
            </Badge>
          </div>
        ),
      },
      {
        id: "gross",
        accessorKey: "totalGross",
        header: "Tổng Gross",
        size: 140,
        cell: ({ row }) => (
          <span className="font-medium text-blue-600">
            {formatCurrency(Number(row.getValue<number | bigint>("gross")))}
          </span>
        ),
      },
      {
        id: "net",
        accessorKey: "totalNet",
        header: "Tổng Net",
        size: 140,
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatCurrency(Number(row.getValue<number | bigint>("net")))}
          </span>
        ),
      },
      {
        id: "tax",
        accessorKey: "totalTax",
        header: "Thuế TNCN",
        size: 140,
        cell: ({ row }) => (
          <span className="text-amber-600">
            {formatCurrency(Number(row.getValue<number | bigint>("tax")))}
          </span>
        ),
      },
      {
        id: "insurance",
        accessorKey: "totalInsurance",
        header: "Bảo hiểm",
        size: 140,
        cell: ({ row }) => (
          <span className="text-rose-600">
            {formatCurrency(Number(row.getValue<number | bigint>("insurance")))}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Trạng thái",
        size: 140,
        cell: ({ row }) => {
          const status = row.getValue<string>("status");
          const config = getPayrollStatusConfig(status);
          return (
            <div className="flex items-center justify-center">
              <Badge
                variant="outline"
                className={cn("text-xs", config.className)}
              >
                {config.label}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => router.push(`/payroll/${record.id}`)}
                  >
                    <Eye />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(record.id)}>
                    <FileSpreadsheet />
                    Xuất CSV
                  </DropdownMenuItem>
                  {record.status !== "COMPLETED" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(record.id)}
                        variant="destructive"
                      >
                        <Trash2 />
                        Xóa
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onDelete, onExport, router],
  );

  // TanStack Table's useReactTable() returns unstable functions — known limitation.
  // eslint-disable-next-line
  const table = useReactTable({
    data: records,
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

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  return (
    <div className="relative flex flex-col h-full overflow-hidden min-h-0">
      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20 shrink-0">
          <span className="text-xs text-muted-foreground mr-1">
            Đã chọn{" "}
            <strong className="text-foreground">{selectedIds.length}</strong>{" "}
            bản ghi
          </span>
          {onBatchDelete && (
            <Button
              variant={"destructive"}
              size={"xs"}
              onClick={() => onBatchDelete(selectedIds)}
            >
              <Trash2 />
              Xóa
            </Button>
          )}
          {onBatchExport && (
            <Button
              variant={"outline"}
              size={"xs"}
              onClick={() => onBatchExport(selectedIds)}
            >
              <FileSpreadsheet />
              Xuất CSV
            </Button>
          )}
          <Button
            variant="ghost"
            size={"icon-xs"}
            className="ml-auto h-6 w-6"
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

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
                    ["gross", "net", "tax", "insurance"].includes(
                      header.column.id,
                    )
                      ? "text-center"
                      : "",
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
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Chưa có bảng lương nào
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="group/row cursor-pointer"
                onClick={() => router.push(`/payroll/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                    }}
                    className={cn(
                      "p-2",
                      cell.column.id === "actions" ? "text-right" : "",
                      ["gross", "net", "tax", "insurance"].includes(
                        cell.column.id,
                      )
                        ? "text-center"
                        : "",
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

      {!isLoading && records.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{records.length}</strong> /{" "}
            <strong>{totalRecords}</strong> bản ghi
          </p>
          {!hasNextPage && records.length < totalRecords && (
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

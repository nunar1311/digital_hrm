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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentListItem } from "@/app/[locale]/(protected)/departments/types";
import { STATUS_LABELS } from "@/components/org-chart/org-chart-constants";
import { Checkbox } from "../ui/checkbox";
import DynamicIcon from "../DynamicIcon";
import { useTranslations } from "next-intl";

interface DepartmentTableProps {
  data: DepartmentListItem[];
  isLoading?: boolean;
  onEdit: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
  onViewDetail: (department: DepartmentListItem) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  totalDepartments: number;
}

export function DepartmentTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetail,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  columnVisibility = {},
  onColumnVisibilityChange,
  totalDepartments,
}: DepartmentTableProps) {
  const t = useTranslations("ProtectedPages");

  const columns = useMemo<ColumnDef<DepartmentListItem>[]>(
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
            aria-label={t("departmentEmployeesSelectAllAria")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("departmentsColSelect")}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          />
        ),
        size: 36,
        enableSorting: false,
      },
      {
        accessorKey: "name",
        id: "employee",
        header: t("departmentsColName"),
        size: 280,
        cell: ({ row }) => {
          const dept = row.original;
          const logoKey = dept.logo;

          return (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <DynamicIcon
                  iconName={logoKey ?? "Building2"}
                  className="size-4"
                />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">{dept.name}</span>
                {dept.description && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {dept.description}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "code",
        header: t("departmentsColCode"),
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.getValue("code")}
          </span>
        ),
      },
      {
        accessorKey: "manager",
        header: t("departmentsColManager"),
        size: 180,
        cell: ({ row }) => {
          const manager = row.original.manager;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={manager?.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {manager?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {manager?.name || (
                    <span className="text-muted-foreground italic">
                      {t("departmentEmployeesUnknown")}
                    </span>
                  )}
                </span>
                {manager?.position && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {manager.position}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "employeeCount",
        header: t("departmentsColEmployeeCount"),
        size: 72,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("employeeCount")}
          </span>
        ),
      },
      {
        accessorKey: "parent",
        header: t("departmentsColParent"),
        size: 180,
        cell: ({ row }) => (
          <span className="text-xs truncate block text-muted-foreground">
            {row.original.parentName || t("positionsDash")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("departmentsColStatus"),
        size: 120,
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={status === "ACTIVE" ? "default" : "secondary"}
              className="px-1.5 border-0 font-normal whitespace-nowrap"
            >
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const department = row.original;
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
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onViewDetail(department)}>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    {t("departmentsTreeViewDetails")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(department)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t("departmentsTreeEdit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(department)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t("departmentsTreeDelete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onEdit, onDelete, onViewDetail, t],
  );

  // TanStack Table's useReactTable() returns unstable functions â€” known limitation.
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
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {t("departmentsEmpty")}
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
            {t("departmentsShowingSummary", {
              shown: data.length,
              total: totalDepartments,
            })}
          </p>
          {!hasNextPage && data.length < totalDepartments && (
            <span className="text-xs text-muted-foreground">{t("departmentsLoadedAll")}</span>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ LoadMoreSentinel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  const t = useTranslations("ProtectedPages");
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
            {t("departmentEmployeesLoadingMore")}
          </span>
        </div>
      )}
    </div>
  );
}


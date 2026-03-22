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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
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
import type { DepartmentListItem } from "@/app/(protected)/departments/types";
import { STATUS_LABELS } from "@/components/org-chart/org-chart-constants";
import { Checkbox } from "../ui/checkbox";
import DynamicIcon from "../DynamicIcon";

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
}: DepartmentTableProps) {
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
                        aria-label="Chọn tất cả"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) =>
                            row.toggleSelected(!!value)
                        }
                        aria-label="Chọn"
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
                header: "Tên phòng ban",
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
                                <span className="font-medium truncate">
                                    {dept.name}
                                </span>
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
                header: "Mã",
                size: 100,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.getValue("code")}
                    </span>
                ),
            },
            {
                accessorKey: "manager",
                header: "Trưởng phòng",
                size: 180,
                cell: ({ row }) => {
                    const manager = row.original.manager;
                    return (
                        <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage
                                    src={manager?.image || undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                    {manager?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">
                                    {manager?.name || (
                                        <span className="text-muted-foreground italic">
                                            Chưa phân công
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
                header: "Số NV",
                size: 72,
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.getValue("employeeCount")}
                    </span>
                ),
            },
            {
                accessorKey: "parent",
                header: "Phòng ban cha",
                size: 180,
                cell: ({ row }) => (
                    <span className="text-xs truncate block text-muted-foreground">
                        {row.original.parentName || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                size: 120,
                cell: ({ row }) => {
                    const status = row.getValue("status") as string;
                    return (
                        <Badge
                            variant={
                                status === "ACTIVE"
                                    ? "default"
                                    : "secondary"
                            }
                            className="px-1.5 border-0 font-normal whitespace-nowrap"
                        >
                            {STATUS_LABELS[
                                status as keyof typeof STATUS_LABELS
                            ] || status}
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
                                <DropdownMenuContent
                                    align="end"
                                    className="w-36"
                                >
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onViewDetail(department)
                                        }
                                    >
                                        <Eye className="mr-2 h-3.5 w-3.5" />
                                        Xem chi tiết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onEdit(department)
                                        }
                                    >
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onDelete(department)
                                        }
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
        [onEdit, onDelete, onViewDetail],
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
                typeof updater === "function"
                    ? updater(columnVisibility)
                    : updater;
            onColumnVisibilityChange?.(newVisibility);
        },
    });

    return (
        <div className="relative flex flex-col h-full overflow-hidden">
            {/* Sticky Header */}
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            className="hover:bg-transparent"
                        >
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className={cn(
                                        "h-7 px-2 select-none z-10 relative",
                                        header.column.id === "actions"
                                            ? "text-right"
                                            : "",
                                    )}
                                    style={{
                                        width: header.getSize(),
                                    }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef
                                                  .header,
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
                            <TableCell
                                colSpan={columns.length}
                                className="h-32 text-center"
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        Không có phòng ban nào
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="group/row cursor-default"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        style={{
                                            width: cell.column.getSize(),
                                        }}
                                        className={cn(
                                            "p-2",
                                            cell.column.id ===
                                                "actions"
                                                ? "text-right"
                                                : "",
                                        )}
                                    >
                                        {flexRender(
                                            cell.column.columnDef
                                                .cell,
                                            cell.getContext(),
                                        )}
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

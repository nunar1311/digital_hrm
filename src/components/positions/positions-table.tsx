"use client";

import { useMemo, useRef } from "react";
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
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import type { PositionListItem } from "@/app/[locale]/(protected)/positions/types";

const AUTHORITY_LABELS: Record<string, { label: string; class: string }> = {
    EXECUTIVE: { label: "Executive", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    DIRECTOR: { label: "Director", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    MANAGER: { label: "Manager", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    DEPUTY: { label: "Deputy", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    TEAM_LEAD: { label: "Team lead", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    STAFF: { label: "Staff", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    INTERN: { label: "Intern", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

interface PositionsTableProps {
    data: PositionListItem[];
    isLoading?: boolean;
    onEdit: (position: PositionListItem) => void;
    onDelete: (position: PositionListItem) => void;
    onViewDetail: (position: PositionListItem) => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
    totalPositions: number;
}

export function PositionsTable({
    data,
    isLoading,
    onEdit,
    onDelete,
    onViewDetail,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    totalPositions,
}: PositionsTableProps) {
    const columns = useMemo<ColumnDef<PositionListItem>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Position name",
                size: 260,
                cell: ({ row }) => {
                    const pos = row.original;
                    const auth = AUTHORITY_LABELS[pos.authority] || {
                        label: pos.authority,
                        class: "bg-gray-100 text-gray-600",
                    };
                    return (
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-medium truncate">{pos.name}</span>
                            <Badge
                                variant="outline"
                                className={`w-fit text-[10px] px-1.5 ${auth.class}`}
                            >
                                {auth.label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: "code",
                header: "Code",
                size: 140,
                cell: ({ row }) => (
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {row.original.code}
                    </code>
                ),
            },
            {
                accessorKey: "departmentName",
                header: "Department",
                size: 180,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.departmentName || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "level",
                header: "Level",
                size: 60,
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {row.original.level}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "parentName",
                header: "Parent position",
                size: 160,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.parentName || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "userCount",
                header: "Employees",
                size: 100,
                cell: ({ row }) => {
                    const count = row.original.userCount;
                    return (
                        <Badge
                            variant={count > 0 ? "secondary" : "outline"}
                            className="font-mono"
                        >
                            {count}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                size: 110,
                cell: ({ row }) => (
                    <Badge
                        variant={row.original.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                            row.original.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }
                    >
                        {row.original.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: "",
                size: 48,
                cell: ({ row }) => {
                    const pos = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetail(pos)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(pos)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(pos)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={pos.userCount > 0}
                                    title={
                                        pos.userCount > 0
                                            ? "Cannot delete position with assigned employees"
                                            : undefined
                                    }
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [onEdit, onDelete, onViewDetail],
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const sentinelRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
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
                                    {columns.map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    No positions available
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group/row hover:bg-muted/50 cursor-pointer"
                                    onClick={() => onViewDetail(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Load more sentinel */}
            {hasNextPage && (
                <div
                    ref={sentinelRef}
                    className="flex items-center justify-center py-4"
                    onClick={onLoadMore}
                >
                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Loading...
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm">
                            Load more
                        </Button>
                    )}
                </div>
            )}

            {/* Summary */}
            <p className="text-xs text-muted-foreground px-1 py-2">
                Showing {data.length} / {totalPositions} positions
            </p>
        </div>
    );
}


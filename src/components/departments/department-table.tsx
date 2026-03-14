"use client";

import { useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
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
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
} from "lucide-react";
import type { DepartmentListItem } from "@/app/(protected)/departments/types";
import { STATUS_LABELS } from "@/components/org-chart/org-chart-constants";
import { DEPARTMENT_ICONS } from "@/components/org-chart/icon-picker";

interface DepartmentTableProps {
    data: DepartmentListItem[];
    onEdit: (department: DepartmentListItem) => void;
    onDelete: (department: DepartmentListItem) => void;
    onViewDetail: (department: DepartmentListItem) => void;
}

export function DepartmentTable({
    data,
    onEdit,
    onDelete,
    onViewDetail,
}: DepartmentTableProps) {
    const columns = useMemo<ColumnDef<DepartmentListItem>[]>(
        () => [
            {
                id: "logo",
                header: "",
                cell: ({ row }) => {
                    const logoKey = row.original.logo;
                    const resolvedKey = logoKey
                        ? DEPARTMENT_ICONS[logoKey]
                            ? logoKey
                            : Object.keys(DEPARTMENT_ICONS).find(
                                  (k) =>
                                      k.toLowerCase() === logoKey.toLowerCase()
                              ) ?? logoKey
                        : null;
                    const iconDef =
                        resolvedKey &&
                        DEPARTMENT_ICONS[resolvedKey] &&
                        typeof DEPARTMENT_ICONS[resolvedKey] === "object"
                            ? DEPARTMENT_ICONS[resolvedKey]
                            : null;
                    const IconComponent = iconDef?.icon;
                    const name = row.original.name || "";
                    const initials = name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w.charAt(0).toUpperCase())
                        .join("");
                    return (
                        <div className="flex items-center justify-center w-12">
                            {IconComponent ? (
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <IconComponent className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                    {initials || "PB"}
                                </div>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
            },
            {
                accessorKey: "name",
                header: "Tên phòng ban",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.getValue("name")}</span>
                        {row.original.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                                {row.original.description}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "code",
                header: "Mã",
                cell: ({ row }) => (
                    <span className="font-mono text-sm">{row.getValue("code")}</span>
                ),
            },
            {
                accessorKey: "manager",
                header: "Trưởng phòng",
                cell: ({ row }) => {
                    const manager = row.original.manager;
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={manager?.image || undefined} />
                                <AvatarFallback className="text-xs">
                                    {manager?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {manager?.name || "Chưa phân công"}
                                </span>
                                {manager?.position && (
                                    <span className="text-xs text-muted-foreground">
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
                cell: ({ row }) => (
                    <span className="text-center block">{row.getValue("employeeCount")}</span>
                ),
            },
            {
                accessorKey: "parent",
                header: "Phòng ban cha",
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.parentName || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => {
                    const status = row.getValue("status") as string;
                    return (
                        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                            {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                        </Badge>
                    );
                },
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const department = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetail(department)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(department)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(department)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [onEdit, onDelete, onViewDetail]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                Không có dữ liệu
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

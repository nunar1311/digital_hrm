"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Eye,
  CheckCircle,
  Trash2,
  User,
  FileText,
  Package,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OffboardingListItem, OffboardingStatus } from "./types";
import { OFFBOARDING_STATUS_LABELS, OFFBOARDING_STATUS_COLORS } from "./types";
import { useTimezone } from "@/hooks/use-timezone";
import { cn } from "@/lib/utils";

interface OffboardingTableProps {
  offboardings: OffboardingListItem[];
  isLoading: boolean;
  canManage: boolean;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function StatusBadge({ status }: { status: OffboardingStatus }) {
  const colorClass = OFFBOARDING_STATUS_COLORS[status];
  return (
    <Badge className={`${colorClass} text-white`}>
      {OFFBOARDING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function OffboardingTable({
  offboardings,
  isLoading,
  canManage,
  onComplete,
  onDelete,
}: OffboardingTableProps) {
  const { formatDate } = useTimezone();
  const router = useRouter();

  const columns = useMemo<ColumnDef<OffboardingListItem>[]>(
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
        accessorKey: "user",
        id: "employee",
        header: "Nhân viên",
        size: 250,
        cell: ({ row }) => {
          const offboarding = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={offboarding.user.image || undefined} />
                <AvatarFallback>
                  {offboarding.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {offboarding.user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {offboarding.user.username || offboarding.user.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "resignDate",
        header: "Ngày nghỉ",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDate(row.original.resignDate, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "lastWorkDate",
        header: "Ngày làm cuối",
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatDate(row.original.lastWorkDate, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "template",
        header: "Mẫu",
        size: 140,
        cell: ({ row }) =>
          row.original.template ? (
            <Badge variant="outline">{row.original.template.name}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Mặc định</span>
          ),
      },
      {
        accessorKey: "checklist",
        header: "Checklist",
        size: 110,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs">
              {row.original._count.checklist} công việc
            </span>
          </div>
        ),
      },
      {
        accessorKey: "assets",
        header: "Tài sản",
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span className="text-xs">
              {row.original._count.assets} tài sản
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 120,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status as OffboardingStatus} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        size: 110,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const offboarding = row.original;
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
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/offboarding/${offboarding.id}`)
                    }
                  >
                    <Eye />
                    Xem chi tiết
                  </DropdownMenuItem>
                  {canManage && offboarding.status === "PROCESSING" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onComplete?.(offboarding.id)}
                      >
                        <CheckCircle className="text-green-600" />
                        Hoàn thành
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(offboarding.id)}
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
    [canManage, formatDate, onComplete, onDelete, router],
  );

  // TanStack Table's useReactTable() returns unstable functions by design.
  // eslint-disable-next-line
  const table = useReactTable({
    data: offboardings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
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
                    className="p-2"
                    style={{ width: col.size }}
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
                  <User className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Chưa có quy trình offboarding nào
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
                    className={cn(
                      "p-2",
                      cell.column.id === "actions" ? "text-right" : "",
                    )}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && offboardings.length > 0 && (
        <div className="bg-background flex items-center justify-between px-2 py-2 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{offboardings.length}</strong> quy trình
            offboarding
          </p>
        </div>
      )}
    </div>
  );
}

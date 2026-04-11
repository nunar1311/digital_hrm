"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import type { EmployeeListItem } from "@/app/(protected)/employees/actions";

import { MoreHorizontal, KeyRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UseEmployeesTableColumnsProps {
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  totalRows: number;
  onManagePassword?: (employee: EmployeeListItem) => void;
}

export function useEmployeesTableColumns({
  selectedIds,
  onToggleAll,
  onToggleOne,
  totalRows,
  onManagePassword,
}: UseEmployeesTableColumnsProps): ColumnDef<EmployeeListItem>[] {
  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            totalRows > 0 && selectedIds.size === totalRows
              ? true
              : selectedIds.size > 0
                ? "indeterminate"
                : false
          }
          onCheckedChange={onToggleAll}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => onToggleOne(row.original.id)}
          className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          aria-label={`Chọn ${row.original.name || row.original.fullName}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "username",
      header: "Mã nhân viên",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.username || "---"}</span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Họ và tên",
      cell: ({ row }) => {
        const name = row.original.fullName || row.original.name;
        return (
          <Link
            href={`/employees/${row.original.id}`}
            className="flex items-center gap-3 hover:text-foreground"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 items-center justify-center text-primary font-semibold text-sm flex">
              {name.split(" ").pop()?.[0] || "?"}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">{name}</span>
              <span className="text-xs text-muted-foreground">
                Vào làm:{" "}
                {row.original.hireDate
                  ? new Date(row.original.hireDate).toLocaleDateString("vi-VN")
                  : "---"}
              </span>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "positionName",
      header: "Chức vụ / Phòng ban",
      cell: ({ row }) => (
        <Link
          href={`/employees/${row.original.id}`}
          className="hover:text-foreground"
        >
          <div className="font-medium">
            {row.original.positionName || "Chưa rõ"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.departmentName || "Chưa rõ"}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: "SĐT / Email",
      cell: ({ row }) => (
        <Link
          href={`/employees/${row.original.id}`}
          className="hover:text-foreground"
        >
          <div className="text-sm">{row.original.phone || "---"}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.email}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "employeeStatus",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Link href={`/employees/${row.original.id}`}>
          <EmployeeStatusBadge
            status={row.original.employeeStatus || "ACTIVE"}
          />
        </Link>
      ),
    },
    {
      accessorKey: "gender",
      header: "Giới tính",
      cell: ({ row }) => (
        <Link href={`/employees/${row.original.id}`}>
          {row.original.gender === "MALE" ? "Nam" : "Nữ"}
        </Link>
      ),
    },
    {
      accessorKey: "nationalId",
      header: "Số CCCD",
      cell: ({ row }) => (
        <Link href={`/employees/${row.original.id}`}>
          {row.original.nationalId}
        </Link>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onManagePassword?.(row.original);
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Quản lý mật khẩu</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    },
  ];
}

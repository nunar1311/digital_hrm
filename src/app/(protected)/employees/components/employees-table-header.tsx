"use client";

import {
  flexRender,
  type HeaderGroup,
  type ColumnDef,
} from "@tanstack/react-table";
import { TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmployeeListItem } from "../actions";

interface EmployeesTableHeaderProps {
  headerGroups: HeaderGroup<EmployeeListItem>[];
}

export function EmployeesTableHeader({
  headerGroups,
}: EmployeesTableHeaderProps) {
  return (
    <thead>
      {headerGroups.map((headerGroup) => (
        <TableRow key={headerGroup.id} className="hover:bg-transparent">
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className={cn(
                "h-7 px-2 select-none z-10 relative",
                header.column.id === "actions" ? "text-right" : "",
              )}
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
    </thead>
  );
}

"use client";

import { flexRender, type Row, type Cell } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeesEmptyState } from "./employees-empty-state";
import { Loader2 } from "lucide-react";
import type { EmployeeListItem } from "@/app/(protected)/employees/actions";
import type { ColumnDef } from "@tanstack/react-table";

interface EmployeesTableBodyProps {
  columns: ColumnDef<EmployeeListItem>[];
  rows: Row<EmployeeListItem>["original"][];
  rowModels: Row<EmployeeListItem>[];
  isLoading: boolean;
  hasRows: boolean;
  search: string;
  onClearSearch: () => void;
  isFetchingNextPage: boolean;
}

export function EmployeesTableBody({
  columns,
  rows,
  rowModels,
  isLoading,
  hasRows,
  search,
  onClearSearch,
  isFetchingNextPage,
}: EmployeesTableBodyProps) {
  if (isLoading) {
    return (
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            {columns.map((col, j) => (
              <TableCell
                key={j}
                style={{ width: col.size }}
                className="p-2"
              >
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (!hasRows) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columns.length + 1}
            className="h-32 text-center text-muted-foreground"
          >
            <EmployeesEmptyState search={search} onClearSearch={onClearSearch} />
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <>
      <TableBody>
        {rowModels.map((row) => (
          <TableRow key={row.id} className="group/row cursor-default">
            {row.getVisibleCells().map((cell: Cell<EmployeeListItem, unknown>) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      <tbody>
        <tr>
          <td colSpan={columns.length + 1}>
            <div
              id="infinite-scroll-sentinel"
              className="h-px shrink-0 mt-4"
            />
          </td>
        </tr>
        {isFetchingNextPage && (
          <tr>
            <td colSpan={columns.length + 1}>
              <div className="flex items-center justify-center py-3 border-t">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">
                  Đang tải thêm...
                </span>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </>
  );
}

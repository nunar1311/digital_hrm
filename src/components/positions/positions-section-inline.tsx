// ============================================================
// Positions Section (inline, replaces tab) â€” TanStack Table
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  BadgeCheck,
  Pencil,
  Trash2,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PositionListItem } from "@/app/[locale]/(protected)/positions/types";
import { getPositions } from "@/app/[locale]/(protected)/positions/actions";

interface AuthorityColorConfig {
  bg: string;
  text: string;
  label: string;
}

// Default fallback colors when authority type not found in database
const DEFAULT_AUTHORITY_COLORS: Record<string, AuthorityColorConfig> = {
  EXECUTIVE: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Executive",
  },
  DIRECTOR: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Director",
  },
  MANAGER: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Manager",
  },
  DEPUTY: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Deputy",
  },
  TEAM_LEAD: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Team lead",
  },
  STAFF: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Staff",
  },
  INTERN: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    label: "Intern",
  },
};

interface PositionsSectionInlineProps {
  departmentId: string;
  departmentName: string;
  onEdit: (pos: PositionListItem | null) => void;
  onDelete: (pos: PositionListItem) => void;
}

function PositionsSectionInline({
  departmentId,
  onEdit,
  onDelete,
}: PositionsSectionInlineProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    positions
      .filter((p) => selectedIds.has(p.id))
      .forEach((pos) => onDelete(pos));
    clearSelection();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["positions", departmentId, search],
    queryFn: () =>
      getPositions({
        page: 1,
        pageSize: 100,
        departmentId,
        search: search || undefined,
        status: "ALL",
      }),
  });

  const positions = useMemo(() => data?.positions ?? [], [data?.positions]);

  const columns = useMemo<ColumnDef<PositionListItem>[]>(
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
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (!!value) {
                setSelectedIds(new Set(positions.map((p) => p.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (!!value) {
                  next.add(row.original.id);
                } else {
                  next.delete(row.original.id);
                }
                return next;
              });
            }}
            aria-label="Select"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          />
        ),
        size: 36,
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Position name",
        size: 200,
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        size: 120,
        cell: ({ row }) => (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {row.original.code}
          </code>
        ),
      },
      {
        accessorKey: "level",
        header: "Level",
        size: 80,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.level}
          </span>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Employees",
        size: 72,
        cell: ({ row }) => {
          const count = row.original.userCount;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                count > 0
                  ? "text-green-600 font-medium"
                  : "text-muted-foreground",
              )}
            >
              {count} employees
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 80,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [positions, selectedIds, onEdit],
  );

  // TanStack Table's useReactTable() returns unstable functions â€” known limitation.
  // eslint-disable-next-line
  const table = useReactTable({
    data: positions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-2 border-b shrink-0">
        <div className="relative flex items-center flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search positions..."
            className="h-7 text-xs pl-7 w-48"
          />
          <Search className="absolute left-2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size={"xs"}
            onClick={() => onEdit(null as unknown as PositionListItem)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add position
          </Button>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20">
          <span className="text-xs text-muted-foreground mr-1">
            Selected{" "}
            <strong className="text-foreground">{selectedIds.size}</strong> positions
          </span>
          <Button
            variant={"destructive"}
            size={"xs"}
            onClick={handleBatchDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size={"icon-xs"}
            className="ml-auto h-6 w-6"
            onClick={clearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-7 px-2 select-none",
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => (
                    <TableCell
                      key={j}
                      style={{
                        width: col.size,
                      }}
                      className="p-2"
                    >
                      <Skeleton className="h-4 w-full" />
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <BadgeCheck className="h-8 w-8 text-muted-foreground/50" />
                    <p>No positions yet.</p>
                    <Button
                      variant="link"
                      size="xs"
                      onClick={() =>
                        onEdit(null as unknown as PositionListItem)
                      }
                    >
                      Add first position
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group/row">
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

      {/* Summary */}
      {!isLoading && positions.length > 0 && (
        <div className="flex items-center justify-between px-2 py-2 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            Showing <strong>{positions.length}</strong> positions
          </p>
        </div>
      )}
    </>
  );
}

export { PositionsSectionInline };


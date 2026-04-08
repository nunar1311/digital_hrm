"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CircleDot,
  FileBadge2,
  FileText,
  ListFilter,
  RefreshCw,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  getContractExpiryOverview,
  getContracts,
} from "@/app/(protected)/contracts/actions";
import type { ContractListItem, ContractListResult } from "@/types/contract";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";

interface Props {
  initialResult: ContractListResult;
}

type ContractStatusFilter =
  | "ALL"
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED";

type ExpiringFilter = "ALL" | "15" | "30";

const STATUS_OPTIONS: { value: ContractStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PENDING", label: "Chờ hiệu lực" },
  { value: "ACTIVE", label: "Đang hiệu lực" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "TERMINATED", label: "Đã chấm dứt" },
];

const EXPIRING_OPTIONS: { value: ExpiringFilter; label: string }[] = [
  { value: "ALL", label: "Mọi mốc" },
  { value: "15", label: "15 ngày" },
  { value: "30", label: "30 ngày" },
];

export function ContractsListClient({ initialResult }: Props) {
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>("ALL");
  const [expiringWithinDays, setExpiringWithinDays] =
    useState<ExpiringFilter>("ALL");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    contractNumber: true,
    employee: true,
    contractType: true,
    startDate: true,
    endDate: true,
    status: true,
  });

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) {
        setSearch("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const {
    data: listData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["contracts", "list", search, statusFilter, expiringWithinDays],
    queryFn: () =>
      getContracts({
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
        status: statusFilter,
        expiringWithinDays:
          expiringWithinDays === "ALL" ? undefined : Number(expiringWithinDays),
      }),
    initialData: initialResult,
  });

  const { data: expiryOverview } = useQuery({
    queryKey: ["contracts", "expiry-overview"],
    queryFn: getContractExpiryOverview,
  });

  const stats = useMemo(() => {
    const source = listData.items;
    return {
      total: source.length,
      active: source.filter((item) => item.status === "ACTIVE").length,
      expired: source.filter((item) => item.status === "EXPIRED").length,
      expiringSoon: source.filter((item) => item.isExpiringIn30Days).length,
    };
  }, [listData.items]);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    if (search.trim()) {
      setSearch("");
    }
    setSearchExpanded(false);
  }, [searchExpanded, search]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setSearch("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const columns = useMemo<ColumnDef<ContractListItem>[]>(
    () => [
      {
        accessorKey: "contractNumber",
        id: "contractNumber",
        header: "Số hợp đồng",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber}</span>
        ),
      },
      {
        accessorKey: "employee.name",
        id: "employee",
        header: "Nhân viên",
        cell: ({ row }) => (
          <Link
            href={`/employees/${row.original.employee.id}`}
            className="flex flex-col hover:text-foreground"
          >
            <span>{row.original.employee.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.employee.username || "N/A"}
            </span>
          </Link>
        ),
      },
      {
        accessorKey: "contractTypeName",
        id: "contractType",
        header: "Loại hợp đồng",
      },
      {
        accessorKey: "startDate",
        id: "startDate",
        header: "Ngày hiệu lực",
        cell: ({ row }) =>
          new Date(row.original.startDate).toLocaleDateString("vi-VN"),
      },
      {
        accessorKey: "endDate",
        id: "endDate",
        header: "Ngày hết hạn",
        cell: ({ row }) =>
          row.original.endDate
            ? new Date(row.original.endDate).toLocaleDateString("vi-VN")
            : "Không thời hạn",
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => <ContractStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => (
          <span className="inline-block w-full text-right">Hành động</span>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <Button asChild size="xs" variant="outline">
              <Link href={`/contracts/${row.original.id}`}>Chi tiết</Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: listData.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        <section className="border-b">
          <header className="p-2 flex items-center h-10">
            <h1 className="font-bold truncate">Quản lý hợp đồng</h1>
          </header>

          <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Tổng hợp đồng</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-md border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Đang hiệu lực</p>
              <p className="text-xl font-semibold text-emerald-700">
                {stats.active}
              </p>
            </div>
            <div className="rounded-md border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Hết hạn</p>
              <p className="text-xl font-semibold text-slate-700">
                {stats.expired}
              </p>
            </div>
            <div className="rounded-md border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Sắp hết hạn (30 ngày)
              </p>
              <p className="text-xl font-semibold text-amber-700">
                {stats.expiringSoon}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-2 py-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    statusFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter />
                  {statusFilter !== "ALL" && (
                    <span className="ml-1 text-xs">
                      {
                        STATUS_OPTIONS.find(
                          (item) => item.value === statusFilter,
                        )?.label
                      }
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Trạng thái
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as ContractStatusFilter)
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={statusFilter === option.value}
                      onCheckedChange={() =>
                        setStatusFilter(option.value as ContractStatusFilter)
                      }
                      className="text-sm"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={expiringWithinDays !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    expiringWithinDays !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <CalendarClock />
                  {expiringWithinDays !== "ALL" && (
                    <span className="ml-1 text-xs">
                      {
                        EXPIRING_OPTIONS.find(
                          (item) => item.value === expiringWithinDays,
                        )?.label
                      }
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Mốc hết hạn
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={expiringWithinDays}
                  onValueChange={(value) =>
                    setExpiringWithinDays(value as ExpiringFilter)
                  }
                >
                  {EXPIRING_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={expiringWithinDays === option.value}
                      onCheckedChange={() =>
                        setExpiringWithinDays(option.value as ExpiringFilter)
                      }
                      className="text-sm"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm theo số hợp đồng, tên nhân viên..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-56 opacity-100 pl-2"
                    : "w-0 opacity-0 pl-0",
                )}
              />

              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0.5 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-4!" />

            <Button
              variant="outline"
              size="xs"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings />
            </Button>
            <Button variant="outline" size="xs" onClick={() => refetch()}>
              <RefreshCw className={cn(isFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>

          <TableSettingsPanel
            className="top-10"
            open={settingsOpen}
            onClose={setSettingsOpen}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            defaultVisibleColumns={{
              contractNumber: true,
              employee: true,
              contractType: true,
              startDate: true,
              endDate: true,
              status: true,
            }}
            columnOptions={[
              {
                key: "contractNumber",
                label: "Số hợp đồng",
                icon: FileBadge2,
              },
              {
                key: "employee",
                label: "Nhân viên",
                icon: User,
              },
              {
                key: "contractType",
                label: "Loại hợp đồng",
                icon: FileText,
              },
              {
                key: "startDate",
                label: "Ngày hiệu lực",
                icon: CalendarClock,
              },
              {
                key: "endDate",
                label: "Ngày hết hạn",
                icon: CalendarClock,
              },
              {
                key: "status",
                label: "Trạng thái",
                icon: CircleDot,
              },
            ]}
            disabledColumnIndices={[1]}
            hiddenColumnIndices={[]}
          />
        </section>

        {(expiryOverview?.in15Days.length || 0) > 0 && (
          <div className="mx-2 mt-2 rounded-md border border-amber-300 bg-amber-50/50 p-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Danh sách hợp đồng sắp hết hạn 15 ngày
            </h2>
            <div className="mt-2 space-y-2 text-sm">
              {expiryOverview?.in15Days.slice(0, 5).map((item) => (
                <Link
                  key={`${item.contractId}-${item.daysUntilExpiry}`}
                  href={`/contracts/${item.contractId}`}
                  className="flex items-center justify-between rounded-md border border-amber-200 bg-white p-2 hover:bg-amber-100/40"
                >
                  <div>
                    <p className="font-medium text-amber-900">
                      {item.employeeName}
                    </p>
                    <p className="text-xs text-amber-800">
                      {item.contractNumber} - {item.contractTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-900">
                    <CalendarClock className="h-4 w-4" />
                    {new Date(item.endDate).toLocaleDateString("vi-VN")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="flex-1 relative h-full min-h-0 overflow-">
          <div className="h-full flex flex-col pb-8 overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          header.column.id === "actions" && "text-right",
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
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <div className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Không có hợp đồng phù hợp bộ lọc.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group/row">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.id === "actions" && "text-right",
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

            {listData.items.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t bg-background px-2 py-2">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{listData.items.length}</strong> /{" "}
                  <strong>{listData.total}</strong> hợp đồng
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Eye,
  ListFilter,
  X,
  CalendarDays,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAuditLogs } from "../preferences/actions";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LogsPage {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AuditFilters {
  actions: string[];
  entities: string[];
  users: { id: string; name: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: {
    label: "Tạo mới",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  UPDATE: {
    label: "Cập nhật",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  DELETE: {
    label: "Xóa",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  LOGIN: {
    label: "Đăng nhập",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  LOGOUT: {
    label: "Đăng xuất",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  EXPORT: {
    label: "Xuất dữ liệu",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
};

const ENTITY_LABELS: Record<string, string> = {
  SystemSetting: "Cài đặt hệ thống",
  UserRole: "Vai trò người dùng",
  User: "Người dùng",
  Department: "Phòng ban",
  Shift: "Ca làm việc",
  ShiftAssignment: "Phân ca",
  Attendance: "Chấm công",
  AttendanceExplanation: "Giải trình",
  OvertimeRequest: "Làm thêm giờ",
  Holiday: "Ngày lễ",
  WorkCycle: "Chu kỳ làm việc",
  AttendanceConfig: "Cấu hình chấm công",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const filterSchema = z.object({
  userId: z.string(),
  action: z.string(),
  entity: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: vi });
  } catch {
    return dateStr;
  }
}

function renderJsonDiff(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) {
  if (!oldData && !newData) return null;
  const allKeys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);

  return (
    <div className="space-y-1 text-sm">
      {Array.from(allKeys).map((key) => {
        const oldVal = oldData?.[key];
        const newVal = newData?.[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        return (
          <div
            key={key}
            className={`rounded px-2 py-1 ${changed ? "bg-accent" : ""}`}
          >
            <span className="font-medium">{key}: </span>
            {oldData && newData && changed ? (
              <>
                <span className="text-red-600 line-through dark:text-red-400">
                  {JSON.stringify(oldVal) ?? "—"}
                </span>
                {" → "}
                <span className="text-green-600 dark:text-green-400">
                  {JSON.stringify(newVal) ?? "—"}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {JSON.stringify(newVal ?? oldVal) ?? "—"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AuditLogToolbarProps {
  form: ReturnType<typeof useForm<FilterFormValues>>;
  filters: AuditFilters;
  onApply: () => void;
  onReset: () => void;
  isFetching: boolean;
  total: number;
}

function AuditLogToolbar({
  form,
  filters,
  onApply,
  onReset,
  isFetching,
  total,
}: AuditLogToolbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    const val = form.getValues("userId");
    if (searchExpanded) {
      if (val !== "all") {
        // keep value
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const filterValues = form.watch();
  const hasFilter =
    filterValues.userId !== "all" ||
    filterValues.action !== "all" ||
    filterValues.entity !== "all" ||
    !!filterValues.startDate ||
    !!filterValues.endDate;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          {/* Left: summary */}
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Đang tải..." : `Tổng cộng ${total} bản ghi`}
          </p>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={hasFilter ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    hasFilter &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  {hasFilter && <span className="ml-1 text-xs">Đang lọc</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-3"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuLabel className="mb-2 text-xs text-muted-foreground px-0">
                  Bộ lọc
                </DropdownMenuLabel>
                <div className="space-y-3">
                  {/* User filter */}
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          Người thực hiện
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="Người thực hiện" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">
                              Tất cả người dùng
                            </SelectItem>
                            {filters.users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Action filter */}
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Hành động</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="Hành động" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">
                              Tất cả hành động
                            </SelectItem>
                            {filters.actions.map((a) => (
                              <SelectItem key={a} value={a}>
                                {ACTION_LABELS[a]?.label ?? a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Entity filter */}
                  <FormField
                    control={form.control}
                    name="entity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Đối tượng</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="Đối tượng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">
                              Tất cả đối tượng
                            </SelectItem>
                            {filters.entities.map((e) => (
                              <SelectItem key={e} value={e}>
                                {ENTITY_LABELS[e] ?? e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <DropdownMenuSeparator />

                  {/* Date range */}
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      Khoảng thời gian
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Từ ngày
                            </FormLabel>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Đến ngày
                            </FormLabel>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      size="xs"
                      className="flex-1"
                      onClick={onApply}
                    >
                      <Search className="h-3 w-3" />
                      Áp dụng
                    </Button>
                    {hasFilter && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={onReset}
                      >
                        <X className="h-3 w-3" />
                        Xóa lọc
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-4!" />

            {/* Search by user name - expand style */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={""}
                onChange={() => {}}
                placeholder="Tìm theo người dùng..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-48 opacity-100 pl-3"
                    : "w-0 opacity-0 pl-0",
                )}
              />
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0.5 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AuditLogClientProps {
  initialData: LogsPage;
  filters: AuditFilters;
}

export function AuditLogClient({ initialData, filters }: AuditLogClientProps) {
  const queryClient = useQueryClient();
  const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(1);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      userId: "all",
      action: "all",
      entity: "all",
      startDate: undefined,
      endDate: undefined,
    },
  });

  const filterValues = form.watch();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["audit-logs", page, filterValues],
    queryFn: async () => {
      const userId =
        filterValues.userId === "all" ? undefined : filterValues.userId;
      const action =
        filterValues.action === "all" ? undefined : filterValues.action;
      const entity =
        filterValues.entity === "all" ? undefined : filterValues.entity;
      const startDate = filterValues.startDate
        ? format(filterValues.startDate, "yyyy-MM-dd")
        : undefined;
      const endDate = filterValues.endDate
        ? format(filterValues.endDate, "yyyy-MM-dd")
        : undefined;

      return getAuditLogs({
        page,
        pageSize: 20,
        userId,
        action,
        entity,
        startDate,
        endDate,
      });
    },
    initialData: page === 1 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
  });

  const logsData = data ?? initialData;

  const handleApplyFilter = useCallback(() => {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  }, [queryClient]);

  const handleResetFilters = useCallback(() => {
    form.reset({
      userId: "all",
      action: "all",
      entity: "all",
      startDate: undefined,
      endDate: undefined,
    });
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  }, [form, queryClient]);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* ── Header ── */}
        <section>
          <header className="p-2 flex items-center h-10 border-b gap-2">
            <h1 className="font-bold">Nhật ký hệ thống</h1>
          </header>

          <AuditLogToolbar
            form={form}
            filters={filters}
            onApply={handleApplyFilter}
            onReset={handleResetFilters}
            isFetching={isFetching}
            total={logsData.total}
          />
        </section>

        {/* ── Table ── */}
        <section className="flex-1 relative h-full min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="whitespace-nowrap">Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>ID đối tượng</TableHead>
                <TableHead className="w-16 text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : logsData.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Chưa có nhật ký nào
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logsData.logs.map((log: AuditLogEntry) => {
                  const actionInfo = ACTION_LABELS[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {log.userName || log.userId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={actionInfo?.color ?? ""}
                        >
                          {actionInfo?.label ?? log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ENTITY_LABELS[log.entity] ?? log.entity}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                        {log.entityId ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {(log.oldData || log.newData) && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDetailLog(log)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>

        {/* ── Pagination ── */}
        {logsData.totalPages > 1 && (
          <section className="border-t px-4 py-2 flex items-center justify-between bg-background">
            <p className="text-xs text-muted-foreground">
              Trang {logsData.page} / {logsData.totalPages} ({logsData.total}{" "}
              bản ghi)
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={logsData.page <= 1}
                onClick={() => setPage(logsData.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={logsData.page >= logsData.totalPages}
                onClick={() => setPage(logsData.page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detailLog} onOpenChange={(v) => !v && setDetailLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết nhật ký</DialogTitle>
            <DialogDescription>
              {detailLog && formatDate(detailLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {detailLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Người thực hiện</p>
                    <p className="font-medium">
                      {detailLog.userName || detailLog.userId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hành động</p>
                    <Badge
                      variant="secondary"
                      className={ACTION_LABELS[detailLog.action]?.color ?? ""}
                    >
                      {ACTION_LABELS[detailLog.action]?.label ??
                        detailLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Đối tượng</p>
                    <p className="font-medium">
                      {ENTITY_LABELS[detailLog.entity] ?? detailLog.entity}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID đối tượng</p>
                    <p className="font-mono text-xs">
                      {detailLog.entityId ?? "—"}
                    </p>
                  </div>
                  {detailLog.ipAddress && (
                    <div>
                      <p className="text-muted-foreground">IP Address</p>
                      <p className="font-mono text-xs">{detailLog.ipAddress}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {detailLog.oldData && (
                  <div>
                    <p className="mb-2 font-medium">Dữ liệu cũ</p>
                    {renderJsonDiff(detailLog.oldData, null)}
                  </div>
                )}

                {detailLog.newData && (
                  <div>
                    <p className="mb-2 font-medium">Dữ liệu mới</p>
                    {renderJsonDiff(null, detailLog.newData)}
                  </div>
                )}

                {detailLog.oldData && detailLog.newData && (
                  <div>
                    <Separator className="my-2" />
                    <p className="mb-2 font-medium">So sánh thay đổi</p>
                    {renderJsonDiff(detailLog.oldData, detailLog.newData)}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

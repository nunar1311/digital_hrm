"use client";

import { useState } from "react";
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
    Filter,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAuditLogs } from "../preferences/actions";
import { DatePicker } from "@/components/ui/date-picker";

// ─── Types ───

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

// ─── Constants ───

const ACTION_LABELS: Record<
    string,
    { label: string; color: string }
> = {
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
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
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

// ─── Schema ───

const filterSchema = z.object({
    userId: z.string(),
    action: z.string(),
    entity: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

// ─── Helper Functions ───

function formatDate(dateStr: string) {
    try {
        return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", {
            locale: vi,
        });
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
                const changed =
                    JSON.stringify(oldVal) !== JSON.stringify(newVal);
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
                                {JSON.stringify(newVal ?? oldVal) ??
                                    "—"}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Component ───

interface AuditLogClientProps {
    initialData: LogsPage;
    filters: AuditFilters;
}

export function AuditLogClient({
    initialData,
    filters,
}: AuditLogClientProps) {
    const queryClient = useQueryClient();
    const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(
        null,
    );
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
                filterValues.userId === "all"
                    ? undefined
                    : filterValues.userId;
            const action =
                filterValues.action === "all"
                    ? undefined
                    : filterValues.action;
            const entity =
                filterValues.entity === "all"
                    ? undefined
                    : filterValues.entity;
            const startDate = filterValues.startDate
                ? format(filterValues.startDate, "yyyy-MM-dd")
                : undefined;
            const endDate = filterValues.endDate
                ? format(filterValues.endDate, "yyyy-MM-dd")
                : undefined;

            const result = await getAuditLogs({
                page,
                pageSize: 20,
                userId,
                action,
                entity,
                startDate,
                endDate,
            });
            return result;
        },
        initialData: page === 1 ? initialData : undefined,
        placeholderData: (previousData) => previousData,
    });

    const logsData = data ?? initialData;

    const handleFilter = form.handleSubmit(() => {
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    });

    const handleResetFilters = () => {
        form.reset({
            userId: "all",
            action: "all",
            entity: "all",
            startDate: undefined,
            endDate: undefined,
        });
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Nhật ký hệ thống
                </h1>
                <p className="text-muted-foreground">
                    Theo dõi tất cả hoạt động trong hệ thống
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={handleFilter}
                            className="space-y-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <FormField
                                    control={form.control}
                                    name="userId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Người thực hiện
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Người thực hiện" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Tất cả người
                                                        dùng
                                                    </SelectItem>
                                                    {filters.users.map(
                                                        (u) => (
                                                            <SelectItem
                                                                key={
                                                                    u.id
                                                                }
                                                                value={
                                                                    u.id
                                                                }
                                                            >
                                                                {
                                                                    u.name
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="action"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Hành động
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Hành động" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Tất cả hành
                                                        động
                                                    </SelectItem>
                                                    {filters.actions.map(
                                                        (a) => (
                                                            <SelectItem
                                                                key={
                                                                    a
                                                                }
                                                                value={
                                                                    a
                                                                }
                                                            >
                                                                {ACTION_LABELS[
                                                                    a
                                                                ]
                                                                    ?.label ??
                                                                    a}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="entity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Đối tượng
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Đối tượng" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Tất cả đối
                                                        tượng
                                                    </SelectItem>
                                                    {filters.entities.map(
                                                        (e) => (
                                                            <SelectItem
                                                                key={
                                                                    e
                                                                }
                                                                value={
                                                                    e
                                                                }
                                                            >
                                                                {ENTITY_LABELS[
                                                                    e
                                                                ] ??
                                                                    e}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        Lọc
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetFilters}
                                    >
                                        Xóa lọc
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Từ ngày
                                            </FormLabel>
                                            <DatePicker
                                                date={field.value}
                                                setDate={
                                                    field.onChange
                                                }
                                            />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Đến ngày
                                            </FormLabel>
                                            <DatePicker
                                                date={field.value}
                                                setDate={
                                                    field.onChange
                                                }
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Lịch sử hoạt động
                    </CardTitle>
                    <CardDescription>
                        Tổng cộng {logsData.total} bản ghi
                        {isFetching && " (đang tải...)"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>
                                        Người thực hiện
                                    </TableHead>
                                    <TableHead>Hành động</TableHead>
                                    <TableHead>Đối tượng</TableHead>
                                    <TableHead>
                                        ID đối tượng
                                    </TableHead>
                                    <TableHead className="w-16 text-right">
                                        Chi tiết
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Đang tải...
                                        </TableCell>
                                    </TableRow>
                                ) : logsData.logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">
                                                    Chưa có nhật ký
                                                    nào
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logsData.logs.map(
                                        (log: AuditLogEntry) => {
                                            const actionInfo =
                                                ACTION_LABELS[
                                                    log.action
                                                ];
                                            return (
                                                <TableRow
                                                    key={log.id}
                                                >
                                                    <TableCell className="whitespace-nowrap text-sm">
                                                        {formatDate(
                                                            log.createdAt,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">
                                                            {log.userName ||
                                                                log.userId}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className={
                                                                actionInfo?.color ??
                                                                ""
                                                            }
                                                        >
                                                            {actionInfo?.label ??
                                                                log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {ENTITY_LABELS[
                                                            log.entity
                                                        ] ??
                                                            log.entity}
                                                    </TableCell>
                                                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                                                        {log.entityId ??
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {(log.oldData ||
                                                            log.newData) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setDetailLog(
                                                                        log,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {logsData.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Trang {logsData.page} /{" "}
                                {logsData.totalPages} (
                                {logsData.total} bản ghi)
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={logsData.page <= 1}
                                    onClick={() =>
                                        handlePageChange(
                                            logsData.page - 1,
                                        )
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        logsData.page >=
                                        logsData.totalPages
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            logsData.page + 1,
                                        )
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Detail Dialog ─── */}
            <Dialog
                open={!!detailLog}
                onOpenChange={(v) => !v && setDetailLog(null)}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chi tiết nhật ký</DialogTitle>
                        <DialogDescription>
                            {detailLog &&
                                formatDate(detailLog.createdAt)}
                        </DialogDescription>
                    </DialogHeader>
                    {detailLog && (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 pr-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Người thực hiện
                                        </p>
                                        <p className="font-medium">
                                            {detailLog.userName ||
                                                detailLog.userId}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Hành động
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                ACTION_LABELS[
                                                    detailLog.action
                                                ]?.color ?? ""
                                            }
                                        >
                                            {ACTION_LABELS[
                                                detailLog.action
                                            ]?.label ??
                                                detailLog.action}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Đối tượng
                                        </p>
                                        <p className="font-medium">
                                            {ENTITY_LABELS[
                                                detailLog.entity
                                            ] ?? detailLog.entity}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            ID đối tượng
                                        </p>
                                        <p className="font-mono text-xs">
                                            {detailLog.entityId ??
                                                "—"}
                                        </p>
                                    </div>
                                    {detailLog.ipAddress && (
                                        <div>
                                            <p className="text-muted-foreground">
                                                IP Address
                                            </p>
                                            <p className="font-mono text-xs">
                                                {detailLog.ipAddress}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {detailLog.oldData && (
                                    <div>
                                        <p className="mb-2 font-medium">
                                            Dữ liệu cũ
                                        </p>
                                        {renderJsonDiff(
                                            detailLog.oldData,
                                            null,
                                        )}
                                    </div>
                                )}

                                {detailLog.newData && (
                                    <div>
                                        <p className="mb-2 font-medium">
                                            Dữ liệu mới
                                        </p>
                                        {renderJsonDiff(
                                            null,
                                            detailLog.newData,
                                        )}
                                    </div>
                                )}

                                {detailLog.oldData &&
                                    detailLog.newData && (
                                        <div>
                                            <Separator className="my-2" />
                                            <p className="mb-2 font-medium">
                                                So sánh thay đổi
                                            </p>
                                            {renderJsonDiff(
                                                detailLog.oldData,
                                                detailLog.newData,
                                            )}
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

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAuditLogs } from "../actions";

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
    const [data, setData] = useState<LogsPage>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(
        null,
    );

    // Filter states
    const [userFilter, setUserFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = useCallback(
        async (
            page: number,
            overrides?: {
                userId?: string;
                action?: string;
                entity?: string;
                startDate?: string;
                endDate?: string;
            },
        ) => {
            setIsLoading(true);
            try {
                const userId =
                    (overrides?.userId ?? userFilter) === "all"
                        ? undefined
                        : (overrides?.userId ?? userFilter);
                const action =
                    (overrides?.action ?? actionFilter) === "all"
                        ? undefined
                        : (overrides?.action ?? actionFilter);
                const entity =
                    (overrides?.entity ?? entityFilter) === "all"
                        ? undefined
                        : (overrides?.entity ?? entityFilter);
                const sd = overrides?.startDate ?? startDate;
                const ed = overrides?.endDate ?? endDate;

                const result = await getAuditLogs({
                    page,
                    pageSize: 20,
                    userId: userId || undefined,
                    action: action || undefined,
                    entity: entity || undefined,
                    startDate: sd || undefined,
                    endDate: ed || undefined,
                });
                setData(result);
            } catch {
                toast.error("Không thể tải nhật ký");
            } finally {
                setIsLoading(false);
            }
        },
        [userFilter, actionFilter, entityFilter, startDate, endDate],
    );

    const handleFilter = () => fetchLogs(1);

    const handleResetFilters = () => {
        setUserFilter("all");
        setActionFilter("all");
        setEntityFilter("all");
        setStartDate("");
        setEndDate("");
        fetchLogs(1, {
            userId: "all",
            action: "all",
            entity: "all",
            startDate: "",
            endDate: "",
        });
    };

    return (
        <div className="space-y-6">
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
                <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Select
                            value={userFilter}
                            onValueChange={setUserFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Người thực hiện" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tất cả người dùng
                                </SelectItem>
                                {filters.users.map((u) => (
                                    <SelectItem
                                        key={u.id}
                                        value={u.id}
                                    >
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={actionFilter}
                            onValueChange={setActionFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Hành động" />
                            </SelectTrigger>
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

                        <Select
                            value={entityFilter}
                            onValueChange={setEntityFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Đối tượng" />
                            </SelectTrigger>
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

                        <div className="flex gap-2">
                            <Button
                                onClick={handleFilter}
                                className="flex-1"
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Lọc
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleResetFilters}
                            >
                                Xóa lọc
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">
                                Từ ngày
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">
                                Đến ngày
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Lịch sử hoạt động
                    </CardTitle>
                    <CardDescription>
                        Tổng cộng {data.total} bản ghi
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
                                ) : data.logs.length === 0 ? (
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
                                    data.logs.map((log) => {
                                        const actionInfo =
                                            ACTION_LABELS[log.action];
                                        return (
                                            <TableRow key={log.id}>
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
                                                    ] ?? log.entity}
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
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Trang {data.page} / {data.totalPages}{" "}
                                ({data.total} bản ghi)
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page <= 1}
                                    onClick={() =>
                                        fetchLogs(data.page - 1)
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        data.page >= data.totalPages
                                    }
                                    onClick={() =>
                                        fetchLogs(data.page + 1)
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

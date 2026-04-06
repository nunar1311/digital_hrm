"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    Eye,
    MapPin,
    Camera,
    ShieldCheck,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { RecordDetailSheet } from "@/components/attendance/record-detail-sheet";
import { getAttendanceRecords } from "../actions";
import type {
    AttendanceRecordWithUser,
    AttendanceRecordsResult,
    DepartmentBasic,
    UserBasic,
} from "../types";
import { useTimezone } from "@/hooks/use-timezone";

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "PRESENT", label: "Đúng giờ" },
    { value: "LATE", label: "Đi muộn" },
    { value: "EARLY_LEAVE", label: "Về sớm" },
    { value: "LATE_AND_EARLY", label: "Muộn & Sớm" },
    { value: "ABSENT", label: "Vắng mặt" },
    { value: "HALF_DAY", label: "Nửa ngày" },
    { value: "ON_LEAVE", label: "Nghỉ phép" },
    { value: "HOLIDAY", label: "Ngày lễ" },
];

const METHOD_OPTIONS = [
    { value: "all", label: "Tất cả phương thức" },
    { value: "GPS", label: "GPS" },
    { value: "WIFI", label: "WiFi" },
    { value: "FACE_ID", label: "Khuôn mặt" },
    { value: "QR", label: "Mã QR" },
    { value: "VANTAY", label: "Vân tay" },
    { value: "MANUAL", label: "Thủ công" },
];

const STATUS_BADGE: Record<
    string,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PRESENT: { label: "Đúng giờ", variant: "default" },
    LATE: { label: "Muộn", variant: "secondary" },
    EARLY_LEAVE: { label: "Về sớm", variant: "secondary" },
    LATE_AND_EARLY: { label: "M&S", variant: "destructive" },
    ABSENT: { label: "Vắng", variant: "destructive" },
    HALF_DAY: { label: "½ ngày", variant: "outline" },
    ON_LEAVE: { label: "Phép", variant: "outline" },
    HOLIDAY: { label: "Lễ", variant: "outline" },
};

function formatTime(dateStr: string | null, timezone: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(dateStr: string, timezone: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        timeZone: timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function RecordsClient({
    initialData,
    departments,
    users,
}: {
    initialData: AttendanceRecordsResult;
    departments: DepartmentBasic[];
    users: UserBasic[];
}) {
    const { timezone, isInitialized } = useTimezone();

    // Filters
    const [page, setPage] = useState(1);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [userId, setUserId] = useState("");
    const [status, setStatus] = useState("");
    const [method, setMethod] = useState("");

    // Detail sheet
    const [selectedRecord, setSelectedRecord] =
        useState<AttendanceRecordWithUser | null>(null);

    const pageSize = 20;

    const buildParams = useCallback(
        (p: number) => ({
            page: p,
            pageSize,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            departmentId: departmentId || undefined,
            userId: userId || undefined,
            status: status || undefined,
            method: method || undefined,
        }),
        [
            dateFrom,
            dateTo,
            departmentId,
            userId,
            status,
            method,
            pageSize,
        ],
    );

    const { data, isFetching } = useQuery<AttendanceRecordsResult>({
        queryKey: [
            "attendance",
            "records",
            page,
            dateFrom,
            dateTo,
            departmentId,
            userId,
            status,
            method,
        ],
        queryFn: async () => {
            const res = await getAttendanceRecords(buildParams(page));
            return JSON.parse(
                JSON.stringify(res),
            ) as AttendanceRecordsResult;
        },
        initialData:
            page === 1 &&
            !dateFrom &&
            !dateTo &&
            !departmentId &&
            !userId &&
            !status &&
            !method
                ? initialData
                : undefined,
        placeholderData: (prev) => prev,
    });

    const records = data?.records ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const handleFilterReset = () => {
        setDateFrom("");
        setDateTo("");
        setDepartmentId("");
        setUserId("");
        setStatus("");
        setMethod("");
        setPage(1);
    };

    const filteredUsers = departmentId
        ? users.filter((u) => u.departmentId === departmentId)
        : users;

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Nhật ký chấm công
                </h1>
                <p className="text-muted-foreground">
                    Kiểm tra chi tiết lịch sử chấm công của nhân viên
                    — vị trí, phương thức, ảnh xác minh
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-4 w-4" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Từ ngày
                            </label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Đến ngày
                            </label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Phòng ban
                            </label>
                            <Select
                                value={departmentId || "all"}
                                onValueChange={(v) => {
                                    setDepartmentId(
                                        v === "all" ? "" : v,
                                    );
                                    setUserId("");
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả phòng ban
                                    </SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem
                                            key={d.id}
                                            value={d.id}
                                        >
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Nhân viên
                            </label>
                            <Select
                                value={userId || "all"}
                                onValueChange={(v) => {
                                    setUserId(v === "all" ? "" : v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả nhân viên
                                    </SelectItem>
                                    {filteredUsers.map((u) => (
                                        <SelectItem
                                            key={u.id}
                                            value={u.id}
                                        >
                                            {u.name}{" "}
                                            {u.employeeCode
                                                ? `(${u.employeeCode})`
                                                : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Trạng thái
                            </label>
                            <Select
                                value={status || "all"}
                                onValueChange={(v) => {
                                    setStatus(v === "all" ? "" : v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Phương thức
                            </label>
                            <Select
                                value={method || "all"}
                                onValueChange={(v) => {
                                    setMethod(v === "all" ? "" : v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METHOD_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2 col-span-1 sm:col-span-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFilterReset}
                            >
                                Xóa bộ lọc
                            </Button>
                            <span className="text-xs text-muted-foreground self-center">
                                {total} bản ghi
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Records Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <TooltipProvider delayDuration={100}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-45">
                                            Nhân viên
                                        </TableHead>
                                        <TableHead className="min-w-25">
                                            Ngày
                                        </TableHead>
                                        <TableHead className="min-w-20">
                                            Check-in
                                        </TableHead>
                                        <TableHead className="min-w-20">
                                            Check-out
                                        </TableHead>
                                        <TableHead>
                                            Phương thức
                                        </TableHead>
                                        <TableHead>
                                            Trạng thái
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Vị trí
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Ảnh
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Xác minh
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Giờ làm
                                        </TableHead>
                                        <TableHead className="w-12.5" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((rec) => {
                                        const statusInfo =
                                            STATUS_BADGE[rec.status];
                                        const hasLocation =
                                            !!rec.checkInLocation ||
                                            !!rec.checkOutLocation;
                                        const hasPhoto =
                                            !!rec.checkInPhoto ||
                                            !!rec.checkOutPhoto;
                                        const allVerified =
                                            rec.checkInVerified &&
                                            (rec.checkOut
                                                ? rec.checkOutVerified
                                                : true);

                                        return (
                                            <TableRow
                                                key={rec.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    setSelectedRecord(
                                                        rec,
                                                    )
                                                }
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarImage
                                                                src={
                                                                    rec
                                                                        .user
                                                                        .image ??
                                                                    undefined
                                                                }
                                                            />
                                                            <AvatarFallback className="text-xs">
                                                                {rec.user.name
                                                                    ?.charAt(
                                                                        0,
                                                                    )
                                                                    ?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium leading-none">
                                                                {
                                                                    rec
                                                                        .user
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {rec
                                                                    .user
                                                                    .employeeCode ??
                                                                    "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(
                                                        rec.date,
                                                        timezone,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatTime(
                                                        rec.checkIn,
                                                        timezone,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatTime(
                                                        rec.checkOut,
                                                        timezone,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        {rec.checkInMethod && (
                                                            <Badge
                                                                variant="outline"
                                                                className="w-fit text-[10px] px-1.5 py-0"
                                                            >
                                                                {
                                                                    rec.checkInMethod
                                                                }
                                                            </Badge>
                                                        )}
                                                        {rec.checkOutMethod &&
                                                            rec.checkOutMethod !==
                                                                rec.checkInMethod && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="w-fit text-[10px] px-1.5 py-0"
                                                                >
                                                                    {
                                                                        rec.checkOutMethod
                                                                    }
                                                                </Badge>
                                                            )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {statusInfo ? (
                                                        <Badge
                                                            variant={
                                                                statusInfo.variant
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {
                                                                statusInfo.label
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            {
                                                                rec.status
                                                            }
                                                        </Badge>
                                                    )}
                                                    {rec.lateMinutes >
                                                        0 && (
                                                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                                                            +
                                                            {
                                                                rec.lateMinutes
                                                            }
                                                            p muộn
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {hasLocation ? (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <MapPin className="h-4 w-4 text-green-600 mx-auto" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {rec.checkInLocation && (
                                                                    <p>
                                                                        In:{" "}
                                                                        {
                                                                            rec.checkInLocation
                                                                        }
                                                                    </p>
                                                                )}
                                                                {rec.checkOutLocation && (
                                                                    <p>
                                                                        Out:{" "}
                                                                        {
                                                                            rec.checkOutLocation
                                                                        }
                                                                    </p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-muted-foreground/30">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {hasPhoto ? (
                                                        <Camera className="h-4 w-4 text-blue-600 mx-auto" />
                                                    ) : (
                                                        <span className="text-muted-foreground/30">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {allVerified ? (
                                                        <ShieldCheck className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <ShieldAlert className="h-4 w-4 text-red-500 mx-auto" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Chưa
                                                                xác
                                                                minh
                                                                đầy đủ
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {rec.workHours !=
                                                    null
                                                        ? `${rec.workHours}h`
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={(
                                                            e,
                                                        ) => {
                                                            e.stopPropagation();
                                                            setSelectedRecord(
                                                                rec,
                                                            );
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {records.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={11}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                {isFetching
                                                    ? "Đang tải dữ liệu..."
                                                    : "Không tìm thấy bản ghi chấm công nào."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                                Hiển thị {(page - 1) * pageSize + 1}–
                                {Math.min(page * pageSize, total)} /{" "}
                                {total} bản ghi
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page <= 1}
                                    onClick={() => setPage(1)}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage((p) => p - 1)
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="mx-2 text-sm font-medium">
                                    Trang {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((p) => p + 1)
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage(totalPages)
                                    }
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Record Detail Sheet */}
            <RecordDetailSheet
                record={selectedRecord}
                open={selectedRecord !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedRecord(null);
                }}
            />
        </div>
    );
}

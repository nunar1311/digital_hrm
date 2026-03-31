"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Search,
    RefreshCw,
    Settings,
    X,
    ChevronDown,
    ChevronUp,
    Loader2,
    Building2,
    User,
    Calendar,
    ListFilter,
    FileCheck,
    Download,
} from "lucide-react";
import {
    getLeaveRequestsForApproval,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveRequestStats,
    getLeaveTypesForFilter,
} from "./actions";
import {
    LeaveRequestItem,
    LeaveRequestPage,
    LeaveRequestStats,
    LeaveRequestStatus,
    LEAVE_REQUEST_STATUS_LABELS,
    LEAVE_REQUEST_STATUS_COLORS,
    LEAVE_REQUEST_STATUS_BORDER_COLORS,
} from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    useClickOutside,
    useMergedRef,
} from "@mantine/hooks";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    flexRender,
    getCoreRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    useReactTable,
    type ColumnDef,
} from "@tanstack/react-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useTimezone } from "@/hooks/use-timezone";

// ============================================================
// TYPES
// ============================================================

interface LeaveRequestsClientProps {
    initialRequests: LeaveRequestPage;
    initialStats: LeaveRequestStats;
    leaveTypes: { id: string; name: string }[];
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string | null | undefined): string {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string, timezone: string): string {
    try {
        return new Intl.DateTimeFormat("vi-VN", {
            timeZone: timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function formatDateTime(dateStr: string, timezone: string): string {
    try {
        return new Intl.DateTimeFormat("vi-VN", {
            timeZone: timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function getRelativeTime(dateStr: string, timezone: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return formatDate(dateStr, timezone);
    } catch {
        return dateStr;
    }
}

function getUserName(user: LeaveRequestItem["user"]): string {
    return user.fullName || user.name || "N/A";
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
    title,
    value,
    icon: Icon,
    className,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    className?: string;
}) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow py-2", className)}>
            <CardContent className="flex items-center gap-3 p-4">
                <div
                    className={cn(
                        "p-2 rounded-lg shrink-0",
                        className?.includes("yellow")
                            ? "bg-yellow-100 text-yellow-600"
                            : className?.includes("green")
                              ? "bg-green-100 text-green-600"
                              : className?.includes("red")
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================
// FILTER POPOVER
// ============================================================

function FilterPopover({
    leaveTypes,
    filterLeaveType,
    setFilterLeaveType,
    sortBy,
    setSortBy,
    onReset,
}: {
    leaveTypes: { id: string; name: string }[];
    filterLeaveType: string;
    setFilterLeaveType: (v: string) => void;
    sortBy: string;
    setSortBy: (v: string) => void;
    onReset: () => void;
}) {
    const [open, setOpen] = useState(false);
    const hasFilters = filterLeaveType !== "all" || sortBy !== "date_desc";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="xs"
                    className={cn(hasFilters && "border-primary bg-primary/5")}
                >
                    <ListFilter className="h-3.5 w-3.5" />
                    Bộ lọc
                    {hasFilters && (
                        <Badge
                            variant="default"
                            className="ml-1 h-4 w-4 p-0 justify-center text-[10px]"
                        >
                            {hasFilters ? 1 : 0}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">Bộ lọc</p>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    onReset();
                                    setOpen(false);
                                }}
                            >
                                Đặt lại
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                            Loại nghỉ phép
                        </Label>
                        <Select
                            value={filterLeaveType}
                            onValueChange={setFilterLeaveType}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn loại nghỉ phép" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại</SelectItem>
                                {leaveTypes.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                            Sắp xếp theo
                        </Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date_desc">Mới nhất</SelectItem>
                                <SelectItem value="date_asc">Cũ nhất</SelectItem>
                                <SelectItem value="name_asc">Tên A → Z</SelectItem>
                                <SelectItem value="name_desc">Tên Z → A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ============================================================
// REQUEST DETAIL DIALOG
// ============================================================

function RequestDetailDialog({
    request,
    open,
    onOpenChange,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
}: {
    request: LeaveRequestItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: () => void;
    onReject: (reason: string) => void;
    isApproving: boolean;
    isRejecting: boolean;
}) {
    const { timezone } = useTimezone();
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    useEffect(() => {
        if (!open) {
            setShowRejectForm(false);
            setRejectReason("");
        }
    }, [open]);

    if (!request) return null;

    const statusLabel =
        LEAVE_REQUEST_STATUS_LABELS[request.status as LeaveRequestStatus];
    const statusColor =
        LEAVE_REQUEST_STATUS_COLORS[request.status as LeaveRequestStatus];
    const isPending = request.status === "PENDING";
    const userName = getUserName(request.user);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        Chi tiết đơn nghỉ phép
                    </DialogTitle>
                    <DialogDescription>
                        Mã đơn: {request.id.slice(-8).toUpperCase()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Status + Leave Type */}
                    <div className="flex items-center justify-between">
                        <Badge className={statusColor}>{statusLabel}</Badge>
                        {request.leaveType && (
                            <Badge
                                variant="outline"
                                className="text-xs"
                            >
                                {request.leaveType.isPaidLeave
                                    ? "Có lương"
                                    : "Không lương"}
                            </Badge>
                        )}
                    </div>

                    {/* Employee Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage
                                src={request.user.avatar || undefined}
                            />
                            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{userName}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                {request.user.employeeCode && (
                                    <span>{request.user.employeeCode}</span>
                                )}
                                {request.user.department && (
                                    <>
                                        <span>•</span>
                                        <Building2 className="h-3 w-3" />
                                        <span>{request.user.department.name}</span>
                                    </>
                                )}
                                {request.user.position && (
                                    <>
                                        <span>•</span>
                                        <span>{request.user.position.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Từ ngày
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                    {formatDate(request.startDate, timezone)}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Đến ngày
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                    {formatDate(request.endDate, timezone)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Số ngày:</span>
                            <span className="font-semibold">{request.totalDays}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Gửi:</span>
                            <span>{getRelativeTime(request.createdAt, timezone)}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Leave Type */}
                    {request.leaveType && (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Loại nghỉ phép
                            </div>
                            <div className="font-medium">{request.leaveType.name}</div>
                        </div>
                    )}

                    {/* Reason */}
                    {request.reason && (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Lý do
                            </div>
                            <div className="text-sm bg-muted/50 rounded-lg p-3">
                                {request.reason}
                            </div>
                        </div>
                    )}

                    {/* Document */}
                    {request.documentUrl && (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Tài liệu đính kèm
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={request.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Tải tài liệu
                                </a>
                            </Button>
                        </div>
                    )}

                    {/* Approved By */}
                    {request.approvedByUser && (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Người duyệt
                            </div>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage
                                        src={request.approvedByUser.fullName || undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                        {getInitials(
                                            request.approvedByUser.fullName
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                    {request.approvedByUser.fullName ||
                                        request.approvedByUser.name}
                                </span>
                                {request.approvedAt && (
                                    <span className="text-xs text-muted-foreground">
                                        ({formatDateTime(
                                            request.approvedAt,
                                            timezone,
                                        )})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === "REJECTED" && request.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                                <XCircle className="h-4 w-4" />
                                Lý do từ chối
                            </div>
                            <div className="text-sm text-red-800">
                                {request.rejectionReason}
                            </div>
                        </div>
                    )}

                    {/* Reject Form */}
                    {showRejectForm && (
                        <div className="space-y-2">
                            <Label className="text-sm">
                                Lý do từ chối <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                placeholder="Nhập lý do từ chối đơn nghỉ phép..."
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {isPending && (
                        <>
                            {!showRejectForm ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowRejectForm(true)
                                        }
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Từ chối
                                    </Button>
                                    <Button
                                        onClick={onApprove}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Duyệt đơn
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectForm(false);
                                            setRejectReason("");
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => onReject(rejectReason)}
                                        disabled={
                                            !rejectReason.trim() || isRejecting
                                        }
                                    >
                                        {isRejecting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <XCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Xác nhận từ chối
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function LeaveRequestsClient({
    initialRequests,
    initialStats,
    leaveTypes,
}: LeaveRequestsClientProps) {
    const queryClient = useQueryClient();
    const { timezone } = useTimezone();

    // ─── Filters ───
    const [year, setYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] =
        useState<"PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ALL">(
            "ALL"
        );
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");
    const [search, setSearch] = useState("");
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // ─── Column visibility ───
    const [columnVisibility, setColumnVisibility] = useState<
        Record<string, boolean>
    >({
        userName: true,
        department: true,
        leaveType: true,
        dateRange: true,
        totalDays: true,
        status: true,
        createdAt: true,
    });

    // ─── Selection ───
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // ─── Dialog ───
    const [detailRequest, setDetailRequest] =
        useState<LeaveRequestItem | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // ─── Click outside to close search ───
    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (search.trim()) setSearch("");
            setSearchExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

    // ─── Queries ───
    const {
        data: requestsData = initialRequests,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: [
            "leave-requests-for-approval",
            year,
            statusFilter,
            leaveTypeFilter,
            search,
        ],
        queryFn: () =>
            getLeaveRequestsForApproval({
                year,
                status:
                    statusFilter === "ALL"
                        ? ("ALL" as const)
                        : statusFilter,
                leaveTypeId:
                    leaveTypeFilter !== "all" ? leaveTypeFilter : undefined,
                search: search || undefined,
                page: 1,
                pageSize: 100,
            }),
        initialData: initialRequests,
    });

    const { data: statsData = initialStats } = useQuery({
        queryKey: ["leave-request-stats", year],
        queryFn: () => getLeaveRequestStats(year),
        initialData: initialStats,
    });

    // ─── Mutations ───
    const approveMutation = useMutation({
        mutationFn: (id: string) => approveLeaveRequest(id),
        onSuccess: () => {
            toast.success("Đã duyệt đơn nghỉ phép");
            queryClient.invalidateQueries({
                queryKey: ["leave-requests-for-approval"],
            });
            queryClient.invalidateQueries({
                queryKey: ["leave-request-stats"],
            });
            setDetailOpen(false);
            setDetailRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể duyệt đơn");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({
            id,
            reason,
        }: {
            id: string;
            reason: string;
        }) => rejectLeaveRequest(id, { reason }),
        onSuccess: () => {
            toast.success("Đã từ chối đơn nghỉ phép");
            queryClient.invalidateQueries({
                queryKey: ["leave-requests-for-approval"],
            });
            queryClient.invalidateQueries({
                queryKey: ["leave-request-stats"],
            });
            setDetailOpen(false);
            setDetailRequest(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể từ chối đơn");
        },
    });

    // ─── Tab filter ───
    const tabValue =
        statusFilter === "ALL"
            ? "all"
            : statusFilter === "PENDING"
              ? "pending"
              : statusFilter === "APPROVED"
                ? "approved"
                : statusFilter === "REJECTED"
                  ? "rejected"
                  : "all";

    const handleTabChange = (val: string) => {
        if (val === "all") setStatusFilter("ALL");
        else if (val === "pending") setStatusFilter("PENDING");
        else if (val === "approved") setStatusFilter("APPROVED");
        else if (val === "rejected") setStatusFilter("REJECTED");
        else setStatusFilter("ALL");
    };

    // ─── Tab counts ───
    const allItems = requestsData.items;
    const pendingItems = allItems.filter(
        (r) => r.status === "PENDING"
    );
    const approvedItems = allItems.filter(
        (r) => r.status === "APPROVED"
    );
    const rejectedItems = allItems.filter(
        (r) => r.status === "REJECTED"
    );

    const tabData = useMemo(() => {
        switch (tabValue) {
            case "pending":
                return pendingItems;
            case "approved":
                return approvedItems;
            case "rejected":
                return rejectedItems;
            default:
                return allItems;
        }
    }, [tabValue, allItems, pendingItems, approvedItems, rejectedItems]);

    // ─── Column Definitions ───
    const columns = useMemo<ColumnDef<LeaveRequestItem>[]>(
        () => [
            {
                id: "select",
                header: () => {
                    const selectedCount = tabData.filter((r) => selectedIds.has(r.id)).length;
                    const isAllSelected = tabData.length > 0 && selectedCount === tabData.length;
                    const isIndeterminate = selectedCount > 0 && selectedCount < tabData.length;
                    
                    return (
                        <Checkbox
                            checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                            onCheckedChange={() => {
                                setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (isAllSelected) {
                                        tabData.forEach((r) => next.delete(r.id));
                                    } else {
                                        tabData.forEach((r) => next.add(r.id));
                                    }
                                    return next;
                                });
                            }}
                            aria-label="Chọn tất cả"
                        />
                    );
                },
                cell: ({ row }) => (
                    <Checkbox
                        checked={selectedIds.has(row.original.id)}
                        onCheckedChange={() =>
                            setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.original.id)) {
                                    next.delete(row.original.id);
                                } else {
                                    next.add(row.original.id);
                                }
                                return next;
                            })
                        }
                        aria-label={`Chọn đơn của ${getUserName(row.original.user)}`}
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
                size: 40,
                enableHiding: false,
            },
            {
                accessorKey: "userName",
                id: "userName",
                header: "Nhân viên",
                size: 200,
                cell: ({ row }) => {
                    const user = row.original.user;
                    const name = getUserName(user);
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                    src={user.avatar || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">
                                    {name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {user.employeeCode || user.email}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "department",
                id: "department",
                header: "Phòng ban",
                size: 150,
                cell: ({ row }) => (
                    <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                    >
                        <Building2 className="h-2.5 w-2.5 mr-0.5" />
                        {row.original.user.department?.name || "—"}
                    </Badge>
                ),
            },
            {
                accessorKey: "leaveType",
                id: "leaveType",
                header: "Loại nghỉ",
                size: 140,
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.leaveType?.name || "N/A"}
                    </span>
                ),
            },
            {
                id: "dateRange",
                header: "Thời gian nghỉ",
                size: 160,
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {formatDate(row.original.startDate, timezone)}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {formatDate(row.original.endDate, timezone)}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "totalDays",
                id: "totalDays",
                header: "Ngày",
                size: 60,
                cell: ({ row }) => (
                    <span className="font-semibold text-sm">
                        {row.original.totalDays}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                id: "status",
                header: "Trạng thái",
                size: 120,
                cell: ({ row }) => {
                    const status = row.original.status as LeaveRequestStatus;
                    return (
                        <Badge
                            className={cn(
                                "text-[10px] px-1.5 py-0 whitespace-nowrap",
                                LEAVE_REQUEST_STATUS_COLORS[status]
                            )}
                        >
                            {LEAVE_REQUEST_STATUS_LABELS[status]}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                id: "createdAt",
                header: "Gửi",
                size: 110,
                cell: ({ row }) => (
                    <span className="text-xs text-muted-foreground">
                        {getRelativeTime(row.original.createdAt, timezone)}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Thao tác",
                size: 100,
                enableHiding: false,
                cell: ({ row }) => {
                    const isPending = row.original.status === "PENDING";
                    return (
                        <div className="flex items-center gap-1 justify-end">
                            {isPending && (
                                <>
                                    <Button
                                        size="icon-xs"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDetailRequest(row.original);
                                            setDetailOpen(true);
                                        }}
                                        title="Duyệt / Xem"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    </Button>
                                </>
                            )}
                            <Button
                                size="icon-xs"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailRequest(row.original);
                                    setDetailOpen(true);
                                }}
                                title="Xem chi tiết"
                            >
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [tabData, selectedIds, timezone]
    );

    const table = useReactTable({
        data: tabData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
    });

    const handleViewDetail = (request: LeaveRequestItem) => {
        setDetailRequest(request);
        setDetailOpen(true);
    };

    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - 2 + i
    );

    const resetFilters = useCallback(() => {
        setLeaveTypeFilter("all");
        setSortBy("date_desc");
        setSearch("");
    }, []);

    const handleSearchToggle = useCallback(() => {
        setSearchExpanded((prev) => {
            const next = !prev;
            if (next) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            } else {
                setSearch("");
            }
            return next;
        });
    }, []);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setSearchExpanded(false);
                setSearch("");
                searchInputRef.current?.blur();
            }
        },
        []
    );

    // ─── Keyboard shortcuts ───
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;
            if (isInputFocused) return;
            if (e.key === "/") {
                e.preventDefault();
                handleSearchToggle();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSearchToggle]);

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* ─── Header ─── */}
            <div className="flex flex-col gap-0">
                <section>
                    <header className="p-2 flex items-center h-10 border-b">
                        <h1 className="font-bold flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                            Duyệt đơn nghỉ phép
                        </h1>
                    </header>
                </section>

                {/* ─── Stats Cards ─── */}
                <div className="grid gap-3 p-2 shrink-0 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Đang chờ duyệt"
                        value={statsData.pending}
                        icon={Clock}
                        className="border-yellow-200 bg-yellow-50/50"
                    />
                    <StatCard
                        title="Đã duyệt"
                        value={statsData.approved}
                        icon={CheckCircle2}
                        className="border-green-200 bg-green-50/50"
                    />
                    <StatCard
                        title="Từ chối"
                        value={statsData.rejected}
                        icon={XCircle}
                        className="border-red-200 bg-red-50/50"
                    />
                    <StatCard
                        title="Tổng đơn"
                        value={statsData.total}
                        icon={CalendarDays}
                        className="border-blue-200 bg-blue-50/50"
                    />
                </div>

                {/* ─── Toolbar ─── */}
                <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
                    {/* Year Select */}
                    <Select
                        value={String(year)}
                        onValueChange={(v) => setYear(parseInt(v))}
                    >
                        <SelectTrigger className="h-7 w-auto text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    Năm {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="h-4!" />

                    <FilterPopover
                        leaveTypes={leaveTypes}
                        filterLeaveType={leaveTypeFilter}
                        setFilterLeaveType={setLeaveTypeFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        onReset={resetFilters}
                    />

                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                            queryClient.invalidateQueries({
                                queryKey: ["leave-requests-for-approval"],
                            })
                        }
                        disabled={isFetching}
                    >
                        <RefreshCw
                            className={cn(
                                "h-3.5 w-3.5",
                                isFetching && "animate-spin"
                            )}
                        />
                    </Button>

                    <Separator orientation="vertical" className="h-4!" />

                    <Button
                        variant="outline"
                        size="icon-xs"
                        className="h-7 w-7"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings className="h-3.5 w-3.5" />
                    </Button>

                    {/* Search */}
                    <div
                        className="relative flex items-center"
                        ref={mergedSearchRef}
                    >
                        <Input
                            ref={searchInputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Tìm nhân viên..."
                            className={cn(
                                "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                                searchExpanded
                                    ? "w-48 opacity-100 pl-3"
                                    : "w-0 opacity-0 pl-0"
                            )}
                        />
                        <Button
                            size={"icon-xs"}
                            variant={"ghost"}
                            onClick={handleSearchToggle}
                            className={cn(
                                "absolute right-0.5 z-10",
                                searchExpanded && "[&_svg]:text-primary"
                            )}
                        >
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* ─── Table Settings ─── */}
                <TableSettingsPanel
                    open={settingsOpen}
                    onClose={setSettingsOpen}
                    columnVisibility={columnVisibility}
                    setColumnVisibility={setColumnVisibility}
                    defaultVisibleColumns={{
                        userName: true,
                        department: true,
                        leaveType: true,
                        dateRange: true,
                        totalDays: true,
                        status: true,
                        createdAt: true,
                    }}
                    columnOptions={[
                        { key: "userName", label: "Nhân viên", icon: User },
                        { key: "department", label: "Phòng ban", icon: Building2 },
                        { key: "leaveType", label: "Loại nghỉ", icon: CalendarDays },
                        { key: "dateRange", label: "Thời gian", icon: Calendar },
                        { key: "totalDays", label: "Ngày", icon: Clock },
                        { key: "status", label: "Trạng thái", icon: FileText },
                        { key: "createdAt", label: "Ngày gửi", icon: Clock },
                    ]}
                    className="top-10"
                    hiddenColumnIndices={[]}
                    disabledColumnIndices={[]}
                />
            </div>

            {/* ─── Tabs ─── */}
            <div className="flex items-center gap-1 px-2 pb-0 border-b bg-background shrink-0">
                {(
                    [
                        { value: "all", label: "Tất cả", count: allItems.length },
                        {
                            value: "pending",
                            label: "Chờ duyệt",
                            count: pendingItems.length,
                        },
                        {
                            value: "approved",
                            label: "Đã duyệt",
                            count: approvedItems.length,
                        },
                        {
                            value: "rejected",
                            label: "Từ chối",
                            count: rejectedItems.length,
                        },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={cn(
                            "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px",
                            tabValue === tab.value
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                        )}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* ─── Batch Actions Bar ─── */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20 shrink-0">
                    <span className="text-xs text-muted-foreground">
                        Đã chọn{" "}
                        <strong className="text-foreground">
                            {selectedIds.size}
                        </strong>{" "}
                        đơn
                    </span>
                    <Button
                        variant="default"
                        size="xs"
                        className="h-6 ml-4"
                        disabled={Array.from(selectedIds).every(id => {
                            const req = requestsData.items.find((r) => r.id === id);
                            return !req || req.status !== "PENDING";
                        })}
                        onClick={() => {
                            const pendingIds = Array.from(selectedIds).filter(id => {
                                const req = requestsData.items.find((r) => r.id === id);
                                return req && req.status === "PENDING";
                            });
                            pendingIds.forEach(id => {
                                approveMutation.mutate(id);
                            });
                            setSelectedIds(new Set());
                        }}
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        Duyệt các đơn chờ ({Array.from(selectedIds).filter(id => {
                            const req = requestsData.items.find((r) => r.id === id);
                            return req && req.status === "PENDING";
                        }).length})
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-auto h-6 w-6"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* ─── Table ─── */}
            <div className="flex-1 min-h-0 overflow-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="h-7 px-2 select-none z-10 relative bg-background"
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
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
                                            style={{ width: col.size }}
                                            className="p-2"
                                        >
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group/row cursor-pointer"
                                    onClick={() => handleViewDetail(row.original)}
                                >
                                    {row
                                        .getVisibleCells()
                                        .map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Không có đơn nghỉ phép nào</p>
                                        {search && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={resetFilters}
                                            >
                                                Xóa tìm kiếm
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ─── Summary Footer ─── */}
            {!isLoading && requestsData.total > 0 && (
                <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Hiển thị <strong>{tabData.length}</strong> /{" "}
                        <strong>{requestsData.total}</strong> đơn
                    </p>
                    {pendingItems.length > 0 && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700"
                        >
                            {pendingItems.length} đơn chờ bạn duyệt
                        </Badge>
                    )}
                </div>
            )}

            {/* ─── Detail Dialog ─── */}
            <RequestDetailDialog
                request={detailRequest}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onApprove={() => {
                    if (detailRequest) {
                        approveMutation.mutate(detailRequest.id);
                    }
                }}
                onReject={(reason) => {
                    if (detailRequest) {
                        rejectMutation.mutate({
                            id: detailRequest.id,
                            reason,
                        });
                    }
                }}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
            />
        </div>
    );
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getPositions,
    deletePosition,
    type PositionListItem,
    type GetPositionsParams,
    type GetPositionsResult,
} from "./actions";
import { PositionsTable } from "@/components/positions/positions-table";
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { Button } from "@/components/ui/button";
import { ListFilter, Plus, Search } from "lucide-react";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Briefcase, ArrowUpDown } from "lucide-react";

const PAGE_SIZE = 20;

const AUTHORITY_OPTIONS = [
    { value: "ALL", label: "Tất cả cấp bậc" },
    { value: "EXECUTIVE", label: "HĐQT" },
    { value: "DIRECTOR", label: "Giám đốc" },
    { value: "MANAGER", label: "Trưởng phòng" },
    { value: "DEPUTY", label: "Phó phòng" },
    { value: "TEAM_LEAD", label: "Tổ trưởng" },
    { value: "STAFF", label: "Nhân viên" },
    { value: "INTERN", label: "Thực tập sinh" },
];

const STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Không hoạt động" },
];

type AuthorityFilter = "ALL" | "EXECUTIVE" | "DIRECTOR" | "MANAGER" | "DEPUTY" | "TEAM_LEAD" | "STAFF" | "INTERN";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function PositionsClient() {
    const queryClient = useQueryClient();

    // Search state
    const [search, setSearch] = useState("");
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (search.trim()) setSearch("");
            setSearchExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

    // Filter state
    const [authorityFilter, setAuthorityFilter] = useState<AuthorityFilter>("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editData, setEditData] = useState<PositionListItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PositionListItem | null>(null);
    const [detailTarget, setDetailTarget] = useState<PositionListItem | null>(null);

    // Real-time updates
    useSocketEvents(
        [],
        () => {
            queryClient.invalidateQueries({ queryKey: ["positions"] });
        },
    );

    // Build query params
    const queryParams: GetPositionsParams = {
        pageSize: PAGE_SIZE,
        search: search || undefined,
        authority: authorityFilter !== "ALL" ? authorityFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : "ALL",
    };

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<GetPositionsResult>({
        queryKey: ["positions", queryParams],
        queryFn: ({ pageParam = 1 }) =>
            getPositions({ ...queryParams, page: pageParam as number }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    });

    const allPositions = data?.pages.flatMap((p) => p.positions) ?? [];
    const totalPositions = data?.pages[0]?.total ?? 0;

    // Handlers
    const handleEdit = useCallback((position: PositionListItem) => {
        setEditData(position);
        setFormOpen(true);
    }, []);

    const handleDelete = useCallback((position: PositionListItem) => {
        setDeleteTarget(position);
    }, []);

    const handleViewDetail = useCallback((position: PositionListItem) => {
        setDetailTarget(position);
    }, []);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        const result = await deletePosition(deleteTarget.id);
        if (result.success) {
            toast.success("Xóa chức vụ thành công");
            queryClient.invalidateQueries({ queryKey: ["positions"] });
        } else {
            toast.error(result.error);
        }
        setDeleteTarget(null);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditData(null);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const hasActiveFilters =
        search !== "" || authorityFilter !== "ALL" || statusFilter !== "ALL";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Briefcase className="h-6 w-6" />
                        Quản lý chức vụ
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý danh sách và phân cấp chức vụ trong tổ chức
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditData(null);
                        setFormOpen(true);
                    }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Thêm chức vụ
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div
                    ref={mergedSearchRef}
                    className={cn(
                        "relative flex items-center transition-all duration-200",
                        searchExpanded ? "flex-1" : "w-full sm:w-64",
                    )}
                >
                    <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Tìm theo tên, mã..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchExpanded(true)}
                        className="pl-9"
                    />
                </div>

                {/* Authority filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "gap-2",
                                authorityFilter !== "ALL" && "border-primary bg-primary/5",
                            )}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {AUTHORITY_OPTIONS.find((o) => o.value === authorityFilter)?.label ||
                                "Cấp bậc"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup
                            value={authorityFilter}
                            onValueChange={(v) => setAuthorityFilter(v as AuthorityFilter)}
                        >
                            {AUTHORITY_OPTIONS.map((opt) => (
                                <DropdownMenuCheckboxItem
                                    key={opt.value}
                                    checked={authorityFilter === opt.value}
                                    onCheckedChange={() =>
                                        setAuthorityFilter(opt.value as AuthorityFilter)
                                    }
                                    className="capitalize"
                                >
                                    {opt.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Status filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "gap-2",
                                statusFilter !== "ALL" && "border-primary bg-primary/5",
                            )}
                        >
                            <ListFilter className="h-4 w-4" />
                            {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ||
                                "Trạng thái"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <DropdownMenuCheckboxItem
                                    key={opt.value}
                                    checked={statusFilter === opt.value}
                                    onCheckedChange={() =>
                                        setStatusFilter(opt.value as StatusFilter)
                                    }
                                >
                                    {opt.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearch("");
                            setAuthorityFilter("ALL");
                            setStatusFilter("ALL");
                        }}
                    >
                        Xóa lọc
                    </Button>
                )}
            </div>

            {/* Table */}
            <PositionsTable
                data={allPositions}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetail={(p) => {
                    window.location.href = `/positions/${p.id}`;
                }}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={handleLoadMore}
                totalPositions={totalPositions}
            />

            {/* Form dialog */}
            <PositionFormDialog
                open={formOpen}
                onClose={handleFormClose}
                editData={editData}
            />

            {/* Delete confirmation */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa chức vụ</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa chức vụ{" "}
                            <strong>{deleteTarget?.name}</strong> không? Hành động này sẽ
                            chuyển chức vụ sang trạng thái không hoạt động.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

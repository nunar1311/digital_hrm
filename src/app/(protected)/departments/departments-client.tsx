"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getDepartments,
    getDepartmentStats,
    getAllDepartments,
    deleteDepartment,
    getDepartmentTree,
} from "./actions";
import { DepartmentStatsCards } from "@/components/departments/department-stats-cards";
import { DepartmentTable } from "@/components/departments/department-table";
import { DepartmentToolbar } from "@/components/departments/department-toolbar";
import { DepartmentDetailSheet } from "@/components/departments/department-detail-sheet";
import { DepartmentFormDialog } from "@/components/org-chart/department-form-dialog";
import DeleteConfirm from "@/components/delete-confirm";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import type {
    DepartmentListItem,
    DepartmentStats,
    GetDepartmentsParams,
} from "./types";
import { PAGE_SIZE } from "./constants";
import { useSocketEvents } from "@/hooks/use-socket-event";

export function DepartmentsClient() {
    const queryClient = useQueryClient();

    // State
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "ACTIVE" | "INACTIVE" | "ALL"
    >("ALL");
    const [parentFilter, setParentFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    // Dialog states
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] =
        useState<DepartmentListItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingDepartment, setDeletingDepartment] =
        useState<DepartmentListItem | null>(null);
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [detailDepartmentId, setDetailDepartmentId] = useState<
        string | null
    >(null);

    // Real-time: invalidate queries when department events occur
    useSocketEvents(
        [
            "department:created",
            "department:updated",
            "department:deleted",
            "department:employee-moved",
            "department:template-applied",
        ],
        () => {
            queryClient.invalidateQueries({
                queryKey: ["departments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["departmentStats"],
            });
            queryClient.invalidateQueries({
                queryKey: ["departmentTree"],
            });
        },
    );

    // Queries
    const { data: statsData, isLoading: isLoadingStats } =
        useQuery<DepartmentStats>({
            queryKey: ["departmentStats"],
            queryFn: getDepartmentStats,
        });

    const { data: departmentsData, isLoading: isLoadingDepartments } =
        useQuery({
            queryKey: [
                "departments",
                {
                    page,
                    pageSize,
                    search,
                    status: statusFilter,
                    parentId: parentFilter,
                },
            ],
            queryFn: () =>
                getDepartments({
                    page,
                    pageSize,
                    search,
                    status: statusFilter,
                    parentId:
                        parentFilter === "all"
                            ? undefined
                            : parentFilter === "none"
                              ? null
                              : parentFilter,
                } as GetDepartmentsParams),
        });

    const { data: allDepartments = [] } = useQuery<
        DepartmentListItem[]
    >({
        queryKey: ["allDepartmentsList"],
        queryFn: getAllDepartments,
    });

    const { data: treeData = [] } = useQuery({
        queryKey: ["departmentTree"],
        queryFn: getDepartmentTree,
    });

    // Computed values
    const totalPages = departmentsData?.totalPages || 1;

    // Handlers
    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const handleStatusFilter = useCallback((value: string) => {
        setStatusFilter(value as "ACTIVE" | "INACTIVE" | "ALL");
        setPage(1);
    }, []);

    const handleParentFilter = useCallback((value: string) => {
        setParentFilter(value);
        setPage(1);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleCreateClick = useCallback(() => {
        setEditingDepartment(null);
        setFormDialogOpen(true);
    }, []);

    const handleEditClick = useCallback(
        (department: DepartmentListItem) => {
            setEditingDepartment(department);
            setFormDialogOpen(true);
        },
        [],
    );

    const handleDeleteClick = useCallback(
        (department: DepartmentListItem) => {
            setDeletingDepartment(department);
            setDeleteDialogOpen(true);
        },
        [],
    );

    const handleViewDetail = useCallback(
        (department: DepartmentListItem) => {
            setDetailDepartmentId(department.id);
            setDetailSheetOpen(true);
        },
        [],
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingDepartment) return;

        const result = await deleteDepartment(deletingDepartment.id);
        if (result.success) {
            toast.success(result.message);
            queryClient.invalidateQueries({
                queryKey: ["departments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["departmentStats"],
            });
        } else {
            toast.error(result.message);
        }

        setDeleteDialogOpen(false);
        setDeletingDepartment(null);
    }, [deletingDepartment, queryClient]);

    const handleFormSuccess = useCallback(() => {
        setFormDialogOpen(false);
        setEditingDepartment(null);
        queryClient.invalidateQueries({ queryKey: ["departments"] });
        queryClient.invalidateQueries({
            queryKey: ["departmentStats"],
        });
        queryClient.invalidateQueries({
            queryKey: ["departmentTree"],
        });
    }, [queryClient]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">
                    Quản lý phòng ban
                </h1>
                <p className="text-sm text-muted-foreground">
                    Quản lý danh sách phòng ban, trưởng phòng và cơ
                    cấu tổ chức
                </p>
            </div>

            {/* Stats Cards */}
            {isLoadingStats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            ) : (
                <DepartmentStatsCards stats={statsData!} />
            )}

            {/* Toolbar */}
            <DepartmentToolbar
                searchValue={search}
                onSearchChange={handleSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilter}
                parentFilter={parentFilter}
                onParentFilterChange={handleParentFilter}
                allDepartments={allDepartments}
                onCreateClick={handleCreateClick}
                isLoading={isLoadingDepartments}
            />

            {/* Table */}
            {isLoadingDepartments ? (
                <div className="space-y-2">
                    <Skeleton className="h-12" />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                    ))}
                </div>
            ) : (
                <DepartmentTable
                    data={departmentsData?.departments || []}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onViewDetail={handleViewDetail}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (page > 1)
                                        handlePageChange(page - 1);
                                }}
                            />
                        </PaginationItem>

                        {[...Array(Math.min(totalPages, 5))].map(
                            (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(
                                                    pageNum,
                                                );
                                            }}
                                            isActive={
                                                page === pageNum
                                            }
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            },
                        )}

                        {totalPages > 5 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (page < totalPages)
                                        handlePageChange(page + 1);
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Create/Edit Form Dialog */}
            <DepartmentFormDialog
                open={formDialogOpen}
                onClose={() => {
                    setFormDialogOpen(false);
                    setEditingDepartment(null);
                }}
                department={editingDepartment}
                allDepartments={treeData}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirm
                open={deleteDialogOpen}
                onOpenChange={(o) => {
                    setDeleteDialogOpen(o);
                    if (!o) setDeletingDepartment(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Xóa phòng ban"
                description={`Bạn có chắc chắn muốn xóa phòng ban "${deletingDepartment?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                isDeleting={false}
            />

            {/* Detail Sheet */}
            <DepartmentDetailSheet
                departmentId={detailDepartmentId}
                open={detailSheetOpen}
                onClose={() => {
                    setDetailSheetOpen(false);
                    setDetailDepartmentId(null);
                }}
            />
        </div>
    );
}

"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
    useInfiniteQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getDepartments, deleteDepartment } from "./actions";
import { DepartmentTable } from "@/components/departments/department-table";
import type {
    DepartmentListItem,
    GetDepartmentsParams,
    GetDepartmentsResult,
} from "./types";
import { PAGE_SIZE } from "./constants";
import { useSocketEvents } from "@/hooks/use-socket-event";
import { Button } from "@/components/ui/button";
import { Plus, Search, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import { useClickOutside, useMergedRef } from "@mantine/hooks";

export function DepartmentsClient() {
    const queryClient = useQueryClient();

    // Search state
    const [search, setSearch] = useState("");
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside to close search
    const clickOutsideRef = useClickOutside(() => {
        if (searchExpanded) {
            if (search.trim()) {
                setSearch("");
            }
            setSearchExpanded(false);
        }
    });
    const mergedSearchRef = useMergedRef(
        searchContainerRef,
        clickOutsideRef,
    );

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] =
        useState<DepartmentListItem | null>(null);

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
        },
    );

    const {
        data: departmentsData,
        isLoading: isLoadingDepartments,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery<GetDepartmentsResult>({
        queryKey: [
            "departments",
            {
                pageSize: PAGE_SIZE,
                search,
            },
        ],
        queryFn: ({ pageParam }) =>
            getDepartments({
                page: pageParam as number,
                pageSize: PAGE_SIZE,
                search,
                status: "ALL",
                parentId: undefined,
            } as GetDepartmentsParams),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages
                ? lastPage.page + 1
                : undefined,
    });

    const departments = useMemo(
        () =>
            departmentsData?.pages.flatMap((p) => p.departments) ??
            [],
        [departmentsData],
    );

    // ─── Infinite scroll fetch ───
    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ─── Table action handlers ───
    const handleViewDetail = useCallback(
        (department: DepartmentListItem) => {
            // Navigate to department detail page
            window.location.href = `/departments/${department.id}`;
        },
        [],
    );

    const handleEdit = useCallback(
        (department: DepartmentListItem) => {
            // TODO: Open edit dialog
            console.log("Edit department:", department.id);
        },
        [],
    );

    const handleDeleteClick = useCallback(
        (department: DepartmentListItem) => {
            setDeleteTarget(department);
        },
        [],
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;

        const result = await deleteDepartment(deleteTarget.id);
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

        setDeleteTarget(null);
    }, [deleteTarget, queryClient]);

    // ─── Search toggle handlers ───
    const handleSearchToggle = useCallback(() => {
        if (!searchExpanded) {
            setSearchExpanded(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
            if (search.trim()) {
                setSearch("");
            }
            setSearchExpanded(false);
        }
    }, [searchExpanded, search]);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
                setSearch("");
                setSearchExpanded(false);
            }
        },
        [],
    );

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
                {/* Header */}
                <section>
                    <header className="p-2 flex items-center h-10 border-b">
                        <h1 className="font-bold">
                            Tất cả phòng ban
                        </h1>
                    </header>
                    <div className="flex items-center justify-end gap-2 px-2 py-2">
                        {/* Search */}
                        <div className="relative flex items-center" ref={mergedSearchRef}>
                            <Input
                                ref={searchInputRef}
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Tìm kiếm phòng ban..."
                                className={cn(
                                    "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                                    searchExpanded
                                        ? "w-50 opacity-100 pl-3"
                                        : "w-0 opacity-0 pl-0",
                                )}
                            />

                            <Button
                                size={"icon-xs"}
                                variant={"ghost"}
                                onClick={handleSearchToggle}
                                className={cn(
                                    "absolute right-0.5 z-10",
                                    searchExpanded &&
                                        "[&_svg]:text-primary",
                                )}
                            >
                                <Search />
                            </Button>
                        </div>

                        <Separator
                            orientation="vertical"
                            className="h-4!"
                        />

                        <Button variant={"outline"} size={"xs"}>
                            <Settings />
                        </Button>
                        <Button size={"xs"}>
                            <Plus />
                            Phòng ban
                        </Button>
                    </div>
                </section>

                {/* Table */}
                <section className="flex-1 relative h-full min-h-0 overflow-hidden">
                    <DepartmentTable
                        data={departments}
                        isLoading={isLoadingDepartments}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onViewDetail={handleViewDetail}
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={!!isFetchingNextPage}
                        onLoadMore={handleFetchNextPage}
                    />
                </section>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) =>
                    !open && setDeleteTarget(null)
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phòng ban{" "}
                            <strong>{deleteTarget?.name}</strong>{" "}
                            không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setDeleteTarget(null)}
                        >
                            Hủy
                        </AlertDialogCancel>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    UserCircle,
    FolderTree,
    Users,
    Pencil,
    Trash2,
    MoreVertical,
    Search,
    ArrowLeft,
    ExternalLink,
    Network,
} from "lucide-react";
import { deleteDepartment } from "@/app/(protected)/org-chart/actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DepartmentStats } from "./department-stats";
import { EmployeeListItem } from "./employee-list-item";
import type { DepartmentNode } from "@/types/org-chart";

interface DepartmentDetailPanelProps {
    department: DepartmentNode | null;
    onClose: () => void;
    onEdit: (id: string) => void;
}

export function DepartmentDetailPanel({
    department,
    onClose,
    onEdit,
}: DepartmentDetailPanelProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const isOpen = department !== null;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

    const filteredEmployees = department?.employees?.filter((emp) => {
        if (!employeeSearchQuery.trim()) return true;
        const query = employeeSearchQuery.toLowerCase();
        return (
            emp.name.toLowerCase().includes(query) ||
            emp.employeeCode?.toLowerCase().includes(query) ||
            emp.position?.toLowerCase().includes(query)
        );
    }) ?? [];

    const managerInitials =
        department?.manager?.name
            ?.split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("")
            .toUpperCase() ?? "?";

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteDepartment(id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["departmentTree"] });
            await queryClient.cancelQueries({ queryKey: ["departments"] });
            onClose();
            return {};
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
                queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
                queryClient.invalidateQueries({ queryKey: ["departments"] });
            }
        },
        onError: () => {
            toast.error("Lỗi khi xóa phòng ban");
            queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
            queryClient.invalidateQueries({ queryKey: ["departments"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["departmentTree"] });
            queryClient.invalidateQueries({ queryKey: ["departments"] });
        },
    });

    const handleDeleteConfirm = () => {
        if (!department) return;
        deleteMutation.mutate(department.id);
        setShowDeleteDialog(false);
    };

    return (
        <>
            <Sheet
                open={isOpen}
                onOpenChange={(open) => !open && onClose()}
            >
                <SheetContent className="w-full max-w-full sm:max-w-md overflow-y-auto p-4">
                    <SheetHeader className="mb-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push("/org-chart")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <SheetTitle className="text-base">
                                Chi tiết phòng ban
                            </SheetTitle>
                        </div>
                    </SheetHeader>

                    {department && (
                        <div className="space-y-6 pb-6">
                            {/* Header */}
                            <div className="p-4 rounded-xl bg-primary/5 border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`h-2 w-2 rounded-full ${department.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`}
                                        />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {department.status === "ACTIVE"
                                                ? "Đang hoạt động"
                                                : "Ngừng hoạt động"}
                                        </span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                            >
                                                <MoreVertical />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onEdit(department.id)
                                                }
                                            >
                                                <Pencil />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    router.push(
                                                        `/org-chart/${department.id}`,
                                                    )
                                                }
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Mở trang chi tiết
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setShowDeleteDialog(
                                                        true,
                                                    )
                                                }
                                                className="text-destructive font-medium focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Xóa phòng ban
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h2 className="text-xl font-bold">
                                    {department.name}
                                </h2>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {department.code}
                                </p>
                                {department.description && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {department.description}
                                    </p>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <DepartmentStats
                                employeeCount={department.employeeCount}
                                positionCount={department.positionCount}
                                childrenCount={department.children.length}
                            />

                            {/* Manager */}
                            <section>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-primary" />{" "}
                                    Trưởng phòng
                                </h3>
                                {department.manager ? (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                                            <AvatarImage
                                                src={
                                                    department.manager
                                                        .image ??
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                                {managerInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm">
                                                {department.manager.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    department.manager
                                                        .position
                                                }
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                router.push(
                                                    `/employees/${department.manager?.id}`,
                                                )
                                            }
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic p-3 rounded-lg bg-muted/50 border">
                                        Chưa phân công quản lý
                                    </p>
                                )}
                            </section>

                            {/* Employees */}
                            {department.employees &&
                                department.employees.length > 0 && (
                                    <section>
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Nhân viên (
                                            {department.employees.length})
                                        </h3>
                                        <div className="relative mb-3">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Tìm nhân viên..."
                                                value={
                                                    employeeSearchQuery
                                                }
                                                onChange={(e) =>
                                                    setEmployeeSearchQuery(
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-7 h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                                            {filteredEmployees.map((emp) => (
                                                <EmployeeListItem
                                                    key={emp.id}
                                                    employee={emp}
                                                    showActions
                                                    onViewProfile={(id) =>
                                                        router.push(
                                                            `/employees/${id}`,
                                                        )
                                                    }
                                                />
                                            ))}
                                            {filteredEmployees.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Không tìm thấy nhân
                                                    viên
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                )}

                            {/* Sub-departments */}
                            {department.children.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <FolderTree className="h-4 w-4 text-primary" />{" "}
                                        Phòng ban trực thuộc (
                                        {department.children.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {department.children.map(
                                            (child) => (
                                                <button
                                                    key={child.id}
                                                    className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm text-left hover:bg-muted transition-colors"
                                                    onClick={() =>
                                                        router.push(
                                                            `/org-chart/${child.id}`,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className={`h-2 w-2 rounded-full shrink-0 ${child.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`}
                                                    />
                                                    <span className="font-medium">
                                                        {child.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        ({child.code})
                                                    </span>
                                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa phòng ban</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phòng ban &quot;
                            {department?.name}&quot;? Thao tác này không thể hoàn
                            tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xác nhận xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

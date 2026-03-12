"use client";

import { useState } from "react";
import type { DepartmentNode } from "@/types/org-chart";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Users,
    Briefcase,
    UserCircle,
    FolderTree,
    Mail,
    Pencil,
    Trash2,
    MoreVerticalIcon,
} from "lucide-react";
import { deleteDepartment } from "@/app/(protected)/org-chart/actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
    const isOpen = department !== null;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const managerInitials =
        department?.manager?.name
            ?.split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("")
            .toUpperCase() ?? "?";

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteDepartment(id),
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                queryClient.invalidateQueries({
                    queryKey: ["departmentTree"],
                });
                onClose();
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error("Lỗi khi xóa phòng ban");
        },
    });

    const handleDeleteConfirm = () => {
        if (!department) return;
        deleteMutation.mutate(department.id);
        setShowDeleteDialog(false);
    };

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
        >
            <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
                <SheetHeader>
                    <SheetTitle>Chi tiết phòng ban</SheetTitle>
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
                                        {department.status ===
                                        "ACTIVE"
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
                                            <MoreVerticalIcon />
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
                        <div className="grid grid-cols-3 gap-3">
                            <StatMini
                                icon={Users}
                                label="Nhân viên"
                                value={department.employeeCount}
                            />
                            <StatMini
                                icon={Briefcase}
                                label="Vị trí"
                                value={department.positionCount}
                            />
                            <StatMini
                                icon={FolderTree}
                                label="Phòng con"
                                value={department.children.length}
                            />
                        </div>

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
                                        <Users className="h-4 w-4 text-primary" />{" "}
                                        Nhân viên (
                                        {department.employees.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {department.employees.map(
                                            (emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border text-sm"
                                                >
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarImage
                                                            src={
                                                                emp.image ??
                                                                undefined
                                                            }
                                                        />
                                                        <AvatarFallback className="text-[9px] bg-muted font-bold">
                                                            {
                                                                emp.name
                                                                    .split(
                                                                        " ",
                                                                    )
                                                                    .slice(
                                                                        -1,
                                                                    )[0][0]
                                                            }
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-xs">
                                                            {emp.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                            <span>
                                                                {
                                                                    emp.position
                                                                }
                                                            </span>
                                                            {emp.employeeCode && (
                                                                <>
                                                                    <span>
                                                                        •
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        {
                                                                            emp.employeeCode
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
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
                                            <div
                                                key={child.id}
                                                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm"
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
                                            </div>
                                        ),
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </SheetContent>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xóa phòng ban
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phòng ban &quot;
                            {department?.name}&quot;? Thao tác này
                            không thể hoàn tác.
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
        </Sheet>
    );
}

function StatMini({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) {
    return (
        <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">
                {label}
            </p>
        </div>
    );
}

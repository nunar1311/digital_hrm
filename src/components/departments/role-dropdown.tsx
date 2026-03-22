"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Crown,
    Shield,
    User,
    Check,
    MoreHorizontal,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { updateDepartmentRole } from "@/app/(protected)/departments/actions";
import { Button } from "../ui/button";

type DepartmentRole = "HEAD" | "DEPUTY" | "MEMBER";

const ROLE_CONFIG: Record<
    DepartmentRole,
    {
        label: string;
        icon: typeof Crown;
        badgeClass: string;
    }
> = {
    HEAD: {
        label: "Trưởng phòng",
        icon: Crown,
        badgeClass:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    DEPUTY: {
        label: "Phó phòng",
        icon: Shield,
        badgeClass:
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    MEMBER: {
        label: "Nhân viên",
        icon: User,
        badgeClass:
            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
};

interface RoleDropdownProps {
    employeeId: string;
    currentRole: string;
    departmentId: string;
    employeeName: string;
}

export function RoleDropdown({
    employeeId,
    currentRole,
    departmentId,
    employeeName,
}: RoleDropdownProps) {
    const queryClient = useQueryClient();
    const [confirmTarget, setConfirmTarget] =
        useState<DepartmentRole | null>(null);

    const role = (currentRole as DepartmentRole) || "MEMBER";

    const mutation = useMutation({
        mutationFn: ({ newRole }: { newRole: DepartmentRole }) =>
            updateDepartmentRole(employeeId, departmentId, newRole),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Cập nhật vai trò thành công");
                queryClient.invalidateQueries({
                    queryKey: ["employees"],
                });
            } else {
                toast.error(
                    result.error || "Lỗi khi cập nhật vai trò",
                );
            }
            setConfirmTarget(null);
        },
        onError: (err) => {
            toast.error(err.message || "Lỗi khi cập nhật vai trò");
            setConfirmTarget(null);
        },
    });

    const handleSelect = (newRole: DepartmentRole) => {
        if (newRole !== role) {
            setConfirmTarget(newRole);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    {(
                        Object.keys(ROLE_CONFIG) as DepartmentRole[]
                    ).map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        const RIcon = cfg.icon;
                        const isActive = r === role;

                        return (
                            <DropdownMenuCheckboxItem
                                key={r}
                                checked={isActive}
                                onCheckedChange={() =>
                                    handleSelect(r)
                                }
                            >
                                <RIcon className="size-3.5 shrink-0" />
                                {cfg.label}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Confirm dialog when promoting — affects existing HEAD or DEPUTY */}
            <AlertDialog
                open={confirmTarget !== null}
                onOpenChange={(o) => !o && setConfirmTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmTarget === "HEAD"
                                ? "Xác nhận đặt Trưởng phòng"
                                : "Xác nhận đặt Phó phòng"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="flex flex-col">
                            <span>
                                Bạn có chắc muốn đặt{" "}
                                <strong>{employeeName}</strong> làm{" "}
                                {confirmTarget === "HEAD"
                                    ? "Trưởng phòng"
                                    : "Phó phòng"}
                                ?
                            </span>
                            {confirmTarget === "HEAD" ? (
                                <span>
                                    Nhân viên giữ vai trò{" "}
                                    <strong>Trưởng phòng</strong> hiện
                                    tại (nếu có) sẽ bị hạ cấp thành{" "}
                                    <strong>Nhân viên</strong>.
                                </span>
                            ) : (
                                <span>
                                    Nhân viên giữ vai trò{" "}
                                    <strong>Phó phòng</strong> hiện
                                    tại (nếu có) sẽ bị hạ cấp thành{" "}
                                    <strong>Nhân viên</strong>.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setConfirmTarget(null)}
                        >
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmTarget) {
                                    mutation.mutate({
                                        newRole: confirmTarget,
                                    });
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xác nhận
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

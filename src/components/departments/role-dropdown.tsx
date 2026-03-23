"use client";

import {
    useMutation,
    useQueryClient,
    useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Crown,
    Shield,
    User,
    MoreHorizontal,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
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
import {
    updateDepartmentRole,
} from "@/app/(protected)/departments/actions";
import { getAuthorityTypes } from "@/app/(protected)/authority-types/actions";
import { Button } from "../ui/button";
import { useState } from "react";
import type { AuthorityTypeItem } from "@/app/(protected)/authority-types/types";

// Map icon name from database to Lucide icon component
function getIconComponent(iconName: string | null) {
    switch (iconName) {
        case "Crown":
            return Crown;
        case "Shield":
            return Shield;
        case "User":
        default:
            return User;
    }
}

// Map authority code to department role
function authorityToRole(authority: string): string {
    switch (authority) {
        case "MANAGER":
            return "HEAD";
        case "DEPUTY":
            return "DEPUTY";
        default:
            return "MEMBER";
    }
}

interface RoleOption {
    role: string; // Department role: HEAD, DEPUTY, MEMBER
    authority: string; // Authority code: MANAGER, DEPUTY, STAFF
    label: string;
    icon: React.ElementType;
}

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
        useState<string | null>(null);

    const role = currentRole || "MEMBER";

    // Fetch authority types from database
    const { data: authorityTypes = [] } = useQuery({
        queryKey: ["authority-types"],
        queryFn: () => getAuthorityTypes(),
    });

    // Build role options from database authority types
    const roleOptions: RoleOption[] = authorityTypes
        .filter(
            (a: AuthorityTypeItem) =>
                a.code === "MANAGER" ||
                a.code === "DEPUTY" ||
                a.code === "STAFF" ||
                a.code === "TEAM_LEAD",
        )
        .map((a: AuthorityTypeItem) => {
            const deptRole = authorityToRole(a.code);
            const Icon = getIconComponent(a.icon);
            return {
                role: deptRole,
                authority: a.code,
                label: a.name,
                icon: Icon,
            };
        });

    const mutation = useMutation({
        mutationFn: ({ newRole }: { newRole: string }) =>
            updateDepartmentRole(employeeId, departmentId, newRole as "HEAD" | "DEPUTY" | "MEMBER"),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Cập nhật chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["employees"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["department-positions", departmentId],
                });
            } else {
                toast.error(
                    result.error || "Lỗi khi cập nhật chức vụ",
                );
            }
            setConfirmTarget(null);
        },
        onError: (err) => {
            toast.error(err.message || "Lỗi khi cập nhật chức vụ");
            setConfirmTarget(null);
        },
    });

    const handleSelect = (newRole: string) => {
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
                    {roleOptions.map((opt) => {
                        const RIcon = opt.icon;
                        const isActive = opt.role === role;

                        return (
                            <DropdownMenuCheckboxItem
                                key={opt.role}
                                checked={isActive}
                                onCheckedChange={() =>
                                    handleSelect(opt.role)
                                }
                            >
                                <RIcon className="size-3.5 shrink-0" />
                                {opt.label}
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

"use client";

import {
    useMutation,
    useQueryClient,
    useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Shield, User, MoreHorizontal, Briefcase } from "lucide-react";
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
    getDepartmentPositions,
} from "@/app/(protected)/departments/actions";
import { Button } from "../ui/button";
import { useState } from "react";

interface RoleOption {
    role: string;
    label: string;
    icon: typeof Crown;
}

const roleOptions: RoleOption[] = [
    { role: "HEAD", label: "Trưởng phòng", icon: Crown },
    { role: "DEPUTY", label: "Phó phòng", icon: Shield },
    { role: "MEMBER", label: "Nhân viên", icon: User },
];

interface RoleDropdownProps {
    employeeId: string;
    currentRole: string;
    employeePositionId?: string | null;
    departmentId: string;
    employeeName: string;
}

export function RoleDropdown({
    employeeId,
    currentRole,
    employeePositionId,
    departmentId,
    employeeName,
}: RoleDropdownProps) {
    const queryClient = useQueryClient();
    const [confirmTarget, setConfirmTarget] =
        useState<string | null>(null);

    const { data: positions = [] } = useQuery({
        queryKey: ["department-positions", departmentId],
        queryFn: () => getDepartmentPositions(departmentId),
    });

    const role = currentRole || "MEMBER";

    const mutation = useMutation({
        mutationFn: ({ newRole }: { newRole: string }) =>
            updateDepartmentRole(
                employeeId,
                departmentId,
                newRole as "HEAD" | "DEPUTY" | "MEMBER",
            ),
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
                <DropdownMenuContent align="end" className="w-56">
                    {/* Hiển thị từ Position nếu có */}
                    {positions.length > 0 ? (
                        positions.map((position) => {
                            const RIcon =
                                position.authority === "MANAGER" ||
                                position.authority === "DIRECTOR" ||
                                position.authority === "EXECUTIVE"
                                    ? Crown
                                    : position.authority === "DEPUTY" ||
                                        position.authority === "TEAM_LEAD"
                                      ? Shield
                                      : Briefcase;
                            const mappedRole =
                                position.authority === "MANAGER" ||
                                position.authority === "DIRECTOR"
                                    ? "HEAD"
                                    : position.authority === "DEPUTY"
                                      ? "DEPUTY"
                                      : "MEMBER";

                            const isActive = position.id === employeePositionId;

                            return (
                                <DropdownMenuCheckboxItem
                                    key={position.id}
                                    checked={isActive}
                                    onCheckedChange={(checked) => {
                                        if (checked && mappedRole !== role) {
                                            handleSelect(mappedRole);
                                        }
                                        if (!checked && isActive) {
                                            handleSelect("MEMBER");
                                        }
                                    }}
                                >
                                    <RIcon className="size-3.5 shrink-0 mr-2" />
                                    <span className="flex flex-col">
                                        <span className="font-medium">
                                            {position.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {position.authority
                                                .toLowerCase()
                                                .replace("_", " ")}
                                        </span>
                                    </span>
                                </DropdownMenuCheckboxItem>
                            );
                        })
                    ) : (
                        /* Fallback: hiển thị roleOptions mặc định khi không có Position */
                        roleOptions.map((opt) => {
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
                                    <RIcon className="size-3.5 shrink-0 mr-2" />
                                    {opt.label}
                                </DropdownMenuCheckboxItem>
                            );
                        })
                    )}
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
                            {confirmTarget === "HEAD" ||
                            confirmTarget === "MANAGER"
                                ? "Xác nhận đặt Trưởng phòng"
                                : "Xác nhận đặt Phó phòng"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="flex flex-col">
                            <span>
                                Bạn có chắc muốn đặt{" "}
                                <strong>{employeeName}</strong> làm{" "}
                                {confirmTarget === "HEAD" ||
                                confirmTarget === "MANAGER"
                                    ? "Trưởng phòng"
                                    : "Phó phòng"}
                                ?
                            </span>
                            {confirmTarget === "HEAD" ||
                            confirmTarget === "MANAGER" ? (
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

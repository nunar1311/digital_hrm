"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Shield, Pencil, Trash2, Users, Eye, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AddRoleDialog } from "./add-role-dialog";
import {
    EditCustomRoleDialog,
    type CustomRoleData,
} from "./edit-custom-role-dialog";
import {
    getAllRoles,
    deleteRole,
} from "../preferences/actions";
import {
    getRoleBadgeColor,
    isFixedRole,
    type DBRole,
} from "./constants";
import { PERMISSION_DESCRIPTIONS } from "@/lib/rbac/db-permissions";

interface CustomRoleTableProps {
    canManage: boolean;
    dbRoles: DBRole[];
}

export function CustomRoleTable({ canManage, dbRoles }: CustomRoleTableProps) {
    const queryClient = useQueryClient();
    const [editRole, setEditRole] = useState<CustomRoleData | null>(null);
    const [deleteRoleData, setDeleteRoleData] =
        useState<CustomRoleData | null>(null);
    const [viewRole, setViewRole] = useState<DBRole | null>(null);

    const { data: allRoles, isLoading } = useQuery({
        queryKey: ["settings", "roles"],
        queryFn: getAllRoles,
        placeholderData: keepPreviousData,
    });

    const roles = (allRoles ?? dbRoles) as DBRole[];

    const deleteMutation = useMutation({
        mutationFn: deleteRole,
        onSuccess: () => {
            toast.success("Đã xóa vai trò thành công");
            setDeleteRoleData(null);
            queryClient.invalidateQueries({
                queryKey: ["settings", "roles"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || "Không thể xóa vai trò");
        },
    });

    const handleDelete = () => {
        if (!deleteRoleData) return;
        deleteMutation.mutate(deleteRoleData.id);
    };

    const customRoles: DBRole[] = roles.filter((r) => r.roleType === "CUSTOM");
    const fixedRoles: DBRole[] = roles.filter((r) => r.roleType === "FIXED");

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium">Danh sách vai trò</h3>
                    <p className="text-sm text-muted-foreground">
                        Tất cả vai trò trong hệ thống — cố định và tùy chỉnh
                    </p>
                </div>
                {canManage && <AddRoleDialog />}
            </div>

            {/* Fixed Roles Section */}
            {fixedRoles.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Vai trò cố định
                        </h4>
                        <Badge variant="outline" className="text-xs">
                            {fixedRoles.length}
                        </Badge>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Shield className="h-4 w-4" />
                                    </TableHead>
                                    <TableHead>Tên vai trò</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="text-center">
                                        Số quyền
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <Users className="h-4 w-4 inline-block" />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Thao tác
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fixedRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={getRoleBadgeColor(
                                                    role.key,
                                                    role.roleType,
                                                )}
                                            >
                                                <Lock className="h-3 w-3 mr-1" />
                                                FIX
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {role.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {role.key}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                            {role.description ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {role.permissions.length}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">
                                                {role.userCount ?? 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() =>
                                                                setViewRole(
                                                                    role,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Xem chi tiết
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Custom Roles Section */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Vai trò tùy chỉnh
                    </h4>
                    <Badge variant="outline" className="text-xs">
                        {customRoles.length}
                    </Badge>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Shield className="h-4 w-4" />
                                </TableHead>
                                <TableHead>Tên vai trò</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead className="text-center">
                                    Số quyền
                                </TableHead>
                                <TableHead className="text-center">
                                    <Users className="h-4 w-4 inline-block" />
                                </TableHead>
                                <TableHead className="text-right">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : customRoles.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield className="h-8 w-8 opacity-30" />
                                            <p>
                                                Chưa có vai trò tùy chỉnh nào.
                                            </p>
                                            {canManage && (
                                                <p className="text-xs">
                                                    Nhấn &quot;Thêm vai trò&quot; để
                                                    tạo vai trò mới.
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={getRoleBadgeColor(
                                                    role.key,
                                                    role.roleType,
                                                )}
                                            >
                                                <Shield className="h-3 w-3 mr-1" />
                                                CR
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {role.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Tạo:{" "}
                                                {new Date(
                                                    role.createdAt,
                                                ).toLocaleDateString("vi-VN")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                            {role.description ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {role.permissions.length}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    (role.userCount ?? 0) > 0
                                                        ? "default"
                                                        : "outline"
                                                }
                                            >
                                                {role.userCount ?? 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() =>
                                                                setViewRole(
                                                                    role,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Xem chi tiết
                                                    </TooltipContent>
                                                </Tooltip>

                                                {canManage && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() =>
                                                                        setEditRole(
                                                                            {
                                                                                id: role.id,
                                                                                name: role.name,
                                                                                description:
                                                                                    role.description,
                                                                                permissions:
                                                                                    role.permissions,
                                                                                userCount:
                                                                                    role.userCount ??
                                                                                    0,
                                                                                createdBy:
                                                                                    role.createdBy,
                                                                                createdAt:
                                                                                    role.createdAt,
                                                                                updatedAt:
                                                                                    role.updatedAt,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Chỉnh sửa
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        setDeleteRoleData(
                                                                            {
                                                                                id: role.id,
                                                                                name: role.name,
                                                                                description:
                                                                                    role.description,
                                                                                permissions:
                                                                                    role.permissions,
                                                                                userCount:
                                                                                    role.userCount ??
                                                                                    0,
                                                                                createdBy:
                                                                                    role.createdBy,
                                                                                createdAt:
                                                                                    role.createdAt,
                                                                                updatedAt:
                                                                                    role.updatedAt,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Xóa
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditCustomRoleDialog
                role={editRole}
                open={!!editRole}
                onOpenChange={(open) => !open && setEditRole(null)}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteRoleData}
                onOpenChange={(open) => !open && setDeleteRoleData(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa vai trò</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa vai trò &quot;
                            <strong>{deleteRoleData?.name}</strong>&quot;?
                            Hành động này không thể hoàn tác.
                            {deleteRoleData &&
                                (deleteRoleData.userCount ?? 0) > 0 && (
                                    <span className="block mt-2 text-orange-600">
                                        Cảnh báo: Vai trò này đang được gán cho{" "}
                                        {deleteRoleData.userCount} người dùng.
                                    </span>
                                )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending
                                ? "Đang xóa..."
                                : "Xóa vai trò"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Role Detail */}
            <Dialog
                open={!!viewRole}
                onOpenChange={(open) => !open && setViewRole(null)}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Chi tiết vai trò — {viewRole?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {(viewRole?.userCount ?? 0) > 0
                                ? `Đang gán cho ${viewRole?.userCount} người dùng — `
                                : ""}
                            {viewRole?.permissions.length ?? 0} quyền
                            {viewRole?.roleType === "FIXED" && (
                                <Badge
                                    variant="outline"
                                    className="ml-2 bg-red-50 text-red-700 border-red-200"
                                >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Vai trò cố định
                                </Badge>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {viewRole && (
                            <div className="space-y-3 pr-4">
                                {viewRole.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {viewRole.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {viewRole.permissions.map((perm) => (
                                        <Badge
                                            key={perm}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {PERMISSION_DESCRIPTIONS[perm] ??
                                                perm}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

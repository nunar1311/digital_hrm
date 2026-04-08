"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    useQuery,
    useQueryClient,
    useMutation,
    keepPreviousData,
} from "@tanstack/react-query";
import { Search, UserCog, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useSocketEvent } from "@/hooks/use-socket-event";
import {
    getUsersWithRoles,
    assignUserRole,
    removeUserRole,
} from "../preferences/actions";
import { EditRoleDialog } from "./edit-role-dialog";
import {
    getInitials,
    getRoleBadgeColor,
    type UsersPage,
    type DBRole,
} from "./constants";

interface UsersRoleTableProps {
    initialData: UsersPage;
    canManage: boolean;
    currentUserId: string;
    rolePermissionsMap: Record<string, string[]>;
    dbRoles: DBRole[];
}

export function UsersRoleTable({
    initialData,
    canManage,
    currentUserId,
    rolePermissionsMap,
    dbRoles,
}: UsersRoleTableProps) {
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [editDialog, setEditDialog] = useState<UsersPage["users"][number] | null>(null);
    const [assignDialog, setAssignDialog] = useState<UsersPage["users"][number] | null>(null);

    const pageSize = 20;

    const queryKey = [
        "settings",
        "users-roles",
        page,
        searchQuery,
        roleFilter,
    ];

    const { data: usersData, isFetching: isLoading } = useQuery<UsersPage>({
        queryKey,
        queryFn: async () => {
            const result = await getUsersWithRoles({
                page,
                pageSize,
                search: searchQuery || undefined,
                roleId: roleFilter === "all" ? undefined : roleFilter,
            });
            return JSON.parse(JSON.stringify(result)) as UsersPage;
        },
        initialData:
            page === 1 && !searchQuery && roleFilter === "all"
                ? initialData
                : undefined,
        placeholderData: keepPreviousData,
    });

    useSocketEvent("settings:role-updated", () => {
        queryClient.invalidateQueries({
            queryKey: ["settings", "users-roles"],
        });
    });

    const handleSearch = () => {
        setPage(1);
        setSearchQuery(search);
    };

    const handleRoleFilterChange = (val: string) => {
        setRoleFilter(val);
        setPage(1);
    };

    // Build role options from dbRoles + fixed roles
    const roleOptions = [
        ...dbRoles.map((r) => ({ key: r.key, name: r.name, roleType: r.roleType })),
    ];

    return (
        <>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("settingsRolesUsersSearchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        className="pl-9"
                    />
                </div>
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder={t("settingsRolesUsersAllRolesPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("settingsRolesUsersAllRolesPlaceholder")}</SelectItem>
                        {roleOptions.map((r) => (
                            <SelectItem key={r.key} value={r.key}>
                                {r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Người dùng</TableHead>
                            <TableHead>Mã NV</TableHead>
                            <TableHead>Vai trò hệ thống</TableHead>
                            <TableHead>Vai trò bổ sung</TableHead>
                            <TableHead className="w-32 text-right">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    Đang tải...
                                </TableCell>
                            </TableRow>
                        ) : !usersData || usersData.users.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    Không tìm thấy người dùng
                                </TableCell>
                            </TableRow>
                        ) : (
                            usersData.users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={user.image ?? undefined}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.employeeCode ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                getRoleBadgeColor(
                                                    user.hrmRole,
                                                ) + " mr-1"
                                            }
                                        >
                                            {user.hrmRole}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((r) => (
                                                    <Badge
                                                        key={r.id}
                                                        variant="outline"
                                                        className={getRoleBadgeColor(
                                                            r.key,
                                                            r.roleType,
                                                        )}
                                                    >
                                                        {r.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    Không có
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canManage && user.id !== currentUserId ? (
                                            <div className="flex items-center justify-end gap-1">
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() =>
                                                            setAssignDialog(
                                                                user,
                                                            )
                                                        }
                                                        title={t("settingsRolesUsersAssignRoleTitle")}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() =>
                                                        setEditDialog(user)
                                                    }
                                                >
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {usersData && usersData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Hiển thị{" "}
                        {(usersData.page - 1) * usersData.pageSize + 1}
                        –
                        {Math.min(
                            usersData.page * usersData.pageSize,
                            usersData.total,
                        )}{" "}
                        / {usersData.total} người dùng
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            ←
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            {page} / {usersData.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= usersData.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            →
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Role Dialog */}
            <EditRoleDialog
                user={editDialog}
                open={!!editDialog}
                onOpenChange={(open) => {
                    if (!open) setEditDialog(null);
                }}
                rolePermissionsMap={rolePermissionsMap}
            />

            {/* Assign Custom Role Dialog */}
            <AssignRoleDialog
                user={assignDialog}
                open={!!assignDialog}
                onOpenChange={(open) => {
                    if (!open) setAssignDialog(null);
                }}
                dbRoles={dbRoles}
            />
        </>
    );
}

// ─── Assign Role Dialog ───

interface AssignRoleDialogProps {
    user: UsersPage["users"][number] | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dbRoles: DBRole[];
}

function AssignRoleDialog({
    user,
    open,
    onOpenChange,
    dbRoles,
}: AssignRoleDialogProps) {
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");

    const assignMutation = useMutation({
        mutationFn: assignUserRole,
        onSuccess: () => {
            toast.success(
                t("settingsRolesUsersAssignSuccess", {
                    name: user?.name ?? "",
                }),
            );
            onOpenChange(false);
            setSelectedRoleId("");
            queryClient.invalidateQueries({
                queryKey: ["settings", "users-roles"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || t("settingsRolesUsersAssignError"));
        },
    });

    const removeMutation = useMutation({
        mutationFn: removeUserRole,
        onSuccess: () => {
            toast.success(
                t("settingsRolesUsersRemoveSuccess", {
                    name: user?.name ?? "",
                }),
            );
            onOpenChange(false);
            setSelectedRoleId("");
            queryClient.invalidateQueries({
                queryKey: ["settings", "users-roles"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || t("settingsRolesUsersRemoveError"));
        },
    });

    const availableRoles = dbRoles.filter((r) => r.roleType === "CUSTOM");
    const assignedRoleIds = new Set(user?.roles.map((r) => r.id) ?? []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gán vai trò bổ sung</DialogTitle>
                    <DialogDescription>
                        Gán thêm vai trò cho <strong>{user?.name}</strong>.
                        Người dùng có thể có nhiều vai trò bổ sung cùng lúc.
                    </DialogDescription>
                </DialogHeader>

                {availableRoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        Chưa có vai trò tùy chỉnh nào. Hãy tạo vai trò mới
                        trước.
                    </p>
                ) : (
                    <div className="space-y-3 py-4">
                        {/* Current roles */}
                        {user?.roles && user.roles.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">
                                    Vai trò hiện tại:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center gap-1"
                                        >
                                            <Badge
                                                variant="outline"
                                                className={getRoleBadgeColor(
                                                    r.key,
                                                    r.roleType,
                                                )}
                                            >
                                                {r.name} ({r.permissionCount}{" "}
                                                quyền)
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    removeMutation.mutate({
                                                        userId: user.id,
                                                        roleId: r.id,
                                                    })
                                                }
                                                disabled={
                                                    removeMutation.isPending
                                                }
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assign new role */}
                        <div>
                            <p className="text-sm font-medium mb-2">
                                Gán vai trò mới:
                            </p>
                            <Select
                                value={selectedRoleId}
                                onValueChange={setSelectedRoleId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("settingsRolesUsersSelectRolePlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((r) =>
                                        assignedRoleIds.has(r.id) ? null : (
                                            <SelectItem
                                                key={r.id}
                                                value={r.id}
                                            >
                                                <div>
                                                    <span>{r.name}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {r.permissions.length}{" "}
                                                        quyền
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        disabled={
                            !selectedRoleId || assignMutation.isPending
                        }
                        onClick={() => {
                            if (user && selectedRoleId) {
                                assignMutation.mutate({
                                    userId: user.id,
                                    roleId: selectedRoleId,
                                });
                            }
                        }}
                    >
                        {assignMutation.isPending
                            ? t("settingsRolesUsersAssigning")
                            : t("settingsRolesUsersAssignRoleButton")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

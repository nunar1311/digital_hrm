"use client";

import { useState } from "react";
import {
    useQuery,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { Search, UserCog } from "lucide-react";
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
import { useSocketEvent } from "@/hooks/use-socket-event";
import { getUsersWithRoles } from "../actions";
import { EditRoleDialog } from "./edit-role-dialog";
import {
    ROLE_LABELS,
    ROLE_COLORS,
    getInitials,
    type UserRow,
    type UsersPage,
} from "./constants";

interface UsersRoleTableProps {
    initialData: UsersPage;
    canManage: boolean;
    currentUserId: string;
    rolePermissionsMap: Record<string, string[]>;
}

export function UsersRoleTable({
    initialData,
    canManage,
    currentUserId,
    rolePermissionsMap,
}: UsersRoleTableProps) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [editDialog, setEditDialog] = useState<UserRow | null>(
        null,
    );

    const pageSize = 5;

    const queryKey = [
        "settings",
        "users-roles",
        page,
        searchQuery,
        roleFilter,
    ];

    const { data: usersData, isFetching: isLoading } =
        useQuery<UsersPage>({
            queryKey,
            queryFn: async () => {
                const result = await getUsersWithRoles({
                    page,
                    pageSize,
                    search: searchQuery || undefined,
                    role:
                        roleFilter === "all" ? undefined : roleFilter,
                });
                return JSON.parse(
                    JSON.stringify(result),
                ) as UsersPage;
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

    return (
        <>
            {/* Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto mb-4 p-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, email, mã NV..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={roleFilter}
                    onValueChange={handleRoleFilterChange}
                >
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Tất cả vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            Tất cả vai trò
                        </SelectItem>
                        {Object.entries(ROLE_LABELS).map(
                            ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ),
                        )}
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
                            <TableHead>Vai trò</TableHead>
                            <TableHead className="w-24 text-right">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    Đang tải...
                                </TableCell>
                            </TableRow>
                        ) : !usersData ||
                          usersData.users.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
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
                                                    src={
                                                        user.image ??
                                                        undefined
                                                    }
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(
                                                        user.name,
                                                    )}
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
                                                ROLE_COLORS[
                                                    user.hrmRole
                                                ] ?? ""
                                            }
                                        >
                                            {ROLE_LABELS[
                                                user.hrmRole
                                            ] ?? user.hrmRole}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canManage &&
                                        user.id !== currentUserId ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setEditDialog(
                                                        user,
                                                    )
                                                }
                                            >
                                                <UserCog className="h-4 w-4" />
                                            </Button>
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
                        {(usersData.page - 1) * usersData.pageSize +
                            1}
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
                            <span className="sr-only">
                                Trang trước
                            </span>
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
                            <span className="sr-only">Trang sau</span>
                            →
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── Edit Role Dialog ─── */}
            <EditRoleDialog
                user={editDialog}
                open={!!editDialog}
                onOpenChange={(open) => {
                    if (!open) setEditDialog(null);
                }}
                rolePermissionsMap={rolePermissionsMap}
            />
        </>
    );
}

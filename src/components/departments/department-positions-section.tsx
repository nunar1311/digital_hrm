"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPositions, deletePosition } from "@/app/(protected)/positions/actions";
import { getAuthorityTypes } from "@/app/(protected)/authority-types/actions";
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import type { PositionListItem } from "@/app/(protected)/positions/types";
import type { AuthorityTypeItem } from "@/app/(protected)/authority-types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    MoreHorizontal,
    Users,
    Loader2,
} from "lucide-react";

interface AuthorityColorConfig {
    bg: string;
    text: string;
    label: string;
}

const DEFAULT_AUTHORITY_COLORS: Record<string, AuthorityColorConfig> = {
    EXECUTIVE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-400", label: "HĐQT" },
    DIRECTOR: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-400", label: "Giám đốc" },
    MANAGER: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400", label: "Trưởng phòng" },
    DEPUTY: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-400", label: "Phó phòng" },
    TEAM_LEAD: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-400", label: "Tổ trưởng" },
    STAFF: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300", label: "Nhân viên" },
    INTERN: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400", label: "Thực tập sinh" },
};

function getAuthorityColorConfig(
    code: string,
    authorityTypes: AuthorityTypeItem[],
): AuthorityColorConfig {
    const dbAuth = authorityTypes.find((a) => a.code === code);
    if (dbAuth) {
        return {
            bg: dbAuth.bgColor ?? DEFAULT_AUTHORITY_COLORS[code]?.bg ?? "bg-gray-100 dark:bg-gray-800",
            text: dbAuth.textColor ?? DEFAULT_AUTHORITY_COLORS[code]?.text ?? "text-gray-800 dark:text-gray-300",
            label: dbAuth.name,
        };
    }
    return DEFAULT_AUTHORITY_COLORS[code] ?? {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-300",
        label: code,
    };
}

interface DepartmentPositionsSectionProps {
    departmentId: string;
    departmentName: string;
}

export function DepartmentPositionsSection({
    departmentId,
    departmentName,
}: DepartmentPositionsSectionProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editData, setEditData] = useState<PositionListItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PositionListItem | null>(null);

    // Fetch authority types from database for dynamic colors
    const { data: authorityTypes = [] } = useQuery({
        queryKey: ["authority-types"],
        queryFn: () => getAuthorityTypes(),
    });

    const { data, isLoading } = useQuery({
        queryKey: ["department-positions", departmentId, search],
        queryFn: () =>
            getPositions({
                page: 1,
                pageSize: 100,
                departmentId,
                search: search || undefined,
                status: "ALL",
            }),
    });

    const positions = data?.positions ?? [];

    const deleteMutation = useMutation({
        mutationFn: deletePosition,
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Xóa chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["department-positions", departmentId],
                });
            } else {
                toast.error(result.error || "Đã xảy ra lỗi");
            }
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error("Đã xảy ra lỗi khi xóa chức vụ");
            setDeleteTarget(null);
        },
    });

    const handleEdit = (position: PositionListItem) => {
        setEditData(position);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setEditData(null);
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditData(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header với search và nút thêm */}
            <div className="flex items-center gap-2 px-2 py-2 border-b shrink-0">
                <div className="relative flex items-center flex-1 max-w-xs">
                    <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm chức vụ..."
                        className="h-7 pl-7 text-xs"
                    />
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                    {positions.length} chức vụ
                </span>
                <Button size={"xs"} onClick={handleAdd}>
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm chức vụ
                </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-7 px-2 w-[120px]">Mã</TableHead>
                            <TableHead className="h-7 px-2">Tên chức vụ</TableHead>
                            <TableHead className="h-7 px-2 w-[100px]">Cấp bậc</TableHead>
                            <TableHead className="h-7 px-2 w-[130px]">Quyền hạn</TableHead>
                            <TableHead className="h-7 px-2 w-[80px] text-center">Số NV</TableHead>
                            <TableHead className="h-7 px-2 w-[120px]">Người giữ</TableHead>
                            <TableHead className="h-7 px-2 w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="p-2"><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-4 w-8" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-4 w-6" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                                    <TableCell className="p-2"><Skeleton className="h-6 w-6" /></TableCell>
                                </TableRow>
                            ))
                        ) : positions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Users className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Không tìm thấy chức vụ nào</p>
                                        {search && (
                                            <Button variant="link" size="sm" onClick={() => setSearch("")}>
                                                Xóa tìm kiếm
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            positions.map((position) => {
                                const authorityConfig = getAuthorityColorConfig(position.authority, authorityTypes);
                                return (
                                    <TableRow key={position.id} className="group/row">
                                        <TableCell className="p-2">
                                            <span className="font-medium text-muted-foreground text-xs">
                                                {position.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <span className="font-medium">{position.name}</span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <span className="text-xs text-muted-foreground">
                                                Cấp {position.level}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Badge
                                                className={`${authorityConfig.bg} ${authorityConfig.text} text-xs font-normal`}
                                                variant="secondary"
                                            >
                                                {authorityConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-2 text-center">
                                            <span className="text-xs font-medium">
                                                {position.userCount}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <span className="text-xs text-muted-foreground truncate max-w-[100px] block">
                                                {position.parentName || "---"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size={"icon-xs"}
                                                        className="opacity-0 group-hover/row:opacity-100 transition-opacity h-6 w-6"
                                                    >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(position)}>
                                                        <Pencil className="h-3 w-3 mr-2" />
                                                        Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteTarget(position)}
                                                        className="text-destructive focus:text-destructive"
                                                        disabled={position.userCount > 0}
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa chức vụ</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa chức vụ{" "}
                            <strong>{deleteTarget?.name}</strong> không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Position Form Dialog */}
            <PositionFormDialog
                open={formOpen}
                onClose={handleFormClose}
                editData={editData}
            />
        </div>
    );
}

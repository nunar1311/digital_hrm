"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertTriangle,
    Loader2,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deletePosition } from "@/app/(protected)/positions/actions";

export interface DeletePositionDialogProps {
    positionId: string;
    positionName: string;
    userCount: number;
    departmentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeletePositionDialog({
    positionId,
    positionName,
    userCount,
    departmentId,
    open,
    onOpenChange,
}: DeletePositionDialogProps) {
    const queryClient = useQueryClient();
    const hasUsers = userCount > 0;

    const deleteMutation = useMutation({
        mutationFn: deletePosition,
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Xóa chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["positions", "department", departmentId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["departments", departmentId],
                });
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        },
        onError: () => {
            toast.error("Đã xảy ra lỗi khi xóa chức vụ");
        },
    });

    const handleDelete = () => {
        if (hasUsers) return;
        deleteMutation.mutate(positionId);
    };

    const isLoading = deleteMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Xóa chức vụ
                    </DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa chức vụ{" "}
                        <span className="font-semibold text-foreground">
                            {positionName}
                        </span>{" "}
                        không?
                    </DialogDescription>
                </DialogHeader>

                {hasUsers && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-destructive">
                                Không thể xóa chức vụ này
                            </p>
                            <p className="text-muted-foreground mt-1">
                                Đang có{" "}
                                <span className="font-semibold">
                                    {userCount} nhân viên
                                </span>{" "}
                                giữ chức vụ này. Vui lòng chuyển nhân viên
                                sang chức vụ khác trước khi xóa.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading || hasUsers}
                    >
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Xóa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

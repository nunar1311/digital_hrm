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
import { deletePosition } from "@/app/[locale]/(protected)/positions/actions";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ProtectedPages");
    const hasUsers = userCount > 0;

    const deleteMutation = useMutation({
        mutationFn: deletePosition,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["positions", "department", departmentId] });
            await queryClient.cancelQueries({ queryKey: ["departments", departmentId] });
            onOpenChange(false);
            return {};
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(t("departmentEmployeesToastDeletePositionSuccess"));
            } else {
                toast.error(result.error);
                queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
                queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
            }
        },
        onError: () => {
            toast.error(t("departmentEmployeesToastDeletePositionError"));
            queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
            queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
            queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
        }
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
                        {t("departmentEmployeesDeletePositionConfirmTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("departmentEmployeesDeletePositionConfirmPrefix")} {" "}
                        <span className="font-semibold text-foreground">
                            {positionName}
                        </span>{" "}
                        {t("departmentEmployeesDeleteConfirmSuffix")}
                    </DialogDescription>
                </DialogHeader>

                {hasUsers && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-destructive">
                                {t("positionsDeleteConfirmTitle")}
                            </p>
                            <p className="text-muted-foreground mt-1">
                                {t("departmentEmployeesPositionInUsePrefix")} {" "}
                                <span className="font-semibold">
                                    {userCount} {t("employee")}
                                </span>{" "}
                                {t("departmentEmployeesPositionInUseSuffix")}
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
                        {t("departmentEmployeesCancel")}
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
                        {t("departmentEmployeesDelete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


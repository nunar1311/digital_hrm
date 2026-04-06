"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "../preferences/actions";
import { ROLE_LABELS, ROLE_COLORS } from "./constants";

// ─── Types ───

interface EditRoleDialogProps {
    user: {
        id: string;
        name: string;
        email: string;
        hrmRole: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rolePermissionsMap: Record<string, string[]>;
}

// ─── Schema ───

const editRoleSchema = z.object({
    role: z.string().min(1, "Vui lòng chọn vai trò"),
});

type EditRoleFormValues = z.infer<typeof editRoleSchema>;

// ─── Component ───

export function EditRoleDialog({
    user,
    open,
    onOpenChange,
    rolePermissionsMap,
}: EditRoleDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<EditRoleFormValues>({
        resolver: zodResolver(editRoleSchema),
        defaultValues: {
            role: user?.hrmRole ?? "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({ role: user.hrmRole });
        }
    }, [user, form]);

    const updateRoleMutation = useMutation({
        mutationFn: updateUserRole,
        onSuccess: (_data, variables) => {
            toast.success(
                `Đã cập nhật vai trò của ${user?.name} thành ${ROLE_LABELS[variables.newRole] ?? variables.newRole}`,
            );
            onOpenChange(false);
            queryClient.invalidateQueries({
                queryKey: ["settings", "users-roles"],
            });
        },
        onError: (err) => {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật vai trò",
            );
        },
    });

    const onSubmit = (values: EditRoleFormValues) => {
        if (!user) return;
        updateRoleMutation.mutate({
            userId: user.id,
            newRole: values.role,
        });
    };

    const selectedRole = useWatch({
        control: form.control,
        name: "role",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Thay đổi vai trò</DialogTitle>
                    <DialogDescription>
                        Thay đổi vai trò cho{" "}
                        <strong>{user?.name}</strong> ({user?.email})
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 py-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="space-y-2 w-[50%]">
                                <p className="text-sm font-medium">
                                    Vai trò hiện tại
                                </p>
                                <Badge
                                    variant="secondary"
                                    className={
                                        ROLE_COLORS[
                                            user?.hrmRole ?? ""
                                        ] ?? ""
                                    }
                                >
                                    {ROLE_LABELS[
                                        user?.hrmRole ?? ""
                                    ] ?? user?.hrmRole}
                                </Badge>
                            </div>

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="w-[50%]">
                                        <FormLabel>
                                            Vai trò mới
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={
                                                    field.onChange
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Chọn vai trò" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(
                                                        ROLE_LABELS,
                                                    ).map(
                                                        ([
                                                            key,
                                                            label,
                                                        ]) => (
                                                            <SelectItem
                                                                key={
                                                                    key
                                                                }
                                                                value={
                                                                    key
                                                                }
                                                            >
                                                                {
                                                                    label
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedRole &&
                            selectedRole !== user?.hrmRole && (
                                <div className="rounded-md bg-muted p-3">
                                    <p className="mb-1 text-sm font-medium">
                                        Quyền hạn sau khi đổi:
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {rolePermissionsMap[
                                            selectedRole
                                        ]?.length ?? 0}{" "}
                                        quyền
                                    </p>
                                </div>
                            )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    updateRoleMutation.isPending ||
                                    selectedRole === user?.hrmRole
                                }
                            >
                                {updateRoleMutation.isPending
                                    ? "Đang lưu..."
                                    : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

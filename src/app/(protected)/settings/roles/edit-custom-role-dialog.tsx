"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RolePermissionSelector } from "./role-permission-selector";
import { updateRole } from "../preferences/actions";

// ─── Types ───

export interface CustomRoleData {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    userCount: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Schema ───

const editRoleSchema = z.object({
    name: z
        .string()
        .min(2, "Tên vai trò phải có ít nhất 2 ký tự")
        .max(100, "Tên vai trò không được quá 100 ký tự")
        .optional(),
    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),
    permissions: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
});

type EditRoleFormValues = z.infer<typeof editRoleSchema>;

// ─── Component ───

interface EditCustomRoleDialogProps {
    role: CustomRoleData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCustomRoleDialog({
    role,
    open,
    onOpenChange,
}: EditCustomRoleDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<EditRoleFormValues>({
        resolver: zodResolver(editRoleSchema),
        defaultValues: {
            name: role?.name ?? "",
            description: role?.description ?? "",
            permissions: role?.permissions ?? [],
        },
    });

    // Reset form khi role thay đổi
    useEffect(() => {
        if (role) {
            form.reset({
                name: role.name,
                description: role.description ?? "",
                permissions: role.permissions,
            });
        }
    }, [role, form]);

    const updateMutation = useMutation({
        mutationFn: updateRole,
        onSuccess: () => {
            toast.success("Đã cập nhật vai trò thành công");
            onOpenChange(false);
            queryClient.invalidateQueries({
                queryKey: ["settings", "roles"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || "Không thể cập nhật vai trò");
        },
    });

    const onSubmit = (values: EditRoleFormValues) => {
        if (!role) return;
        updateMutation.mutate({
            id: role.id,
            name: values.name,
            description: values.description,
            permissions: values.permissions,
        });
    };

    const selectedPermissions = form.watch("permissions");
    const originalPermissions = role?.permissions ?? [];
    const permChanged =
        JSON.stringify([...selectedPermissions].sort()) !==
        JSON.stringify([...originalPermissions].sort());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa vai trò</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin và quyền hạn cho vai trò{" "}
                        <strong>{role?.name}</strong>
                        {(role?.userCount ?? 0) > 0 && (
                            <span className="text-orange-600">
                                {" "}
                                (đang gán cho {role?.userCount} người dùng)
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 flex-1 min-h-0"
                    >
                        {/* Name & Description */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên vai trò</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Tên vai trò"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Mô tả ngắn về vai trò"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Permission Selector */}
                        <div className="flex-1 min-h-0">
                            <FormField
                                control={form.control}
                                name="permissions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phân quyền</FormLabel>
                                        <FormDescription className="mb-2">
                                            Chọn các quyền mà vai trò này được
                                            phép thực hiện.
                                        </FormDescription>
                                        <FormControl>
                                            <RolePermissionSelector
                                                selectedPermissions={
                                                    field.value ?? []
                                                }
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Preview changes */}
                        {permChanged && (
                            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Đã thay đổi{" "}
                                    <strong>
                                        {selectedPermissions.length -
                                            originalPermissions.filter((p) =>
                                            selectedPermissions.includes(p),
                                        ).length >
                                        0
                                            ? selectedPermissions.length -
                                              originalPermissions.filter(
                                                  (p) =>
                                                      selectedPermissions.includes(
                                                          p,
                                                      ),
                                              ).length
                                            : originalPermissions.length -
                                              selectedPermissions.filter((p) =>
                                                  originalPermissions.includes(p),
                                              ).length}
                                    </strong>{" "}
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
                                    updateMutation.isPending ||
                                    (!permChanged &&
                                        form.getValues("name") ===
                                            role?.name &&
                                        form.getValues("description") ===
                                            role?.description)
                                }
                            >
                                {updateMutation.isPending
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

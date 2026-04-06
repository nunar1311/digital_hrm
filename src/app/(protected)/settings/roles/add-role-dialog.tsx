"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RolePermissionSelector } from "./role-permission-selector";
import { createRole } from "../preferences/actions";

// ─── Schema ───

const addRoleSchema = z.object({
    name: z
        .string()
        .min(2, "Tên vai trò phải có ít nhất 2 ký tự")
        .max(100, "Tên vai trò không được quá 100 ký tự"),
    description: z
        .string()
        .max(255, "Mô tả không được quá 255 ký tự")
        .optional(),
    permissions: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
});

type AddRoleFormValues = z.infer<typeof addRoleSchema>;

// ─── Component ───

interface AddRoleDialogProps {
    onSuccess?: () => void;
}

export function AddRoleDialog({ onSuccess }: AddRoleDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<AddRoleFormValues>({
        resolver: zodResolver(addRoleSchema),
        defaultValues: {
            name: "",
            description: "",
            permissions: [],
        },
    });

    const createMutation = useMutation({
        mutationFn: createRole,
        onSuccess: () => {
            toast.success("Đã tạo vai trò mới thành công");
            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({
                queryKey: ["settings", "roles"],
            });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Không thể tạo vai trò");
        },
    });

    const onSubmit = (values: AddRoleFormValues) => {
        createMutation.mutate({
            name: values.name,
            description: values.description,
            permissions: values.permissions,
        });
    };

    const selectedPermissions = form.watch("permissions");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4" />
                    Thêm vai trò
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Tạo vai trò mới</DialogTitle>
                    <DialogDescription>
                        Đặt tên, mô tả và chọn các quyền cho vai trò mới.
                        Vai trò này có thể gán cho nhân viên trong tab Admin.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 flex-1 min-h-0"
                    >
                        {/* Step 1: Name & Description */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tên vai trò{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Nhân viên kinh doanh"
                                                {...field}
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
                                                placeholder="Mô tả ngắn về vai trò này"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Step 2: Permission Selector */}
                        <div className="flex-1 min-h-0">
                            <FormField
                                control={form.control}
                                name="permissions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Phân quyền{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FormLabel>
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    createMutation.isPending ||
                                    selectedPermissions.length === 0
                                }
                            >
                                {createMutation.isPending
                                    ? "Đang tạo..."
                                    : "Tạo vai trò"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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

type EditRoleFormValues = {
    name?: string;
    description?: string;
    permissions: string[];
};

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
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();

    const editRoleSchema = useMemo(
        () =>
            z.object({
                name: z
                    .string()
                    .min(2, t("settingsRolesAddValidationNameMin"))
                    .max(100, t("settingsRolesAddValidationNameMax"))
                    .optional(),
                description: z
                    .string()
                    .max(255, t("settingsRolesAddValidationDescriptionMax"))
                    .optional(),
                permissions: z
                    .array(z.string())
                    .min(1, t("settingsRolesAddValidationPermissionsMin")),
            }),
        [t],
    );

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
            toast.success(t("settingsRolesEditToastUpdateSuccess"));
            onOpenChange(false);
            queryClient.invalidateQueries({
                queryKey: ["settings", "roles"],
            });
        },
        onError: (err: Error) => {
            toast.error(err.message || t("settingsRolesEditToastUpdateError"));
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
                    <DialogTitle>{t("settingsRolesEditDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin và quyền hạn cho vai trò{" "}
                        <strong>{role?.name}</strong>
                        {(role?.userCount ?? 0) > 0 && (
                            <span className="text-orange-600">
                                {" "}
                                {t("settingsRolesEditAssignedUsers", {
                                    count: role?.userCount ?? 0,
                                })}
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
                                        <FormLabel>{t("settingsRolesAddNameLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settingsRolesEditNamePlaceholder")}
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
                                        <FormLabel>{t("settingsRolesAddDescriptionLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settingsRolesEditDescriptionPlaceholder")}
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
                                        <FormLabel>{t("settingsRolesAddPermissionsLabel")}</FormLabel>
                                        <FormDescription className="mb-2">
                                            {t("settingsRolesEditPermissionsDescription")}
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
                                    {t("settingsRolesEditChangedPrefix")} {" "}
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
                                    {t("settingsRolesEditChangedSuffix")}
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("settingsRolesAddCancel")}
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
                                    ? t("settingsRolesEditSaving")
                                    : t("settingsRolesEditSaveChanges")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

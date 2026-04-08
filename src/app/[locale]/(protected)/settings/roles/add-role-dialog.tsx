"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { RolePermissionSelector } from "./role-permission-selector";
import { createRole } from "../preferences/actions";

// ─── Schema ───

type AddRoleFormValues = {
    name: string;
    description?: string;
    permissions: string[];
};

// ─── Component ───

interface AddRoleDialogProps {
    onSuccess?: () => void;
}

export function AddRoleDialog({ onSuccess }: AddRoleDialogProps) {
    const t = useTranslations("ProtectedPages");
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const addRoleSchema = useMemo(
        () =>
            z.object({
                name: z
                    .string()
                    .min(2, t("settingsRolesAddValidationNameMin"))
                    .max(100, t("settingsRolesAddValidationNameMax")),
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
            toast.success(t("settingsRolesAddToastCreateSuccess"));
            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({
                queryKey: ["settings", "roles"],
            });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast.error(err.message || t("settingsRolesAddToastCreateError"));
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
                    {t("settingsRolesAddTrigger")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("settingsRolesAddDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("settingsRolesAddDialogDescription")}
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
                                            {t("settingsRolesAddNameLabel")} {" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settingsRolesAddNamePlaceholder")}
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
                                        <FormLabel>{t("settingsRolesAddDescriptionLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settingsRolesAddDescriptionPlaceholder")}
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
                                            {t("settingsRolesAddPermissionsLabel")} {" "}
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
                                {t("settingsRolesAddCancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    createMutation.isPending ||
                                    selectedPermissions.length === 0
                                }
                            >
                                {createMutation.isPending
                                    ? t("settingsRolesAddCreating")
                                    : t("settingsRolesAddSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

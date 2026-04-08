"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Monitor, Plus, Trash2, Pencil, Loader2 } from "lucide-react";

import {
    createTimekeeperDevice,
    updateTimekeeperDevice,
    deleteTimekeeperDevice,
} from "@/app/[locale]/(protected)/attendance/actions";
import type { TimekeeperDevice } from "@/app/[locale]/(protected)/attendance/types";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const DEVICE_TYPES = ["FINGERPRINT", "FACE_ID", "CARD", "QR"] as const;

function createDeviceSchema(t: ReturnType<typeof useTranslations>) {
    return z.object({
        name: z
            .string()
            .min(1, t("attendanceDevicesTabValidationNameRequired")),
        code: z
            .string()
            .min(1, t("attendanceDevicesTabValidationCodeRequired")),
        type: z.enum(DEVICE_TYPES),
        location: z.string().optional(),
        ipAddress: z.string().optional(),
        apiKey: z.string().optional(),
    });
}

type DeviceFormValues = z.infer<ReturnType<typeof createDeviceSchema>>;

function getDeviceTypeLabel(
    type: TimekeeperDevice["type"],
    t: ReturnType<typeof useTranslations>,
): string {
    switch (type) {
        case "FINGERPRINT":
            return t("attendanceDevicesTabTypeFINGERPRINT");
        case "FACE_ID":
            return t("attendanceDevicesTabTypeFACE_ID");
        case "CARD":
            return t("attendanceDevicesTabTypeCARD");
        case "QR":
            return t("attendanceDevicesTabTypeQR");
        default:
            return type;
    }
}

interface Props {
    devices: TimekeeperDevice[];
    queryClient: ReturnType<typeof useQueryClient>;
}

export function DevicesTab({ devices, queryClient }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editDevice, setEditDevice] =
        useState<TimekeeperDevice | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const t = useTranslations("ProtectedPages");
    const deviceSchema = createDeviceSchema(t);

    const form = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema),
        defaultValues: {
            name: "",
            code: "",
            type: "FINGERPRINT",
            location: "",
            ipAddress: "",
            apiKey: "",
        },
    });

    const openCreate = () => {
        form.reset({
            name: "",
            code: "",
            type: "FINGERPRINT",
            location: "",
            ipAddress: "",
            apiKey: "",
        });
        setEditDevice(null);
        setShowDialog(true);
    };

    const openEdit = (d: TimekeeperDevice) => {
        form.reset({
            name: d.name,
            code: d.code,
            type: d.type as DeviceFormValues["type"],
            location: d.location ?? "",
            ipAddress: d.ipAddress ?? "",
            apiKey: d.apiKey ?? "",
        });
        setEditDevice(d);
        setShowDialog(true);
    };

    const createMutation = useMutation({
        mutationFn: (values: DeviceFormValues) =>
            createTimekeeperDevice({
                name: values.name,
                code: values.code,
                type: values.type,
                location: values.location || undefined,
                ipAddress: values.ipAddress || undefined,
                apiKey: values.apiKey || undefined,
            }),
        onMutate: async (values) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "devices"] });
            const optimisticDevice: TimekeeperDevice = {
                id: `optimistic-${Date.now()}`,
                name: values.name,
                code: values.code,
                type: values.type,
                location: values.location || null,
                ipAddress: values.ipAddress || null,
                apiKey: values.apiKey || null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            queryClient.setQueryData<TimekeeperDevice[]>(
                ["attendance", "devices"],
                (old) => {
                    if (!old) return [optimisticDevice];
                    return [...old, optimisticDevice];
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceDevicesTabToastCreateSuccess"));
            setShowDialog(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceDevicesTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "devices"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "devices"],
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (values: DeviceFormValues) => {
            if (!editDevice) throw new Error("No device");
            return updateTimekeeperDevice(editDevice.id, {
                name: values.name,
                type: values.type,
                location: values.location || undefined,
                ipAddress: values.ipAddress || undefined,
                apiKey: values.apiKey || undefined,
            });
        },
        onMutate: async (values) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "devices"] });
            if (!editDevice) return;
            queryClient.setQueryData<TimekeeperDevice[]>(
                ["attendance", "devices"],
                (old) => {
                    if (!old) return old;
                    return old.map((d) =>
                        d.id === editDevice.id
                            ? {
                                  ...d,
                                  ...values,
                                  location: values.location || null,
                                  ipAddress: values.ipAddress || null,
                                  apiKey: values.apiKey || null,
                              }
                            : d,
                    );
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceDevicesTabToastUpdateSuccess"));
            setShowDialog(false);
            setEditDevice(null);
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceDevicesTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "devices"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "devices"],
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTimekeeperDevice(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "devices"] });
            queryClient.setQueryData<TimekeeperDevice[]>(
                ["attendance", "devices"],
                (old) => {
                    if (!old) return old;
                    return old.filter((d) => d.id !== id);
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceDevicesTabToastDeleteSuccess"));
            setDeleteId(null);
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceDevicesTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "devices"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "devices"],
            });
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({
            id,
            isActive,
        }: {
            id: string;
            isActive: boolean;
        }) => updateTimekeeperDevice(id, { isActive }),
        onMutate: async ({ id, isActive }) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "devices"] });
            queryClient.setQueryData<TimekeeperDevice[]>(
                ["attendance", "devices"],
                (old) => {
                    if (!old) return old;
                    return old.map((d) =>
                        d.id === id ? { ...d, isActive } : d,
                    );
                },
            );
            return {};
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceDevicesTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "devices"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "devices"],
            });
        }
    });

    const isSaving =
        createMutation.isPending || updateMutation.isPending;

    const onSubmit = (values: DeviceFormValues) => {
        if (editDevice) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        {t("attendanceDevicesTabTitle")}
                    </CardTitle>
                    <CardDescription>
                        {t("attendanceDevicesTabDescription")}
                    </CardDescription>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("attendanceDevicesTabAdd")}
                </Button>
            </CardHeader>
            <CardContent>
                {devices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        {t("attendanceDevicesTabEmpty")}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {devices.map((d) => (
                            <div
                                key={d.id}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">
                                                {d.name}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {d.code}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {getDeviceTypeLabel(d.type, t)}
                                            {d.location && ` · ${d.location}`}
                                            {d.ipAddress &&
                                                ` · ${d.ipAddress}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={d.isActive}
                                        onCheckedChange={(v) =>
                                            toggleMutation.mutate({
                                                id: d.id,
                                                isActive: v,
                                            })
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(d)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setDeleteId(d.id)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog
                open={showDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDialog(false);
                        setEditDevice(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editDevice
                                ? t("attendanceDevicesTabDialogTitleEdit")
                                : t("attendanceDevicesTabDialogTitleCreate")}
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("attendanceDevicesTabNameLabel")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t(
                                                        "attendanceDevicesTabNamePlaceholder",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("attendanceDevicesTabCodeLabel")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t(
                                                        "attendanceDevicesTabCodePlaceholder",
                                                    )}
                                                    disabled={
                                                        !!editDevice
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceDevicesTabTypeLabel")}
                                        </FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={
                                                field.onChange
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FINGERPRINT">
                                                    {t("attendanceDevicesTabTypeFINGERPRINT")}
                                                </SelectItem>
                                                <SelectItem value="FACE_ID">
                                                    {t("attendanceDevicesTabTypeFACE_ID")}
                                                </SelectItem>
                                                <SelectItem value="CARD">
                                                    {t("attendanceDevicesTabTypeCARD")}
                                                </SelectItem>
                                                <SelectItem value="QR">
                                                    {t("attendanceDevicesTabTypeQR")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceDevicesTabLocationLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "attendanceDevicesTabLocationPlaceholder",
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ipAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("attendanceDevicesTabIpLabel")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="192.168.1.100"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                API Key
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
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
                                    onClick={() => {
                                        setShowDialog(false);
                                        setEditDevice(null);
                                    }}
                                >
                                    {t("attendanceDevicesTabCancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editDevice
                                        ? t("attendanceDevicesTabSubmitUpdate")
                                        : t("attendanceDevicesTabSubmitCreate")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("attendanceDevicesTabDeleteTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("attendanceDevicesTabDeleteDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t("attendanceDevicesTabCancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deleteId &&
                                deleteMutation.mutate(deleteId)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t("attendanceDevicesTabDeleteConfirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}


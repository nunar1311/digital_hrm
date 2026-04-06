"use client";

import { useState } from "react";
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
} from "@/app/(protected)/attendance/actions";
import type { TimekeeperDevice } from "@/app/(protected)/attendance/types";

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

const DEVICE_TYPE_LABELS: Record<string, string> = {
    FINGERPRINT: "Vân tay",
    FACE_ID: "Nhận diện khuôn mặt",
    CARD: "Thẻ từ",
    QR: "Mã QR",
};

const deviceSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên thiết bị"),
    code: z.string().min(1, "Vui lòng nhập mã thiết bị"),
    type: z.enum(["FINGERPRINT", "FACE_ID", "CARD", "QR"]),
    location: z.string().optional(),
    ipAddress: z.string().optional(),
    apiKey: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

interface Props {
    devices: TimekeeperDevice[];
    queryClient: ReturnType<typeof useQueryClient>;
}

export function DevicesTab({ devices, queryClient }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editDevice, setEditDevice] =
        useState<TimekeeperDevice | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            const optimisticDevice = {
                id: `optimistic-${Date.now()}`,
                ...values,
                location: values.location || null,
                ipAddress: values.ipAddress || null,
                apiKey: values.apiKey || null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            queryClient.setQueryData(["attendance", "devices"], (old: any) => {
                if (!old) return [optimisticDevice];
                return [...old, optimisticDevice];
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã thêm thiết bị");
            setShowDialog(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
            queryClient.setQueryData(["attendance", "devices"], (old: any) => {
                if (!old) return old;
                return old.map((d: any) => d.id === editDevice.id ? { ...d, ...values, location: values.location || null, ipAddress: values.ipAddress || null, apiKey: values.apiKey || null } : d);
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã cập nhật thiết bị");
            setShowDialog(false);
            setEditDevice(null);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
            queryClient.setQueryData(["attendance", "devices"], (old: any) => {
                if (!old) return old;
                return old.filter((d: any) => d.id !== id);
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã xoá thiết bị");
            setDeleteId(null);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
            queryClient.setQueryData(["attendance", "devices"], (old: any) => {
                if (!old) return old;
                return old.map((d: any) => d.id === id ? { ...d, isActive } : d);
            });
            return {};
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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
                        Thiết bị chấm công
                    </CardTitle>
                    <CardDescription>
                        Quản lý máy chấm công vân tay, nhận diện khuôn
                        mặt, thẻ từ
                    </CardDescription>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm thiết bị
                </Button>
            </CardHeader>
            <CardContent>
                {devices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Chưa có thiết bị nào
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
                                            {DEVICE_TYPE_LABELS[
                                                d.type
                                            ] ?? d.type}
                                            {d.location &&
                                                ` · ${d.location}`}
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
                                ? "Chỉnh sửa thiết bị"
                                : "Thêm thiết bị"}
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
                                                Tên thiết bị
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="VD: Máy vân tay tầng 1"
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
                                                Mã thiết bị
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="VD: FP-001"
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
                                            Loại thiết bị
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
                                                    Vân tay
                                                </SelectItem>
                                                <SelectItem value="FACE_ID">
                                                    Nhận diện khuôn
                                                    mặt
                                                </SelectItem>
                                                <SelectItem value="CARD">
                                                    Thẻ từ
                                                </SelectItem>
                                                <SelectItem value="QR">
                                                    Mã QR
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
                                            Vị trí lắp đặt
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Sảnh tầng 1"
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
                                                Địa chỉ IP
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
                                    Huỷ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editDevice ? "Cập nhật" : "Thêm"}
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
                            Xoá thiết bị?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Thiết bị sẽ bị xoá khỏi hệ thống. Dữ liệu
                            chấm công liên quan sẽ không bị ảnh hưởng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deleteId &&
                                deleteMutation.mutate(deleteId)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xoá
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

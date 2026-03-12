"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Pencil, Loader2, Star } from "lucide-react";

import {
    createShift,
    updateShift,
    deleteShift,
} from "@/app/(protected)/attendance/actions";
import type { Shift } from "@/app/(protected)/attendance/types";

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

// ─── Schema ───

const shiftFormSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên ca"),
    code: z.string().min(1, "Vui lòng nhập mã ca"),
    startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
    breakMinutes: z.number().min(0),
    lateThreshold: z.number().min(0),
    earlyThreshold: z.number().min(0),
    isDefault: z.boolean(),
    isActive: z.boolean(),
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

function computeWorkHours(
    startTime: string,
    endTime: string,
    breakMinutes: number,
): string | null {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    let totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes -= breakMinutes;
    if (totalMinutes <= 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h${minutes}p` : `${hours}h`;
}

// ─── Component ───

interface Props {
    shifts: Shift[];
    queryClient: ReturnType<typeof useQueryClient>;
}

export function ShiftsTab({ shifts, queryClient }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editShift, setEditShift] = useState<Shift | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<ShiftFormValues>({
        resolver: zodResolver(shiftFormSchema),
        defaultValues: {
            name: "",
            code: "",
            startTime: "08:00",
            endTime: "17:00",
            breakMinutes: 60,
            lateThreshold: 15,
            earlyThreshold: 15,
            isDefault: false,
            isActive: true,
        },
    });

    const watchStart = form.watch("startTime");
    const watchEnd = form.watch("endTime");
    const watchBreak = form.watch("breakMinutes");

    const workHoursPreview = useMemo(
        () => computeWorkHours(watchStart, watchEnd, watchBreak),
        [watchStart, watchEnd, watchBreak],
    );

    const openCreate = () => {
        form.reset({
            name: "",
            code: "",
            startTime: "08:00",
            endTime: "17:00",
            breakMinutes: 60,
            lateThreshold: 15,
            earlyThreshold: 15,
            isDefault: false,
            isActive: true,
        });
        setEditShift(null);
        setShowDialog(true);
    };

    const openEdit = (s: Shift) => {
        form.reset({
            name: s.name,
            code: s.code,
            startTime: s.startTime,
            endTime: s.endTime,
            breakMinutes: s.breakMinutes,
            lateThreshold: s.lateThreshold,
            earlyThreshold: s.earlyThreshold,
            isDefault: s.isDefault,
            isActive: s.isActive,
        });
        setEditShift(s);
        setShowDialog(true);
    };

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: ["attendance", "shifts"],
        });

    const createMutation = useMutation({
        mutationFn: (values: ShiftFormValues) => createShift(values),
        onSuccess: () => {
            toast.success("Đã thêm ca làm việc");
            setShowDialog(false);
            invalidate();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const updateMutation = useMutation({
        mutationFn: (values: ShiftFormValues) => {
            if (!editShift) throw new Error("No shift");
            return updateShift(editShift.id, values);
        },
        onSuccess: () => {
            toast.success("Đã cập nhật ca làm việc");
            setShowDialog(false);
            setEditShift(null);
            invalidate();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteShift(id),
        onSuccess: () => {
            toast.success("Đã xoá ca làm việc");
            setDeleteId(null);
            invalidate();
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ shift, isActive }: { shift: Shift; isActive: boolean }) =>
            updateShift(shift.id, {
                name: shift.name,
                code: shift.code,
                startTime: shift.startTime,
                endTime: shift.endTime,
                breakMinutes: shift.breakMinutes,
                lateThreshold: shift.lateThreshold,
                earlyThreshold: shift.earlyThreshold,
                isDefault: shift.isDefault,
                isActive,
            }),
        onSuccess: () => invalidate(),
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const isSaving =
        createMutation.isPending || updateMutation.isPending;

    const onSubmit = (values: ShiftFormValues) => {
        if (editShift) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    const deleteTarget = deleteId
        ? shifts.find((s) => s.id === deleteId)
        : null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Quản lý ca làm việc
                    </CardTitle>
                    <CardDescription>
                        Thiết lập các ca làm việc, giờ bắt đầu/kết
                        thúc và ngưỡng đi trễ/về sớm
                    </CardDescription>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm ca
                </Button>
            </CardHeader>
            <CardContent>
                {shifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Chưa có ca làm việc nào
                    </p>
                ) : (
                    <div className="space-y-2">
                        {shifts.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">
                                                {s.name}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {s.code}
                                            </Badge>
                                            {s.isDefault && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    <Star className="mr-1 h-3 w-3" />
                                                    Mặc định
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {s.startTime} – {s.endTime}
                                            {" · "}
                                            Nghỉ {s.breakMinutes}p
                                            {" · "}
                                            {computeWorkHours(
                                                s.startTime,
                                                s.endTime,
                                                s.breakMinutes,
                                            ) ?? "—"}
                                            {" · "}
                                            Trễ {s.lateThreshold}p / Sớm{" "}
                                            {s.earlyThreshold}p
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={s.isActive}
                                        onCheckedChange={(v) =>
                                            toggleMutation.mutate({
                                                shift: s,
                                                isActive: v,
                                            })
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(s)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setDeleteId(s.id)
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

            {/* Create / Edit Dialog */}
            <Dialog
                open={showDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDialog(false);
                        setEditShift(null);
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editShift
                                ? "Chỉnh sửa ca làm việc"
                                : "Thêm ca làm việc"}
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
                                            <FormLabel>Tên ca</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="VD: Ca sáng"
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
                                            <FormLabel>Mã ca</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="VD: SANG"
                                                    disabled={!!editShift}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Giờ bắt đầu
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Giờ kết thúc
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="breakMinutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nghỉ trưa (phút)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lateThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Trễ cho phép (phút)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="earlyThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Sớm cho phép (phút)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {workHoursPreview && (
                                <p className="text-sm text-muted-foreground">
                                    Thời gian làm việc thực tế:{" "}
                                    <span className="font-medium text-foreground">
                                        {workHoursPreview}
                                    </span>
                                </p>
                            )}

                            <div className="flex items-center gap-6">
                                <FormField
                                    control={form.control}
                                    name="isDefault"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <FormLabel className="!mt-0">
                                                Ca mặc định
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <FormLabel className="!mt-0">
                                                Đang hoạt động
                                            </FormLabel>
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
                                        setEditShift(null);
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
                                    {editShift ? "Cập nhật" : "Thêm"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xoá ca làm việc?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget &&
                            deleteTarget._count.attendances > 0
                                ? "Ca này đã có dữ liệu chấm công. Vui lòng vô hiệu hóa thay vì xoá."
                                : "Ca làm việc sẽ bị xoá khỏi hệ thống. Hành động này không thể hoàn tác."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deleteId &&
                                deleteMutation.mutate(deleteId)
                            }
                            disabled={
                                !!deleteTarget &&
                                deleteTarget._count.attendances > 0
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

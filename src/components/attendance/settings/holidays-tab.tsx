"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Loader2 } from "lucide-react";

import {
    createHoliday,
    deleteHoliday,
} from "@/app/(protected)/attendance/actions";
import type { Holiday } from "@/app/(protected)/attendance/types";
import { useTimezone } from "@/hooks/use-timezone";

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

const holidaySchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên ngày lễ"),
    date: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().optional(),
    isRecurring: z.boolean(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

interface Props {
    holidays: Holiday[];
    queryClient: ReturnType<typeof useQueryClient>;
}

export function HolidaysTab({ holidays, queryClient }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { timezone } = useTimezone();

    const form = useForm<HolidayFormValues>({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            name: "",
            date: "",
            endDate: "",
            isRecurring: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: HolidayFormValues) =>
            createHoliday({
                name: values.name,
                date: values.date,
                endDate: values.endDate || undefined,
                isRecurring: values.isRecurring,
            }),
        onSuccess: () => {
            toast.success("Đã thêm ngày nghỉ lễ");
            setShowDialog(false);
            form.reset();
            queryClient.invalidateQueries({
                queryKey: ["attendance", "holidays"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteHoliday(id),
        onSuccess: () => {
            toast.success("Đã xoá ngày nghỉ lễ");
            setDeleteId(null);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "holidays"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", {
            timeZone: timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Ngày nghỉ lễ
                    </CardTitle>
                    <CardDescription>
                        Quản lý các ngày nghỉ lễ. Nhân viên không cần
                        chấm công vào những ngày này.
                    </CardDescription>
                </div>
                <Button
                    onClick={() => {
                        form.reset();
                        setShowDialog(true);
                    }}
                    size="sm"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm ngày lễ
                </Button>
            </CardHeader>
            <CardContent>
                {holidays.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Chưa có ngày nghỉ lễ nào
                    </p>
                ) : (
                    <div className="space-y-2">
                        {holidays.map((h) => (
                            <div
                                key={h.id}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-sm">
                                            {h.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(h.date)}
                                            {h.endDate &&
                                                ` → ${formatDate(h.endDate)}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {h.isRecurring && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Hàng năm
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setDeleteId(h.id)
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

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm ngày nghỉ lễ</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit((v) =>
                                createMutation.mutate(v),
                            )}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tên ngày lễ
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Tết Nguyên Đán"
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
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Ngày bắt đầu
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Ngày kết thúc (tuỳ
                                                chọn)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
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
                                name="isRecurring"
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
                                        <FormLabel>
                                            Lặp lại hàng năm
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setShowDialog(false)
                                    }
                                >
                                    Huỷ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending
                                    }
                                >
                                    {createMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Thêm
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
                            Xoá ngày nghỉ lễ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Ngày
                            nghỉ lễ sẽ bị xoá khỏi hệ thống.
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

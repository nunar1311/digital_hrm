"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { createAttendanceAdjustmentRequest } from "../actions";
import { format } from "date-fns";

const adjustmentRequestSchema = z.object({
    attendanceId: z.string().min(1, "Vui lòng chọn bản ghi chấm công"),
    date: z.string().min(1, "Vui lòng chọn ngày"),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    reason: z
        .string()
        .min(5, "Lý do phải có ít nhất 5 ký tự")
        .max(500, "Lý do không được quá 500 ký tự"),
});

type AdjustmentRequestValues = z.infer<typeof adjustmentRequestSchema>;

interface AdjustmentRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendanceId?: string;
    initialDate?: string;
    onSuccess?: () => void;
}

export function AdjustmentRequestDialog({
    open,
    onOpenChange,
    attendanceId,
    initialDate,
    onSuccess,
}: AdjustmentRequestDialogProps) {
    const queryClient = useQueryClient();
    const [attachment, setAttachment] = useState<File | null>(null);

    const form = useForm<AdjustmentRequestValues>({
        resolver: zodResolver(adjustmentRequestSchema),
        defaultValues: {
            attendanceId: attendanceId || "",
            date: initialDate || "",
            checkInTime: "",
            checkOutTime: "",
            reason: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: AdjustmentRequestValues) => {
            return createAttendanceAdjustmentRequest({
                attendanceId: values.attendanceId,
                date: values.date,
                checkInTime: values.checkInTime || undefined,
                checkOutTime: values.checkOutTime || undefined,
                reason: values.reason,
                attachment: undefined,
            });
        },
        onSuccess: () => {
            toast.success("Đã gửi yêu cầu điều chỉnh chấm công");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "adjustments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "records"],
            });
            onSuccess?.();
            onOpenChange(false);
            form.reset();
            setAttachment(null);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra khi gửi yêu cầu");
        },
    });

    const handleSubmit = (values: AdjustmentRequestValues) => {
        createMutation.mutate(values);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset();
            setAttachment(null);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Yêu cầu điều chỉnh chấm công</DialogTitle>
                    <DialogDescription>
                        Điều chỉnh giờ vào/giờ ra khi quên chấm công hoặc
                        cần thay đổi thông tin chấm công
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        {/* Hidden attendanceId */}
                        {attendanceId && (
                            <input
                                type="hidden"
                                {...form.register("attendanceId")}
                                value={attendanceId}
                            />
                        )}

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            max={
                                                format(new Date(), "yyyy-MM-dd")
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Check-in Time */}
                        <FormField
                            control={form.control}
                            name="checkInTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giờ vào mới</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Bỏ trống nếu không cần điều chỉnh
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Check-out Time */}
                        <FormField
                            control={form.control}
                            name="checkOutTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giờ ra mới</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Bỏ trống nếu không cần điều chỉnh
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reason */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Lý do{" "}
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Vui lòng nhập lý do điều chỉnh chấm công..."
                                            rows={4}
                                            maxLength={500}
                                        />
                                    </FormControl>
                                    <div className="flex justify-end">
                                        <p className="text-xs text-muted-foreground">
                                            {field.value?.length || 0}/500
                                        </p>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Attachment */}
                        <div className="space-y-2">
                            <Label>Đính kèm (tùy chọn)</Label>
                            <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    setAttachment(file || null);
                                }}
                                className="cursor-pointer"
                            />
                            {attachment && (
                                <p className="text-xs text-muted-foreground">
                                    Đã chọn: {attachment.name}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Hỗ trợ: hình ảnh, PDF. Tối đa 5MB.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Gửi yêu cầu
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

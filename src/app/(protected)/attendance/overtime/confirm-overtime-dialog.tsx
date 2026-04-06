"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    confirmHoursSchema,
    type ConfirmHoursValues,
} from "./overtime-schemas";

interface ConfirmOvertimeDialogProps {
    open: boolean;
    registeredStartTime?: string;
    registeredEndTime?: string;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: ConfirmHoursValues) => void;
    isPending: boolean;
}

export function ConfirmOvertimeDialog({
    open,
    registeredStartTime,
    registeredEndTime,
    onOpenChange,
    onSubmit,
    isPending,
}: ConfirmOvertimeDialogProps) {
    const form = useForm<ConfirmHoursValues>({
        resolver: zodResolver(confirmHoursSchema),
        defaultValues: {
            actualStartTime: registeredStartTime ?? "",
            actualEndTime: registeredEndTime ?? "",
        },
    });

    // Reset form values when dialog data changes
    const handleOpenChange = (v: boolean) => {
        if (!v) {
            form.reset({ actualStartTime: "", actualEndTime: "" });
        }
        onOpenChange(v);
    };

    const handleSubmit = (values: ConfirmHoursValues) => {
        onSubmit(values);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận giờ OT thực tế</DialogTitle>
                    <DialogDescription>
                        Nhập giờ bắt đầu và kết thúc thực tế sau khi
                        hoàn thành OT.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="grid gap-4 py-4"
                    >
                        {registeredStartTime && registeredEndTime && (
                            <div className="text-sm text-muted-foreground">
                                Giờ đăng ký: {registeredStartTime} –{" "}
                                {registeredEndTime}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="actualStartTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Giờ bắt đầu thực tế *
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="actualEndTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Giờ kết thúc thực tế *
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
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
                                onClick={() => handleOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Đang xử lý..." : "Xác nhận"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

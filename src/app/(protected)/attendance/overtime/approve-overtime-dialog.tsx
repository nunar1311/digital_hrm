"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    approveNoteSchema,
    type ApproveNoteValues,
} from "./overtime-schemas";

interface ApproveOvertimeDialogProps {
    open: boolean;
    step: "MANAGER" | "HR";
    onOpenChange: (open: boolean) => void;
    onSubmit: (note?: string) => void;
    isPending: boolean;
}

export function ApproveOvertimeDialog({
    open,
    step,
    onOpenChange,
    onSubmit,
    isPending,
}: ApproveOvertimeDialogProps) {
    const form = useForm<ApproveNoteValues>({
        resolver: zodResolver(approveNoteSchema),
        defaultValues: { note: "" },
    });

    const handleSubmit = (values: ApproveNoteValues) => {
        onSubmit(values.note || undefined);
        form.reset();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) form.reset();
                onOpenChange(v);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Duyệt đơn OT (
                        {step === "MANAGER" ? "Quản lý" : "HR"})
                    </DialogTitle>
                    <DialogDescription>
                        Thêm ghi chú (không bắt buộc) trước khi duyệt.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Ghi chú (tùy chọn)..."
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? "Đang xử lý..."
                                    : "Xác nhận duyệt"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

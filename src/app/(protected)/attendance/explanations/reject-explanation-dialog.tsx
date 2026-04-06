"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const rejectSchema = z.object({
    reason: z.string().optional(),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface RejectExplanationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isPending: boolean;
    onConfirm: (reason: string) => void;
}

export function RejectExplanationDialog({
    open,
    onOpenChange,
    isPending,
    onConfirm,
}: RejectExplanationDialogProps) {
    const form = useForm<RejectFormValues>({
        resolver: zodResolver(rejectSchema),
        defaultValues: { reason: "" },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            form.reset();
        }
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Từ chối giải trình</DialogTitle>
                    <DialogDescription>
                        Vui lòng nêu lý do từ chối.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) => {
                            onConfirm(values.reason ?? "");
                            form.reset();
                        })}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Lý do từ chối
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Lý do..."
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
                                onClick={() =>
                                    handleOpenChange(false)
                                }
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isPending}
                            >
                                {isPending
                                    ? "Đang xử lý..."
                                    : "Từ chối"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ProtectedPages");

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
                        {t("attendanceOvertimeApproveDialogTitle", {
                            role:
                                step === "MANAGER"
                                    ? t("attendanceOvertimeRoleManager")
                                    : t("attendanceOvertimeRoleHR"),
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceOvertimeApproveDialogDescription")}
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
                                    <FormLabel>{t("attendanceOvertimeApproveNoteLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder={t("attendanceOvertimeApproveNotePlaceholder")}
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
                                {t("attendanceOvertimeDialogCancel")}
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? t("attendanceOvertimeDialogPending")
                                    : t("attendanceOvertimeApproveConfirm")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

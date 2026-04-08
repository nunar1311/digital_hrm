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
import { rejectSchema, type RejectValues } from "./overtime-schemas";
import { useTranslations } from "next-intl";

interface RejectOvertimeDialogProps {
    open: boolean;
    step: "MANAGER" | "HR";
    onOpenChange: (open: boolean) => void;
    onSubmit: (reason?: string) => void;
    isPending: boolean;
}

export function RejectOvertimeDialog({
    open,
    step,
    onOpenChange,
    onSubmit,
    isPending,
}: RejectOvertimeDialogProps) {
    const t = useTranslations("ProtectedPages");

    const form = useForm<RejectValues>({
        resolver: zodResolver(rejectSchema),
        defaultValues: { reason: "" },
    });

    const handleSubmit = (values: RejectValues) => {
        onSubmit(values.reason || undefined);
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
                        {t("attendanceOvertimeRejectDialogTitle", {
                            role:
                                step === "MANAGER"
                                    ? t("attendanceOvertimeRoleManager")
                                    : t("attendanceOvertimeRoleHR"),
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceOvertimeRejectDialogDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("attendanceOvertimeRejectReasonLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder={t("attendanceOvertimeRejectReasonPlaceholder")}
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
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isPending}
                            >
                                {isPending
                                    ? t("attendanceOvertimeDialogPending")
                                    : t("attendanceOvertimeRejectConfirm")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

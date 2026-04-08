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
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ProtectedPages");

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
                    <DialogTitle>{t("attendanceOvertimeConfirmDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("attendanceOvertimeConfirmDialogDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="grid gap-4 py-4"
                    >
                        {registeredStartTime && registeredEndTime && (
                            <div className="text-sm text-muted-foreground">
                                {t("attendanceOvertimeRegisteredTimeLabel")}: {registeredStartTime} –{" "}
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
                                            {t("attendanceOvertimeActualStartLabel")}
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
                                            {t("attendanceOvertimeActualEndLabel")}
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
                                {t("attendanceOvertimeDialogCancel")}
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? t("attendanceOvertimeDialogPending")
                                    : t("attendanceOvertimeConfirmAction")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

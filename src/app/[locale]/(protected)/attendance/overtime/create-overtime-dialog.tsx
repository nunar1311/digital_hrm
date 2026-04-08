"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    createOvertimeSchema,
    type CreateOvertimeValues,
} from "./overtime-schemas";
import { DatePicker } from "@/components/ui/date-picker";
import { dateToStr, strToDate } from "../shifts/shift-dialogs";
import { useTranslations } from "next-intl";

interface CreateOvertimeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CreateOvertimeValues) => void;
    isPending: boolean;
}

export function CreateOvertimeDialog({
    open,
    onOpenChange,
    onSubmit,
    isPending,
}: CreateOvertimeDialogProps) {
    const t = useTranslations("ProtectedPages");

    const form = useForm<CreateOvertimeValues>({
        resolver: zodResolver(createOvertimeSchema),
        defaultValues: {
            date: "",
            startTime: "18:00",
            endTime: "20:00",
            reason: "",
        },
    });

    const handleSubmit = (values: CreateOvertimeValues) => {
        onSubmit(values);
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
                    <DialogTitle>{t("attendanceOvertimeCreateDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("attendanceOvertimeCreateDialogDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="grid gap-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceOvertimeDateLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            date={strToDate(
                                                field.value,
                                            )}
                                            setDate={(d) =>
                                                field.onChange(
                                                    dateToStr(d),
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceOvertimeStartTimeLabel")}
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
                                            {t("attendanceOvertimeEndTimeLabel")}
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
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("attendanceOvertimeReasonLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder={t("attendanceOvertimeReasonPlaceholder")}
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
                                disabled={isPending}
                            >
                                {isPending
                                    ? t("attendanceOvertimeCreatePending")
                                    : t("attendanceOvertimeCreateSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

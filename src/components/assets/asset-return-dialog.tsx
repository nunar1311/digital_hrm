"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { returnAsset } from "@/app/[locale]/(protected)/assets/actions";
import { CONDITION_OPTIONS } from "@/app/[locale]/(protected)/assets/constants";

const formSchema = z.object({
    assignmentId: z.string().min(1),
    condition: z.enum(["GOOD", "DAMAGED", "LOST"]).optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentId: string;
}

export function AssetReturnDialog({
    open,
    onOpenChange,
    assignmentId,
}: AssetReturnDialogProps) {
    const queryClient = useQueryClient();
    const t = useTranslations("ProtectedPages");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assignmentId,
            condition: "GOOD",
            notes: "",
        },
    });

    const mutation = useMutation({
        mutationFn: returnAsset,
        onSuccess: () => {
            toast.success(t("assetsReturnToastSuccess"));
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (err: Error) => {
            toast.error(err.message || t("assetsReturnToastError"));
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("assetsReturnDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("assetsReturnDialogDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((v) =>
                            mutation.mutate(v),
                        )}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("assetsReturnConditionLabel")}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t("assetsReturnConditionPlaceholder")}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CONDITION_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("assetsReturnNotesLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("assetsReturnNotesPlaceholder")}
                                            rows={3}
                                            {...field}
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
                                {t("assetsReturnCancelButton")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t("assetsReturnConfirmButton")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";

import { updateAttendanceConfig } from "@/app/[locale]/(protected)/attendance/actions";
import type { AttendanceConfig } from "@/app/[locale]/(protected)/attendance/types";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

function createGeneralSchema(t: ReturnType<typeof useTranslations>) {
    return z.object({
        standardWorkHours: z
            .number()
            .min(1, t("attendanceGeneralSettingsTabValidationHoursMin"))
            .max(24, t("attendanceGeneralSettingsTabValidationHoursMax")),
        standardWorkDays: z
            .number()
            .min(1, t("attendanceGeneralSettingsTabValidationDaysMin"))
            .max(31, t("attendanceGeneralSettingsTabValidationDaysMax")),
        otWeekdayCoeff: z
            .number()
            .min(1, t("attendanceGeneralSettingsTabValidationCoeffMin"))
            .max(10, t("attendanceGeneralSettingsTabValidationCoeffMax")),
        otWeekendCoeff: z
            .number()
            .min(1, t("attendanceGeneralSettingsTabValidationCoeffMin"))
            .max(10, t("attendanceGeneralSettingsTabValidationCoeffMax")),
        otHolidayCoeff: z
            .number()
            .min(1, t("attendanceGeneralSettingsTabValidationCoeffMin"))
            .max(10, t("attendanceGeneralSettingsTabValidationCoeffMax")),
    });
}

type GeneralFormValues = z.infer<ReturnType<typeof createGeneralSchema>>;

interface Props {
    config: AttendanceConfig | null;
    queryClient: ReturnType<typeof useQueryClient>;
}

export function GeneralSettingsTab({ config, queryClient }: Props) {
    const t = useTranslations("ProtectedPages");
    const generalSchema = createGeneralSchema(t);

    const form = useForm<GeneralFormValues>({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            standardWorkHours: config?.standardWorkHours ?? 8,
            standardWorkDays: config?.standardWorkDays ?? 22,
            otWeekdayCoeff: config?.otWeekdayCoeff ?? 1.5,
            otWeekendCoeff: config?.otWeekendCoeff ?? 2.0,
            otHolidayCoeff: config?.otHolidayCoeff ?? 3.0,
        },
    });

    const mutation = useMutation({
        mutationFn: (values: GeneralFormValues) =>
            updateAttendanceConfig({
                requireGps: config?.requireGps ?? false,
                requireWifi: config?.requireWifi ?? false,
                requireSelfie: config?.requireSelfie ?? false,
                maxGpsDistanceMeters: config?.maxGpsDistanceMeters ?? 200,
                officeLat: config?.officeLat ?? null,
                officeLng: config?.officeLng ?? null,
                ...values,
            }),
        onMutate: async (values) => {
            await queryClient.cancelQueries({ queryKey: ["attendance", "config"] });
            queryClient.setQueryData<AttendanceConfig>(
                ["attendance", "config"],
                (old) => {
                    if (!old) return old;
                    return { ...old, ...values };
                },
            );
            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceGeneralSettingsTabToastSaveSuccess"));
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceGeneralSettingsTabToastGenericError"));
            queryClient.invalidateQueries({ queryKey: ["attendance", "config"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "config"],
            });
        }
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((v) =>
                    mutation.mutate(v),
                )}
                className="grid gap-6 lg:grid-cols-2"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {t("attendanceGeneralSettingsTabStandardTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("attendanceGeneralSettingsTabStandardDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="standardWorkHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceGeneralSettingsTabHoursPerDayLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={24}
                                                step={0.5}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target
                                                            .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="standardWorkDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceGeneralSettingsTabWorkDaysPerMonthLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target
                                                            .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {t("attendanceGeneralSettingsTabOvertimeTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("attendanceGeneralSettingsTabOvertimeDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="otWeekdayCoeff"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceGeneralSettingsTabWeekdayLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                step={0.1}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target
                                                            .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="otWeekendCoeff"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceGeneralSettingsTabWeekendLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                step={0.1}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target
                                                            .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="otHolidayCoeff"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("attendanceGeneralSettingsTabHolidayLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                step={0.1}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target
                                                            .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 flex justify-end">
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("attendanceGeneralSettingsTabSave")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}


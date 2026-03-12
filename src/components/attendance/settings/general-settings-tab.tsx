"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";

import { updateAttendanceConfig } from "@/app/(protected)/attendance/actions";
import type { AttendanceConfig } from "@/app/(protected)/attendance/types";

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

const generalSchema = z.object({
    standardWorkHours: z
        .number()
        .min(1, "Tối thiểu 1 giờ")
        .max(24, "Tối đa 24 giờ"),
    standardWorkDays: z
        .number()
        .min(1, "Tối thiểu 1 ngày")
        .max(31, "Tối đa 31 ngày"),
    otWeekdayCoeff: z
        .number()
        .min(1, "Tối thiểu 1.0")
        .max(10, "Tối đa 10.0"),
    otWeekendCoeff: z
        .number()
        .min(1, "Tối thiểu 1.0")
        .max(10, "Tối đa 10.0"),
    otHolidayCoeff: z
        .number()
        .min(1, "Tối thiểu 1.0")
        .max(10, "Tối đa 10.0"),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

interface Props {
    config: AttendanceConfig | null;
    queryClient: ReturnType<typeof useQueryClient>;
}

export function GeneralSettingsTab({ config, queryClient }: Props) {
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
                maxGpsDistanceMeters:
                    config?.maxGpsDistanceMeters ?? 200,
                officeLat: config?.officeLat ?? null,
                officeLng: config?.officeLng ?? null,
                ...values,
            }),
        onSuccess: () => {
            toast.success("Đã lưu cài đặt chung");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "config"],
            });
        },
        onError: (err: Error) =>
            toast.error(err.message || "Có lỗi xảy ra"),
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
                            Giờ làm việc tiêu chuẩn
                        </CardTitle>
                        <CardDescription>
                            Thiết lập thời gian làm việc chuẩn cho tổ
                            chức
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
                                            Giờ/ngày
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
                                            Ngày công/tháng
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
                            Hệ số tăng ca
                        </CardTitle>
                        <CardDescription>
                            Hệ số nhân lương cho các loại tăng ca
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
                                            Ngày thường
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
                                            Cuối tuần
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
                                        <FormLabel>Ngày lễ</FormLabel>
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
                        Lưu cài đặt chung
                    </Button>
                </div>
            </form>
        </Form>
    );
}

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import type { WorkCycle } from "../types";
import { WEEKDAY_SHORT } from "@/components/attendance/settings/work-cycles-constants";
import { cn } from "@/lib/utils";
import { assignWorkCycle } from "../actions";

// ─── Zod Schema ───

const assignCycleInlineFormSchema = z.object({
    workCycleId: z.string().min(1, "Vui lòng chọn chu kỳ"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().optional(),
});

type AssignCycleInlineFormValues = z.infer<
    typeof assignCycleInlineFormSchema
>;

// ─── Component Props ───

interface AssignCycleInlineFormProps {
    userId: string;
    userName: string;
    workCycles: WorkCycle[];
    defaultStartDate: Date;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ─── Component ───

export function AssignCycleInlineForm({
    userId,
    userName,
    workCycles,
    defaultStartDate,
    onSuccess,
    onCancel,
}: AssignCycleInlineFormProps) {
    const queryClient = useQueryClient();

    const form = useForm<AssignCycleInlineFormValues>({
        resolver: zodResolver(assignCycleInlineFormSchema),
        defaultValues: {
            workCycleId: "",
            startDate: format(defaultStartDate, "yyyy-MM-dd"),
            endDate: "",
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedCycleId = form.watch("workCycleId");
    const selectedCycle = workCycles.find(
        (c) => c.id === selectedCycleId,
    );

    const assignCycleMutation = useMutation({
        mutationFn: async (values: AssignCycleInlineFormValues) => {
            return assignWorkCycle(
                userId,
                values.workCycleId,
                values.startDate,
                values.endDate || undefined,
            );
        },
        onSuccess: () => {
            toast.success(`Gán chu kỳ thành công cho ${userName}`);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            form.reset();
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Có lỗi xảy ra");
        },
    });

    const onSubmit = (values: AssignCycleInlineFormValues) => {
        assignCycleMutation.mutate(values);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
            >
                {/* Chọn chu kỳ */}
                <FormField
                    control={form.control}
                    name="workCycleId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">
                                Chọn chu kỳ{" "}
                                <span className="text-destructive">
                                    *
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn chu kỳ..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workCycles.map((cycle) => (
                                            <SelectItem
                                                key={cycle.id}
                                                value={cycle.id}
                                            >
                                                {cycle.name} (
                                                {cycle.totalDays}{" "}
                                                ngày)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                {/* Preview chu kỳ đã chọn */}
                {selectedCycle && (
                    <CyclePreview cycle={selectedCycle} />
                )}

                {/* Từ ngày */}
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">
                                Từ ngày{" "}
                                <span className="text-destructive">
                                    *
                                </span>
                            </FormLabel>
                            <FormControl>
                                <DatePicker
                                    date={
                                        field.value
                                            ? new Date(field.value)
                                            : undefined
                                    }
                                    setDate={(date) =>
                                        field.onChange(
                                            date
                                                ? format(
                                                      date,
                                                      "yyyy-MM-dd",
                                                  )
                                                : "",
                                        )
                                    }
                                    className="h-8 text-sm"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                {/* Đến ngày */}
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">
                                Đến ngày
                            </FormLabel>
                            <FormControl>
                                <DatePicker
                                    date={
                                        field.value
                                            ? new Date(field.value)
                                            : undefined
                                    }
                                    setDate={(date) =>
                                        field.onChange(
                                            date
                                                ? format(
                                                      date,
                                                      "yyyy-MM-dd",
                                                  )
                                                : "",
                                        )
                                    }
                                    className="h-8 text-sm"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                {/* Nút xác nhận */}
                <div className="flex gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={onCancel}
                        >
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        size="sm"
                        className="flex-1"
                        disabled={assignCycleMutation.isPending}
                    >
                        {assignCycleMutation.isPending
                            ? "Đang xử lý..."
                            : "Xác nhận"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

// ─── Cycle Preview Component ───

interface CyclePreviewProps {
    cycle: WorkCycle;
    compact?: boolean;
}

function CyclePreview({ cycle, compact = true }: CyclePreviewProps) {
    if (compact) {
        return (
            <div className="rounded-md border bg-muted/50 p-2 text-xs">
                <p className="mb-1.5 font-medium">
                    Mẫu chu kỳ ({cycle.totalDays} ngày):
                </p>
                <div className="flex flex-wrap gap-1">
                    {cycle.entries.slice(0, 7).map((entry) => (
                        <span
                            key={entry.id}
                            className={cn(
                                "rounded px-1.5 py-0.5",
                                entry.isDayOff
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-primary",
                            )}
                        >
                            {entry.isDayOff
                                ? "Nghỉ"
                                : (entry.shift?.name?.slice(0, 3) ??
                                  "N/A")}
                        </span>
                    ))}
                    {cycle.entries.length > 7 && (
                        <span className="text-muted-foreground">
                            +{cycle.entries.length - 7}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-2 text-sm font-medium">
                Mẫu chu kỳ ({cycle.totalDays} ngày):
            </p>
            <div className="flex flex-wrap gap-1.5">
                {cycle.entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={cn(
                            "rounded px-2 py-1 text-xs font-medium",
                            entry.isDayOff
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary",
                        )}
                    >
                        {WEEKDAY_SHORT[entry.dayIndex % 7]} -{" "}
                        {entry.isDayOff
                            ? "Nghỉ"
                            : (entry.shift?.name ?? "N/A")}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Cycle Select Component (cho việc tái sử dụng) ───

interface CycleSelectProps {
    value: string;
    onChange: (value: string) => void;
    workCycles: WorkCycle[];
    placeholder?: string;
    disabled?: boolean;
}

export function CycleSelect({
    value,
    onChange,
    workCycles,
    placeholder = "Chọn chu kỳ...",
    disabled = false,
}: CycleSelectProps) {
    return (
        <Select
            value={value}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger className="w-full h-8">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {workCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                                {cycle.name} ({cycle.totalDays} ngày)
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ─── Export Preview as standalone ───
export { CyclePreview };

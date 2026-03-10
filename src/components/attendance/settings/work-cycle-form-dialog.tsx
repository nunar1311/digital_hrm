"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sun, Moon } from "lucide-react";
import type {
    Shift,
    WorkCycle,
} from "@/app/(protected)/attendance/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    workCycleFormSchema,
    type WorkCycleFormValues,
    type CycleEntryDraft,
    WEEKDAY_FULL,
} from "./work-cycles-constants";
import { useState, useEffect } from "react";

interface WorkCycleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editCycle: WorkCycle | null;
    shifts: Shift[];
    onSubmit: (
        values: WorkCycleFormValues,
        entries: CycleEntryDraft[],
    ) => void;
    isSaving: boolean;
}

export function WorkCycleFormDialog({
    open,
    onOpenChange,
    editCycle,
    shifts,
    onSubmit,
    isSaving,
}: WorkCycleFormDialogProps) {
    const [entries, setEntries] = useState<CycleEntryDraft[]>([]);
    const activeShifts = shifts.filter((s) => s.isActive);

    const form = useForm<WorkCycleFormValues>({
        resolver: zodResolver(workCycleFormSchema),
        defaultValues: {
            name: "",
            description: "",
            totalDays: 7,
        },
    });

    useEffect(() => {
        if (!open) return;
        if (editCycle) {
            form.reset({
                name: editCycle.name,
                description: editCycle.description ?? "",
                totalDays: editCycle.totalDays,
            });
            setEntries(
                editCycle.entries.map((e) => ({
                    dayIndex: e.dayIndex,
                    shiftId: e.shiftId,
                    isDayOff: e.isDayOff,
                })),
            );
        } else {
            const days = 7;
            form.reset({
                name: "",
                description: "",
                totalDays: days,
            });
            setEntries(
                Array.from({ length: days }, (_, i) => ({
                    dayIndex: i,
                    shiftId: activeShifts[0]?.id ?? null,
                    isDayOff: i >= 5,
                })),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editCycle]);

    const handleTotalDaysChange = (days: number) => {
        if (days >= 1 && days <= 90) {
            setEntries((prev) => {
                if (prev.length === days) return prev;
                const result: CycleEntryDraft[] = [];
                for (let i = 0; i < days; i++) {
                    result.push(
                        prev[i] ?? {
                            dayIndex: i,
                            shiftId: activeShifts[0]?.id ?? null,
                            isDayOff: false,
                        },
                    );
                    result[i].dayIndex = i;
                }
                return result;
            });
        }
    };

    const updateEntry = (
        dayIndex: number,
        update: Partial<CycleEntryDraft>,
    ) => {
        setEntries((prev) =>
            prev.map((e) =>
                e.dayIndex === dayIndex ? { ...e, ...update } : e,
            ),
        );
    };

    const handleSubmit = (values: WorkCycleFormValues) => {
        onSubmit(values, entries);
    };

    const workDaysCount = entries.filter((e) => !e.isDayOff).length;
    const offDaysCount = entries.filter((e) => e.isDayOff).length;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) onOpenChange(false);
            }}
        >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editCycle
                            ? "Chỉnh sửa chu kỳ"
                            : "Tạo chu kỳ làm việc"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên chu kỳ</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="VD: 4 làm - 2 nghỉ"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Mô tả (tuỳ chọn)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="VD: Chu kỳ xoay ca cho nhân viên sản xuất"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="totalDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Số ngày trong chu kỳ
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={90}
                                            value={field.value}
                                            onChange={(e) => {
                                                const v =
                                                    e.target
                                                        .valueAsNumber;
                                                field.onChange(v);
                                                handleTotalDaysChange(
                                                    v,
                                                );
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Chu kỳ sẽ lặp lại sau{" "}
                                        {field.value} ngày
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />

                        {/* Cycle Entries Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base">
                                    Lịch từng ngày
                                </FormLabel>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Sun className="h-3 w-3" />
                                        {workDaysCount} ngày làm
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Moon className="h-3 w-3" />
                                        {offDaysCount} ngày nghỉ
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                {entries.map((entry) => (
                                    <div
                                        key={entry.dayIndex}
                                        className={`flex items-center gap-3 rounded-md border p-3 ${
                                            entry.isDayOff
                                                ? "bg-muted/50"
                                                : ""
                                        }`}
                                    >
                                        <span className="text-sm font-medium w-16 shrink-0">
                                            {
                                                WEEKDAY_FULL[
                                                    entry.dayIndex % 7
                                                ]
                                            }
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={
                                                    !entry.isDayOff
                                                }
                                                onCheckedChange={(
                                                    checked,
                                                ) =>
                                                    updateEntry(
                                                        entry.dayIndex,
                                                        {
                                                            isDayOff:
                                                                !checked,
                                                            shiftId:
                                                                checked
                                                                    ? (activeShifts[0]
                                                                          ?.id ??
                                                                      null)
                                                                    : null,
                                                        },
                                                    )
                                                }
                                            />
                                            <span className="text-xs text-muted-foreground w-12">
                                                {entry.isDayOff
                                                    ? "Nghỉ"
                                                    : "Làm"}
                                            </span>
                                        </div>

                                        {!entry.isDayOff && (
                                            <Select
                                                value={
                                                    entry.shiftId ??
                                                    ""
                                                }
                                                onValueChange={(v) =>
                                                    updateEntry(
                                                        entry.dayIndex,
                                                        {
                                                            shiftId:
                                                                v,
                                                        },
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Chọn ca" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeShifts.map(
                                                        (s) => (
                                                            <SelectItem
                                                                key={
                                                                    s.id
                                                                }
                                                                value={
                                                                    s.id
                                                                }
                                                            >
                                                                {
                                                                    s.name
                                                                }{" "}
                                                                (
                                                                {
                                                                    s.startTime
                                                                }
                                                                –
                                                                {
                                                                    s.endTime
                                                                }
                                                                )
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {entry.isDayOff && (
                                            <span className="text-sm text-muted-foreground italic flex-1">
                                                Ngày nghỉ
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Huỷ
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {editCycle
                                    ? "Cập nhật"
                                    : "Tạo chu kỳ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

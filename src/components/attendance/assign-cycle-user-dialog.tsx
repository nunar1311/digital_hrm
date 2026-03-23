"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { WorkCycle } from "@/app/(protected)/attendance/types";
import { assignWorkCycle } from "@/app/(protected)/attendance/actions";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const assignCycleSchema = z.object({
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    workCycleId: z.string().min(1, "Vui lòng chọn chu kỳ"),
    startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.date().optional(),
});

type AssignCycleFormValues = z.infer<typeof assignCycleSchema>;

interface AssignCycleUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: Array<{
        id: string;
        name: string;
        employeeCode: string | null;
    }>;
    workCycles: WorkCycle[];
    defaultUserId?: string;
    defaultStartDate?: Date;
}

export function AssignCycleUserDialog({
    open,
    onOpenChange,
    users,
    workCycles,
    defaultUserId,
    defaultStartDate,
}: AssignCycleUserDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<AssignCycleFormValues>({
        resolver: zodResolver(assignCycleSchema),
        defaultValues: {
            userId: defaultUserId ?? "",
            workCycleId: "",
            startDate: defaultStartDate,
            endDate: new Date(),
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: AssignCycleFormValues) => {
            return assignWorkCycle(
                values.userId,
                values.workCycleId,
                values.startDate,
                values.endDate || undefined,
            );
        },
        onSuccess: () => {
            toast.success("Gán chu kỳ thành công");
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
        },
    });

    const workCycleId = form.watch("workCycleId");
    const selectedCycle = workCycles.find(
        (c) => c.id === workCycleId,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Gán chu kỳ cho nhân viên
                    </DialogTitle>
                    <DialogDescription>
                        Gán chu kỳ làm việc xoay vòng cho nhân viên
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((v) =>
                            mutation.mutate(v),
                        )}
                        className="space-y-3"
                    >
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">
                                        Nhân viên{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={
                                                field.onChange
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Chọn nhân viên..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((u) => (
                                                    <SelectItem
                                                        key={u.id}
                                                        value={u.id}
                                                    >
                                                        {u.name}
                                                        {u.employeeCode
                                                            ? ` (${u.employeeCode})`
                                                            : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="workCycleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">
                                        Chu kỳ làm việc{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={
                                                field.onChange
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Chọn chu kỳ..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workCycles
                                                    .filter(
                                                        (c) =>
                                                            c.isActive,
                                                    )
                                                    .map((c) => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={
                                                                c.id
                                                            }
                                                        >
                                                            {c.name} (
                                                            {
                                                                c.totalDays
                                                            }{" "}
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

                        {selectedCycle && (
                            <div className="rounded-md border bg-muted/50 px-2.5 py-1.5">
                                <p className="text-[10px] text-muted-foreground">
                                    Mẫu:{" "}
                                    {selectedCycle.entries
                                        .slice(0, 7)
                                        .map((e, i) =>
                                            e.isDayOff
                                                ? "Nghỉ"
                                                : (e.shift?.name?.slice(
                                                      0,
                                                      3,
                                                  ) ?? "?"),
                                        )
                                        .join(" · ")}
                                    {selectedCycle.entries.length >
                                        7 &&
                                        ` +${selectedCycle.entries.length - 7}`}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
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
                                                        ? new Date(
                                                              field.value,
                                                          )
                                                        : undefined
                                                }
                                                setDate={(d) =>
                                                    field.onChange(
                                                        d
                                                            ? format(
                                                                  d,
                                                                  "yyyy-MM-dd",
                                                              )
                                                            : "",
                                                    )
                                                }
                                                className="h-8 text-xs"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
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
                                                        ? new Date(
                                                              field.value,
                                                          )
                                                        : undefined
                                                }
                                                setDate={(d) =>
                                                    field.onChange(
                                                        d
                                                            ? format(
                                                                  d,
                                                                  "yyyy-MM-dd",
                                                              )
                                                            : "",
                                                    )
                                                }
                                                className="h-8 text-xs"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="size-3.5 animate-spin" />
                                )}
                                Gán chu kỳ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

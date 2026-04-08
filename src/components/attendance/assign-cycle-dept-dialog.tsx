"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import type {
    WorkCycle,
    DepartmentBasic,
} from "@/app/[locale]/(protected)/attendance/types";
import { assignWorkCycleToDepartment } from "@/app/[locale]/(protected)/attendance/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CyclePreview } from "@/components/attendance/cycle-preview";
import { useTranslations } from "next-intl";

function createAssignCycleDeptSchema(t: ReturnType<typeof useTranslations>) {
    return z.object({
        departmentId: z.string().min(1, t("attendanceShiftsValidationDepartmentRequired")),
        workCycleId: z.string().min(1, t("attendanceShiftsValidationWorkCycleRequired")),
        startDate: z.date().min(1, t("attendanceShiftsValidationStartDateRequired")),
        endDate: z.date().optional(),
    });
}

type AssignCycleDeptFormSchema = ReturnType<typeof createAssignCycleDeptSchema>;
type AssignCycleDeptFormValues = z.infer<AssignCycleDeptFormSchema>;

interface AssignCycleDeptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departments: DepartmentBasic[];
    workCycles: WorkCycle[];
}

export function AssignCycleDeptDialog({
    open,
    onOpenChange,
    departments,
    workCycles,
}: AssignCycleDeptDialogProps) {
    const queryClient = useQueryClient();
    const t = useTranslations("ProtectedPages");
    const assignCycleDeptSchema = createAssignCycleDeptSchema(t);

    const form = useForm<AssignCycleDeptFormValues>({
        resolver: zodResolver(assignCycleDeptSchema),
        defaultValues: {
            departmentId: "",
            workCycleId: "",
            startDate: new Date(),
            endDate: new Date(),
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: AssignCycleDeptFormValues) => {
            return assignWorkCycleToDepartment(
                values.departmentId,
                values.workCycleId,
                values.startDate,
                values.endDate || undefined,
            );
        },
        onSuccess: (result) => {
            let msg = t("attendanceShiftsAssignCycleDeptToastAssigned", {
                count: result.assigned,
            });
            if (result.skipped > 0) {
                msg += ` ${t("attendanceShiftsAssignCycleDeptToastSkipped", {
                    count: result.skipped,
                })}`;
            }
            toast.success(msg);
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceShiftsToastError"));
        },
    });

    const workCycleId = useWatch({
        control: form.control,
        name: "workCycleId",
    });
    const departmentId = useWatch({
        control: form.control,
        name: "departmentId",
    });
    const startDate = useWatch({
        control: form.control,
        name: "startDate",
    });
    const endDate = useWatch({
        control: form.control,
        name: "endDate",
    });

    const selectedCycle = workCycles.find(
        (c) => c.id === workCycleId,
    );
    const selectedDept = departments.find(
        (d) => d.id === departmentId,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {t("attendanceShiftsAssignCycleDeptDialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("attendanceShiftsAssignCycleDeptDialogDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) => {
                            mutation.mutate(values);
                        })}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceShiftsAssignCycleDeptDepartment")}{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        "attendanceShiftsAssignCycleDeptDepartmentPlaceholder",
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem
                                                    key={d.id}
                                                    value={d.id}
                                                >
                                                    {d.name}
                                                    {d.code
                                                        ? ` (${d.code})`
                                                        : ""}
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
                            name="workCycleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceShiftsAssignCycleDeptCycle")}{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        "attendanceShiftsAssignCycleDeptCyclePlaceholder",
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {workCycles
                                                .filter(
                                                    (c) => c.isActive,
                                                )
                                                .map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                        {t("attendanceShiftsCycleDays", {
                                                            days: c.totalDays,
                                                        })}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedCycle && (
                            <CyclePreview cycle={selectedCycle} />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceShiftsAssignFromDate")}{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                setDate={
                                                    field.onChange
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceShiftsAssignToDate")}
                                        </FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                setDate={(d) =>
                                                    field.onChange(d)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Summary */}
                        {startDate &&
                            selectedDept &&
                            selectedCycle && (
                                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                    {t("attendanceShiftsAssignCycleDeptSummaryPrefix")}{" "}
                                    <strong className="text-foreground">
                                        {selectedCycle.name}
                                    </strong>{" "}
                                    {t("attendanceShiftsAssignCycleDeptSummaryForDept")}{" "}
                                    <strong className="text-foreground">
                                        {selectedDept.name}
                                    </strong>{" "}
                                    {t("attendanceShiftsAssignCycleDeptSummaryFrom")}{" "}
                                    <strong className="text-foreground">
                                        {format(
                                            startDate,
                                            "dd/MM/yyyy",
                                        )}
                                    </strong>
                                    {endDate ? (
                                        <>
                                            {" "}
                                            {t("attendanceShiftsAssignCycleDeptSummaryTo")}{" "}
                                            <strong className="text-foreground">
                                                {format(
                                                    endDate,
                                                    "dd/MM/yyyy",
                                                )}
                                            </strong>
                                        </>
                                    ) : (
                                        ` (${t("attendanceShiftsAssignCycleDeptNoEndDate")})`
                                    )}
                                </div>
                            )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("attendanceShiftsAssignCancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending
                                    ? t("attendanceShiftsAssignSaving")
                                    : t("attendanceShiftsAssignCycleDeptSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


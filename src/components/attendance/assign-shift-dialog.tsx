"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    CheckIcon,
    ChevronDownIcon,
    Clock,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    Shift,
    ShiftAssignment,
} from "@/app/[locale]/(protected)/attendance/types";
import type { UserBasic } from "@/app/[locale]/(protected)/attendance/types";
import { assignShift } from "@/app/[locale]/(protected)/attendance/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function createAssignSchema(t: ReturnType<typeof useTranslations>) {
    return z.object({
        userId: z.string().min(1, t("attendanceShiftsValidationUserRequired")),
        shiftId: z.string().min(1, t("attendanceShiftsValidationShiftRequired")),
        startDate: z.date().min(1, t("attendanceShiftsValidationStartDateRequired")),
        endDate: z.date().optional(),
    });
}

 type AssignFormValues = z.infer<ReturnType<typeof createAssignSchema>>;

interface AssignShiftDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: UserBasic[];
    shifts: Shift[];
}

export function AssignShiftDialog({
    open,
    onOpenChange,
    users,
    shifts,
}: AssignShiftDialogProps) {
    const id = useId();
    const [userOpen, setUserOpen] = useState(false);
    const queryClient = useQueryClient();
    const t = useTranslations("ProtectedPages");
    const assignSchema = createAssignSchema(t);

    const form = useForm<AssignFormValues>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            userId: "",
            shiftId: "",
            startDate: new Date(),
            endDate: new Date(),
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: AssignFormValues) => {
            return assignShift(
                values.userId,
                values.shiftId,
                values.startDate,
                values.endDate || undefined,
            );
        },
        onMutate: async (values) => {
            await queryClient.cancelQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });

            const optimisticAssignment = {
                id: `optimistic-${Date.now()}`,
                userId: values.userId,
                shiftId: values.shiftId,
                startDate: values.startDate,
                endDate: values.endDate || null,
                workCycleId: null,
                cycleStartDate: null,
                shift: shifts.find((s) => s.id === values.shiftId),
                user: users.find((u) => u.id === values.userId) || {
                    id: values.userId,
                    name: "...",
                    employeeCode: "...",
                },
            };

            queryClient.setQueriesData(
                { queryKey: ["attendance", "shiftAssignments"] },
                (old: ShiftAssignment[]) => {
                    if (!old) return [optimisticAssignment];
                    return [...old, optimisticAssignment];
                },
            );

            return {};
        },
        onSuccess: () => {
            toast.success(t("attendanceShiftsAssignToastSuccess"));
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || t("attendanceShiftsToastError"));
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shiftAssignments"],
            });
            queryClient.invalidateQueries({
                queryKey: ["attendance", "shifts"],
            });
        },
    });

    const shiftId = useWatch({ control: form.control, name: "shiftId" });
    const selectedShift = shifts.find((s) => s.id === shiftId);

    const activeShifts = shifts.filter((s) => s.isActive);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("attendanceShiftsAssignDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("attendanceShiftsAssignDialogDescription")}
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
                                    <FormLabel>
                                        {t("attendanceShiftsAssignEmployee")}{" "}
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Popover
                                            onOpenChange={setUserOpen}
                                            open={userOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    aria-expanded={
                                                        userOpen
                                                    }
                                                    className={cn(
                                                        "w-full justify-between border-input bg-background px-3 font-normal outline-none hover:bg-background focus-visible:outline-[3px]",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                    id={id}
                                                    role="combobox"
                                                    variant="outline"
                                                >
                                                    <span className="truncate">
                                                        {field.value
                                                            ? users.find(
                                                                  (
                                                                      u,
                                                                  ) =>
                                                                      u.id ===
                                                                      field.value,
                                                              )?.name
                                                            : t("attendanceShiftsAssignEmployeePlaceholder")}
                                                    </span>
                                                    <ChevronDownIcon
                                                        aria-hidden="true"
                                                        className="shrink-0 text-muted-foreground/80"
                                                        size={16}
                                                    />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                align="start"
                                                className="w-full min-w-(--radix-popper-anchor-width) border-input p-0"
                                            >
                                                <Command>
                                                    <CommandInput placeholder={t("attendanceShiftsAssignSearchEmployeePlaceholder")} />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {t("attendanceShiftsAssignNoEmployeeFound")}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {users.map(
                                                                (
                                                                    u,
                                                                ) => (
                                                                    <CommandItem
                                                                        key={
                                                                            u.id
                                                                        }
                                                                        onSelect={(
                                                                            currentValue,
                                                                        ) => {
                                                                            field.onChange(
                                                                                currentValue,
                                                                            );
                                                                            setUserOpen(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        value={
                                                                            u.id
                                                                        }
                                                                    >
                                                                        {
                                                                            u.name
                                                                        }
                                                                        {u.employeeCode
                                                                            ? ` (${u.employeeCode})`
                                                                            : ""}
                                                                        {field.value ===
                                                                            u.id && (
                                                                            <CheckIcon
                                                                                className="ml-auto"
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        )}
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shiftId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("attendanceShiftsAssignShift")}{" "}
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={
                                                field.onChange
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("attendanceShiftsAssignShiftPlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeShifts.map(
                                                    (s) => (
                                                        <SelectItem
                                                            key={s.id}
                                                            value={
                                                                s.id
                                                            }
                                                        >
                                                            {s.name} (
                                                            {
                                                                s.startTime
                                                            }
                                                            -
                                                            {
                                                                s.endTime
                                                            }
                                                            )
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {selectedShift && (
                            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
                                <Clock className="size-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">
                                    <strong>
                                        {selectedShift.name}
                                    </strong>{" "}
                                    ({selectedShift.code}) · {t("attendanceShiftsAssignShiftSummary", {
                                        start: selectedShift.startTime,
                                        end: selectedShift.endTime,
                                        breakMinutes: selectedShift.breakMinutes,
                                    })}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("attendanceShiftsAssignFromDate")}{" "}
                                            <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                setDate={(d) =>
                                                    field.onChange(d)
                                                }
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
                                        <FormLabel>{t("attendanceShiftsAssignToDate")}</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                setDate={(d) =>
                                                    field.onChange(d)
                                                }
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
                                {t("attendanceShiftsAssignCancel")}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="size-3.5 animate-spin" />
                                )}
                                {t("attendanceShiftsAssignSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
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
} from "@/app/(protected)/attendance/types";
import type { UserBasic } from "@/app/(protected)/attendance/types";
import { assignShift } from "@/app/(protected)/attendance/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const assignSchema = z.object({
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    shiftId: z.string().min(1, "Vui lòng chọn ca"),
    startDate: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.date().optional(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

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
                    username: "...",
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
            toast.success("Phân ca thành công");
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Có lỗi xảy ra");
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

    const shiftId = form.watch("shiftId");
    const selectedShift = shifts.find((s) => s.id === shiftId);

    const activeShifts = shifts.filter((s) => s.isActive);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Phân ca cho nhân viên</DialogTitle>
                    <DialogDescription>
                        Gán ca làm việc cho nhân viên theo khoảng thời
                        gian
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
                                        Nhân viên{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
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
                                                            : "Chọn nhân viên..."}
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
                                                    <CommandInput placeholder="Tìm nhân viên..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            Không tìm
                                                            thấy nhân
                                                            viên.
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
                                                                        {u.username
                                                                            ? ` (${u.username})`
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
                                        Ca làm việc{" "}
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
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn ca..." />
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
                                    ({selectedShift.code}) ·{" "}
                                    {selectedShift.startTime}–
                                    {selectedShift.endTime} · nghỉ{" "}
                                    {selectedShift.breakMinutes}p
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
                                            Từ ngày{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                        <FormLabel>
                                            Đến ngày
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
                                Phân ca
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

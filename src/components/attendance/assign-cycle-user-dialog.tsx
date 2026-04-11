"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckIcon, ChevronDownIcon, Loader2 } from "lucide-react";
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
import type { WorkCycle } from "@/app/(protected)/attendance/types";
import { assignWorkCycle } from "@/app/(protected)/attendance/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CyclePreview } from "./cycle-preview";

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
        username: string | null;
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
    const id = useId();
    const [userOpen, setUserOpen] = useState(false);
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
    const activeCycles = workCycles.filter((c) => c.isActive);

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
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn chu kỳ..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeCycles.map(
                                                    (c) => (
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
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {selectedCycle && (
                            <CyclePreview
                                cycle={selectedCycle}
                            />
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
                                                              field.value as unknown as string,
                                                          )
                                                        : undefined
                                                }
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
                                        <FormLabel className="text-xs">
                                            Đến ngày
                                        </FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={
                                                    field.value
                                                        ? new Date(
                                                              field.value as unknown as string,
                                                          )
                                                        : undefined
                                                }
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
                                Gán chu kỳ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

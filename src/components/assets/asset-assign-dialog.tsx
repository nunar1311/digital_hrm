"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
    assignAsset,
    getUsersList,
} from "@/app/(protected)/assets/actions";
import type { UserOption } from "@/app/(protected)/assets/types";
import { DatePicker } from "../ui/date-picker";

const formSchema = z.object({
    assetId: z.string().min(1),
    userId: z.string().min(1, "Vui lòng chọn nhân viên"),
    assignDate: z.date().optional(),
    expectedReturn: z.date().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assetId: string;
}

export function AssetAssignDialog({
    open,
    onOpenChange,
    assetId,
}: AssetAssignDialogProps) {
    const queryClient = useQueryClient();
    const [popoverOpen, setPopoverOpen] = useState(false);

    const { data: users = [] } = useQuery<UserOption[]>({
        queryKey: ["assets", "users"],
        queryFn: getUsersList,
        enabled: open,
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetId,
            userId: "",
            assignDate: new Date(),
            expectedReturn: new Date(),
            notes: "",
        },
    });

    // Reset form when assetId changes
    useEffect(() => {
        form.setValue("assetId", assetId);
    }, [assetId, form]);

    const mutation = useMutation({
        mutationFn: assignAsset,
        onSuccess: () => {
            toast.success("Đã cấp phát tài sản thành công");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Không thể cấp phát tài sản");
        },
    });

    const selectedUser = users.find(
        (u) => u.id === form.watch("userId"),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Cấp phát tài sản</DialogTitle>
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
                            name="userId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Nhân viên *</FormLabel>
                                    <Popover
                                        open={popoverOpen}
                                        onOpenChange={setPopoverOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "justify-between",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {selectedUser
                                                        ? `${selectedUser.name}${selectedUser.employeeCode ? ` (${selectedUser.employeeCode})` : ""}`
                                                        : "Chọn nhân viên..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Tìm nhân viên..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        Không tìm thấy nhân
                                                        viên
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map(
                                                            (user) => (
                                                                <CommandItem
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    value={`${user.name} ${user.employeeCode || ""}`}
                                                                    onSelect={() => {
                                                                        field.onChange(
                                                                            user.id,
                                                                        );
                                                                        setPopoverOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value ===
                                                                                user.id
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium">
                                                                            {
                                                                                user.name
                                                                            }
                                                                        </p>
                                                                        {user.employeeCode && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {
                                                                                    user.employeeCode
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="assignDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày cấp phát</FormLabel>
                                    <FormControl>
                                       <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expectedReturn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Ngày dự kiến trả
                                    </FormLabel>
                                    <FormControl>
                                       <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú thêm..."
                                            rows={2}
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
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Cấp phát
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

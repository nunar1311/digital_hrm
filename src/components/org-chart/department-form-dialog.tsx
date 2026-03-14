"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { DepartmentNode } from "@/types/org-chart";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    createDepartment,
    updateDepartment,
} from "@/app/(protected)/org-chart/actions";
import { getPotentialManagers } from "@/app/(protected)/departments/actions";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconPicker } from "./icon-picker";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ChevronsUpDown, Check } from "lucide-react";

const departmentFormSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên phòng ban"),
    code: z.string().min(1, "Vui lòng nhập mã phòng ban"),
    description: z.string().optional(),
    logo: z.string().optional(),
    parentId: z.string().optional(),
    secondaryParentIds: z.array(z.string()).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    managerId: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormDialogProps {
    open: boolean;
    onClose: () => void;
    department: DepartmentNode | null; // null = create mode
    allDepartments: DepartmentNode[];
}

function flattenDepartments(
    nodes: DepartmentNode[],
): { id: string; name: string; code: string }[] {
    const result: { id: string; name: string; code: string }[] = [];
    function walk(ns: DepartmentNode[]) {
        for (const n of ns) {
            result.push({ id: n.id, name: n.name, code: n.code });
            walk(n.children);
        }
    }
    walk(nodes);
    return result;
}

export function DepartmentFormDialog({
    open,
    onClose,
    department,
    allDepartments,
}: DepartmentFormDialogProps) {
    const queryClient = useQueryClient();
    const isEdit = department !== null;
    const allFlat = flattenDepartments(allDepartments);

    // Fetch potential managers
    const { data: potentialManagers = [] } = useQuery({
        queryKey: ["potentialManagers"],
        queryFn: getPotentialManagers,
        enabled: open,
    });

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentFormSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            logo: "",
            parentId: "none",
            secondaryParentIds: [],
            status: "ACTIVE",
            managerId: "__none__",
        },
    });

    useEffect(() => {
        if (department && open) {
            form.reset({
                name: department.name,
                code: department.code,
                description: department.description ?? "",
                logo: department.logo ?? "",
                parentId: department.parentId ?? "none",
                secondaryParentIds:
                    department.secondaryParentIds ?? [],
                status: department.status as "ACTIVE" | "INACTIVE",
                managerId: department.managerId ?? "__none__",
            });
        } else if (open) {
            form.reset({
                name: "",
                code: "",
                description: "",
                logo: "",
                parentId: "none",
                secondaryParentIds: [],
                status: "ACTIVE",
                managerId: "__none__",
            });
        }
    }, [department, open, form]);

    const watchName = form.watch("name");

    useEffect(() => {
        // Auto generate code from name ONLY in create mode
        if (watchName && !isEdit) {
            const generatedCode = watchName
                .split(/\s+/)
                .filter((word) => word.length > 0)
                .map((word) => word[0].toUpperCase())
                .join("");
            form.setValue("code", generatedCode, {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [watchName, isEdit, form]);

    const mutation = useMutation({
        mutationFn: async (data: {
            name: string;
            code: string;
            description?: string;
            logo?: string;
            parentId?: string | null;
            secondaryParentIds?: string[];
            status: string;
            managerId?: string | null;
        }) => {
            if (isEdit && department) {
                return updateDepartment(department.id, data);
            } else {
                return createDepartment(data);
            }
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                queryClient.invalidateQueries({
                    queryKey: ["departmentTree"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["departments"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["potentialManagers"],
                });
                onClose();
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error("Có lỗi xảy ra");
        },
    });

    const onSubmit = (values: DepartmentFormValues) => {
        mutation.mutate({
            name: values.name.trim(),
            code: values.code.trim().toUpperCase(),
            description: values.description?.trim() || undefined,
            logo: values.logo?.trim() || undefined,
            parentId:
                values.parentId === "none" ? null : values.parentId,
            secondaryParentIds: values.secondaryParentIds || [],
            status: values.status,
            managerId: values.managerId === "__none__" || !values.managerId ? null : values.managerId,
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .slice(-1)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) =>
                (!o || !mutation.isPending) && onClose()
            }
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit
                            ? "Sửa phòng ban"
                            : "Tạo phòng ban mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin phòng ban"
                            : "Thêm phòng ban mới vào sơ đồ tổ chức"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biểu tượng</FormLabel>
                                    <FormControl>
                                        <IconPicker
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tên phòng ban *
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Mã phòng ban *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="uppercase"
                                                disabled
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả ngắn về phòng ban..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="managerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trưởng phòng</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between"
                                                >
                                                    {field.value && field.value !== "__none__"
                                                        ? potentialManagers.find(
                                                              (m) => m.id === field.value
                                                          )?.name || "Chọn trưởng phòng"
                                                        : "Chọn trưởng phòng"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Tìm kiếm nhân viên..." />
                                                <CommandList>
                                                    <CommandEmpty>Không tìm thấy nhân viên</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="__none__"
                                                            onSelect={() => {
                                                                field.onChange("__none__");
                                                            }}
                                                        >
                                                            <Check
                                                                className={`mr-2 h-4 w-4 ${
                                                                    field.value === "__none__"
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                }`}
                                                            />
                                                            -- Chưa phân công --
                                                        </CommandItem>
                                                        {potentialManagers.map((manager) => (
                                                            <CommandItem
                                                                key={manager.id}
                                                                value={`${manager.name} ${manager.position || ""} ${
                                                                    manager.employeeCode || ""
                                                                }`}
                                                                onSelect={() => {
                                                                    field.onChange(manager.id);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={`mr-2 h-4 w-4 ${
                                                                        field.value === manager.id
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    }`}
                                                                />
                                                                <Avatar className="h-6 w-6 mr-2">
                                                                    <AvatarImage src={manager.image ?? undefined} />
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {getInitials(manager.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span>{manager.name}</span>
                                                                    {manager.position && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {manager.position}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Phòng ban cấp trên
                                        </FormLabel>
                                        <Select
                                            onValueChange={
                                                field.onChange
                                            }
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full truncate">
                                                    <SelectValue placeholder="Chọn phòng ban" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    -- Không có (gốc)
                                                    --
                                                </SelectItem>
                                                {allFlat
                                                    .filter(
                                                        (d) =>
                                                            d.id !==
                                                            department?.id,
                                                    )
                                                    .map((d) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={
                                                                d.id
                                                            }
                                                        >
                                                            {d.name} (
                                                            {d.code})
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
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Trạng thái
                                        </FormLabel>
                                        <Select
                                            onValueChange={
                                                field.onChange
                                            }
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">
                                                    Đang hoạt động
                                                </SelectItem>
                                                <SelectItem value="INACTIVE">
                                                    Ngừng hoạt động
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="secondaryParentIds"
                            render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Phòng ban quản lý phụ (Cấp
                                        trên thứ 2)
                                    </FormLabel>
                                    <DialogDescription className="text-xs">
                                        Chọn các phòng ban mà phòng
                                        ban này cũng phải báo cáo
                                        (Matrix Structure).
                                    </DialogDescription>

                                    <ScrollArea className="h-30 w-full rounded-md border p-4 bg-muted/20">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {allFlat
                                                .filter(
                                                    (d) =>
                                                        d.id !==
                                                            department?.id &&
                                                        d.id !==
                                                            form.watch(
                                                                "parentId",
                                                            ),
                                                )
                                                .map((item) => (
                                                    <FormField
                                                        key={item.id}
                                                        control={
                                                            form.control
                                                        }
                                                        name="secondaryParentIds"
                                                        render={({
                                                            field,
                                                        }) => {
                                                            return (
                                                                <FormItem
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(
                                                                                item.id,
                                                                            )}
                                                                            onCheckedChange={(
                                                                                checked,
                                                                            ) => {
                                                                                return checked
                                                                                    ? field.onChange(
                                                                                          [
                                                                                              ...(field.value ||
                                                                                                  []),
                                                                                              item.id,
                                                                                          ],
                                                                                      )
                                                                                    : field.onChange(
                                                                                          field.value?.filter(
                                                                                              (
                                                                                                  value,
                                                                                              ) =>
                                                                                                  value !==
                                                                                                  item.id,
                                                                                          ),
                                                                                      );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-xs truncate cursor-pointer leading-tight pt-0.5">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending
                                    ? "Đang xử lý..."
                                    : isEdit
                                      ? "Cập nhật"
                                      : "Tạo mới"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

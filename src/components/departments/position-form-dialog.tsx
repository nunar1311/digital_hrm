"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPosition, updatePosition } from "@/app/(protected)/positions/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    FormDescription,
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
import { Loader2 } from "lucide-react";
import z from "zod";

const AUTHORITY_OPTIONS = [
    { value: "EXECUTIVE", label: "HĐQT", defaultLevel: 1 },
    { value: "DIRECTOR", label: "Giám đốc", defaultLevel: 2 },
    { value: "MANAGER", label: "Trưởng phòng", defaultLevel: 3 },
    { value: "DEPUTY", label: "Phó phòng", defaultLevel: 4 },
    { value: "TEAM_LEAD", label: "Tổ trưởng", defaultLevel: 5 },
    { value: "STAFF", label: "Nhân viên", defaultLevel: 6 },
    { value: "INTERN", label: "Thực tập sinh", defaultLevel: 7 },
];

const AUTHORITY_DUPLICATE_CHECK = ["MANAGER", "DEPUTY"];

const positionFormSchema = z.object({
    name: z.string().min(2, "Tên chức vụ phải có ít nhất 2 ký tự"),
    code: z
        .string()
        .min(2, "Mã chức vụ phải có ít nhất 2 ký tự")
        .max(20, "Mã chức vụ tối đa 20 ký tự")
        .regex(/^[A-Z0-9_]+$/, "Mã chức vụ chỉ chứa chữ hoa, số và dấu gạch dưới"),
    authority: z.enum([
        "EXECUTIVE",
        "DIRECTOR",
        "MANAGER",
        "DEPUTY",
        "TEAM_LEAD",
        "STAFF",
        "INTERN",
    ]),
    level: z.number().int().min(1).max(10),
    description: z.string().optional(),
    minSalary: z.number().min(0).optional(),
    maxSalary: z.number().min(0).optional(),
});

type PositionFormValues = z.infer<typeof positionFormSchema>;

type ExistingPosition = { id: string; name: string; code: string; authority: string; level: number };

export interface DepartmentPositionFormDialogProps {
    departmentId: string;
    departmentName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPosition?: {
        id: string;
        name: string;
        code: string;
        authority: string;
        level: number;
        description?: string | null;
        minSalary?: string | null;
        maxSalary?: string | null;
    } | null;
}

function getDefaultLevel(authority: string): number {
    const option = AUTHORITY_OPTIONS.find((opt) => opt.value === authority);
    return option?.defaultLevel ?? 6;
}

function getAuthorityLabel(authority: string): string {
    const option = AUTHORITY_OPTIONS.find((opt) => opt.value === authority);
    return option?.label ?? authority;
}

export function DepartmentPositionFormDialog({
    departmentId,
    departmentName,
    open,
    onOpenChange,
    editingPosition,
}: DepartmentPositionFormDialogProps) {
    const queryClient = useQueryClient();
    const isEdit = !!editingPosition;

    const form = useForm<PositionFormValues>({
        resolver: zodResolver(positionFormSchema),
        defaultValues: {
            name: "",
            code: "",
            authority: "STAFF",
            level: 6,
            description: "",
            minSalary: undefined,
            maxSalary: undefined,
        },
    });

    const authority = form.watch("authority");

    useEffect(() => {
        if (editingPosition) {
            form.reset({
                name: editingPosition.name,
                code: editingPosition.code,
                authority: editingPosition.authority as PositionFormValues["authority"],
                level: editingPosition.level || getDefaultLevel(editingPosition.authority),
                description: editingPosition.description || "",
                minSalary: editingPosition.minSalary
                    ? Number(editingPosition.minSalary)
                    : undefined,
                maxSalary: editingPosition.maxSalary
                    ? Number(editingPosition.maxSalary)
                    : undefined,
            });
        } else {
            form.reset({
                name: "",
                code: "",
                authority: "STAFF",
                level: getDefaultLevel("STAFF"),
                description: "",
                minSalary: undefined,
                maxSalary: undefined,
            });
        }
    }, [editingPosition, form]);

    useEffect(() => {
        if (!isEdit && authority) {
            form.setValue("level", getDefaultLevel(authority), {
                shouldValidate: true,
            });
        }
    }, [authority, isEdit, form]);

    const { data: existingPositions = [] } = useQuery({
        queryKey: ["positions", "department", departmentId],
        queryFn: async () => {
            const { getAllPositions } = await import(
                "@/app/(protected)/positions/actions"
            );
            return getAllPositions({ departmentId, status: "ACTIVE" });
        },
        enabled: open,
    });

    const positionsList: ExistingPosition[] = existingPositions;

    const createMutation = useMutation({
        mutationFn: createPosition,
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Tạo chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["positions", "department", departmentId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["departments", departmentId],
                });
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        },
        onError: () => {
            toast.error("Đã xảy ra lỗi khi tạo chức vụ");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Parameters<typeof updatePosition>[1];
        }) => updatePosition(id, data),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Cập nhật chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["positions", "department", departmentId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["departments", departmentId],
                });
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        },
        onError: () => {
            toast.error("Đã xảy ra lỗi khi cập nhật chức vụ");
        },
    });

    const onSubmit = form.handleSubmit((values) => {
        const requiresDuplicateCheck = AUTHORITY_DUPLICATE_CHECK.includes(
            values.authority,
        );
        const editingId: string | null = editingPosition ? editingPosition.id : null;

        if (requiresDuplicateCheck && !isEdit) {
            const hasExisting = positionsList.some(
                (p) =>
                    p.authority === values.authority &&
                    p.id !== editingId,
            );
            if (hasExisting) {
                const label = getAuthorityLabel(values.authority);
                toast.error(
                    `Phòng ban đã có chức vụ "${label}". Mỗi phòng ban chỉ có một chức vụ "${label}".`,
                );
                return;
            }
        }

        const payload = {
            name: values.name,
            code: values.code,
            authority: values.authority,
            departmentId,
            level: Number(values.level),
            description: values.description || undefined,
            minSalary: values.minSalary
                ? Number(values.minSalary)
                : undefined,
            maxSalary: values.maxSalary
                ? Number(values.maxSalary)
                : undefined,
            status: "ACTIVE" as const,
            sortOrder: 0,
        };

        if (isEdit && editingPosition) {
            updateMutation.mutate({
                id: editingPosition.id,
                data: payload,
            });
        } else {
            createMutation.mutate(payload as Parameters<typeof createPosition>[0]);
        }
    });

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Sửa chức vụ" : "Thêm chức vụ mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? `Cập nhật thông tin chức vụ trong phòng ban "${departmentName}"`
                            : `Tạo chức vụ mới trong phòng ban "${departmentName}"`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tên chức vụ *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Trưởng phòng Nhân sự"
                                                {...field}
                                            />
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
                                            Mã chức vụ *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: HR_MANAGER"
                                                {...field}
                                                disabled={isEdit}
                                                className={
                                                    isEdit
                                                        ? "opacity-60"
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    field.onChange(
                                                        e.target.value.toUpperCase(),
                                                    );
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="authority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quyền hạn *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn quyền hạn" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {AUTHORITY_OPTIONS.map(
                                                    (opt) => (
                                                        <SelectItem
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        {AUTHORITY_DUPLICATE_CHECK.includes(
                                            field.value,
                                        ) && (
                                            <FormDescription className="text-amber-600">
                                                Mỗi phòng ban chỉ có một{" "}
                                                {getAuthorityLabel(field.value).toLowerCase()}
                                            </FormDescription>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cấp bậc *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                placeholder="1-10 (1=cao nhất)"
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(
                                                        val ? Number(val) : undefined,
                                                    );
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minSalary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Lương tối thiểu (VNĐ)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="VD: 15000000"
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value;
                                                    field.onChange(
                                                        val
                                                            ? Number(val)
                                                            : undefined,
                                                    );
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxSalary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Lương tối đa (VNĐ)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="VD: 30000000"
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value;
                                                    field.onChange(
                                                        val
                                                            ? Number(val)
                                                            : undefined,
                                                    );
                                                }}
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
                                            placeholder="Mô tả chi tiết về chức vụ này..."
                                            rows={3}
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
                                disabled={isLoading}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEdit ? "Lưu thay đổi" : "Tạo mới"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

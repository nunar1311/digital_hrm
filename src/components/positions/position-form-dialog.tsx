"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    createPosition,
    updatePosition,
    getAllPositions,
} from "@/app/(protected)/positions/actions";
import { updatePositionSchema } from "@/app/(protected)/positions/schemas";
import type { PositionListItem } from "@/app/(protected)/positions/types";
import { getDepartments } from "@/app/(protected)/departments/actions";
import { getAuthorityTypes } from "@/app/(protected)/authority-types/actions";
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

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Không hoạt động" },
];

interface PositionFormDialogProps {
    open: boolean;
    onClose: () => void;
    editData?: PositionListItem | null;
    // Optional aliases for department-scoped usage
    onOpenChange?: (open: boolean) => void;
    editingPosition?: PositionListItem | null;
}

export function PositionFormDialog({
    open,
    onClose,
    editData,
    onOpenChange,
    editingPosition,
}: PositionFormDialogProps) {
    const resolvedEditData = editingPosition ?? editData;
    const resolvedOnClose = onOpenChange
        ? () => onOpenChange(false)
        : onClose;
    const queryClient = useQueryClient();
    const isEdit = !!resolvedEditData;

    const form = useForm<z.infer<typeof updatePositionSchema>>({
        resolver: zodResolver(updatePositionSchema),
        defaultValues: {
            name: "",
            code: "",
            authority: "STAFF",
            departmentId: undefined,
            level: 5,
            description: "",
            parentId: undefined,
            minSalary: 0,
            maxSalary: 0,
            status: "ACTIVE",
            sortOrder: 0,
        },
    });

    // Load edit data
    useEffect(() => {
        if (resolvedEditData) {
            form.reset({
                name: resolvedEditData.name,
                code: resolvedEditData.code,
                authority: resolvedEditData.authority as never,
                departmentId: resolvedEditData.departmentId ?? undefined,
                level: resolvedEditData.level || 0,
                description: resolvedEditData.description || "",
                parentId: resolvedEditData.parentId ?? undefined,
                minSalary: resolvedEditData.minSalary
                    ? Number(resolvedEditData.minSalary)
                    : undefined,
                maxSalary: resolvedEditData.maxSalary
                    ? Number(resolvedEditData.maxSalary)
                    : undefined,
                status: resolvedEditData.status as never,
                sortOrder: resolvedEditData.sortOrder || 0,
            });
        } else {
            form.reset({
                name: "",
                code: "",
                authority: "STAFF",
                departmentId: undefined,
                level: 5,
                description: "",
                parentId: undefined,
                minSalary: 0,
                maxSalary: 0,
                status: "ACTIVE",
                sortOrder: 0,
            });
        }
    }, [resolvedEditData, form]);

    const { data: departmentsData } = useQuery({
        queryKey: ["departments", "all"],
        queryFn: () =>
            getDepartments({
                page: 1,
                pageSize: 100,
                status: "ACTIVE",
            }),
        enabled: open,
    });

    const { data: positions = [] } = useQuery({
        queryKey: ["positions", "all"],
        queryFn: () =>
            getAllPositions({
                status: "ACTIVE",
            }),
        enabled: open,
    });

    // Fetch authority types from database
    const { data: authorityTypes = [] } = useQuery({
        queryKey: ["authority-types"],
        queryFn: () => getAuthorityTypes(),
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: createPosition,
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Tạo chức vụ thành công");
                queryClient.invalidateQueries({
                    queryKey: ["positions"],
                });
                resolvedOnClose();
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
                    queryKey: ["positions"],
                });
                resolvedOnClose();
            } else {
                toast.error(result.error);
            }
        },
        onError: () => {
            toast.error("Đã xảy ra lỗi khi cập nhật chức vụ");
        },
    });

    const onSubmit = form.handleSubmit((values) => {
        const payload = {
            name: values.name,
            code: values.code,
            authority: values.authority as never,
            departmentId: values.departmentId ?? undefined,
            level: Number(values.level),
            description: values.description || undefined,
            parentId: values.parentId ?? undefined,
            minSalary: values.minSalary
                ? Number(values.minSalary)
                : undefined,
            maxSalary: values.maxSalary
                ? Number(values.maxSalary)
                : undefined,
            status: values.status as never,
            sortOrder: Number(values.sortOrder),
        };

        if (isEdit && editData) {
            updateMutation.mutate({ id: editData.id, data: payload });
        } else {
            createMutation.mutate(payload as never);
        }
    });

    const isLoading =
        createMutation.isPending || updateMutation.isPending;

    // Filter out current position from parent options when editing
    const parentOptions = positions.filter(
        (p) => p.id !== editData?.id,
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => !o && resolvedOnClose()}
        >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Sửa chức vụ" : "Thêm chức vụ mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật thông tin chức vụ"
                            : "Điền thông tin để tạo chức vụ mới trong hệ thống"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Tên chức vụ */}
                            <FormField
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                control={form.control as any}
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

                            {/* Mã chức vụ */}
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
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Cấp bậc */}
                            <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cấp bậc</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                placeholder="1-10 (1=cao nhất)"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Quyền hạn */}
                            <FormField
                                control={form.control}
                                name="authority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Quyền hạn
                                        </FormLabel>
                                        <Select
                                            onValueChange={
                                                field.onChange
                                            }
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Chọn quyền hạn" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {authorityTypes.map(
                                                    (opt) => (
                                                        <SelectItem
                                                            key={
                                                                opt.code
                                                            }
                                                            value={
                                                                opt.code
                                                            }
                                                        >
                                                            {
                                                                opt.name
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Phòng ban */}
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Phòng ban
                                        </FormLabel>
                                        <Select
                                            onValueChange={
                                                field.onChange
                                            }
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn phòng ban (tùy chọn)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departmentsData?.departments?.map(
                                                    (dept: {
                                                        id: string;
                                                        name: string;
                                                    }) => (
                                                        <SelectItem
                                                            key={
                                                                dept.id
                                                            }
                                                            value={
                                                                dept.id
                                                            }
                                                        >
                                                            {
                                                                dept.name
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Chức vụ cha */}
                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Chức vụ cha
                                        </FormLabel>
                                        <Select
                                            onValueChange={
                                                field.onChange
                                            }
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Chọn chức vụ cha (tùy chọn)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {parentOptions.map(
                                                    (pos) => (
                                                        <SelectItem
                                                            key={
                                                                pos.id
                                                            }
                                                            value={
                                                                pos.id
                                                            }
                                                        >
                                                            {pos.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Lương tối thiểu */}
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Lương tối đa */}
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Thứ tự */}
                            <FormField
                                control={form.control}
                                name="sortOrder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Thứ tự hiển thị
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Trạng thái */}
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
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {STATUS_OPTIONS.map(
                                                    (opt) => (
                                                        <SelectItem
                                                            key={
                                                                opt.value
                                                            }
                                                            value={
                                                                opt.value
                                                            }
                                                        >
                                                            {
                                                                opt.label
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Mô tả */}
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
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
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

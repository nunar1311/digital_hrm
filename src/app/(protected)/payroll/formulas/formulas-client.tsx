"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    getSalaryComponentTypes,
    getAllSalaryComponentTypes,
    createSalaryComponentType,
    updateSalaryComponentType,
    deleteSalaryComponentType,
} from "../actions";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";

// ─── Schema ───

const salaryComponentTypeSchema = z.object({
    code: z.string().min(1, "Mã không được trống"),
    name: z.string().min(1, "Tên không được trống"),
    description: z.string().optional(),
    category: z.enum([
        "BASIC",
        "ALLOWANCE",
        "BONUS",
        "DISCIPLINE",
        "DEDUCTION",
        "INSURANCE",
        "TAX",
        "OVERTIME",
    ]),
    isTaxable: z.boolean().default(true),
    isInsurance: z.boolean().default(false),
    isBase: z.boolean().default(false),
    coefficient: z.number().optional(),
    maxAmount: z.number().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
});

type SalaryComponentTypeForm = z.infer<typeof salaryComponentTypeSchema>;

// ─── Helpers ───

function getCategoryLabel(category: string) {
    const labels: Record<string, string> = {
        BASIC: "Lương cơ bản",
        ALLOWANCE: "Phụ cấp",
        BONUS: "Thưởng",
        DISCIPLINE: "Kỷ luật",
        DEDUCTION: "Khấu trừ",
        INSURANCE: "Bảo hiểm",
        TAX: "Thuế",
        OVERTIME: "Tăng ca",
    };
    return labels[category] || category;
}

function getCategoryBadgeVariant(category: string): "default" | "secondary" | "outline" | "destructive" {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
        BASIC: "default",
        ALLOWANCE: "secondary",
        BONUS: "secondary",
        DISCIPLINE: "destructive",
        DEDUCTION: "destructive",
        INSURANCE: "outline",
        TAX: "outline",
        OVERTIME: "secondary",
    };
    return variants[category] || "secondary";
}

// ─── Component Type Dialog ───

function SalaryComponentTypeDialog({
    children,
    editData,
    onSuccess,
}: {
    children: React.ReactNode;
    editData?: Awaited<ReturnType<typeof getAllSalaryComponentTypes>>[number];
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<SalaryComponentTypeForm>({
        resolver: zodResolver(salaryComponentTypeSchema),
        defaultValues: editData
            ? {
                  code: editData.code,
                  name: editData.name,
                  description: editData.description || "",
                  category: editData.category as SalaryComponentTypeForm["category"],
                  isTaxable: editData.isTaxable,
                  isInsurance: editData.isInsurance,
                  isBase: editData.isBase,
                  coefficient: editData.coefficient || undefined,
                  maxAmount: editData.maxAmount || undefined,
                  isActive: editData.isActive,
                  sortOrder: editData.sortOrder,
              }
            : {
                  code: "",
                  name: "",
                  description: "",
                  category: "ALLOWANCE",
                  isTaxable: true,
                  isInsurance: false,
                  isBase: false,
                  isActive: true,
                  sortOrder: 0,
              },
    });

    const onSubmit = async (data: SalaryComponentTypeForm) => {
        setIsLoading(true);
        try {
            if (editData) {
                await updateSalaryComponentType(editData.id, data);
                toast.success("Đã cập nhật loại khoản lương");
            } else {
                await createSalaryComponentType(data);
                toast.success("Đã tạo loại khoản lương mới");
            }
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editData ? "Chỉnh sửa" : "Tạo mới"} loại khoản lương
                    </DialogTitle>
                    <DialogDescription>
                        Định nghĩa các loại khoản lương như phụ cấp, thưởng, khấu trừ...
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="ALLOWANCE" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sortOrder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thứ tự</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Phụ cấp xăng xe" />
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
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Mô tả chi tiết..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            {...field}
                                        >
                                            <option value="BASIC">Lương cơ bản</option>
                                            <option value="ALLOWANCE">Phụ cấp</option>
                                            <option value="BONUS">Thưởng</option>
                                            <option value="DISCIPLINE">Kỷ luật</option>
                                            <option value="DEDUCTION">Khấu trừ</option>
                                            <option value="OVERTIME">Tăng ca</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="isTaxable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Chịu thuế</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isBase"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Lương CB</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Hoạt động</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───

export default function FormulasClient({
    initialData,
}: {
    initialData: Awaited<ReturnType<typeof getAllSalaryComponentTypes>>;
}) {
    const queryClient = useQueryClient();

    const { data: componentTypes, isLoading } = useQuery({
        queryKey: ["salary-component-types"],
        queryFn: getAllSalaryComponentTypes,
        initialData: initialData,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSalaryComponentType,
        onSuccess: () => {
            toast.success("Đã xóa loại khoản lương");
            queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
        },
    });

    // Group by category
    const grouped = componentTypes?.reduce(
        (acc, item) => {
            const cat = item.category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        },
        {} as Record<string, typeof componentTypes>,
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cấu hình lương</h1>
                    <p className="text-muted-foreground">
                        Quản lý các loại khoản lương, phụ cấp, thưởng
                    </p>
                </div>
                <SalaryComponentTypeDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["salary-component-types"] })}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm loại khoản lương
                    </Button>
                </SalaryComponentTypeDialog>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Đang tải...</div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(grouped || {}).map(([category, items]) => (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant={getCategoryBadgeVariant(category)}>
                                        {getCategoryLabel(category)}
                                    </Badge>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({items.length} khoản)
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã</TableHead>
                                            <TableHead>Tên</TableHead>
                                            <TableHead>Mô tả</TableHead>
                                            <TableHead>Chịu thuế</TableHead>
                                            <TableHead>Hoạt động</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {item.code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.description || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.isTaxable ? "Có" : "Không"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.isActive ? "Có" : "Không"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <SalaryComponentTypeDialog
                                                            editData={item}
                                                            onSuccess={() =>
                                                                queryClient.invalidateQueries({
                                                                    queryKey: ["salary-component-types"],
                                                                })
                                                            }
                                                        >
                                                            <Button variant="ghost" size="icon">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </SalaryComponentTypeDialog>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteMutation.mutate(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

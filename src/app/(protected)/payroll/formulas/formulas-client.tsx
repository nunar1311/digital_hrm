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
import { Plus, Pencil, Trash2, Settings, Loader2, Layers, Banknote, Gift, AlertTriangle, Minus, Shield, Receipt, Clock } from "lucide-react";

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
  isTaxable: z.boolean(),
  isInsurance: z.boolean(),
  isBase: z.boolean(),
  coefficient: z.number().optional(),
  maxAmount: z.number().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

type SalaryComponentTypeForm = z.infer<typeof salaryComponentTypeSchema>;

// ─── Helpers ───

function getCategoryConfig(category: string) {
  const configs: Record<string, { label: string; icon: typeof Banknote; bg: string; color: string; badgeClass: string }> = {
    BASIC: { label: "Lương cơ bản", icon: Banknote, bg: "bg-blue-50", color: "text-blue-600", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
    ALLOWANCE: { label: "Phụ cấp", icon: Layers, bg: "bg-emerald-50", color: "text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    BONUS: { label: "Thưởng", icon: Gift, bg: "bg-violet-50", color: "text-violet-600", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
    DISCIPLINE: { label: "Kỷ luật", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600", badgeClass: "bg-red-50 text-red-700 border-red-200" },
    DEDUCTION: { label: "Khấu trừ", icon: Minus, bg: "bg-orange-50", color: "text-orange-600", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
    INSURANCE: { label: "Bảo hiểm", icon: Shield, bg: "bg-rose-50", color: "text-rose-600", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
    TAX: { label: "Thuế", icon: Receipt, bg: "bg-amber-50", color: "text-amber-600", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
    OVERTIME: { label: "Tăng ca", icon: Clock, bg: "bg-cyan-50", color: "text-cyan-600", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  };
  return configs[category] || { label: category, icon: Settings, bg: "bg-slate-50", color: "text-slate-600", badgeClass: "" };
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
    defaultValues: {
      code: editData?.code || "",
      name: editData?.name || "",
      description: editData?.description || "",
      category: editData?.category as SalaryComponentTypeForm["category"],
      isTaxable: editData?.isTaxable || false,
      isInsurance: editData?.isInsurance || false,
      isBase: editData?.isBase || false,
      //   coefficient: editData?.coefficient || 0,
      //   maxAmount: editData?.maxAmount || 0,
      isActive: editData?.isActive || false,
      sortOrder: editData?.sortOrder || 0,
    },
  });

  const onSubmit = async (data: SalaryComponentTypeForm) => {
    setIsLoading(true);
    setOpen(false);
    try {
      if (editData) {
        await updateSalaryComponentType(editData.id, data);
        toast.success("Đã cập nhật loại khoản lương");
      } else {
        await createSalaryComponentType(data);
        toast.success("Đã tạo loại khoản lương mới");
      }
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
      setOpen(true);
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["salary-component-types"] });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã xóa loại khoản lương");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    }
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
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-violet-500/5 via-primary/5 to-emerald-500/5">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-100">
                <Settings className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Cấu hình lương</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Quản lý các loại khoản lương, phụ cấp, thưởng
                </p>
              </div>
            </div>
            <SalaryComponentTypeDialog
              onSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: ["salary-component-types"],
                })
              }
            >
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Thêm loại khoản lương
              </Button>
            </SalaryComponentTypeDialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.entries(grouped || {}).map(([category, items]) => {
              const cfg = getCategoryConfig(category);
              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <span>{cfg.label}</span>
                      <Badge variant="outline" className={`text-xs ${cfg.badgeClass}`}>
                        {items.length} khoản
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-b-lg border-t overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Mã</TableHead>
                            <TableHead className="font-semibold">Tên</TableHead>
                            <TableHead className="font-semibold">Mô tả</TableHead>
                            <TableHead className="font-semibold text-center">Chịu thuế</TableHead>
                            <TableHead className="font-semibold text-center">Hoạt động</TableHead>
                            <TableHead className="font-semibold text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id} className="group">
                              <TableCell className="font-mono text-sm">
                                {item.code}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {item.description || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={item.isTaxable ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500"}>
                                  {item.isTaxable ? "Có" : "Không"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-500 border-red-200"}>
                                  {item.isActive ? "Có" : "Không"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <SalaryComponentTypeDialog
                                    editData={item}
                                    onSuccess={() =>
                                      queryClient.invalidateQueries({
                                        queryKey: ["salary-component-types"],
                                      })
                                    }
                                  >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </SalaryComponentTypeDialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

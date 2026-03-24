"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Eye,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createPayrollRecord } from "@/app/(protected)/payroll/actions";
import type { PayrollRecord } from "@/app/(protected)/payroll/types";

const createPayrollSchema = z.object({
  month: z.string().min(1, "Tháng không được trống"),
  year: z.string().min(1, "Năm không được trống"),
  departmentId: z.string().optional(),
  standardWorkDays: z.number().min(1).max(31),
});

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

interface CreatePayrollDialogProps {
  children: React.ReactNode;
  departments: { id: string; name: string }[];
  onSuccess?: (record: PayrollRecord) => void;
}

export function CreatePayrollDialog({
  children,
  departments,
  onSuccess,
}: CreatePayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    employeeCount: number;
    estimatedGross: number;
    estimatedNet: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const form = useForm<CreatePayrollForm>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: {
      month: String(new Date().getMonth() + 1),
      year: String(currentYear),
      departmentId: undefined,
      standardWorkDays: 22,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      month: number;
      year: number;
      departmentId?: string;
    }) => {
      const result = await createPayrollRecord(data);
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Đã tạo bảng lương tháng ${result.month}/${result.year}`);
      setOpen(false);
      setShowPreview(false);
      setPreviewData(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
      //   onSuccess?.(result );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tạo bảng lương",
      );
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const response = await fetch(
        "/api/payroll/preview?" +
          new URLSearchParams({
            month: values.month,
            year: values.year,
            departmentId: values.departmentId || "",
          }),
      );
      if (!response.ok) throw new Error("Lỗi khi xem trước");
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
    onError: () => {
      toast.error("Không thể xem trước. Vui lòng thử lại.");
    },
  });

  const onSubmit = (data: CreatePayrollForm) => {
    createMutation.mutate({
      month: parseInt(data.month),
      year: parseInt(data.year),
      departmentId: data.departmentId === "all" ? undefined : data.departmentId,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedDepartment = form.watch("departmentId");
  const selectedDepartmentName =
    selectedDepartment && selectedDepartment !== "all"
      ? departments.find((d) => d.id === selectedDepartment)?.name
      : "Toàn công ty";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tạo bảng lương mới
          </DialogTitle>
          <DialogDescription>
            Tính lương cho nhân viên trong tháng. Hệ thống sẽ tự động tính toán
            các khoản BHXH, BHYT, BHTN và thuế TNCN.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tháng</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tháng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            Tháng {m}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn năm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phòng ban (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Toàn công ty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Toàn công ty</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
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
              name="standardWorkDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số ngày công chuẩn (mặc định: 22)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="22"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 22)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPreview && previewData && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Xem trước bảng lương
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Số nhân viên
                      </p>
                      <p className="font-semibold">
                        {previewData.employeeCount}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tổng Gross ước tính
                    </p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(previewData.estimatedGross)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tổng Net ước tính
                    </p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(previewData.estimatedNet)}
                    </p>
                  </div>
                </div>

                {previewData.employeeCount === 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Không có nhân viên nào trong phạm vi này
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              {!showPreview ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => previewMutation.mutate()}
                    disabled={
                      previewMutation.isPending || !form.formState.isValid
                    }
                  >
                    {previewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xem trước...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Xem trước
                      </>
                    )}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Tạo bảng lương
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => onSubmit(form.getValues())}
                    disabled={
                      createMutation.isPending ||
                      previewData?.employeeCount === 0
                    }
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Xác nhận tạo
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

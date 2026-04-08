"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Users, AlertCircle, Loader2, Plus } from "lucide-react";
import {
  createPayrollRecord,
  getDepartmentsForPayroll,
  previewPayroll,
} from "@/app/(protected)/payroll/actions";

const createPayrollSchema = z.object({
  month: z.string().min(1, "Tháng không được trống"),
  year: z.string().min(1, "Năm không được trống"),
  departmentId: z.string().optional(),
  standardWorkDays: z.number().min(1).max(31),
});

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

export function CreatePayrollDialog() {
  const [open, setOpen] = useState(false);
  const [enablePreview, setEnablePreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartmentsForPayroll,
  });

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

  const watchMonth = form.watch("month");
  const watchYear = form.watch("year");
  const watchDepartmentId = form.watch("departmentId");

  const { data: previewData, isFetching: isPreviewFetching } = useQuery({
    queryKey: ["payroll-preview", watchMonth, watchYear, watchDepartmentId],
    queryFn: async () => {
      const values = form.getValues();
      return previewPayroll({
        month: parseInt(values.month),
        year: parseInt(values.year),
        departmentId:
          values.departmentId === "all" || !values.departmentId
            ? undefined
            : values.departmentId,
      });
    },
    enabled: enablePreview,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePayrollForm) => {
      const record = await createPayrollRecord({
        month: parseInt(data.month),
        year: parseInt(data.year),
        departmentId:
          data.departmentId === "all" || !data.departmentId
            ? undefined
            : data.departmentId,
      });
      return record;
    },
    onSuccess: (record, data) => {
      toast.success(`Đã tạo bảng lương tháng ${data.month}/${data.year}`);
      setEnablePreview(false);
      setOpen(false);
      form.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tạo bảng lương",
      );
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = () => {
    createMutation.mutate(form.getValues());
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEnablePreview(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="xs" onClick={() => setOpen(true)}>
          <Plus /> Tạo bảng lương mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo bảng lương mới</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tính lương cho nhân viên trong tháng. Hệ thống sẽ tự động tính toán
            các khoản BHXH, BHYT, BHTN và thuế TNCN.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                  <div className="flex items-center gap-3">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
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
                  </div>
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

            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Xem trước bảng lương</span>
                  {isPreviewFetching && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    size="sm"
                    id="enable-preview"
                    checked={enablePreview}
                    onCheckedChange={setEnablePreview}
                  />
                  <label
                    htmlFor="enable-preview"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Preview
                  </label>
                </div>
              </div>
              {enablePreview && (
                <>
                  {isPreviewFetching ? (
                    <div className="text-center py-3 text-sm text-muted-foreground">
                      Đang tải dữ liệu preview...
                    </div>
                  ) : previewData ? (
                    <>
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
                    </>
                  ) : null}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  (enablePreview && previewData?.employeeCount === 0)
                }
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>Tạo bảng lương</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

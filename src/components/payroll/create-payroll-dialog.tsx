"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createPayrollRecord } from "@/app/[locale]/(protected)/payroll/actions";
import type { PayrollRecord } from "@/app/[locale]/(protected)/payroll/types";

const createPayrollSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    month: z.string().min(1, t("payrollCreateValidationMonthRequired")),
    year: z.string().min(1, t("payrollCreateValidationYearRequired")),
    departmentId: z.string().optional(),
    standardWorkDays: z.number().min(1).max(31),
  });

type CreatePayrollForm = z.infer<ReturnType<typeof createPayrollSchema>>;

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
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
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
    resolver: zodResolver(createPayrollSchema(t)),
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      setOpen(false);
      setShowPreview(false);
      return {};
    },
    onSuccess: (result) => {
      toast.success(t("payrollCreateToastSuccess", { month: result.month, year: result.year }));
      onSuccess?.(result as PayrollRecord);
      setPreviewData(null);
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("payrollCreateToastError"),
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    }
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
      if (!response.ok) throw new Error(t("payrollCreatePreviewError"));
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
    onError: () => {
      toast.error(t("payrollCreatePreviewRetry"));
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
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("payrollCreateTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("payrollCreateDescription")}
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
                    <FormLabel>{t("payrollMonth")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("payrollCreateSelectMonth")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {t("payrollCreateMonthOption", { month: m })}
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
                    <FormLabel>{t("payrollYear")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("payrollCreateSelectYear")} />
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
                  <FormLabel>{t("payrollCreateDepartmentOptional")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("payrollWholeCompany")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">{t("payrollWholeCompany")}</SelectItem>
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
                  <FormLabel>{t("payrollCreateStandardWorkDays")}</FormLabel>
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
                  {t("payrollCreatePreviewTitle")}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("payrollSummaryTotalEmployees")}
                      </p>
                      <p className="font-semibold">
                        {previewData.employeeCount}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("payrollCreateEstimatedGross")}
                    </p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(previewData.estimatedGross)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("payrollCreateEstimatedNet")}
                    </p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(previewData.estimatedNet)}
                    </p>
                  </div>
                </div>

                {previewData.employeeCount === 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {t("payrollCreateNoEmployees")}
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
                        {t("payrollCreatePreviewing")}
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("payrollCreatePreview")}
                      </>
                    )}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("payrollCreating")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t("payrollCreateSubmit")}
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
                    {t("payrollCreateBack")}
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
                        {t("payrollCreating")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t("payrollCreateConfirm")}
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


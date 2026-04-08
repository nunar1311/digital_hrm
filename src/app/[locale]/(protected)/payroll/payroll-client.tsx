"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  getPayrollRecords,
  createPayrollRecord,
  deletePayrollRecord,
  exportPayrollRecord,
} from "./actions";
import { Plus, Trash2, Eye, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Schema ───

const createPayrollSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    month: z.string().min(1, t("payrollValidationMonthRequired")),
    year: z.string().min(1, t("payrollValidationYearRequired")),
    departmentId: z.string().optional(),
  });

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

// ─── Components ───

function formatCurrency(
  amount: number | bigint | unknown,
  locale: string,
): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">{t("payrollStatusDraft")}</Badge>;
    case "PROCESSING":
      return <Badge variant="outline">{t("payrollStatusProcessing")}</Badge>;
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-600">
          {t("payrollStatusCompleted")}
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">{t("payrollStatusCancelled")}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

// ─── Create Payroll Dialog ───

function CreatePayrollDialog({
  children,
  departments,
  onSuccess,
}: {
  children: React.ReactNode;
  departments: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const t = useTranslations("ProtectedPages");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: {
      month: number;
      year: number;
      departmentId?: string;
    }) => createPayrollRecord(data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      setOpen(false);
      return {};
    },
    onSuccess: (result) => {
      toast.success(
        t("payrollCreateSuccess", { month: result.month, year: result.year }),
      );
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("payrollCreateError"),
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    }
  });

  const form = useForm<CreatePayrollForm>({
    resolver: zodResolver(createPayrollSchema(t)),
    defaultValues: {
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      departmentId: "all",
    },
  });

  const onSubmit = (data: CreatePayrollForm) => {
    createMutation.mutate({
      month: parseInt(data.month),
      year: parseInt(data.year),
      departmentId: data.departmentId === "all" ? undefined : data.departmentId,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("payrollCreateDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("payrollCreateDialogDescription")}
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
                          <SelectValue placeholder={t("payrollSelectMonth")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {t("payrollMonthOption", { month: m })}
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
                          <SelectValue placeholder={t("payrollSelectYear")} />
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
                  <FormLabel>{t("payrollDepartmentOptional")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "all"}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("payrollCancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t("payrollCreating")
                  : t("payrollCreate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payroll Records Table ───

function PayrollRecordsTable({
  records,
  onDelete,
  onExport,
}: {
  records: Awaited<ReturnType<typeof getPayrollRecords>>;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
  const router = useRouter();

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSpreadsheet className="mx-auto h-12 w-12 opacity-50" />
        <h3 className="mt-4 text-lg font-semibold">{t("payrollEmptyTitle")}</h3>
        <p className="mt-2 text-sm">{t("payrollEmptyDescription")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("payrollHeadMonthYear")}</TableHead>
          <TableHead>{t("payrollHeadDepartment")}</TableHead>
          <TableHead>{t("payrollHeadEmployeeCount")}</TableHead>
          <TableHead className="text-right">{t("payrollHeadTotalGross")}</TableHead>
          <TableHead className="text-right">{t("payrollHeadTotalNet")}</TableHead>
          <TableHead className="text-right">{t("payrollHeadTax")}</TableHead>
          <TableHead className="text-right">{t("payrollHeadInsurance")}</TableHead>
          <TableHead>{t("payrollHeadStatus")}</TableHead>
          <TableHead className="text-right">{t("payrollHeadActions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {t("payrollMonthYear", { month: record.month, year: record.year })}
            </TableCell>
            <TableCell>
              {record.departments.join(", ") || t("payrollWholeCompany")}
            </TableCell>
            <TableCell>{record.totalEmployees}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalGross, locale)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalNet, locale)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalTax, locale)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalInsurance, locale)}
            </TableCell>
            <TableCell>{getStatusBadge(record.status, t)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onExport(record.id)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/payroll/${record.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {record.status !== "COMPLETED" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Main Component ───

export default function PayrollClient({
  initialRecords,
  departments,
}: {
  initialRecords: Awaited<ReturnType<typeof getPayrollRecords>>;
  departments: { id: string; name: string }[];
}) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const { data: records, isLoading } = useQuery({
    queryKey: ["payroll-records", filterStatus, filterDepartment],
    queryFn: () =>
      getPayrollRecords({
        status: filterStatus === "all" ? undefined : filterStatus,
        departmentId: filterDepartment === "all" ? undefined : filterDepartment,
      }),
    initialData: initialRecords,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayrollRecord,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      return {};
    },
    onSuccess: () => {
      toast.success(t("payrollDeleteSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollDeleteError"));
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    }
  });

  const exportMutation = useMutation({
    mutationFn: exportPayrollRecord,
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("payrollExportSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollExportError"));
    },
  });

  // Calculate summary
  const summary = records?.reduce(
    (acc, r) => ({
      totalEmployees: acc.totalEmployees + r.totalEmployees,
      totalGross: acc.totalGross + Number(r.totalGross),
      totalNet: acc.totalNet + Number(r.totalNet),
      totalTax: acc.totalTax + Number(r.totalTax),
      totalInsurance: acc.totalInsurance + Number(r.totalInsurance),
    }),
    {
      totalEmployees: 0,
      totalGross: 0,
      totalNet: 0,
      totalTax: 0,
      totalInsurance: 0,
    },
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("payrollTitle")}</h1>
          <p className="text-muted-foreground">{t("payrollDescription")}</p>
        </div>
        <CreatePayrollDialog
          departments={departments}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["payroll-records"] })
          }
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("payrollCreate")}
          </Button>
        </CreatePayrollDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalEmployees")}</CardDescription>
            <CardTitle className="text-2xl">
              {summary?.totalEmployees || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalGross")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalGross || 0, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalNet")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalNet || 0, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalTax")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalTax || 0, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalInsurance")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalInsurance || 0, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("payrollFilterDepartment")}/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("payrollFilterAllDepartments")}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("payrollFilterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("payrollFilterAll")}</SelectItem>
            <SelectItem value="DRAFT">{t("payrollStatusDraft")}</SelectItem>
            <SelectItem value="PROCESSING">{t("payrollStatusProcessing")}</SelectItem>
            <SelectItem value="COMPLETED">{t("payrollStatusCompleted")}</SelectItem>
            <SelectItem value="CANCELLED">{t("payrollStatusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("payrollListTitle")}</CardTitle>
          <CardDescription>
            {t("payrollListCount", { count: records?.length || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{t("payrollLoading")}</div>
            </div>
          ) : (
            <PayrollRecordsTable
              records={records || []}
              onDelete={(id) => deleteMutation.mutate(id)}
              onExport={(id) => exportMutation.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

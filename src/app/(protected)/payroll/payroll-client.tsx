"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import {
  Plus,
  Trash2,
  Eye,
  FileSpreadsheet,
  Wallet,
  Users,
  TrendingUp,
  Shield,
  Receipt,
  ArrowRight,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Schema ───

const createPayrollSchema = z.object({
  month: z.string().min(1, "Tháng không được trống"),
  year: z.string().min(1, "Năm không được trống"),
  departmentId: z.string().optional(),
});

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

// ─── Helpers ───

function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

function getStatusConfig(status: string) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Nháp",
        className:
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
      };
    case "PROCESSING":
      return {
        label: "Đang xử lý",
        className:
          "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      };
    default:
      return { label: status, className: "" };
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
      toast.success(`Đã tạo bảng lương tháng ${result.month}/${result.year}`);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tạo bảng lương",
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
  });

  const form = useForm<CreatePayrollForm>({
    resolver: zodResolver(createPayrollSchema),
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Tạo bảng lương mới
          </DialogTitle>
          <DialogDescription>
            Tính lương cho nhân viên trong tháng. Hệ thống sẽ tự động tính thuế
            TNCN và bảo hiểm.
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
                    defaultValue={field.value || "all"}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tính lương...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo bảng lương
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Chart Component ───

function PayrollChart({
  records,
}: {
  records: Awaited<ReturnType<typeof getPayrollRecords>>;
}) {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const sorted = [...records]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .slice(-12);

    return sorted.map((r) => ({
      name: `T${r.month}/${r.year}`,
      gross: Number(r.totalGross),
      net: Number(r.totalNet),
      tax: Number(r.totalTax),
      insurance: Number(r.totalInsurance),
    }));
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BarChart3 className="h-10 w-10 opacity-30 mb-3" />
        <p className="text-sm">Chưa có dữ liệu để hiển thị biểu đồ</p>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v) => formatCurrencyShort(v)}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="gross"
          name="Gross"
          fill="hsl(221, 83%, 53%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
        <Bar
          dataKey="net"
          name="Net"
          fill="hsl(142, 71%, 45%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
        <Bar
          dataKey="tax"
          name="Thuế"
          fill="hsl(38, 92%, 50%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Summary Stats Cards ───

function SummaryCards({
  summary,
}: {
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    totalTax: number;
    totalInsurance: number;
  };
}) {
  const stats = [
    {
      label: "Tổng nhân viên",
      value: summary.totalEmployees.toString(),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Tổng lương Gross",
      value: formatCurrency(summary.totalGross),
      icon: TrendingUp,
      gradient: "from-violet-500 to-violet-600",
      bgLight: "bg-violet-50",
      textColor: "text-violet-600",
    },
    {
      label: "Tổng lương Net",
      value: formatCurrency(summary.totalNet),
      icon: Wallet,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Tổng thuế TNCN",
      value: formatCurrency(summary.totalTax),
      icon: Receipt,
      gradient: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Tổng BH",
      value: formatCurrency(summary.totalInsurance),
      icon: Shield,
      gradient: "from-rose-500 to-rose-600",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="group hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform duration-200`}
              >
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </p>
                <p
                  className={`text-lg font-bold ${stat.textColor} truncate`}
                  title={stat.value}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
  const router = useRouter();

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/50 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Chưa có bảng lương
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Tạo bảng lương đầu tiên để bắt đầu tính lương cho nhân viên
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-semibold">Kỳ lương</TableHead>
            <TableHead className="font-semibold">Phòng ban</TableHead>
            <TableHead className="font-semibold text-center">Số NV</TableHead>
            <TableHead className="font-semibold text-right">
              Tổng Gross
            </TableHead>
            <TableHead className="font-semibold text-right">Tổng Net</TableHead>
            <TableHead className="font-semibold text-right">
              Thuế TNCN
            </TableHead>
            <TableHead className="font-semibold text-right">Bảo hiểm</TableHead>
            <TableHead className="font-semibold">Trạng thái</TableHead>
            <TableHead className="font-semibold text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const statusConfig = getStatusConfig(record.status);
            return (
              <TableRow
                key={record.id}
                className="cursor-pointer group"
                onClick={() => router.push(`/payroll/${record.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      T{record.month}
                    </div>
                    <div>
                      <p className="font-medium">
                        Tháng {record.month}/{record.year}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {record.departments?.length
                    ? record.departments.join(", ")
                    : "Toàn công ty"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-mono">
                    {record.totalEmployees}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  {formatCurrency(record.totalGross)}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">
                  {formatCurrency(record.totalNet)}
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  {formatCurrency(record.totalTax)}
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  {formatCurrency(record.totalInsurance)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onExport(record.id)}
                      title="Xuất CSV"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/payroll/${record.id}`)}
                      title="Xem chi tiết"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    {record.status !== "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        onClick={() => onDelete(record.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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
      toast.success("Đã xóa bảng lương");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
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
      toast.success("Đã xuất file CSV");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xuất file");
    },
  });

  // Calculate summary
  const summary = useMemo(
    () =>
      records?.reduce(
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
      ) || {
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        totalTax: 0,
        totalInsurance: 0,
      },
    [records],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b h-10 p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-lg font-bold">Bảng lương</h1>

          {/* <CreatePayrollDialog
            departments={departments}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["payroll-records"] })
            }
          >
            <Button size="default" className="gap-2 shadow-sm">
              <Plus />
              Tạo bảng lương
            </Button>
          </CreatePayrollDialog> */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  So sánh Gross / Net theo tháng
                </CardTitle>
                <CardDescription>
                  Biểu đồ tổng hợp các kỳ lương gần nhất
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PayrollChart records={records || []} />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Lọc phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT">Nháp</SelectItem>
              <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {records?.length || 0} bảng lương
          </span>
        </div>

        {/* Records Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    </div>
  );
}

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

const createPayrollSchema = z.object({
  month: z.string().min(1, "Tháng không được trống"),
  year: z.string().min(1, "Năm không được trống"),
  departmentId: z.string().optional(),
});

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

// ─── Components ───

function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Nháp</Badge>;
    case "PROCESSING":
      return <Badge variant="outline">Đang xử lý</Badge>;
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-600">
          Hoàn thành
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Đã hủy</Badge>;
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
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: {
      month: number;
      year: number;
      departmentId?: string;
    }) => createPayrollRecord(data),
    onSuccess: (result) => {
      toast.success(`Đã tạo bảng lương tháng ${result.month}/${result.year}`);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tạo bảng lương",
      );
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo bảng lương mới</DialogTitle>
          <DialogDescription>
            Tính lương cho nhân viên trong tháng
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
                {createMutation.isPending ? "Đang tạo..." : "Tạo bảng lương"}
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
  const router = useRouter();

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSpreadsheet className="mx-auto h-12 w-12 opacity-50" />
        <h3 className="mt-4 text-lg font-semibold">Chưa có bảng lương</h3>
        <p className="mt-2 text-sm">Tạo bảng lương đầu tiên để bắt đầu</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tháng/Năm</TableHead>
          <TableHead>Phòng ban</TableHead>
          <TableHead>Số NV</TableHead>
          <TableHead className="text-right">Tổng Gross</TableHead>
          <TableHead className="text-right">Tổng Net</TableHead>
          <TableHead className="text-right">Thuế TNCN</TableHead>
          <TableHead className="text-right">BH</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              Tháng {record.month}/{record.year}
            </TableCell>
            <TableCell>
              {record.departments.join(", ") ?? "Toàn công ty"}
            </TableCell>
            <TableCell>{record.totalEmployees}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalGross)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalNet)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalTax)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(record.totalInsurance)}
            </TableCell>
            <TableCell>{getStatusBadge(record.status)}</TableCell>
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
    onSuccess: () => {
      toast.success("Đã xóa bảng lương");
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
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
          <h1 className="text-2xl font-bold tracking-tight">Bảng lương</h1>
          <p className="text-muted-foreground">
            Quản lý và tính lương nhân viên
          </p>
        </div>
        <CreatePayrollDialog
          departments={departments}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["payroll-records"] })
          }
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo bảng lương
          </Button>
        </CreatePayrollDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng nhân viên</CardDescription>
            <CardTitle className="text-2xl">
              {summary?.totalEmployees || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng lương Gross</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalGross || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng lương Net</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalNet || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng thuế TNCN</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalTax || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng BH</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary?.totalInsurance || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
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
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bảng lương</CardTitle>
          <CardDescription>{records?.length || 0} bảng lương</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Đang tải...</div>
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

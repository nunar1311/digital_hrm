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
} from "@/components/ui/dialog";
import { getPayrollConfigs, setPayrollConfig } from "../actions";
import {
  Shield,
  Heart,
  Briefcase,
  Clock,
  User,
  Users,
  Pencil,
  Save,
  Loader2,
  Scale,
  TrendingUp,
} from "lucide-react";

// ─── Tax Brackets ───

const TAX_BRACKETS = [
  { level: 1, range: "Đến 5 triệu", rate: "5%", deduction: "0" },
  { level: 2, range: "5 - 10 triệu", rate: "10%", deduction: "250,000" },
  { level: 3, range: "10 - 18 triệu", rate: "15%", deduction: "750,000" },
  { level: 4, range: "18 - 32 triệu", rate: "20%", deduction: "1,650,000" },
  { level: 5, range: "32 - 52 triệu", rate: "25%", deduction: "3,250,000" },
  { level: 6, range: "52 - 78 triệu", rate: "30%", deduction: "5,850,000" },
  { level: 7, range: "Trên 78 triệu", rate: "35%", deduction: "9,850,000" },
];

// ─── Default Config Values ───

const DEFAULT_CONFIGS = [
  {
    key: "SOCIAL_INSURANCE_RATE",
    name: "Tỷ lệ BHXH (NLĐ)",
    description: "Tỷ lệ BHXH trích từ lương người lao động",
    defaultValue: 8,
    unit: "%",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "HEALTH_INSURANCE_RATE",
    name: "Tỷ lệ BHYT (NLĐ)",
    description: "Tỷ lệ BHYT trích từ lương người lao động",
    defaultValue: 1.5,
    unit: "%",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    key: "UNEMPLOYMENT_INSURANCE_RATE",
    name: "Tỷ lệ BHTN (NLĐ)",
    description: "Tỷ lệ BHTN trích từ lương người lao động",
    defaultValue: 1,
    unit: "%",
    icon: Briefcase,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "OVERTIME_RATE",
    name: "Hệ số tăng ca",
    description: "Hệ số tính tiền tăng ca (mặc định: 1.5)",
    defaultValue: 1.5,
    unit: "x",
    icon: Clock,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    key: "PERSONAL_DEDUCTION",
    name: "Giảm trừ cá nhân",
    description: "Mức giảm trừ gia cảnh cá nhân hàng tháng",
    defaultValue: 11000000,
    unit: "₫",
    icon: User,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "DEPENDENT_DEDUCTION",
    name: "Giảm trừ người phụ thuộc",
    description: "Mức giảm trừ cho mỗi người phụ thuộc",
    defaultValue: 4400000,
    unit: "₫",
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

// ─── Edit Dialog ───

function ConfigEditDialog({
  config,
  currentValue,
  onSave,
  isPending,
}: {
  config: (typeof DEFAULT_CONFIGS)[number];
  currentValue: number;
  onSave: (value: number) => void;
  isPending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(currentValue));

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setValue(String(currentValue));
          setOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
              <config.icon className={`h-4 w-4 ${config.color}`} />
            </div>
            {config.name}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step={config.unit === "%" ? "0.1" : "1"}
              className="text-lg font-mono"
            />
            <span className="text-lg font-medium text-muted-foreground min-w-[30px]">
              {config.unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Giá trị mặc định: {config.defaultValue} {config.unit}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───

export default function TaxInsuranceClient({
  initialData,
}: {
  initialData: Awaited<ReturnType<typeof getPayrollConfigs>>;
}) {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["payroll-configs"],
    queryFn: getPayrollConfigs,
    initialData: initialData,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      return setPayrollConfig({
        key,
        value,
        description: DEFAULT_CONFIGS.find((c) => c.key === key)?.name || key,
        effectiveDate: new Date().toISOString(),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-configs"] });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã lưu cấu hình");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
      queryClient.invalidateQueries({ queryKey: ["payroll-configs"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-configs"] });
    },
  });

  const configMap = new Map(
    (configs || []).map((c) => [c.key, Number(c.value)])
  );

  const formatValue = (key: string, value: number | undefined) => {
    const config = DEFAULT_CONFIGS.find((c) => c.key === key);
    if (!config) return value;
    if (config.unit === "%") return `${value || config.defaultValue}%`;
    if (config.unit === "x") return `${value || config.defaultValue}x`;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value || config.defaultValue);
  };

  const handleUpdate = (key: string, value: number) => {
    updateMutation.mutate({ key, value });
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-rose-500/5 via-primary/5 to-amber-500/5">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100">
              <Scale className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Thuế & Bảo hiểm
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cấu hình các thông số thuế TNCN và bảo hiểm bắt buộc
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Insurance Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">BHXH</p>
                  <div className="text-sm space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                      >
                        NLĐ: 8%
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-600 text-xs"
                      >
                        NSDLĐ: 17%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 group-hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5 text-rose-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">BHYT</p>
                  <div className="text-sm space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 border-rose-200 text-xs"
                      >
                        NLĐ: 1.5%
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-600 text-xs"
                      >
                        NSDLĐ: 3%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">BHTN</p>
                  <div className="text-sm space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                      >
                        NLĐ: 1%
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-600 text-xs"
                      >
                        NSDLĐ: 1%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Brackets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-amber-50">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              Biểu thuế TNCN lũy tiến
            </CardTitle>
            <CardDescription>
              Biểu thuế áp dụng theo Luật Thuế thu nhập cá nhân
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg border-t overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-center w-20">
                      Bậc
                    </TableHead>
                    <TableHead className="font-semibold">
                      Thu nhập tính thuế / tháng
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Thuế suất
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Số tiền giảm trừ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TAX_BRACKETS.map((bracket) => (
                    <TableRow key={bracket.level}>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {bracket.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {bracket.range}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 font-mono"
                        >
                          {bracket.rate}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {bracket.deduction} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Configurable Values */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              Cấu hình hệ thống
            </CardTitle>
            <CardDescription>
              Các thông số dùng để tính lương hàng tháng. Bấm chỉnh sửa để thay
              đổi.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-b-lg border-t overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Thông số</TableHead>
                      <TableHead className="font-semibold">Mô tả</TableHead>
                      <TableHead className="font-semibold text-right">
                        Giá trị hiện tại
                      </TableHead>
                      <TableHead className="font-semibold text-right w-20">
                        Sửa
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_CONFIGS.map((config) => {
                      const currentValue =
                        configMap.get(config.key) ?? config.defaultValue;
                      return (
                        <TableRow key={config.key} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                <config.icon
                                  className={`h-4 w-4 ${config.color}`}
                                />
                              </div>
                              <span className="font-medium">{config.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {config.description}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="font-mono text-sm"
                            >
                              {formatValue(config.key, currentValue)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ConfigEditDialog
                              config={config}
                              currentValue={currentValue}
                              onSave={(value) =>
                                handleUpdate(config.key, value)
                              }
                              isPending={updateMutation.isPending}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

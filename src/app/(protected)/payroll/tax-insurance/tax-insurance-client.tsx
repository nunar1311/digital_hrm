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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { getPayrollConfigs, setPayrollConfig } from "../actions";
import { Settings, Save } from "lucide-react";

// ─── Default Config Values ───
const DEFAULT_CONFIGS = [
  {
    key: "SOCIAL_INSURANCE_RATE",
    name: "Tỷ lệ BHXH (NLĐ)",
    description: "Tỷ lệ BHXH trích từ lương người lao động",
    defaultValue: 8,
    unit: "%",
  },
  {
    key: "HEALTH_INSURANCE_RATE",
    name: "Tỷ lệ BHYT (NLĐ)",
    description: "Tỷ lệ BHYT trích từ lương người lao động",
    defaultValue: 1.5,
    unit: "%",
  },
  {
    key: "UNEMPLOYMENT_INSURANCE_RATE",
    name: "Tỷ lệ BHTN (NLĐ)",
    description: "Tỷ lệ BHTN trích từ lương người lao động",
    defaultValue: 1,
    unit: "%",
  },
  {
    key: "OVERTIME_RATE",
    name: "Hệ số tăng ca",
    description: "Hệ số tính tiền tăng ca (mặc định: 1.5)",
    defaultValue: 1.5,
    unit: "x",
  },
  {
    key: "PERSONAL_DEDUCTION",
    name: "Giảm trừ cá nhân",
    description: "Mức giảm trừ gia cảnh cá nhân hàng tháng",
    defaultValue: 11000000,
    unit: "₫",
  },
  {
    key: "DEPENDENT_DEDUCTION",
    name: "Giảm trừ người phụ thuộc",
    description: "Mức giảm trừ cho mỗi người phụ thuộc",
    defaultValue: 4400000,
    unit: "₫",
  },
];

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
    }
  });

  // Create a map of current config values
  const configMap = new Map(
    (configs || []).map((c) => [c.key, Number(c.value)]),
  );

  const formatValue = (key: string, value: number | undefined) => {
    const config = DEFAULT_CONFIGS.find((c) => c.key === key);
    if (!config) return value;

    if (config.unit === "%") {
      return `${value || config.defaultValue}%`;
    }
    if (config.unit === "x") {
      return `${value || config.defaultValue}x`;
    }
    // VND
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thuế & Bảo hiểm</h1>
        <p className="text-muted-foreground">
          Cấu hình các thông số thuế TNCN và bảo hiểm bắt buộc
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Thông số theo quy định 2024
          </CardTitle>
          <CardDescription>
            Các mức quy định hiện hành của Luật BHXH, Luật Thuế TNCN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHXH</h4>
              <p className="text-sm text-muted-foreground">
                Người lao động: 8%
                <br />
                Người sử dụng lao động: 17%
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHYT</h4>
              <p className="text-sm text-muted-foreground">
                Người lao động: 1.5%
                <br />
                Người sử dụng lao động: 3%
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHTN</h4>
              <p className="text-sm text-muted-foreground">
                Người lao động: 1%
                <br />
                Người sử dụng lao động: 1%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình hệ thống</CardTitle>
          <CardDescription>
            Các thông số dùng để tính lương hàng tháng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Đang tải...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thông số</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Giá trị hiện tại</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEFAULT_CONFIGS.map((config) => {
                  const currentValue =
                    configMap.get(config.key) ?? config.defaultValue;
                  return (
                    <TableRow key={config.key}>
                      <TableCell className="font-medium">
                        {config.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {config.description}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatValue(config.key, currentValue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfigEditDialog
                          config={config}
                          currentValue={currentValue}
                          onSave={(value) => handleUpdate(config.key, value)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Edit Dialog ───

function ConfigEditDialog({
  config,
  currentValue,
  onSave,
}: {
  config: (typeof DEFAULT_CONFIGS)[number];
  currentValue: number;
  onSave: (value: number) => void;
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
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Sửa
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{config.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {config.description}
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                step={config.unit === "%" ? "0.1" : "1"}
              />
              <span className="text-muted-foreground">{config.unit}</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

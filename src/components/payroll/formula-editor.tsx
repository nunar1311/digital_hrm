"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Plus,
  Code,
  Eye,
  Sparkles,
  Hash,
  Percent,
  Type,
  DollarSign,
  Variable,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  FORMULA_VARIABLE_SOURCES,
  type PayrollFormula,
} from "@/app/(protected)/payroll/types";

const formulaSchema = z.object({
  name: z.string().min(1, "Tên công thức không được trống"),
  code: z
    .string()
    .min(1, "Mã công thức không được trống")
    .regex(/^[A-Z0-9_]+$/, "Mã phải viết hoa, không dấu cách"),
  description: z.string().optional(),
  formulaType: z.enum(["EARNING", "DEDUCTION", "TAX", "INSURANCE", "NET"]),
  expression: z.string().min(1, "Biểu thức không được trống"),
});

type FormulaForm = z.infer<typeof formulaSchema>;

interface FormulaEditorProps {
  editData?: PayrollFormula;
  onSave: (data: FormulaForm) => Promise<void>;
  onCancel: () => void;
  onPreview?: (payload: {
    formulaId?: string;
    expression: string;
    sampleData: Record<string, number>;
  }) => Promise<{
    success: boolean;
    result?: number;
    error?: string;
    message?: string;
  }>;
}

export function FormulaEditor({
  editData,
  onSave,
  onCancel,
  onPreview,
}: FormulaEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [previewResult, setPreviewResult] = useState<{
    success: boolean;
    value?: number;
    error?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const sampleData: Record<string, number> = {
    baseSalary: 15000000,
    grossSalary: 18000000,
    netSalary: 14000000,
    workDays: 22,
    standardDays: 22,
    lateDays: 0,
    overtimeHours: 10,
    allowanceAmount: 2000000,
    bonusAmount: 1000000,
    deductionAmount: 500000,
    overtimeAmount: 1500000,
    socialInsurance: 1200000,
    healthInsurance: 225000,
    unemploymentInsurance: 150000,
    totalInsurance: 1575000,
    taxableIncome: 1500000,
    taxAmount: 75000,
    personalDeduction: 11000000,
    dependentDeduction: 4400000,
  };

  const form = useForm<FormulaForm>({
    resolver: zodResolver(formulaSchema),
    defaultValues: editData
      ? {
          name: editData.name,
          code: editData.code,
          description: editData.description || "",
          formulaType: editData.formulaType,
          expression: editData.expression,
        }
      : {
          name: "",
          code: "",
          description: "",
          formulaType: "EARNING",
          expression: "",
        },
  });

  const evaluateExpression = (expr: string): number | string => {
    try {
      const variables: Record<string, number> = { ...sampleData };
      let processedExpr = expr;

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        processedExpr = processedExpr.replace(regex, String(value));
      }

      if (!/^[\d\s+\-*/().]+$/.test(processedExpr)) {
        return "Công thức chứa ký tự không hợp lệ";
      }

      const result = Function(`"use strict"; return (${processedExpr})`)();
      return typeof result === "number" && isFinite(result)
        ? result
        : "Kết quả không hợp lệ";
    } catch {
      return "Công thức không hợp lệ";
    }
  };

  const handlePreview = async () => {
    const expression = form.getValues("expression");

    if (onPreview) {
      setIsPreviewing(true);
      try {
        const result = await onPreview({
          formulaId: editData?.id,
          expression,
          sampleData,
        });

        setPreviewResult({
          success: result.success,
          value: result.success ? result.result : undefined,
          error: result.success
            ? undefined
            : (result.error ?? result.message ?? "Lỗi khi tính công thức"),
        });
      } finally {
        setIsPreviewing(false);
      }
      return;
    }

    const result = evaluateExpression(expression);
    setPreviewResult({
      success: typeof result === "number",
      value: typeof result === "number" ? result : undefined,
      error: typeof result === "string" ? result : undefined,
    });
  };

  const handleInsertVariable = (variableCode: string) => {
    const currentValue = form.getValues("expression");
    form.setValue("expression", `${currentValue}${variableCode}`);
  };

  const handleInsertOperator = (operator: string) => {
    const currentValue = form.getValues("expression");
    form.setValue("expression", `${currentValue}${operator}`);
  };

  const onSubmit = async (data: FormulaForm) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      toast.success(
        editData ? "Đã cập nhật công thức" : "Đã tạo công thức mới",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi lưu công thức",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>
              {editData ? "Chỉnh sửa công thức" : "Tạo công thức mới"}
            </CardTitle>
          </div>
          <Badge
            variant={
              form.watch("formulaType") === "EARNING"
                ? "default"
                : form.watch("formulaType") === "DEDUCTION"
                  ? "destructive"
                  : form.watch("formulaType") === "TAX"
                    ? "outline"
                    : form.watch("formulaType") === "INSURANCE"
                      ? "secondary"
                      : "default"
            }
          >
            {form.watch("formulaType")}
          </Badge>
        </div>
        <CardDescription>
          Xây dựng công thức tính lương với các biến có sẵn
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">
              <Code className="h-4 w-4 mr-2" />
              Biên tập
            </TabsTrigger>
            <TabsTrigger value="variables">
              <Variable className="h-4 w-4 mr-2" />
              Biến số
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Xem trước
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="edit" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên công thức</FormLabel>
                        <FormControl>
                          <Input placeholder="Tiền tăng ca" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã công thức</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="OVERTIME_AMOUNT"
                            className="font-mono"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả công thức..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formulaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại công thức</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại công thức" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EARNING">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Thu nhập (EARNING)
                            </div>
                          </SelectItem>
                          <SelectItem value="DEDUCTION">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Khấu trừ (DEDUCTION)
                            </div>
                          </SelectItem>
                          <SelectItem value="TAX">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Thuế (TAX)
                            </div>
                          </SelectItem>
                          <SelectItem value="INSURANCE">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              Bảo hiểm (INSURANCE)
                            </div>
                          </SelectItem>
                          <SelectItem value="NET">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-purple-500" />
                              Lương Net (NET)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biểu thức công thức</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            placeholder="(baseSalary / standardDays / 8) * overtimeHours * 1.5"
                            className="font-mono h-24 resize-none"
                            {...field}
                          />
                          <div className="absolute right-2 top-2 flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleInsertVariable("baseSalary")}
                            >
                              baseSalary
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() =>
                                handleInsertVariable("overtimeHours")
                              }
                            >
                              overtimeHours
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Sử dụng các biến từ tab &quot;Biến số&quot;
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator(" + ")}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator(" - ")}
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator(" * ")}
                  >
                    ×
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator(" / ")}
                  >
                    ÷
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator("( )")}
                  >
                    ( )
                  </Button>
                  <Separator orientation="vertical" className="h-8" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator("IF( , , )")}
                  >
                    IF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator("MAX( , )")}
                  >
                    MAX
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertOperator("MIN( , )")}
                  >
                    MIN
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu..." : "Lưu công thức"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="mt-4">
                <ScrollArea className="h-100 pr-4">
                  <div className="space-y-4">
                    {Object.entries(FORMULA_VARIABLE_SOURCES).map(
                      ([source, variables]) => (
                        <div key={source}>
                          <div className="flex items-center gap-2 mb-2">
                            {source === "SALARY" && (
                              <DollarSign className="h-4 w-4" />
                            )}
                            {source === "ATTENDANCE" && (
                              <Calendar className="h-4 w-4" />
                            )}
                            {source === "COMPONENT" && (
                              <Plus className="h-4 w-4" />
                            )}
                            {source === "INSURANCE" && (
                              <Percent className="h-4 w-4" />
                            )}
                            {source === "TAX" && <Hash className="h-4 w-4" />}
                            {source === "CONFIG" && (
                              <Type className="h-4 w-4" />
                            )}
                            {source === "CONSTANT" && (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <h4 className="font-medium capitalize">
                              {source.toLowerCase()}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {variables.map((variable) => (
                              <div
                                key={variable.code}
                                className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                onClick={() =>
                                  handleInsertVariable(variable.code)
                                }
                              >
                                <div>
                                  <p className="font-mono text-sm font-medium">
                                    {variable.code}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {variable.name}
                                  </p>
                                </div>
                                {/* {variable.code && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {variable. }
                                                                    </Badge>
                                                                )} */}
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Kết quả xem trước</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      disabled={isPreviewing}
                    >
                      {isPreviewing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Calculator className="h-4 w-4 mr-2" />
                      )}
                      {isPreviewing ? "Đang tính..." : "Tính toán"}
                    </Button>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Công thức:
                        </p>
                        <code className="block bg-background p-2 rounded border font-mono">
                          {form.watch("expression") || "(chưa nhập công thức)"}
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  {previewResult && (
                    <Card
                      className={
                        previewResult.success
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-red-500 bg-red-50 dark:bg-red-950/20"
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          {previewResult.success ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-600">
                                  Kết quả
                                </p>
                                <p className="text-2xl font-bold">
                                  {previewResult.value !== undefined
                                    ? formatCurrency(previewResult.value)
                                    : "N/A"}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-medium text-red-600">Lỗi</p>
                                <p className="text-sm">{previewResult.error}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Dữ liệu mẫu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {Object.entries(sampleData).map(([key, value]) => (
                          <div key={key} className="flex justify-between p-1">
                            <span className="text-muted-foreground font-mono text-xs">
                              {key}:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

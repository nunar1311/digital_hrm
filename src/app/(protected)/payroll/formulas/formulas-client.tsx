"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ListFilter,
  Loader2,
  Banknote,
  Layers,
  Gift,
  AlertTriangle,
  Minus,
  Shield,
  Receipt,
  Clock,
  X,
  MoreHorizontal,
} from "lucide-react";
import {
  getAllSalaryComponentTypes,
  createSalaryComponentType,
  updateSalaryComponentType,
  deleteSalaryComponentType,
  getPayrollFormulas,
  createPayrollFormula,
  updatePayrollFormula,
  deletePayrollFormula,
  togglePayrollFormula,
  previewFormula,
} from "../actions";
import {
  FORMULA_VARIABLE_SOURCES,
  type FormulaType,
  type FormulaVariable,
  type PayrollFormula,
  type SalaryComponentType,
} from "@/app/(protected)/payroll/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormulaEditor } from "@/components/payroll/formula-editor";

// ============================================================
// TYPES
// ============================================================

interface FormulasClientProps {
  initialData: SalaryComponentType[];
  initialFormulas: PayrollFormula[];
}

type CategoryType =
  | "ALL"
  | "BASIC"
  | "ALLOWANCE"
  | "BONUS"
  | "DISCIPLINE"
  | "DEDUCTION"
  | "INSURANCE"
  | "TAX"
  | "OVERTIME";

type PayrollFormulaScreenTab = "COMPONENTS" | "FORMULAS";

// ============================================================
// SCHEMA
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function getCategoryConfig(category: string) {
  const configs: Record<
    string,
    {
      label: string;
      icon: typeof Banknote;
      bg: string;
      color: string;
      badgeClass: string;
    }
  > = {
    BASIC: {
      label: "Lương cơ bản",
      icon: Banknote,
      bg: "bg-blue-50",
      color: "text-blue-600",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    },
    ALLOWANCE: {
      label: "Phụ cấp",
      icon: Layers,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    BONUS: {
      label: "Thưởng",
      icon: Gift,
      bg: "bg-violet-50",
      color: "text-violet-600",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    },
    DISCIPLINE: {
      label: "Kỷ luật",
      icon: AlertTriangle,
      bg: "bg-red-50",
      color: "text-red-600",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    },
    DEDUCTION: {
      label: "Khấu trừ",
      icon: Minus,
      bg: "bg-orange-50",
      color: "text-orange-600",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
    INSURANCE: {
      label: "Bảo hiểm",
      icon: Shield,
      bg: "bg-rose-50",
      color: "text-rose-600",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    },
    TAX: {
      label: "Thuế",
      icon: Receipt,
      bg: "bg-amber-50",
      color: "text-amber-600",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    OVERTIME: {
      label: "Tăng ca",
      icon: Clock,
      bg: "bg-cyan-50",
      color: "text-cyan-600",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
  };
  return (
    configs[category] || {
      label: category,
      icon: Settings,
      bg: "bg-slate-50",
      color: "text-slate-600",
      badgeClass: "",
    }
  );
}

const CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "BASIC", label: "Lương cơ bản" },
  { value: "ALLOWANCE", label: "Phụ cấp" },
  { value: "BONUS", label: "Thưởng" },
  { value: "DISCIPLINE", label: "Kỷ luật" },
  { value: "DEDUCTION", label: "Khấu trừ" },
  { value: "INSURANCE", label: "Bảo hiểm" },
  { value: "TAX", label: "Thuế" },
  { value: "OVERTIME", label: "Tăng ca" },
];

const FORMULA_TYPE_CONFIG: Record<
  FormulaType,
  { label: string; badgeClass: string }
> = {
  EARNING: {
    label: "Thu nhập",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DEDUCTION: {
    label: "Khấu trừ",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  TAX: {
    label: "Thuế",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INSURANCE: {
    label: "Bảo hiểm",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  NET: {
    label: "Lương net",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

type PayrollFormulaPayload = {
  code: string;
  name: string;
  description?: string;
  formulaType: FormulaType;
  category?: string;
  expression: string;
  variables: FormulaVariable[];
  outputField?: string;
  priority: number;
  isActive: boolean;
  isSystem: boolean;
  effectiveDate?: string;
};

type FormulaVariableSource = FormulaVariable["source"];

const VARIABLE_SOURCE_ENTRIES = Object.entries(
  FORMULA_VARIABLE_SOURCES,
).flatMap(([source, values]) =>
  values.map((item) => ({
    code: item.code,
    source: source as FormulaVariableSource,
    dataType: item.dataType as FormulaVariable["dataType"],
  })),
);

const VARIABLE_INDEX: Record<
  string,
  {
    source: FormulaVariableSource;
    dataType: FormulaVariable["dataType"];
  }
> = VARIABLE_SOURCE_ENTRIES.reduce(
  (acc, item) => {
    acc[item.code] = {
      source: item.source,
      dataType: item.dataType,
    };
    return acc;
  },
  {} as Record<
    string,
    {
      source: FormulaVariableSource;
      dataType: FormulaVariable["dataType"];
    }
  >,
);

function parseFormulaVariables(value: unknown): FormulaVariable[] {
  if (Array.isArray(value)) {
    return value as FormulaVariable[];
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as FormulaVariable[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizePayrollFormula(raw: unknown): PayrollFormula {
  const item = raw as PayrollFormula & {
    variables: unknown;
    effectiveDate: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
  };

  return {
    ...item,
    variables: parseFormulaVariables(item.variables),
    effectiveDate: new Date(item.effectiveDate),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

function extractVariablesFromExpression(expression: string): FormulaVariable[] {
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  const uniqueTokens = Array.from(new Set(tokens));

  return uniqueTokens
    .map((token) => {
      const item = VARIABLE_INDEX[token];
      if (!item) {
        return null;
      }

      return {
        name: token,
        source: item.source,
        dataType: item.dataType,
      } satisfies FormulaVariable;
    })
    .filter((item): item is FormulaVariable => item !== null);
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow py-2", className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "p-2 rounded-lg shrink-0",
            className?.includes("yellow")
              ? "bg-yellow-100 text-yellow-600"
              : className?.includes("green")
                ? "bg-green-100 text-green-600"
                : className?.includes("blue")
                  ? "bg-blue-100 text-blue-600"
                  : className?.includes("red")
                    ? "bg-red-100 text-red-600"
                    : className?.includes("violet")
                      ? "bg-violet-100 text-violet-600"
                      : className?.includes("emerald")
                        ? "bg-emerald-100 text-emerald-600"
                        : className?.includes("amber")
                          ? "bg-amber-100 text-amber-600"
                          : className?.includes("cyan")
                            ? "bg-cyan-100 text-cyan-600"
                            : className?.includes("orange")
                              ? "bg-orange-100 text-orange-600"
                              : className?.includes("rose")
                                ? "bg-rose-100 text-rose-600"
                                : "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FILTER POPOVER
// ============================================================

function FilterPopover({
  categoryFilter,
  setCategoryFilter,
  activeOnlyFilter,
  setActiveOnlyFilter,
  onReset,
}: {
  categoryFilter: CategoryType;
  setCategoryFilter: (v: CategoryType) => void;
  activeOnlyFilter: boolean;
  setActiveOnlyFilter: (v: boolean) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasFilters = categoryFilter !== "ALL" || activeOnlyFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className={cn(hasFilters && "border-primary bg-primary/5")}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Lọc
          {hasFilters && (
            <Badge
              variant="default"
              className="ml-1 h-4 w-4 p-0 justify-center text-[10px]"
            >
              {hasFilters ? 1 : 0}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Bộ lọc</p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                Đặt lại
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Loại</Label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Chỉ hiển thị đang hoạt động
            </Label>
            <Switch
              checked={activeOnlyFilter}
              onCheckedChange={setActiveOnlyFilter}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// DIALOG FORM
// ============================================================

function SalaryComponentTypeDialog({
  children,
  editData,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
}: {
  children: React.ReactNode;
  editData?: SalaryComponentType | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createSalaryComponentType,
    onSuccess: () => {
      toast.success("Đã tạo loại khoản lương mới");
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalaryComponentTypeForm }) =>
      updateSalaryComponentType(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật loại khoản lương");
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
    },
  });

  const form = useForm<SalaryComponentTypeForm>({
    resolver: zodResolver(salaryComponentTypeSchema),
    defaultValues: {
      code: editData?.code || "",
      name: editData?.name || "",
      description: editData?.description || "",
      category:
        (editData?.category as SalaryComponentTypeForm["category"]) ||
        "ALLOWANCE",
      isTaxable: editData?.isTaxable ?? true,
      isInsurance: editData?.isInsurance ?? false,
      isBase: editData?.isBase ?? false,
      isActive: editData?.isActive ?? true,
      sortOrder: editData?.sortOrder ?? 0,
    },
  });

  // Reset form when editData changes
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [editData, open, form]);

  const onSubmit = (data: SalaryComponentTypeForm) => {
    if (editData) {
      updateMutation.mutate({ id: editData.id, data });
    } else {
      createMutation.mutate(data);
    }
    setOpen(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle style={{ display: "none" }}>
        {editData ? "Chỉnh sửa" : "Tạo mới"} loại khoản lương
      </DialogTitle>
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
                    <FormLabel>
                      Mã <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập mã loại khoản lương"
                        {...field}
                      />
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
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0,
                          )
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
                  <FormLabel>
                    Tên <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên loại khoản lương" {...field} />
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
                    <Input placeholder="Mô tả chi tiết..." {...field} />
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
                  <FormLabel>
                    Loại <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn loại khoản lương" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BASIC">Lương cơ bản</SelectItem>
                      <SelectItem value="ALLOWANCE">Phụ cấp</SelectItem>
                      <SelectItem value="BONUS">Thưởng</SelectItem>
                      <SelectItem value="DISCIPLINE">Kỷ luật</SelectItem>
                      <SelectItem value="DEDUCTION">Khấu trừ</SelectItem>
                      <SelectItem value="INSURANCE">Bảo hiểm</SelectItem>
                      <SelectItem value="TAX">Thuế</SelectItem>
                      <SelectItem value="OVERTIME">Tăng ca</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isTaxable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm">Chịu thuế</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm">Lương CB</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm">Hoạt động</FormLabel>
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
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PayrollFormulaDialog({
  children,
  editData,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
}: {
  children: React.ReactNode;
  editData?: PayrollFormula | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: PayrollFormulaPayload) => {
      const result = await createPayrollFormula(data);
      if ("success" in result && result.success === false) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Đã tạo công thức payroll");
      queryClient.invalidateQueries({ queryKey: ["payroll-formulas"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PayrollFormulaPayload;
    }) => {
      const result = await updatePayrollFormula(id, data);
      if ("success" in result && result.success === false) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật công thức payroll");
      queryClient.invalidateQueries({ queryKey: ["payroll-formulas"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async ({
      formulaId,
      expression,
      sampleData,
    }: {
      formulaId?: string;
      expression: string;
      sampleData: Record<string, number>;
    }) => previewFormula({ formulaId, expression, sampleData }),
  });

  const handleSave = async (data: {
    name: string;
    code: string;
    description?: string;
    formulaType: FormulaType;
    expression: string;
  }) => {
    const payload: PayrollFormulaPayload = {
      code: data.code,
      name: data.name,
      description: data.description,
      formulaType: data.formulaType,
      category: editData?.category || undefined,
      expression: data.expression,
      variables: extractVariablesFromExpression(data.expression),
      outputField: editData?.outputField || undefined,
      priority: editData?.priority ?? 0,
      isActive: editData?.isActive ?? true,
      isSystem: editData?.isSystem ?? false,
      effectiveDate: editData?.effectiveDate
        ? new Date(editData.effectiveDate).toISOString()
        : new Date().toISOString(),
    };

    if (editData) {
      await updateMutation.mutateAsync({ id: editData.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">
        {editData ? "Chỉnh sửa" : "Tạo mới"} công thức payroll
      </DialogTitle>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <FormulaEditor
          editData={editData ?? undefined}
          onSave={handleSave}
          onPreview={(payload) => previewMutation.mutateAsync(payload)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FormulasClient({
  initialData,
  initialFormulas,
}: FormulasClientProps) {
  const queryClient = useQueryClient();
  const [screenTab, setScreenTab] =
    useState<PayrollFormulaScreenTab>("COMPONENTS");

  // ─── Filters ───
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("ALL");
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Column visibility ───
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    code: true,
    name: true,
    description: true,
    category: true,
    isTaxable: true,
    isActive: true,
    actions: true,
  });

  // ─── Selection ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Click outside to close search ───
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // ─── Queries ───
  const {
    data: componentTypes = initialData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["salary-component-types"],
    queryFn: async () => {
      const data = await getAllSalaryComponentTypes();
      return data as unknown as SalaryComponentType[];
    },
    initialData: initialData as unknown as SalaryComponentType[],
    staleTime: 0,
  });

  const {
    data: payrollFormulas = initialFormulas,
    isLoading: isLoadingPayrollFormulas,
    isFetching: isFetchingPayrollFormulas,
  } = useQuery({
    queryKey: ["payroll-formulas"],
    queryFn: async () => {
      const data = await getPayrollFormulas();
      return (data as unknown[]).map((item) => normalizePayrollFormula(item));
    },
    initialData: (initialFormulas as unknown[]).map((item) =>
      normalizePayrollFormula(item),
    ),
    staleTime: 0,
  });

  // ─── Mutations ───
  const deleteMutation = useMutation({
    mutationFn: deleteSalaryComponentType,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["salary-component-types"],
      });
    },
    onSuccess: () => {
      toast.success("Đã xóa loại khoản lương");
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    },
  });

  const deletePayrollFormulaMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePayrollFormula(id);
      if ("success" in result && result.success === false) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Đã xóa công thức payroll");
      queryClient.invalidateQueries({ queryKey: ["payroll-formulas"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
    },
  });

  const togglePayrollFormulaMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await togglePayrollFormula(id);
      if ("success" in result && result.success === false) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-formulas"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật");
    },
  });

  // ─── Edit Dialog State ───
  const [editDialogData, setEditDialogData] =
    useState<SalaryComponentType | null>(null);
  const [editPayrollFormulaData, setEditPayrollFormulaData] =
    useState<PayrollFormula | null>(null);

  const statsData = useMemo(() => {
    const items = componentTypes || [];
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const inactive = total - active;
    const basic = items.filter((i) => i.category === "BASIC").length;
    const allowance = items.filter((i) => i.category === "ALLOWANCE").length;
    const bonus = items.filter((i) => i.category === "BONUS").length;
    const deduction = items.filter(
      (i) => i.category === "DEDUCTION" || i.category === "DISCIPLINE",
    ).length;
    return { total, active, inactive, basic, allowance, bonus, deduction };
  }, [componentTypes]);

  const payrollFormulaStats = useMemo(() => {
    const items = payrollFormulas || [];
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const system = items.filter((i) => i.isSystem).length;
    return { total, active, system };
  }, [payrollFormulas]);

  // ─── Tab data ───
  const tabValue = categoryFilter;

  // ─── Filtered data ───
  const tabData = useMemo(() => {
    let items = componentTypes || [];

    // Filter by category
    if (categoryFilter !== "ALL") {
      items = items.filter((i) => i.category === categoryFilter);
    }

    // Filter by active only
    if (activeOnlyFilter) {
      items = items.filter((i) => i.isActive);
    }

    return items;
  }, [componentTypes, categoryFilter, activeOnlyFilter]);

  // ─── Column Definitions ───
  const columns = useMemo<ColumnDef<SalaryComponentType>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const selectedCount = tabData.filter((item) =>
            selectedIds.has(item.id),
          ).length;
          const isAllSelected =
            tabData.length > 0 && selectedCount === tabData.length;
          const isIndeterminate =
            selectedCount > 0 && selectedCount < tabData.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={() => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (isAllSelected) {
                    tabData.forEach((item) => next.delete(item.id));
                  } else {
                    tabData.forEach((item) => next.add(item.id));
                  }
                  return next;
                });
              }}
              className="accent-primary"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.original.id)}
            onChange={() =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(row.original.id)) {
                  next.delete(row.original.id);
                } else {
                  next.add(row.original.id);
                }
                return next;
              })
            }
            onClick={(e) => e.stopPropagation()}
            className="accent-primary"
          />
        ),
        size: 40,
        enableHiding: false,
      },
      {
        accessorKey: "code",
        id: "code",
        header: "Mã",
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        id: "name",
        header: "Tên",
        size: 200,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "description",
        id: "description",
        header: "Mô tả",
        size: 200,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "category",
        id: "category",
        header: "Loại",
        size: 130,
        cell: ({ row }) => {
          const cfg = getCategoryConfig(row.original.category);
          return (
            <Badge
              variant="secondary"
              className={cn("text-[10px]", cfg.badgeClass)}
            >
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isTaxable",
        id: "isTaxable",
        header: "Chịu thuế",
        size: 100,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.isTaxable
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-500"
            }
          >
            {row.original.isTaxable ? "Có" : "Không"}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        id: "isActive",
        header: "Hoạt động",
        size: 100,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-500 border-red-200"
            }
          >
            {row.original.isActive ? "Có" : "Không"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-xs" variant="ghost">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogData(row.original)}>
                <Pencil />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => deleteMutation.mutate(row.original.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [tabData, selectedIds, deleteMutation],
  );

  const resetFilters = useCallback(() => {
    setCategoryFilter("ALL");
    setActiveOnlyFilter(false);
    setSearch("");
  }, []);

  const handleSearchToggle = useCallback(() => {
    setSearchExpanded((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearch("");
      }
      return next;
    });
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchExpanded(false);
        setSearch("");
        searchInputRef.current?.blur();
      }
    },
    [],
  );

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInputFocused) return;
      if (e.key === "/") {
        e.preventDefault();
        handleSearchToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSearchToggle]);

  // ─── Filter data by search ───
  const filteredData = useMemo(() => {
    if (!search) return tabData;
    const s = search.toLowerCase();
    return tabData.filter(
      (item) =>
        item.code.toLowerCase().includes(s) ||
        item.name.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s),
    );
  }, [tabData, search]);

  // ─── Table with filtered data ───
  const tableForRender = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-2">
              Cấu hình lương
            </h1>
          </header>
        </section>

        <div className="flex items-center px-2 pb-0 border-b bg-background shrink-0 overflow-x-auto">
          <button
            onClick={() => setScreenTab("COMPONENTS")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              screenTab === "COMPONENTS"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Khoản lương
          </button>
          <button
            onClick={() => setScreenTab("FORMULAS")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              screenTab === "FORMULAS"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Công thức động
          </button>
        </div>

        {screenTab === "COMPONENTS" && (
          <>
            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border-b bg-muted/20">
              <StatCard
                title="Tổng cộng"
                value={statsData.total}
                icon={Settings}
                className=""
              />
              <StatCard
                title="Đang hoạt động"
                value={statsData.active}
                icon={Banknote}
                className="green"
              />
              <StatCard
                title="Ngừng hoạt động"
                value={statsData.inactive}
                icon={AlertTriangle}
                className="red"
              />
              <StatCard
                title="Phụ cấp"
                value={statsData.allowance}
                icon={Layers}
                className="emerald"
              />
            </div>

            {/* ─── Toolbar ─── */}
            <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
              <SalaryComponentTypeDialog
                onSuccess={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["salary-component-types"],
                  })
                }
              >
                <Button size="xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm mới
                </Button>
              </SalaryComponentTypeDialog>

              <Separator orientation="vertical" className="h-4!" />

              <FilterPopover
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                activeOnlyFilter={activeOnlyFilter}
                setActiveOnlyFilter={setActiveOnlyFilter}
                onReset={resetFilters}
              />

              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["salary-component-types"],
                  })
                }
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
              </Button>

              {/* Search */}
              <div className="relative flex items-center" ref={mergedSearchRef}>
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm kiếm..."
                  className={cn(
                    "h-6 text-xs transition-all duration-300 ease-in-out pr-6",
                    searchExpanded
                      ? "w-48 opacity-100 pl-3"
                      : "w-0 opacity-0 pl-0",
                  )}
                />
                <Button
                  size={"icon-xs"}
                  variant={"ghost"}
                  onClick={handleSearchToggle}
                  className={cn(
                    "absolute right-0.5 z-10",
                    searchExpanded && "[&_svg]:text-primary",
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-4!" />

              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* ─── Table Settings ─── */}
            <TableSettingsPanel
              open={settingsOpen}
              onClose={setSettingsOpen}
              columnVisibility={columnVisibility}
              setColumnVisibility={setColumnVisibility}
              defaultVisibleColumns={{
                code: true,
                name: true,
                description: true,
                category: true,
                isTaxable: true,
                isActive: true,
              }}
              columnOptions={[
                { key: "code", label: "Mã", icon: Settings },
                { key: "name", label: "Tên", icon: Settings },
                { key: "description", label: "Mô tả", icon: Settings },
                { key: "category", label: "Loại", icon: Settings },
                { key: "isTaxable", label: "Chịu thuế", icon: Settings },
                { key: "isActive", label: "Hoạt động", icon: Settings },
              ]}
              className="top-10"
              hiddenColumnIndices={[]}
              disabledColumnIndices={[]}
            />
          </>
        )}
      </div>

      {screenTab === "COMPONENTS" && (
        <>
          {/* ─── Tabs ─── */}
          <div className="flex items-center px-2 pb-0 border-b bg-background shrink-0 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const count =
                cat.value === "ALL"
                  ? statsData.total
                  : componentTypes?.filter((i) => i.category === cat.value)
                      .length || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                    tabValue === cat.value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.label}{" "}
                  <Badge
                    className={cn(
                      "p-0 px-1 text-[10px]",
                      tabValue === cat.value
                        ? "bg-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* ─── Batch Actions Bar ─── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border-b border-primary/20 shrink-0">
              <span className="text-xs text-muted-foreground">
                Đã chọn{" "}
                <strong className="text-foreground">{selectedIds.size}</strong>{" "}
                mục
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto h-6 w-6"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* ─── Table ─── */}
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                {tableForRender.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-7 px-2 select-none z-10 relative bg-background"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((col, j) => (
                        <TableCell
                          key={j}
                          style={{ width: col.size }}
                          className="p-2"
                        >
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tableForRender.getRowModel().rows?.length ? (
                  tableForRender.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group/row">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Settings className="h-8 w-8 text-muted-foreground/50" />
                        <p>Không có khoản lương nào</p>
                        {search && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={resetFilters}
                          >
                            Xóa tìm kiếm
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ─── Summary Footer ─── */}
          {!isLoading && componentTypes && componentTypes.length > 0 && (
            <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Hiển thị <strong>{filteredData.length}</strong> /{" "}
                <strong>{componentTypes.length}</strong> khoản lương
              </p>
              {statsData.inactive > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 border-red-200 text-red-700"
                >
                  {statsData.inactive} khoản ngừng hoạt động
                </Badge>
              )}
            </div>
          )}
        </>
      )}

      {screenTab === "FORMULAS" && (
        <>
          {/* ─── Payroll Dynamic Formulas ─── */}
          <div className="flex-1 min-h-0 border-t bg-muted/10 flex flex-col">
            <div className="px-2 py-2 border-b flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Công thức payroll động</p>
                <p className="text-xs text-muted-foreground">
                  Dùng để tính trực tiếp các trường lương như overtime, thuế,
                  bảo hiểm, net salary
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" className="hidden md:inline-flex">
                  {payrollFormulaStats.total} công thức
                </Badge>
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {payrollFormulaStats.active} đang hoạt động
                </Badge>
                <Badge
                  variant="outline"
                  className="hidden lg:inline-flex bg-slate-50 text-slate-700 border-slate-200"
                >
                  {payrollFormulaStats.system} hệ thống
                </Badge>

                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["payroll-formulas"],
                    })
                  }
                  disabled={isFetchingPayrollFormulas}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      isFetchingPayrollFormulas && "animate-spin",
                    )}
                  />
                </Button>

                <PayrollFormulaDialog
                  onSuccess={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["payroll-formulas"],
                    })
                  }
                >
                  <Button size="xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm công thức
                  </Button>
                </PayrollFormulaDialog>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-7 px-2">Mã</TableHead>
                    <TableHead className="h-7 px-2">Tên</TableHead>
                    <TableHead className="h-7 px-2">Loại</TableHead>
                    <TableHead className="h-7 px-2">Biểu thức</TableHead>
                    <TableHead className="h-7 px-2">Biến</TableHead>
                    <TableHead className="h-7 px-2">Ưu tiên</TableHead>
                    <TableHead className="h-7 px-2">Trạng thái</TableHead>
                    <TableHead className="h-7 px-2 text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayrollFormulas ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`formula-skeleton-${i}`}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell
                            key={`formula-skeleton-cell-${j}`}
                            className="p-2"
                          >
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : payrollFormulas.length > 0 ? (
                    payrollFormulas.map((formula) => {
                      const formulaCfg =
                        FORMULA_TYPE_CONFIG[formula.formulaType];
                      return (
                        <TableRow key={formula.id}>
                          <TableCell className="px-2 py-1.5">
                            <span className="font-mono text-xs">
                              {formula.code}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <div>
                              <p className="text-sm font-medium leading-tight">
                                {formula.name}
                              </p>
                              {formula.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-65">
                                  {formula.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                formulaCfg.badgeClass,
                              )}
                            >
                              {formulaCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 max-w-70">
                            <code className="text-[11px] px-1.5 py-1 rounded bg-muted block truncate">
                              {formula.expression}
                            </code>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-xs text-muted-foreground">
                            {formula.variables.length}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-xs">
                            {formula.priority}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  formula.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200",
                                )}
                              >
                                {formula.isActive ? "Đang bật" : "Đang tắt"}
                              </Badge>
                              {formula.isSystem && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  System
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon-xs" variant="ghost">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditPayrollFormulaData(formula)
                                  }
                                >
                                  <Pencil />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    togglePayrollFormulaMutation.mutate(
                                      formula.id,
                                    )
                                  }
                                  disabled={
                                    formula.isSystem ||
                                    togglePayrollFormulaMutation.isPending
                                  }
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  {formula.isActive
                                    ? "Tắt công thức"
                                    : "Bật công thức"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    deletePayrollFormulaMutation.mutate(
                                      formula.id,
                                    )
                                  }
                                  disabled={
                                    formula.isSystem ||
                                    deletePayrollFormulaMutation.isPending
                                  }
                                >
                                  <Trash2 />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Chưa có công thức payroll nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* ─── Edit Dialog ─── */}
      <SalaryComponentTypeDialog
        editData={editDialogData ?? undefined}
        open={editDialogData !== null}
        onOpenChange={(open) => {
          if (!open) setEditDialogData(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["salary-component-types"],
          });
          setEditDialogData(null);
        }}
      >
        <div />
      </SalaryComponentTypeDialog>

      <PayrollFormulaDialog
        editData={editPayrollFormulaData ?? undefined}
        open={editPayrollFormulaData !== null}
        onOpenChange={(open) => {
          if (!open) setEditPayrollFormulaData(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["payroll-formulas"],
          });
          setEditPayrollFormulaData(null);
        }}
      >
        <div />
      </PayrollFormulaDialog>
    </div>
  );
}

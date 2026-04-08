"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  getSalaryComponentTypes,
  getAllSalaryComponentTypes,
  createSalaryComponentType,
  updateSalaryComponentType,
  deleteSalaryComponentType,
} from "../actions";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";

// ─── Schema ───

const salaryComponentTypeSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    code: z.string().min(1, t("payrollFormulasValidationCodeRequired")),
    name: z.string().min(1, t("payrollFormulasValidationNameRequired")),
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

type SalaryComponentTypeForm = z.infer<
  ReturnType<typeof salaryComponentTypeSchema>
>;

// ─── Helpers ───

function getCategoryLabel(
  category: string,
  t: ReturnType<typeof useTranslations>,
) {
  const labels: Record<string, string> = {
    BASIC: t("payrollFormulasCategoryBasic"),
    ALLOWANCE: t("payrollFormulasCategoryAllowance"),
    BONUS: t("payrollFormulasCategoryBonus"),
    DISCIPLINE: t("payrollFormulasCategoryDiscipline"),
    DEDUCTION: t("payrollFormulasCategoryDeduction"),
    INSURANCE: t("payrollFormulasCategoryInsurance"),
    TAX: t("payrollFormulasCategoryTax"),
    OVERTIME: t("payrollFormulasCategoryOvertime"),
  };
  return labels[category] || category;
}

function getCategoryBadgeVariant(
  category: string,
): "default" | "secondary" | "outline" | "destructive" {
  const variants: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    BASIC: "default",
    ALLOWANCE: "secondary",
    BONUS: "secondary",
    DISCIPLINE: "destructive",
    DEDUCTION: "destructive",
    INSURANCE: "outline",
    TAX: "outline",
    OVERTIME: "secondary",
  };
  return variants[category] || "secondary";
}

// ─── Component Type Dialog ───

function SalaryComponentTypeDialog({
  children,
  editData,
  onSuccess,
}: {
  children: React.ReactNode;
  editData?: Awaited<ReturnType<typeof getAllSalaryComponentTypes>>[number];
  onSuccess: () => void;
}) {
  const t = useTranslations("ProtectedPages");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SalaryComponentTypeForm>({
    resolver: zodResolver(salaryComponentTypeSchema(t)),
    defaultValues: {
      code: editData?.code || "",
      name: editData?.name || "",
      description: editData?.description || "",
      category: editData?.category as SalaryComponentTypeForm["category"],
      isTaxable: editData?.isTaxable || false,
      isInsurance: editData?.isInsurance || false,
      isBase: editData?.isBase || false,
      //   coefficient: editData?.coefficient || 0,
      //   maxAmount: editData?.maxAmount || 0,
      isActive: editData?.isActive || false,
      sortOrder: editData?.sortOrder || 0,
    },
  });

  const onSubmit = async (data: SalaryComponentTypeForm) => {
    setIsLoading(true);
    setOpen(false);
    try {
      if (editData) {
        await updateSalaryComponentType(editData.id, data);
        toast.success(t("payrollFormulasToastUpdateSuccess"));
      } else {
        await createSalaryComponentType(data);
        toast.success(t("payrollFormulasToastCreateSuccess"));
      }
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("payrollFormulasToastSaveError"));
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editData
              ? t("payrollFormulasDialogTitleEdit")
              : t("payrollFormulasDialogTitleCreate")}
          </DialogTitle>
          <DialogDescription>
            {t("payrollFormulasDialogDescription")}
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
                    <FormLabel>{t("payrollFormulasFieldCode")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ALLOWANCE" />
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
                    <FormLabel>{t("payrollFormulasFieldOrder")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
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
                  <FormLabel>{t("payrollFormulasFieldName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("payrollFormulasFieldNamePlaceholder")} />
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
                  <FormLabel>{t("payrollFormulasFieldDescription")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("payrollFormulasFieldDescriptionPlaceholder")} />
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
                  <FormLabel>{t("payrollFormulasFieldCategory")}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                    >
                      <option value="BASIC">{t("payrollFormulasCategoryBasic")}</option>
                      <option value="ALLOWANCE">{t("payrollFormulasCategoryAllowance")}</option>
                      <option value="BONUS">{t("payrollFormulasCategoryBonus")}</option>
                      <option value="DISCIPLINE">{t("payrollFormulasCategoryDiscipline")}</option>
                      <option value="DEDUCTION">{t("payrollFormulasCategoryDeduction")}</option>
                      <option value="OVERTIME">{t("payrollFormulasCategoryOvertime")}</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isTaxable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("payrollFormulasFieldTaxable")}</FormLabel>
                    </div>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("payrollFormulasFieldBaseSalary")}</FormLabel>
                    </div>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("payrollFormulasFieldActive")}</FormLabel>
                    </div>
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
                {t("payrollCancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("payrollFormulasSaving") : t("payrollFormulasSave")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───

export default function FormulasClient({
  initialData,
}: {
  initialData: Awaited<ReturnType<typeof getAllSalaryComponentTypes>>;
}) {
  const t = useTranslations("ProtectedPages");
  const queryClient = useQueryClient();

  const { data: componentTypes, isLoading } = useQuery({
    queryKey: ["salary-component-types"],
    queryFn: getAllSalaryComponentTypes,
    initialData: initialData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalaryComponentType,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["salary-component-types"] });
      return {};
    },
    onSuccess: () => {
      toast.success(t("payrollFormulasToastDeleteSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollFormulasToastDeleteError"));
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-component-types"] });
    }
  });

  // Group by category
  const grouped = componentTypes?.reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, typeof componentTypes>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("payrollFormulasTitle")}</h1>
          <p className="text-muted-foreground">
            {t("payrollFormulasDescription")}
          </p>
        </div>
        <SalaryComponentTypeDialog
          onSuccess={() =>
            queryClient.invalidateQueries({
              queryKey: ["salary-component-types"],
            })
          }
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("payrollFormulasAddType")}
          </Button>
        </SalaryComponentTypeDialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("payrollLoading")}</div>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(grouped || {}).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={getCategoryBadgeVariant(category)}>
                    {getCategoryLabel(category, t)}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {t("payrollFormulasItemCount", { count: items.length })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("payrollFormulasHeadCode")}</TableHead>
                      <TableHead>{t("payrollFormulasHeadName")}</TableHead>
                      <TableHead>{t("payrollFormulasHeadDescription")}</TableHead>
                      <TableHead>{t("payrollFormulasHeadTaxable")}</TableHead>
                      <TableHead>{t("payrollFormulasHeadActive")}</TableHead>
                      <TableHead className="text-right">{t("payrollHeadActions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.description || t("payrollNotAvailable")}
                        </TableCell>
                        <TableCell>
                          {item.isTaxable
                            ? t("payrollFormulasYes")
                            : t("payrollFormulasNo")}
                        </TableCell>
                        <TableCell>
                          {item.isActive
                            ? t("payrollFormulasYes")
                            : t("payrollFormulasNo")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <SalaryComponentTypeDialog
                              editData={item}
                              onSuccess={() =>
                                queryClient.invalidateQueries({
                                  queryKey: ["salary-component-types"],
                                })
                              }
                            >
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </SalaryComponentTypeDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

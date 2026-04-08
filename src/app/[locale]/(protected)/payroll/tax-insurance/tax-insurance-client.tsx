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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPayrollConfigs, setPayrollConfig } from "../actions";
import { Settings, Save } from "lucide-react";

// Default config values
const DEFAULT_CONFIGS = [
  {
    key: "SOCIAL_INSURANCE_RATE",
    nameKey: "payrollTaxInsuranceConfigSocialRateName",
    descriptionKey: "payrollTaxInsuranceConfigSocialRateDesc",
    defaultValue: 8,
    unit: "percent",
  },
  {
    key: "HEALTH_INSURANCE_RATE",
    nameKey: "payrollTaxInsuranceConfigHealthRateName",
    descriptionKey: "payrollTaxInsuranceConfigHealthRateDesc",
    defaultValue: 1.5,
    unit: "percent",
  },
  {
    key: "UNEMPLOYMENT_INSURANCE_RATE",
    nameKey: "payrollTaxInsuranceConfigUnemploymentRateName",
    descriptionKey: "payrollTaxInsuranceConfigUnemploymentRateDesc",
    defaultValue: 1,
    unit: "percent",
  },
  {
    key: "OVERTIME_RATE",
    nameKey: "payrollTaxInsuranceConfigOvertimeRateName",
    descriptionKey: "payrollTaxInsuranceConfigOvertimeRateDesc",
    defaultValue: 1.5,
    unit: "multiplier",
  },
  {
    key: "PERSONAL_DEDUCTION",
    nameKey: "payrollTaxInsuranceConfigPersonalDeductionName",
    descriptionKey: "payrollTaxInsuranceConfigPersonalDeductionDesc",
    defaultValue: 11000000,
    unit: "currency",
  },
  {
    key: "DEPENDENT_DEDUCTION",
    nameKey: "payrollTaxInsuranceConfigDependentDeductionName",
    descriptionKey: "payrollTaxInsuranceConfigDependentDeductionDesc",
    defaultValue: 4400000,
    unit: "currency",
  },
] as const;

// Main component

export default function TaxInsuranceClient({
  initialData,
}: {
  initialData: Awaited<ReturnType<typeof getPayrollConfigs>>;
}) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
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
        description:
          t(DEFAULT_CONFIGS.find((c) => c.key === key)?.nameKey || "payrollTaxInsuranceTitle") ||
          key,
        effectiveDate: new Date().toISOString(),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-configs"] });
      return {};
    },
    onSuccess: () => {
      toast.success(t("payrollTaxInsuranceToastSaved"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollTaxInsuranceToastSaveError"));
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

    if (config.unit === "percent") {
      return `${value || config.defaultValue}%`;
    }
    if (config.unit === "multiplier") {
      return `${value || config.defaultValue}x`;
    }
    return new Intl.NumberFormat(locale, {
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
        <h1 className="text-2xl font-bold tracking-tight">{t("payrollTaxInsuranceTitle")}</h1>
        <p className="text-muted-foreground">
          {t("payrollTaxInsuranceDescription")}
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("payrollTaxInsuranceRegulationTitle")}
          </CardTitle>
          <CardDescription>
            {t("payrollTaxInsuranceRegulationDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHXH</h4>
              <p className="text-sm text-muted-foreground">
                {t("payrollTaxInsuranceSocialEmployee")}
                <br />
                {t("payrollTaxInsuranceSocialEmployer")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHYT</h4>
              <p className="text-sm text-muted-foreground">
                {t("payrollTaxInsuranceHealthEmployee")}
                <br />
                {t("payrollTaxInsuranceHealthEmployer")}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">BHTN</h4>
              <p className="text-sm text-muted-foreground">
                {t("payrollTaxInsuranceUnemploymentEmployee")}
                <br />
                {t("payrollTaxInsuranceUnemploymentEmployer")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("payrollTaxInsuranceSystemConfigTitle")}</CardTitle>
          <CardDescription>
            {t("payrollTaxInsuranceSystemConfigDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{t("payrollTableLoading")}</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payrollTaxInsuranceTableParam")}</TableHead>
                  <TableHead>{t("payrollTaxInsuranceTableDescription")}</TableHead>
                  <TableHead>{t("payrollTaxInsuranceTableCurrentValue")}</TableHead>
                  <TableHead className="text-right">{t("payrollTaxInsuranceTableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEFAULT_CONFIGS.map((config) => {
                  const currentValue =
                    configMap.get(config.key) ?? config.defaultValue;
                  return (
                    <TableRow key={config.key}>
                      <TableCell className="font-medium">
                        {t(config.nameKey)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t(config.descriptionKey)}
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
                          t={t}
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

// Edit dialog

function ConfigEditDialog({
  config,
  currentValue,
  onSave,
  t,
}: {
  config: (typeof DEFAULT_CONFIGS)[number];
  currentValue: number;
  onSave: (value: number) => void;
  t: ReturnType<typeof useTranslations>;
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
        {t("payrollEdit")}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{t(config.nameKey)}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t(config.descriptionKey)}
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                step={config.unit === "percent" ? "0.1" : "1"}
              />
              <span className="text-muted-foreground">
                {config.unit === "percent"
                  ? "%"
                  : config.unit === "multiplier"
                    ? "x"
                    : t("payrollCurrency")}
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("payrollCancel")}
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {t("payrollSave")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

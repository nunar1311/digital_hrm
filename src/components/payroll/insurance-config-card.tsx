"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Percent,
  Banknote,
  Calendar,
  Save,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  INSURANCE_CAPS_2024,
  DEFAULT_INSURANCE_RATES,
} from "@/app/[locale]/(protected)/payroll/types";

const insuranceConfigSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    socialRate: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: t("payrollInsuranceValidationSocialRate"),
      }),
    healthRate: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: t("payrollInsuranceValidationHealthRate"),
      }),
    unemploymentRate: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: t("payrollInsuranceValidationUnemploymentRate"),
      }),
    minSalary: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("payrollInsuranceValidationMinSalary"),
      }),
    socialMaxSalary: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("payrollInsuranceValidationSocialMaxSalary"),
      }),
    healthMaxSalary: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("payrollInsuranceValidationHealthMaxSalary"),
      }),
    unemploymentMaxSalary: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t("payrollInsuranceValidationUnemploymentMaxSalary"),
      }),
  });

type InsuranceConfigForm = z.infer<ReturnType<typeof insuranceConfigSchema>>;

interface InsuranceConfigCardProps {
  initialConfig?: {
    socialRate: number;
    healthRate: number;
    unemploymentRate: number;
    minSalary: number;
    socialMaxSalary: number;
    healthMaxSalary: number;
    unemploymentMaxSalary: number;
  };
  onSave: (data: InsuranceConfigForm) => Promise<void>;
  region?: string;
}

const PRESETS = [
  {
    year: 2026,
    rates: { socialRate: 0.08, healthRate: 0.015, unemploymentRate: 0.01 },
    caps: {
      minSalary: 2490000,
      socialMaxSalary: 49800000,
      healthMaxSalary: 74700000,
      unemploymentMaxSalary: 74700000,
    },
  },
  {
    year: 2025,
    rates: { socialRate: 0.08, healthRate: 0.015, unemploymentRate: 0.01 },
    caps: {
      minSalary: 2340000,
      socialMaxSalary: 46800000,
      healthMaxSalary: 70200000,
      unemploymentMaxSalary: 70200000,
    },
  },
  {
    year: 2024,
    rates: { socialRate: 0.08, healthRate: 0.015, unemploymentRate: 0.01 },
    caps: INSURANCE_CAPS_2024,
  },
];

export function InsuranceConfigCard({
  initialConfig,
  onSave,
  region,
}: InsuranceConfigCardProps) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
  const [selectedPreset, setSelectedPreset] = useState<string>("2026");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsuranceConfigForm>({
    resolver: zodResolver(insuranceConfigSchema(t)),
    defaultValues: initialConfig
      ? {
          socialRate: String(initialConfig.socialRate * 100),
          healthRate: String(initialConfig.healthRate * 100),
          unemploymentRate: String(initialConfig.unemploymentRate * 100),
          minSalary: String(initialConfig.minSalary),
          socialMaxSalary: String(initialConfig.socialMaxSalary),
          healthMaxSalary: String(initialConfig.healthMaxSalary),
          unemploymentMaxSalary: String(initialConfig.unemploymentMaxSalary),
        }
      : {
          socialRate: String(DEFAULT_INSURANCE_RATES.socialRate * 100),
          healthRate: String(DEFAULT_INSURANCE_RATES.healthRate * 100),
          unemploymentRate: String(
            DEFAULT_INSURANCE_RATES.unemploymentRate * 100,
          ),
          minSalary: String(INSURANCE_CAPS_2024.SOCIAL.min),
          socialMaxSalary: String(INSURANCE_CAPS_2024.SOCIAL.max),
          healthMaxSalary: String(INSURANCE_CAPS_2024.HEALTH.max),
          unemploymentMaxSalary: String(INSURANCE_CAPS_2024.UNEMPLOYMENT.max),
        },
  });

  const handlePresetChange = (year: string) => {
    setSelectedPreset(year);
    const preset = PRESETS.find((p) => p.year === parseInt(year));
    if (preset) {
      form.setValue("socialRate", String(preset.rates.socialRate * 100));
      form.setValue("healthRate", String(preset.rates.healthRate * 100));
      form.setValue(
        "unemploymentRate",
        String(preset.rates.unemploymentRate * 100),
      );
      // form.setValue("minSalary", String(preset.caps.minSalary));
      // form.setValue("socialMaxSalary", String(preset.caps.socialMaxSalary));
      // form.setValue("healthMaxSalary", String(preset.caps.healthMaxSalary));
      // form.setValue("unemploymentMaxSalary", String(preset.caps.unemploymentMaxSalary));
    }
  };

  const onSubmit = async (data: InsuranceConfigForm) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      toast.success(t("payrollInsuranceToastSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("payrollInsuranceToastSaveError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const values = form.watch();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>{t("payrollInsuranceTitle")}</CardTitle>
          </div>
          <Badge variant="outline" className="font-normal">
            {t("payrollInsuranceRegion", { region: region || t("payrollNotAvailable") })}
          </Badge>
        </div>
        <CardDescription>
          {t("payrollInsuranceDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">
              <Shield className="h-4 w-4 mr-2" />
              {t("payrollInsuranceTabConfig")}
            </TabsTrigger>
            <TabsTrigger value="presets">
              <Calendar className="h-4 w-4 mr-2" />
              {t("payrollInsuranceTabPresets")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {PRESETS.map((preset) => (
                <Card
                  key={preset.year}
                  className={`cursor-pointer transition-colors ${
                    selectedPreset === String(preset.year)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handlePresetChange(String(preset.year))}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("payrollInsuranceYear", { year: preset.year })}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    {t("payrollInsuranceContributionRate")}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="socialRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BHXH (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="healthRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BHYT (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unemploymentRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BHTN (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    {t("payrollInsuranceRegionalMinSalary")}
                  </h4>
                  <FormField
                    control={form.control}
                    name="minSalary"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>{t("payrollInsuranceMinSalary")}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("payrollInsuranceMaxSalaryCap")}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="socialMaxSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("payrollInsuranceSocialMax")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="healthMaxSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("payrollInsuranceHealthMax")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unemploymentMaxSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("payrollInsuranceUnemploymentMax")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    {t("payrollInsuranceSummary")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("payrollInsuranceTotalContribution")}
                      </span>
                      <span className="font-medium">
                        {(
                          parseFloat(values.socialRate || "0") +
                          parseFloat(values.healthRate || "0") +
                          parseFloat(values.unemploymentRate || "0")
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("payrollInsuranceBhxhAt10m")}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.min(
                            parseFloat(values.minSalary || "0") * 20,
                            parseFloat(values.socialMaxSalary || "0"),
                          ) *
                            (parseFloat(values.socialRate || "0") / 100),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("payrollReset")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? t("payrollSaving") : t("payrollInsuranceSaveConfig")}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPayslips } from "../actions";
import { FileText, Eye, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCurrency(amount: number | bigint, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PayslipsClient({
  initialData,
  isSelfService = false,
}: {
  initialData: Awaited<ReturnType<typeof getPayslips>>;
  isSelfService?: boolean;
}) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(
    new Date().getFullYear().toString(),
  );

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["payslips", monthFilter, yearFilter],
    queryFn: () =>
      getPayslips(
        monthFilter === "all" || yearFilter === "all"
          ? {}
          : {
              month: parseInt(monthFilter),
              year: parseInt(yearFilter),
            },
      ),
    initialData: initialData,
  });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredPayslips = payslips?.filter((p) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.employeeName.toLowerCase().includes(searchLower) ||
      p.employeeCode?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isSelfService
            ? t("payrollPayslipsMyTitle")
            : t("payrollPayslipsTitle")}
        </h1>
        <p className="text-muted-foreground">
          {isSelfService
            ? t("payrollPayslipsMyDescription")
            : t("payrollPayslipsDescription")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("payrollPayslipsSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("payrollMonth")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("payrollFilterAll")}</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {t("payrollMonthOption", { month: m })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("payrollYear")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("payrollFilterAll")}</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {!isSelfService && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("payrollPayslipsSummaryTotal")}</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("payrollPayslipsSummaryViewed")}</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.filter((p) => p.status !== "GENERATED").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("payrollPayslipsSummaryUnviewed")}</CardDescription>
              <CardTitle className="text-2xl">
                {payslips?.filter((p) => p.status === "GENERATED").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("payrollPayslipsListTitle")}</CardTitle>
          <CardDescription>
            {t("payrollPayslipsListCount", {
              count: filteredPayslips?.length || 0,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{t("payrollLoading")}</div>
            </div>
          ) : !filteredPayslips || filteredPayslips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {t("payrollPayslipsEmptyTitle")}
              </h3>
              <p className="mt-2 text-sm">
                {isSelfService
                  ? t("payrollPayslipsMyEmptyDescription")
                  : t("payrollPayslipsEmptyDescription")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payrollHeadMonthYear")}</TableHead>
                  {!isSelfService && (
                    <>
                      <TableHead>{t("payrollPayslipsHeadEmployeeCode")}</TableHead>
                      <TableHead>{t("payrollPayslipsHeadEmployee")}</TableHead>
                      <TableHead>{t("payrollHeadDepartment")}</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">{t("payrollPayslipsHeadGross")}</TableHead>
                  <TableHead className="text-right">{t("payrollHeadTax")}</TableHead>
                  <TableHead className="text-right">{t("payrollHeadInsurance")}</TableHead>
                  <TableHead className="text-right">{t("payrollPayslipsHeadNet")}</TableHead>
                  <TableHead>{t("payrollHeadStatus")}</TableHead>
                  <TableHead className="text-right">{t("payrollHeadActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {t("payrollMonthYear", {
                        month: payslip.month,
                        year: payslip.year,
                      })}
                    </TableCell>
                    {!isSelfService && (
                      <>
                        <TableCell>{payslip.employeeCode || t("payrollNotAvailable")}</TableCell>
                        <TableCell>{payslip.employeeName}</TableCell>
                        <TableCell>{payslip.departmentName || t("payrollNotAvailable")}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      {formatCurrency(Number(payslip.grossSalary), locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const tax = JSON.parse(String(payslip.tax));
                        return formatCurrency(
                          Number(tax.PIT ?? tax.tax ?? tax.personalIncomeTax ?? 0),
                          locale,
                        );
                      })()}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      {(() => {
                        const ins = JSON.parse(payslip.insurance);
                        return formatCurrency(
                          (ins.BHXH || 0) + (ins.BHYT || 0) + (ins.BHTN || 0),
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell> */}
                    <TableCell>
                      {payslip.status === "GENERATED" ? (
                        <Badge variant="secondary">{t("payrollPayslipsStatusNew")}</Badge>
                      ) : payslip.status === "VIEWED" ? (
                        <Badge>{t("payrollPayslipsStatusViewed")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("payrollPayslipsStatusDownloaded")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/payroll/payslips/${payslip.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronDown, ChevronRight, Eye, FileDown, Search } from "lucide-react";
import type { PayrollRecordDetail, PayrollDetailStatus } from "@/app/[locale]/(protected)/payroll/types";

export function formatCurrency(amount: number | bigint | unknown, locale: string): string {
    const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(num);
}

interface PayrollDetailTableProps {
    details: PayrollRecordDetail[];
    departments: { id: string; name: string }[];
    onViewPayslip: (userId: string) => void;
    onExportPayslip: (userId: string) => void;
}

export function PayrollDetailTable({
    details: initialDetails,
    departments,
    onViewPayslip,
    onExportPayslip,
}: PayrollDetailTableProps) {
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();
    const [search, setSearch] = useState("");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const filteredDetails = initialDetails.filter((detail) => {
        const matchesSearch =
            search === "" ||
            detail.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            detail.user?.employeeCode?.toLowerCase().includes(search.toLowerCase());

        const matchesDepartment =
            filterDepartment === "all" ||
            detail.user?.department?.name === departments.find((d) => d.id === filterDepartment)?.name;

        const matchesStatus = filterStatus === "all" || detail.status === filterStatus;

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const totalPages = Math.ceil(filteredDetails.length / PAGE_SIZE);
    const paginatedDetails = filteredDetails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusBadge = (status: PayrollDetailStatus) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary">{t("payrollDetailTableStatusPending")}</Badge>;
            case "CONFIRMED":
                return <Badge variant="outline" className="bg-blue-50">{t("payrollDetailTableStatusConfirmed")}</Badge>;
            case "PAID":
                return <Badge variant="default" className="bg-green-600">{t("payrollDetailTableStatusPaid")}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{t("payrollDetailTableTitle")}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {t("payrollDetailTableEmployeeCount", { count: filteredDetails.length })}
                    </span>
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("payrollDetailTableSearchPlaceholder")}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>

                    <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t("payrollDetailTableDepartmentPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("payrollDetailTableDepartmentAll")}</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder={t("payrollDetailTableStatusPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("payrollDetailTableStatusAll")}</SelectItem>
                            <SelectItem value="PENDING">{t("payrollDetailTableStatusPending")}</SelectItem>
                            <SelectItem value="CONFIRMED">{t("payrollDetailTableStatusConfirmed")}</SelectItem>
                            <SelectItem value="PAID">{t("payrollDetailTableStatusPaid")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="w-12">{t("payrollDetailTableHeadIndex")}</TableHead>
                                <TableHead className="w-24">{t("payrollDetailTableHeadEmployeeCode")}</TableHead>
                                <TableHead>{t("payrollDetailTableHeadEmployeeName")}</TableHead>
                                <TableHead>{t("payrollDetailTableHeadDepartment")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadBaseSalary")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadAllowance")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadBonus")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadOvertime")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadGross")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadSocialInsurance")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadHealthInsurance")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadUnemploymentInsurance")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadPit")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadDeduction")}</TableHead>
                                <TableHead className="text-right">{t("payrollDetailTableHeadNet")}</TableHead>
                                <TableHead className="w-24">{t("payrollDetailTableHeadStatus")}</TableHead>
                                <TableHead className="w-20">{t("payrollDetailTableHeadWorkDays")}</TableHead>
                                <TableHead className="w-28 text-right">{t("payrollDetailTableHeadActions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDetails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                                        {t("payrollTableNoData")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDetails.map((detail, index) => (
                                    <>
                                        <TableRow key={detail.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => toggleRow(detail.id)}
                                                >
                                                    {expandedRows.has(detail.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {detail.user?.employeeCode || t("payrollNotAvailable")}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {detail.user?.name || t("payrollNotAvailable")}
                                            </TableCell>
                                            <TableCell>{detail.user?.department?.name || t("payrollNotAvailable")}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(detail.baseSalary, locale)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(detail.allowanceAmount, locale)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(detail.bonusAmount, locale)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(detail.overtimeAmount, locale)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(detail.grossSalary, locale)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {formatCurrency(detail.socialInsurance, locale)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {formatCurrency(detail.healthInsurance, locale)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {formatCurrency(detail.unemploymentInsurance, locale)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {formatCurrency(detail.taxAmount, locale)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {formatCurrency(detail.deductionAmount, locale)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(detail.netSalary, locale)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(detail.status)}</TableCell>
                                            <TableCell className="text-center">
                                                {detail.workDays}/{detail.standardDays}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => onViewPayslip(detail.userId)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => onExportPayslip(detail.userId)}
                                                    >
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows.has(detail.id) && (
                                            <TableRow key={`${detail.id}-expanded`} className="bg-muted/30">
                                                <TableCell colSpan={19} className="p-4">
                                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableBaseSalary")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.baseSalary, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableAllowance")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.allowanceAmount, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableBonus")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.bonusAmount, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableOvertimeHours", { hours: detail.overtimeHours })}</p>
                                                            <p className="font-medium">{formatCurrency(detail.overtimeAmount, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableGrossTotal")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.grossSalary, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableSocialInsuranceRate")}</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.socialInsurance, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableHealthInsuranceRate")}</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.healthInsurance, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableUnemploymentInsuranceRate")}</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.unemploymentInsurance, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTablePersonalDeduction")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.personalDeduction, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableDependentDeduction")}</p>
                                                            <p className="font-medium">{formatCurrency(detail.dependentDeduction, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTablePit")}</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.taxAmount, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableOtherDeduction")}</p>
                                                            <p className="font-medium text-red-600">{formatCurrency(detail.deductionAmount, locale)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableWorkDays")}</p>
                                                            <p className="font-medium">{detail.workDays}/{detail.standardDays}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableLateDays")}</p>
                                                            <p className="font-medium">{detail.lateDays}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableBankAccount")}</p>
                                                            <p className="font-medium">{detail.bankAccount || t("payrollNotAvailable")}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">{t("payrollDetailTableBankName")}</p>
                                                            <p className="font-medium">{detail.bankName || t("payrollNotAvailable")}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            {t("payrollDetailTableShowing", {
                                from: (page - 1) * PAGE_SIZE + 1,
                                to: Math.min(page * PAGE_SIZE, filteredDetails.length),
                                total: filteredDetails.length,
                            })}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                {t("payrollDetailTablePrevious")}
                            </Button>
                            <span className="text-sm">
                                {t("payrollDetailTablePage", { page, totalPages })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                {t("payrollDetailTableNext")}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


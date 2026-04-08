"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Printer,
    Download,
    Mail,
    Shield,
    Building2,
    User,
    Calendar,
    Banknote,
} from "lucide-react";
import type { Payslip, PayslipItem, PayslipInsurance, PayslipTax } from "@/app/[locale]/(protected)/payroll/types";

interface PayslipViewerProps {
    payslip: Payslip;
    companyName?: string;
    companyLogo?: string;
    isSecure?: boolean;
    onPasswordRequired?: () => void;
}

export function PayslipViewer({
    payslip,
    companyName,
    companyLogo,
    isSecure = false,
    onPasswordRequired,
}: PayslipViewerProps) {
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();
    const [showContent, setShowContent] = useState(!isSecure);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const earnings: PayslipItem[] = payslip.earnings
        ? JSON.parse(payslip.earnings)
        : [];
    const deductions: PayslipItem[] = payslip.deductions
        ? JSON.parse(payslip.deductions)
        : [];
    const insurance: PayslipInsurance = payslip.insurance
        ? JSON.parse(payslip.insurance)
        : { BHXH: 0, BHXH_RATE: 0.08, BHYT: 0, BHYT_RATE: 0.015, BHTN: 0, BHTN_RATE: 0.01, total: 0 };
    const tax: PayslipTax = payslip.tax
        ? JSON.parse(payslip.tax)
        : { taxableIncome: 0, taxAmount: 0, personalDeduction: 0, dependentDeduction: 0, totalDependents: 0 };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        toast.success(t("payrollPayslipViewerDownloading"));
    };

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(t("payrollPayslipViewerEmailSent"));
        } catch {
            toast.error(t("payrollPayslipViewerEmailError"));
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleUnlock = () => {
        if (onPasswordRequired) {
            onPasswordRequired();
        } else {
            setShowContent(true);
        }
    };

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalInsurance = insurance.BHXH + insurance.BHYT + insurance.BHTN;

    return (
        <div className="space-y-4">
            {!showContent && isSecure ? (
                <Card className="flex flex-col items-center justify-center py-16">
                    <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        {t("payrollPayslipViewerSecureTitle")}
                    </h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                        {t("payrollPayslipViewerSecureDescription")}
                    </p>
                    <Button onClick={handleUnlock}>{t("payrollPayslipViewerEnterPassword")}</Button>
                </Card>
            ) : (
                <>
                    <div className="flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                {t("payrollPayslipViewerPrint")}
                            </Button>
                            <Button variant="outline" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                {t("payrollPayslipViewerDownloadPdf")}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                {isSendingEmail ? t("payrollPayslipViewerSending") : t("payrollPayslipViewerSendEmail")}
                            </Button>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            {t("payrollPayslipViewerMonthBadge", { month: payslip.month, year: payslip.year })}
                        </Badge>
                    </div>

                    <Card className="print:border-none print:shadow-none">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {companyLogo ? (
                                            <img
                                                src={companyLogo}
                                                alt="Logo"
                                                className="h-16 w-16 object-contain"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-8 w-8 text-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                {companyName || t("payrollPayslipViewerDefaultCompanyName")}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {t("payrollPayslipViewerDocument")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                            {t("payrollPayslipViewerPayrollPeriod")}
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {t("payrollPayslipViewerMonthYear", { month: payslip.month, year: payslip.year })}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                {t("payrollPayslipViewerEmployee")}
                                            </p>
                                            <p className="font-medium">
                                                {payslip.employeeName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                {t("payrollPayslipViewerDepartment")}
                                            </p>
                                            <p className="font-medium">
                                                {payslip.departmentName || t("payrollNotAvailable")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                {t("payrollPayslipViewerEmployeeCode")}
                                            </p>
                                            <p className="font-medium font-mono">
                                                {payslip.employeeCode || t("payrollNotAvailable")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                {t("payrollPayslipViewerPosition")}
                                            </p>
                                            <p className="font-medium">
                                                {payslip.position || t("payrollNotAvailable")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                                            <span className="h-6 w-1 bg-green-600 rounded-full" />
                                            {t("payrollPayslipViewerIncome")}
                                        </h3>
                                        <div className="space-y-2">
                                            {earnings.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span>{item.name}</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                            <Separator className="my-2" />
                                            <div className="flex justify-between font-semibold">
                                                <span>{t("payrollPayslipViewerTotalIncome")}</span>
                                                <span className="text-green-600">
                                                    {formatCurrency(totalEarnings)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
                                                <span className="h-6 w-1 bg-red-600 rounded-full" />
                                                {t("payrollPayslipViewerInsuranceEmployee")}
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>
                                                        BHXH (8%){" "}
                                                        <span className="text-muted-foreground">
                                                            {formatCurrency(insurance.BHXH)}
                                                        </span>
                                                    </span>
                                                    <span className="font-medium text-red-600">
                                                        -{formatCurrency(insurance.BHXH)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>
                                                        BHYT (1.5%){" "}
                                                        <span className="text-muted-foreground">
                                                            {formatCurrency(insurance.BHYT)}
                                                        </span>
                                                    </span>
                                                    <span className="font-medium text-red-600">
                                                        -{formatCurrency(insurance.BHYT)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>
                                                        BHTN (1%){" "}
                                                        <span className="text-muted-foreground">
                                                            {formatCurrency(insurance.BHTN)}
                                                        </span>
                                                    </span>
                                                    <span className="font-medium text-red-600">
                                                        -{formatCurrency(insurance.BHTN)}
                                                    </span>
                                                </div>
                                                <Separator className="my-2" />
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span>{t("payrollPayslipViewerTotalInsurance")}</span>
                                                    <span className="text-red-600">
                                                        -{formatCurrency(totalInsurance)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold mb-3 text-amber-600 flex items-center gap-2">
                                                <span className="h-6 w-1 bg-amber-600 rounded-full" />
                                                {t("payrollPayslipViewerPit")}
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>{t("payrollPayslipViewerTaxableIncome")}</span>
                                                    <span>
                                                        {formatCurrency(tax.taxableIncome)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>{t("payrollPayslipViewerPersonalDeduction")}</span>
                                                    <span>
                                                        -{formatCurrency(tax.personalDeduction)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>
                                                        {t("payrollPayslipViewerDependentDeduction", { count: tax.totalDependents })}
                                                    </span>
                                                    <span>
                                                        -{formatCurrency(tax.dependentDeduction)}
                                                    </span>
                                                </div>
                                                <Separator className="my-2" />
                                                <div className="flex justify-between font-medium">
                                                    <span>{t("payrollPayslipViewerTaxPayable")}</span>
                                                    <span className="text-amber-600">
                                                        -{formatCurrency(tax.taxAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {deductions.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="font-semibold mb-3 text-red-600">
                                                {t("payrollPayslipViewerOtherDeductions")}
                                            </h3>
                                            <div className="space-y-2">
                                                {deductions.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between text-sm"
                                                    >
                                                        <span>{item.name}</span>
                                                        <span className="font-medium text-red-600">
                                                            -{formatCurrency(item.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator className="bg-primary/20" />

                                <div className="flex justify-between items-center bg-primary/5 -mx-6 -mb-6 p-6 rounded-b-lg">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            {t("payrollPayslipViewerGrossSalary")}
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(payslip.grossSalary)}
                                        </p>
                                    </div>
                                    <div className="h-12 w-px bg-border" />
                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            {t("payrollPayslipViewerTotalDeductions")}
                                        </p>
                                        <p className="text-lg font-semibold text-red-600">
                                            -{formatCurrency(
                                                totalInsurance +
                                                    tax.taxAmount +
                                                    totalDeductions
                                            )}
                                        </p>
                                    </div>
                                    <div className="h-12 w-px bg-border" />
                                    <div className="text-right space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            {t("payrollPayslipViewerNetSalary")}
                                        </p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {formatCurrency(payslip.netSalary)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="print:hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="space-y-1">
                                    <p>
                                        {t("payrollPayslipViewerCreatedAt")}
                                        {formatDate(payslip.createdAt)}
                                    </p>
                                    {payslip.signedAt && (
                                        <p>
                                            {t("payrollPayslipViewerSignedAt")}
                                            {formatDate(payslip.signedAt)}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="flex items-center gap-1">
                                        <Shield className="h-3 w-3" />
                                        {t("payrollPayslipViewerSecurityNotice")}
                                    </p>
                                    <p className="text-xs mt-1">
                                        {t("payrollPayslipViewerContactHr")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-12">
                                        {t("payrollPayslipViewerPreparedBy")}
                                    </p>
                                    <p className="text-xs">
                                        {t("payrollPayslipViewerSignHint")}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-12">
                                        {t("payrollPayslipViewerApprovedBy")}
                                    </p>
                                    <p className="text-xs">
                                        {t("payrollPayslipViewerSignHint")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}


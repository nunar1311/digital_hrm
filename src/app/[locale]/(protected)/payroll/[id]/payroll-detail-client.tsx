"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Mail,
  MoreHorizontal,
  Printer,
  Trash2,
  Send,
  Eye,
  Loader2,
  Shield,
  Download,
} from "lucide-react";
import { PayrollDetailTable } from "@/components/payroll/payroll-detail-table";
import { PayslipViewer } from "@/components/payroll/payslip-viewer";
import {
  getPayrollRecord,
  updatePayrollRecordStatus,
  deletePayrollRecord,
  exportPayrollRecord,
  getPayslips,
  sendPayslipEmails,
} from "@/app/[locale]/(protected)/payroll/actions";
import type {
  PayrollRecord,
  PayrollRecordDetail,
  Payslip,
} from "@/app/[locale]/(protected)/payroll/types";

function formatCurrency(
  amount: number | bigint | unknown,
  locale: string,
): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">{t("payrollStatusDraft")}</Badge>;
    case "PROCESSING":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          {t("payrollStatusProcessing")}
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-600">
          {t("payrollStatusCompleted")}
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">{t("payrollStatusCancelled")}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

interface PayrollDetailClientProps {
  recordId: string;
  initialRecord: PayrollRecord | null;
  initialPayslips: Payslip[];
  departments: { id: string; name: string }[];
}

export default function PayrollDetailClient({
  recordId,
  initialRecord,
  initialPayslips,
  departments,
}: PayrollDetailClientProps) {
  const t = useTranslations("ProtectedPages");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const { data: record, isLoading } = useQuery({
    queryKey: ["payroll-record", recordId],
    queryFn: () =>
      getPayrollRecord(recordId) as unknown as Promise<PayrollRecord>,
    initialData: initialRecord,
  });

  const { data: payslips } = useQuery({
    queryKey: ["payslips-for-record", recordId],
    queryFn: () => getPayslips({}) as unknown as Promise<Payslip[]>,
    initialData: initialPayslips,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED") =>
      updatePayrollRecordStatus(recordId, status),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payroll-record", recordId] });
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      setShowApprovalDialog(false);
      return {};
    },
    onSuccess: () => {
      toast.success(t("payrollDetailToastStatusSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("payrollDetailToastStatusError"),
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-record", recordId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-record", recordId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePayrollRecord(recordId),
    onMutate: async () => {
      setShowDeleteDialog(false);
      return {};
    },
    onSuccess: () => {
      toast.success(t("payrollDeleteSuccess"));
      router.push("/payroll");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("payrollDeleteError"),
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportPayrollRecord(recordId),
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("payrollExportSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollExportError"));
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendPayslipEmails(recordId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["payslips-for-record", recordId] });
      setShowSendEmailDialog(false);
      return {};
    },
    onSuccess: (result) => {
      toast.success(t("payrollDetailToastEmailSent", { count: result.sent }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payrollDetailToastEmailError"));
      queryClient.invalidateQueries({
        queryKey: ["payslips-for-record", recordId],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["payslips-for-record", recordId],
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <h2 className="text-xl font-semibold">{t("payrollDetailNotFound")}</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/payroll")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("payrollDetailBackToList")}
        </Button>
      </div>
    );
  }

  const details: PayrollRecordDetail[] = record.details || [];
  const filteredPayslips =
    payslips?.filter((p) => p.payrollRecordId === recordId) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/payroll")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {t("payrollMonthYear", { month: record.month, year: record.year })}
              </h1>
              {getStatusBadge(record.status, t)}
            </div>
            <p className="text-muted-foreground">
              {record.department?.name || t("payrollWholeCompany")} •{" "}
              {t("payrollDetailEmployeeCount", { count: record.totalEmployees })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportMutation.mutate()}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("payrollDetailExportCsv")}
              </DropdownMenuItem>
              {record.status === "COMPLETED" && (
                <DropdownMenuItem onClick={() => setShowSendEmailDialog(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("payrollDetailSendPayslipEmail")}
                </DropdownMenuItem>
              )}
              {record.status === "DRAFT" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("payrollDetailDeletePayroll")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Main action button */}
          {record.status === "DRAFT" && (
            <Button onClick={() => setShowApprovalDialog(true)}>
              <Check className="mr-2 h-4 w-4" />
              {t("payrollDetailApprovePayroll")}
            </Button>
          )}
          {record.status === "PROCESSING" && (
            <Button onClick={() => updateStatusMutation.mutate("COMPLETED")}>
              <Check className="mr-2 h-4 w-4" />
              {t("payrollStatusCompleted")}
            </Button>
          )}
          {record.status === "COMPLETED" && (
            <Button variant="outline" onClick={() => exportMutation.mutate()}>
              <Download className="mr-2 h-4 w-4" />
              {t("payrollDetailExportReport")}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalEmployees")}</CardDescription>
            <CardTitle className="text-2xl">{record.totalEmployees}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalGross")}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalGross, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalNet")}</CardDescription>
            <CardTitle className="text-xl text-green-600">
              {formatCurrency(record.totalNet, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalTax")}</CardDescription>
            <CardTitle className="text-xl text-red-600">
              {formatCurrency(record.totalTax, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollSummaryTotalInsurance")}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalInsurance, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("payrollDetailTotalDeductions")}</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalDeductions, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("payrollDetailTabOverview")}</TabsTrigger>
          <TabsTrigger value="details">{t("payrollDetailTabDetails")}</TabsTrigger>
          <TabsTrigger value="payslips">
            {t("payrollDetailTabPayslips", { count: filteredPayslips.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payroll Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("payrollDetailInfoTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailMonthYearLabel")}</p>
                    <p className="font-medium">
                      {record.month}/{record.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailDepartmentLabel")}</p>
                    <p className="font-medium">
                      {record.department?.name || t("payrollWholeCompany")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailStatusLabel")}</p>
                    <p className="font-medium">
                      {getStatusBadge(record.status, t)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailEmployeeCountLabel")}</p>
                    <p className="font-medium">{record.totalEmployees}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailProcessedByLabel")}</p>
                    <p className="font-medium">{record.processedBy || t("payrollDetailDash")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("payrollDetailProcessedAtLabel")}</p>
                    <p className="font-medium">
                      {record.processedAt
                        ? new Date(record.processedAt).toLocaleDateString(locale)
                        : t("payrollDetailDash")}
                    </p>
                  </div>
                  {record.approvedBy && (
                    <>
                      <div>
                        <p className="text-muted-foreground">{t("payrollDetailApprovedByLabel")}</p>
                        <p className="font-medium">{record.approvedBy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("payrollDetailApprovedAtLabel")}</p>
                        <p className="font-medium">
                          {record.approvedAt
                            ? new Date(record.approvedAt).toLocaleDateString(locale)
                            : t("payrollDetailDash")}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {record.note && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground">{t("payrollDetailNoteLabel")}</p>
                      <p className="font-medium">{record.note}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payroll Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("payrollDetailSummaryTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">
                      {t("payrollDetailTotalIncome")}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(record.totalGross, locale)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("payrollDetailInsuranceBhxh")}</span>
                      <span>{t("payrollNotAvailable")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("payrollDetailInsuranceBhyt")}</span>
                      <span>{t("payrollNotAvailable")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("payrollDetailInsuranceBhtn")}</span>
                      <span>{t("payrollNotAvailable")}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">
                      {t("payrollDetailTotalInsuranceTax")}
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(record.totalInsurance + record.totalTax, locale)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("payrollDetailTotalInsuranceLabel")}</span>
                      <span>{formatCurrency(record.totalInsurance, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("payrollDetailTotalPitLabel")}
                      </span>
                      <span>{formatCurrency(record.totalTax, locale)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">
                      {t("payrollDetailNetSalaryLabel")}
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(record.totalNet, locale)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{t("payrollDetailEmployeeSalaryTitle")}</CardTitle>
              <CardDescription>
                {t("payrollDetailEmployeeSalaryDescription", { count: details.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollDetailTable
                details={details}
                departments={departments}
                onViewPayslip={(userId) => {
                  const payslip = filteredPayslips.find(
                    (p) => p.userId === userId,
                  );
                  if (payslip) {
                    setSelectedPayslip(payslip);
                  }
                }}
                onExportPayslip={(userId) => {
                  toast.info(t("payrollFeatureInDevelopment"));
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("payrollDetailEmployeePayslipsTitle")}</CardTitle>
                  <CardDescription>
                    {t("payrollDetailPayslipsCount", { count: filteredPayslips.length })}
                  </CardDescription>
                </div>
                {record.status === "COMPLETED" && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSendEmailDialog(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {t("payrollDetailSendEmail")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPayslips.map((payslip) => (
                  <Card
                    key={payslip.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPayslip(payslip)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{payslip.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payslip.employeeCode || t("payrollNotAvailable")}
                          </p>
                        </div>
                        {payslip.isSecure && (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t("payrollDetailNetSalary")}
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(payslip.netSalary, locale)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t("payrollDetailStatus")}
                          </span>
                          <Badge
                            variant={
                              payslip.status === "GENERATED"
                                ? "secondary"
                                : payslip.status === "VIEWED"
                                  ? "outline"
                                  : "default"
                            }
                          >
                            {payslip.status === "GENERATED"
                              ? t("payrollPayslipsStatusNew")
                              : payslip.status === "VIEWED"
                                ? t("payrollPayslipsStatusViewed")
                                : t("payrollPayslipsStatusDownloaded")}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPayslips.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t("payrollDetailNoPayslips")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payslip Viewer Dialog */}
      {selectedPayslip && (
        <PayslipViewer
          payslip={selectedPayslip}
          //   open={!!selectedPayslip}
          //   onClose={() => setSelectedPayslip(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payrollDetailDeleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("payrollDetailDeleteDialogDescription", {
                month: record.month,
                year: record.year,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("payrollCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("payrollDetailDeletePayroll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payrollDetailApprovalDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("payrollDetailApprovalDialogDescription", {
                month: record.month,
                year: record.year,
                count: record.totalEmployees,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">{t("payrollDetailTotalGrossLabel")}</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(record.totalGross, locale)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">{t("payrollDetailTotalNetLabel")}</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(record.totalNet, locale)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-medium text-amber-800">{t("payrollDetailWarningTitle")}</p>
              <p className="text-amber-700">{t("payrollDetailWarningContent")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              {t("payrollCancel")}
            </Button>
            <Button
              onClick={() => updateStatusMutation.mutate("COMPLETED")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("payrollDetailConfirmApproval")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payrollDetailSendEmailDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("payrollDetailSendEmailDialogDescription", {
                month: record.month,
                year: record.year,
                count: filteredPayslips.length,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">{t("payrollDetailEmailContentTitle")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("payrollDetailEmailContentBody")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>{t("payrollDetailPasswordProtectedNote")}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendEmailDialog(false)}
            >
              {t("payrollCancel")}
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("payrollDetailSendEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


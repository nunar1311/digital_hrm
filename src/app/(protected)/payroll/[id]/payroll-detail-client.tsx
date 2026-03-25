"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/app/(protected)/payroll/actions";
import type {
  PayrollRecord,
  PayrollRecordDetail,
  Payslip,
} from "@/app/(protected)/payroll/types";

function formatCurrency(amount: number | bigint | unknown): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Nháp</Badge>;
    case "PROCESSING":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          Đang xử lý
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-600">
          Hoàn thành
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Đã hủy</Badge>;
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
      toast.success("Cập nhật trạng thái thành công");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái",
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
      toast.success("Đã xóa bảng lương");
      router.push("/payroll");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi xóa bảng lương",
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
      toast.success("Đã xuất file CSV");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xuất file");
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
      toast.success(`Đã gửi ${result.sent} phiếu lương qua email`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi gửi email");
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
        <h2 className="text-xl font-semibold">Không tìm thấy bảng lương</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/payroll")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
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
                Bảng lương Tháng {record.month}/{record.year}
              </h1>
              {getStatusBadge(record.status)}
            </div>
            <p className="text-muted-foreground">
              {record.department?.name || "Toàn công ty"} •{" "}
              {record.totalEmployees} nhân viên
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
                Xuất CSV
              </DropdownMenuItem>
              {record.status === "COMPLETED" && (
                <DropdownMenuItem onClick={() => setShowSendEmailDialog(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Gửi email phiếu lương
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
                    Xóa bảng lương
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Main action button */}
          {record.status === "DRAFT" && (
            <Button onClick={() => setShowApprovalDialog(true)}>
              <Check className="mr-2 h-4 w-4" />
              Duyệt bảng lương
            </Button>
          )}
          {record.status === "PROCESSING" && (
            <Button onClick={() => updateStatusMutation.mutate("COMPLETED")}>
              <Check className="mr-2 h-4 w-4" />
              Hoàn thành
            </Button>
          )}
          {record.status === "COMPLETED" && (
            <Button variant="outline" onClick={() => exportMutation.mutate()}>
              <Download className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng nhân viên</CardDescription>
            <CardTitle className="text-2xl">{record.totalEmployees}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng lương Gross</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalGross)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng lương Net</CardDescription>
            <CardTitle className="text-xl text-green-600">
              {formatCurrency(record.totalNet)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng thuế TNCN</CardDescription>
            <CardTitle className="text-xl text-red-600">
              {formatCurrency(record.totalTax)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng BH</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalInsurance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng khấu trừ</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(record.totalDeductions)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="payslips">
            Phiếu lương ({filteredPayslips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payroll Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Thông tin bảng lương
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tháng/Năm</p>
                    <p className="font-medium">
                      {record.month}/{record.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phòng ban</p>
                    <p className="font-medium">
                      {record.department?.name || "Toàn công ty"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trạng thái</p>
                    <p className="font-medium">
                      {getStatusBadge(record.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số nhân viên</p>
                    <p className="font-medium">{record.totalEmployees}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Người tạo</p>
                    <p className="font-medium">{record.processedBy || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày tạo</p>
                    <p className="font-medium">
                      {record.processedAt
                        ? new Date(record.processedAt).toLocaleDateString(
                            "vi-VN",
                          )
                        : "—"}
                    </p>
                  </div>
                  {record.approvedBy && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Người duyệt</p>
                        <p className="font-medium">{record.approvedBy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ngày duyệt</p>
                        <p className="font-medium">
                          {record.approvedAt
                            ? new Date(record.approvedAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "—"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {record.note && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground">Ghi chú</p>
                      <p className="font-medium">{record.note}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payroll Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tổng hợp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">
                      Tổng thu nhập
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(record.totalGross)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- BHXH</span>
                      <span>—</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- BHYT</span>
                      <span>—</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- BHTN</span>
                      <span>—</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">
                      Tổng bảo hiểm & thuế
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(record.totalInsurance + record.totalTax)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tổng BH</span>
                      <span>{formatCurrency(record.totalInsurance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tổng thuế TNCN
                      </span>
                      <span>{formatCurrency(record.totalTax)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">
                      Thực lĩnh (Net)
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(record.totalNet)}
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
              <CardTitle>Chi tiết lương nhân viên</CardTitle>
              <CardDescription>
                Danh sách chi tiết lương của {details.length} nhân viên
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
                  toast.info("Tính năng đang phát triển");
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
                  <CardTitle>Phiếu lương nhân viên</CardTitle>
                  <CardDescription>
                    {filteredPayslips.length} phiếu lương
                  </CardDescription>
                </div>
                {record.status === "COMPLETED" && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSendEmailDialog(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Gửi email
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
                            {payslip.employeeCode || "—"}
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
                            Lương Net:
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(payslip.netSalary)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Trạng thái:
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
                              ? "Mới"
                              : payslip.status === "VIEWED"
                                ? "Đã xem"
                                : "Đã tải"}
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
                    Chưa có phiếu lương nào. Vui lòng duyệt bảng lương trước.
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
            <DialogTitle>Xóa bảng lương</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bảng lương tháng {record.month}/
              {record.year}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa bảng lương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt bảng lương</DialogTitle>
            <DialogDescription>
              Bạn sắp duyệt bảng lương tháng {record.month}/{record.year} cho{" "}
              {record.totalEmployees} nhân viên. Sau khi duyệt, hệ thống sẽ tạo
              phiếu lương cho từng nhân viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Tổng Gross</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(record.totalGross)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Tổng Net</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(record.totalNet)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-medium text-amber-800">Lưu ý:</p>
              <p className="text-amber-700">
                Sau khi duyệt, bảng lương sẽ không thể chỉnh sửa. Vui lòng kiểm
                tra kỹ trước khi xác nhận.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => updateStatusMutation.mutate("COMPLETED")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi email phiếu lương</DialogTitle>
            <DialogDescription>
              Gửi phiếu lương tháng {record.month}/{record.year} qua email cho{" "}
              {filteredPayslips.length} nhân viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Nội dung email</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Email sẽ chứa thông tin lương và hướng dẫn xem phiếu lương chi
                tiết trên hệ thống. Tính năng bảo mật sẽ được áp dụng.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Phiếu lương có mật khẩu bảo vệ</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendEmailDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gửi email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

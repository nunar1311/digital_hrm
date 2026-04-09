"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Printer,
  Download,
  Mail,
  Shield,
  Building2,
  User,
  Calendar,
  Banknote,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  Payslip,
  PayslipItem,
  PayslipInsurance,
  PayslipTax,
} from "@/app/(protected)/payroll/types";
import Image from "next/image";

interface PayslipViewerProps {
  payslip: Payslip;
  companyName?: string;
  companyLogo?: string;
  isSecure?: boolean;
  onPasswordRequired?: () => void;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function PayslipViewer({
  payslip,
  companyName = "Công ty TNHH Digital HRM",
  companyLogo,
  isSecure = false,
  onPasswordRequired,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: PayslipViewerProps) {
  const [showContent, setShowContent] = useState(!isSecure);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const earnings: PayslipItem[] = payslip.earnings
    ? JSON.parse(payslip.earnings).map((e: any) => ({
        ...e,
        amount: Number(e.amount || 0),
      }))
    : [];
  const deductions: PayslipItem[] = payslip.deductions
    ? JSON.parse(payslip.deductions).map((d: any) => ({
        ...d,
        amount: Number(d.amount || 0),
      }))
    : [];
  const insurance: PayslipInsurance = payslip.insurance
    ? (() => {
        const ins = JSON.parse(payslip.insurance);
        return {
          ...ins,
          BHXH: Number(ins.BHXH || 0),
          BHYT: Number(ins.BHYT || 0),
          BHTN: Number(ins.BHTN || 0),
        };
      })()
    : {
        BHXH: 0,
        BHXH_RATE: 0.08,
        BHYT: 0,
        BHYT_RATE: 0.015,
        BHTN: 0,
        BHTN_RATE: 0.01,
        total: 0,
      };
  const tax: PayslipTax = payslip.tax
    ? (() => {
        const t = JSON.parse(payslip.tax);
        return {
          ...t,
          taxableIncome: Number(t.taxableIncome || 0),
          taxAmount: Number(t.taxAmount || 0),
          personalDeduction: Number(t.personalDeduction || 0),
          dependentDeduction: Number(t.dependentDeduction || 0),
        };
      })()
    : {
        taxableIncome: 0,
        taxAmount: 0,
        personalDeduction: 0,
        dependentDeduction: 0,
        totalDependents: 0,
      };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Đang tải phiếu lương...");
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Đã gửi phiếu lương qua email");
    } catch {
      toast.error("Lỗi khi gửi email");
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
    <div className="flex flex-col h-full">
      {/* Fixed Header with Actions */}
      <div className="flex items-center justify-between border-b pb-4 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          {onPrevious && (
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              In
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Tải PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingEmail ? "Đang gửi..." : "Gửi email"}
            </Button>
          </div>
          {onNext && (
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Phiếu lương tháng {payslip.month}/{payslip.year}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Payslip Content */}
      {!showContent && isSecure ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Phiếu lương được bảo mật
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Vui lòng nhập mật khẩu để xem chi tiết phiếu lương này
          </p>
          <Button onClick={handleUnlock}>Nhập mật khẩu</Button>
        </Card>
      ) : (
        <ScrollArea className="flex-1 -mx-6 px-6">
          <Card className="print:border-none print:shadow-none">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {companyLogo ? (
                      <Image
                        src={companyLogo}
                        alt="Logo"
                        className="h-16 w-16 object-contain"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold">{companyName}</h2>
                      <p className="text-sm text-muted-foreground">
                        Phiếu lương
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Kỳ lương</p>
                    <p className="text-lg font-semibold">
                      Tháng {payslip.month}/{payslip.year}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nhân viên</p>
                      <p className="font-medium">{payslip.employeeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phòng ban</p>
                      <p className="font-medium">
                        {payslip.departmentName || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Mã nhân viên
                      </p>
                      <p className="font-medium font-mono">
                        {payslip.username || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Chức vụ</p>
                      <p className="font-medium">{payslip.position || "—"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Earnings & Deductions Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Earnings Column */}
                  <div>
                    <h3 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                      <span className="h-6 w-1 bg-green-600 rounded-full" />
                      THU NHẬP
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
                        <span>Tổng thu nhập</span>
                        <span className="text-green-600">
                          {formatCurrency(totalEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Insurance Column */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
                        <span className="h-6 w-1 bg-red-600 rounded-full" />
                        BẢO HIỂM (Người lao động)
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
                          <span>Tổng bảo hiểm</span>
                          <span className="text-red-600">
                            -{formatCurrency(totalInsurance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tax Column */}
                    <div>
                      <h3 className="font-semibold mb-3 text-amber-600 flex items-center gap-2">
                        <span className="h-6 w-1 bg-amber-600 rounded-full" />
                        THUẾ TNCN
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Thu nhập chịu thuế</span>
                          <span>{formatCurrency(tax.taxableIncome)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Giảm trừ cá nhân</span>
                          <span>-{formatCurrency(tax.personalDeduction)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            Giảm trừ phụ thuộc ({tax.totalDependents} người)
                          </span>
                          <span>-{formatCurrency(tax.dependentDeduction)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Thuế phải nộp</span>
                          <span className="text-amber-600">
                            -{formatCurrency(tax.taxAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Deductions */}
                {deductions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-red-600">
                        KHẤU TRỪ KHÁC
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

                {/* Summary Footer */}
                <div className="flex justify-between items-center bg-primary/5 -mx-6 -mb-6 p-6 rounded-b-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lương Gross</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(payslip.grossSalary)}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Các khoản khấu trừ
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      -
                      {formatCurrency(
                        totalInsurance + tax.taxAmount + totalDeductions,
                      )}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Lương Net (Thực nhận)
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(payslip.netSalary)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>Ngày tạo: {formatDate(payslip.createdAt)}</p>
                  {payslip.signedAt && (
                    <p>Ngày ký: {formatDate(payslip.signedAt)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Thông tin bảo mật - Chỉ người được xem
                  </p>
                  <p className="text-xs mt-1">
                    Nếu có thắc mắc, vui lòng liên hệ phòng Nhân sự
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-12">
                    Người lập phiếu
                  </p>
                  <p className="text-xs">(Ký và ghi rõ họ tên)</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-12">
                    Phê duyệt
                  </p>
                  <p className="text-xs">(Ký và ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          </Card>
        </ScrollArea>
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

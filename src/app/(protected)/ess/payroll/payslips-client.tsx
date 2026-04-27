"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Wallet,
  Download,
  Loader2,
  FileText,
  Calendar,
  DollarSign,
  Search,
  Settings,
  Grid2X2,
  Table2,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Info,
  ListFilter,
  Lock,
} from "lucide-react";
import { verifyPayslipPassword } from "@/app/(protected)/payroll/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payslip {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  tax: number;
  insurance: number;
  otherDeductions: number;
  netSalary: number;
  status: string;
  isSecure?: boolean;
  paidAt: string | null;
  createdAt: string;
}

interface ESSPayslipsClientProps {
  initialPayslips: Payslip[];
}

// ─── Mobile Detection ─────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "GENERATED", label: "Đã phát hành" },
  { value: "VIEWED", label: "Đã xem" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "PROCESSING", label: "Đang xử lý" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return "0";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function secureFormat(amount: number | null, isSecure?: boolean) {
  if (isSecure) {
    return (
      <span className="blur-xs opacity-40 select-none pointer-events-none tracking-widest text-[0.95em]">
        {formatCurrency(12345678)}
      </span>
    );
  }
  return formatCurrency(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  PAID: {
    label: "Đã thanh toán",
    variant: "default",
    className: "bg-emerald-100 text-emerald-800",
  },
  PENDING: {
    label: "Chờ thanh toán",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800",
  },
  PROCESSING: {
    label: "Đang xử lý",
    variant: "secondary",
  },
  GENERATED: {
    label: "Đã phát hành",
    variant: "default",
    className: "bg-blue-100 text-blue-800",
  },
  VIEWED: {
    label: "Đã xem",
    variant: "secondary",
    className: "bg-purple-100 text-purple-800",
  },
};

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}

// ─── Payslip Detail Dialog (Desktop) ───────────────────────────────────────────

function PayslipDetailDialog({
  payslip,
  onClose,
  onDownload,
  isDownloading,
}: {
  payslip: Payslip | null;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  if (!payslip) return null;

  const cfg = STATUS_CONFIG[payslip.status] ?? STATUS_CONFIG.GENERATED;
  const grossSalary =
    (payslip.baseSalary || 0) +
    (payslip.allowances || 0) +
    (payslip.overtimePay || 0) +
    (payslip.bonuses || 0);
  const totalDeductions =
    (payslip.tax || 0) +
    (payslip.insurance || 0) +
    (payslip.otherDeductions || 0);

  return (
    <Dialog open={!!payslip} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-600" />
            Phiếu lương {MONTHS[payslip.month - 1]} {payslip.year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status & Payment Date */}
          <div className="flex items-center justify-between">
            <Badge variant={cfg.variant} className={cfg.className}>
              {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Ngày thanh toán: {formatDate(payslip.paidAt)}
            </span>
          </div>

          {/* Net Salary Highlight */}
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Lương thực nhận
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(payslip.netSalary)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income Section */}
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-t-lg">
              <span className="text-xs font-semibold text-emerald-800">
                Thu nhập
              </span>
            </div>
            <div className="border border-t-0 border-border divide-y rounded-b-lg">
              <DetailRow
                label="Lương cơ bản"
                value={
                  <span className="font-medium">
                    {formatCurrency(payslip.baseSalary)}
                  </span>
                }
              />
              <DetailRow
                label="Phụ cấp"
                value={
                  <span className="font-medium">
                    {formatCurrency(payslip.allowances)}
                  </span>
                }
              />
              <DetailRow
                label="Làm thêm giờ (OT)"
                value={
                  <span className="font-medium">
                    {formatCurrency(payslip.overtimePay)}
                  </span>
                }
              />
              <DetailRow
                label="Thưởng"
                value={
                  <span className="font-medium">
                    {formatCurrency(payslip.bonuses)}
                  </span>
                }
              />
              <div className="flex justify-between px-3 py-2 bg-emerald-50/50 font-semibold">
                <span className="text-sm text-emerald-900">Tổng thu nhập</span>
                <span className="text-sm text-emerald-700">
                  {formatCurrency(grossSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-t-lg">
              <span className="text-xs font-semibold text-red-800">
                Khấu trừ
              </span>
            </div>
            <div className="border border-t-0 border-border divide-y rounded-b-lg">
              <DetailRow
                label="Thuế TNCN"
                value={
                  <span className="font-medium text-red-600">
                    {formatCurrency(payslip.tax)}
                  </span>
                }
              />
              <DetailRow
                label="Bảo hiểm"
                value={
                  <span className="font-medium text-red-600">
                    {formatCurrency(payslip.insurance)}
                  </span>
                }
              />
              <DetailRow
                label="Khấu trừ khác"
                value={
                  <span className="font-medium text-red-600">
                    {formatCurrency(payslip.otherDeductions)}
                  </span>
                }
              />
              <div className="flex justify-between px-3 py-2 bg-red-50/50 font-semibold">
                <span className="text-sm text-red-900">Tổng khấu trừ</span>
                <span className="text-sm text-red-700">
                  {formatCurrency(totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Tải phiếu lương
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payslip Detail Sheet (Mobile) ───────────────────────────────────────────

function PayslipDetailSheet({
  payslip,
  onClose,
  onDownload,
  isDownloading,
}: {
  payslip: Payslip | null;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  if (!payslip) return null;

  const cfg = STATUS_CONFIG[payslip.status] ?? STATUS_CONFIG.GENERATED;
  const grossSalary =
    (payslip.baseSalary || 0) +
    (payslip.allowances || 0) +
    (payslip.overtimePay || 0) +
    (payslip.bonuses || 0);
  const totalDeductions =
    (payslip.tax || 0) +
    (payslip.insurance || 0) +
    (payslip.otherDeductions || 0);

  return (
    <Sheet open={!!payslip} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-3">
        <SheetHeader className="sr-only">
          <SheetTitle>
            Phiếu lương {MONTHS[payslip.month - 1]} {payslip.year}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {MONTHS[payslip.month - 1]} {payslip.year}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={cfg.variant} className={cfg.className}>
                  {cfg.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(payslip.paidAt)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Salary */}
          <Card className="bg-green-50/50 border-green-100">
            <CardContent>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Lương thực nhận
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(payslip.netSalary)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income */}
          <div>
            <p className="text-xs font-semibold text-emerald-800 mb-1.5 px-1">
              Thu nhập
            </p>
            <div className="space-y-2">
              {[
                { label: "Lương cơ bản", value: payslip.baseSalary },
                { label: "Phụ cấp", value: payslip.allowances },
                { label: "Làm thêm giờ (OT)", value: payslip.overtimePay },
                { label: "Thưởng", value: payslip.bonuses },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold text-emerald-700 pt-1.5 border-t">
                <span>Tổng thu nhập</span>
                <span>{formatCurrency(grossSalary)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <p className="text-xs font-semibold text-red-800 mb-1.5 px-1">
              Khấu trừ
            </p>
            <div className="space-y-2">
              {[
                { label: "Thuế TNCN", value: payslip.tax },
                { label: "Bảo hiểm", value: payslip.insurance },
                { label: "Khấu trừ khác", value: payslip.otherDeductions },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold text-red-700 pt-1.5 border-t">
                <span>Tổng khấu trừ</span>
                <span>-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ngày tạo</span>
              <span>{formatDateTime(payslip.createdAt)}</span>
            </div>
            {payslip.paidAt && (
              <div className="flex justify-between">
                <span>Ngày thanh toán</span>
                <span>{formatDateTime(payslip.paidAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Tải phiếu lương
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Mobile Payslip Card ──────────────────────────────────────────────────────

function MobilePayslipCard({
  payslip,
  onClick,
}: {
  payslip: Payslip;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[payslip.status] ?? STATUS_CONFIG.GENERATED;

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-green-100 text-green-600">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">
              {MONTHS[payslip.month - 1]} {payslip.year}
            </p>
            <Badge
              variant={cfg.variant}
              className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}
            >
              {cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {payslip.paidAt
              ? `Thanh toán: ${formatDate(payslip.paidAt)}`
              : "Chưa thanh toán"}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Thực nhận</span>
            <span className="text-sm font-bold text-green-700">
              {secureFormat(payslip.netSalary, payslip.isSecure)}
            </span>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Desktop Payslip Card ─────────────────────────────────────────────────────

function PayslipCard({
  payslip,
  onClick,
}: {
  payslip: Payslip;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[payslip.status] ?? STATUS_CONFIG.GENERATED;

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer p-3"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg shrink-0 bg-green-100 text-green-600">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                {MONTHS[payslip.month - 1]} {payslip.year}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {payslip.paidAt
                  ? formatDate(payslip.paidAt)
                  : "Chưa thanh toán"}
              </p>
            </div>
          </div>
          <Badge
            variant={cfg.variant}
            className={cn("text-[10px] py-0 h-5 shrink-0", cfg.className)}
          >
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lương cơ bản</span>
            <span className="font-medium">
              {secureFormat(payslip.baseSalary, payslip.isSecure)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phụ cấp + OT + Thưởng</span>
            <span className="font-medium text-emerald-600">
              +
              {secureFormat(
                payslip.allowances + payslip.overtimePay + payslip.bonuses,
                payslip.isSecure,
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thuế + BHXH</span>
            <span className="font-medium text-red-600">
              -{secureFormat(payslip.tax + payslip.insurance, payslip.isSecure)}
            </span>
          </div>
          <div className="flex justify-between pt-2 mt-1 border-t bg-green-50 -mx-3 px-3 py-2">
            <span className="text-sm font-semibold text-green-800">
              Thực nhận
            </span>
            <span className="text-base font-bold text-green-700">
              {secureFormat(payslip.netSalary, payslip.isSecure)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ESSPayslipsClient({ initialPayslips }: ESSPayslipsClientProps) {
  const isMobile = useIsMobile();
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Password Prompt State ───
  const [promptAuthFor, setPromptAuthFor] = useState<Payslip | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Filter payslips
  const filteredPayslips = useMemo(() => {
    return initialPayslips.filter((p) => {
      const matchesYear = p.year === selectedYear;
      const matchesStatus =
        selectedStatus === "ALL" || p.status === selectedStatus;
      const matchesSearch =
        !searchTerm ||
        MONTHS[p.month - 1].toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.year).includes(searchTerm);
      return matchesYear && matchesStatus && matchesSearch;
    });
  }, [initialPayslips, selectedYear, selectedStatus, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      totalPayslips: initialPayslips.length,
      paidPayslips: initialPayslips.filter((p) =>
        ["GENERATED", "VIEWED", "PAID"].includes(p.status),
      ).length,
      totalIncome: initialPayslips
        .filter((p) => ["GENERATED", "VIEWED", "PAID"].includes(p.status))
        .reduce((sum, p) => sum + (p.netSalary || 0), 0),
    }),
    [initialPayslips],
  );

  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  }, [searchExpanded]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchTerm("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const handleDownload = useCallback(() => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  }, []);

  const handleViewPayslip = useCallback((payslip: Payslip) => {
    if (payslip.isSecure) {
      setPromptAuthFor(payslip);
    } else {
      setSelectedPayslip(payslip);
    }
  }, []);

  const handleVerifyPassword = async () => {
    if (!promptAuthFor) return;
    if (!passwordInput) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyPayslipPassword(promptAuthFor.id, passwordInput);
      if (res.success) {
        setPasswordInput("");
        setSelectedPayslip(promptAuthFor);
        setPromptAuthFor(null);
      } else {
        toast.error(res.message || "Mật khẩu không chính xác");
      }
    } catch {
      toast.error("Lỗi xác minh. Vui lòng thử lại");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClosePrompt = () => {
    setPromptAuthFor(null);
    setPasswordInput("");
  };

  const handleCloseDetail = useCallback(() => {
    setSelectedPayslip(null);
  }, []);

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">Phiếu lương</h1>
          </header>

          {/* Stats row */}
          <div className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tổng phiếu lương
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {stats.totalPayslips}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Đã thanh toán
                  </p>
                  <p className="text-sm font-bold leading-tight text-emerald-700">
                    {stats.paidPayslips}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <DollarSign className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tổng thu nhập
                  </p>
                  <p className="text-xs font-bold leading-tight text-green-700 truncate max-w-28">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-2">
            {/* Year Navigator */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setSelectedYear((y) => y - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-16 text-center">
                {selectedYear}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setSelectedYear((y) => y + 1)}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="xs"
                tooltip={"Hôm nay"}
                onClick={() => setSelectedYear(new Date().getFullYear())}
              >
                Hôm nay
              </Button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm..."
                className={cn(
                  "h-6 text-xs transition-all duration-300 ease-in-out pr-7",
                  searchExpanded ? "w-28 sm:w-48 pl-3" : "w-0 opacity-0 pl-0",
                )}
              />

              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>

            {/* Status Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedStatus !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    "px-1 sm:px-2",
                    selectedStatus !== "ALL" &&
                      "bg-primary/10 border-primary text-primary hover:text-primary",
                  )}
                >
                  <ListFilter className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {STATUS_OPTIONS.find((s) => s.value === selectedStatus)
                      ?.label ?? "Trạng thái"}
                  </span>
                  <span className="sm:hidden">Lọc</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
                  Trạng thái
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={selectedStatus === opt.value}
                      onCheckedChange={() => setSelectedStatus(opt.value)}
                      className="text-sm"
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle (Desktop only) */}
            {!isMobile && (
              <div className="hidden sm:flex items-center border rounded-md overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50",
                  )}
                  title="Dạng lưới"
                >
                  <Grid2X2 className="h-3 w-3" />
                  <span className="hidden lg:inline">Lưới</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs transition-colors border-l",
                    viewMode === "table"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50",
                  )}
                  title="Dạng bảng"
                >
                  <Table2 className="h-3 w-3" />
                  <span className="hidden lg:inline">Bảng</span>
                </button>
              </div>
            )}

            <Separator
              orientation="vertical"
              className="h-4! hidden sm:block"
            />

            {/* Settings (Desktop only) */}
            <Button
              variant="outline"
              size="icon-xs"
              className="hidden sm:flex"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </section>

        {/* Content */}
        <div className="flex-1 relative h-full min-h-0 overflow-hidden">
          <div className="h-full flex flex-col pb-8">
            {isMobile ? (
              /* ── Mobile Card List View ── */
              <div className="overflow-auto h-full">
                {filteredPayslips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                    <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchTerm || selectedStatus !== "ALL"
                        ? "Không tìm thấy phiếu lương phù hợp"
                        : "Chưa có phiếu lương cho kỳ lựa chọn"}
                    </p>
                    {(searchTerm || selectedStatus !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedStatus("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredPayslips.map((payslip) => (
                      <MobilePayslipCard
                        key={payslip.id}
                        payslip={payslip}
                        onClick={() => handleViewPayslip(payslip)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* ── Desktop Grid View ── */
              <div className="overflow-auto h-full p-3">
                {filteredPayslips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchTerm || selectedStatus !== "ALL"
                        ? "Không tìm thấy phiếu lương phù hợp"
                        : "Chưa có phiếu lương cho kỳ lựa chọn"}
                    </p>
                    {(searchTerm || selectedStatus !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedStatus("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Payslips Grid */}
                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredPayslips.map((payslip) => (
                        <PayslipCard
                          key={payslip.id}
                          payslip={payslip}
                          onClick={() => handleViewPayslip(payslip)}
                        />
                      ))}
                    </div>

                    {/* Info Card */}
                    <Card className="bg-blue-50/50 border-blue-100">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium text-blue-900">
                              Thông tin phiếu lương
                            </p>
                            <ul className="mt-1.5 space-y-0.5 text-blue-800">
                              <li>
                                • Phiếu lương được tạo tự động sau khi kỳ lương
                                kết thúc
                              </li>
                              <li>
                                • Vui lòng kiểm tra kỹ các khoản thu nhập và
                                khấu trừ
                              </li>
                              <li>
                                • Nếu có thắc mắc, liên hệ bộ phận HR/TC để được
                                giải đáp
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              /* ── Desktop Table View ── */
              <div className="overflow-x-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Kỳ lương
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Trạng thái
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Lương cơ bản
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Phụ cấp
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        OT + Thưởng
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Thuế + BHXH
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Thực nhận
                      </TableHead>
                      <TableHead className="h-8 px-3 text-xs font-semibold select-none z-10 relative">
                        Ngày TT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Wallet className="h-8 w-8 text-muted-foreground/50" />
                            <p>Không tìm thấy phiếu lương nào.</p>
                            {(searchTerm || selectedStatus !== "ALL") && (
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearchTerm("");
                                  setSelectedStatus("ALL");
                                }}
                              >
                                Xóa bộ lọc
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayslips.map((payslip) => {
                        const cfg =
                          STATUS_CONFIG[payslip.status] ??
                          STATUS_CONFIG.GENERATED;
                        return (
                          <TableRow
                            key={payslip.id}
                            className="group/row cursor-pointer"
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            <TableCell className="px-3 py-2">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                                  <Wallet className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-tight">
                                    {MONTHS[payslip.month - 1]} {payslip.year}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Badge
                                variant={cfg.variant}
                                className={cn(
                                  "text-[10px] py-0 h-5",
                                  cfg.className,
                                )}
                              >
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-sm">
                                {secureFormat(
                                  payslip.baseSalary,
                                  payslip.isSecure,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-sm">
                                {secureFormat(
                                  payslip.allowances,
                                  payslip.isSecure,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-sm text-emerald-600">
                                +
                                {secureFormat(
                                  payslip.overtimePay + payslip.bonuses,
                                  payslip.isSecure,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-sm text-red-600">
                                -
                                {secureFormat(
                                  payslip.tax + payslip.insurance,
                                  payslip.isSecure,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-sm font-bold text-green-700">
                                {secureFormat(
                                  payslip.netSalary,
                                  payslip.isSecure,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <span className="text-xs text-muted-foreground">
                                {payslip.paidAt
                                  ? formatDate(payslip.paidAt)
                                  : "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Bottom bar */}
            {filteredPayslips.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-3 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredPayslips.length}</strong> /{" "}
                  <strong>{initialPayslips.length}</strong> phiếu lương
                </p>
                {selectedStatus !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Lọc:{" "}
                    {
                      STATUS_OPTIONS.find((s) => s.value === selectedStatus)
                        ?.label
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog / Sheet */}
      {isMobile ? (
        <PayslipDetailSheet
          payslip={selectedPayslip}
          onClose={handleCloseDetail}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />
      ) : (
        <PayslipDetailDialog
          payslip={selectedPayslip}
          onClose={handleCloseDetail}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />
      )}

      {/* Password Prompt Dialog */}
      <Dialog
        open={!!promptAuthFor}
        onOpenChange={(v) => !v && handleClosePrompt()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </DialogTitle>
            <DialogTitle className="text-center">
              Phiếu lương được bảo mật
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 px-2 text-center text-sm text-muted-foreground">
            Vui lòng nhập mật khẩu do HR cung cấp để xem chi tiết phiếu lương
            tháng {promptAuthFor?.month}/{promptAuthFor?.year}.
            <Input
              type="password"
              placeholder="Nhập mật khẩu..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerifyPassword();
              }}
              className="text-center mt-2"
            />
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClosePrompt}
            >
              Hủy bỏ
            </Button>
            <Button
              className="flex-1"
              onClick={handleVerifyPassword}
              disabled={isVerifying}
            >
              {isVerifying ? "Đang xác thực..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

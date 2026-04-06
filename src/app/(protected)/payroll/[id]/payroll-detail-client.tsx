"use client";

import { useState, useEffect, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Mail,
  MoreHorizontal,
  Trash2,
  Send,
  Loader2,
  Shield,
  Download,
  Wallet,
  Users,
  TrendingUp,
  Receipt,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Keyboard,
  Zap,
  BarChart3,
  PieChart,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
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

function getStatusConfig(status: string) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Nháp",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        color: "text-slate-600",
        bgDot: "bg-slate-400",
      };
    case "PROCESSING":
      return {
        label: "Đang xử lý",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        color: "text-amber-600",
        bgDot: "bg-amber-400",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "text-emerald-600",
        bgDot: "bg-emerald-500",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "bg-red-50 text-red-700 border-red-200",
        color: "text-red-600",
        bgDot: "bg-red-400",
      };
    default:
      return { label: status, className: "", color: "", bgDot: "" };
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lastSavedDate, setLastSavedDate] = useState<Date | null>(null);

  // Command palette search
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for keyboard shortcuts
  const exportRef = useRef<(() => void) | null>(null);
  const refreshRef = useRef<(() => void) | null>(null);

  const { data: record, isLoading, refetch } = useQuery({
    queryKey: ["payroll-record", recordId],
    queryFn: () =>
      getPayrollRecord(recordId) as unknown as Promise<PayrollRecord>,
    initialData: initialRecord,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const { data: payslips } = useQuery({
    queryKey: ["payslips-for-record", recordId],
    queryFn: () => getPayslips({}) as unknown as Promise<Payslip[]>,
    initialData: initialPayslips,
  });

  // Track last saved time

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Cmd/Ctrl + S for export
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (exportRef.current) exportRef.current();
      }
      // Cmd/Ctrl + R for refresh
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        if (refreshRef.current) refreshRef.current();
      }
      // Escape to close dialogs
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
      // ? for keyboard help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setShowKeyboardHelp(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED") =>
      updatePayrollRecordStatus(recordId, status),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["payroll-record", recordId],
      });
      await queryClient.cancelQueries({ queryKey: ["payroll-records"] });
      setShowApprovalDialog(false);
      return {};
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công", {
        description: `Bảng lương đã được cập nhật lúc ${new Date().toLocaleTimeString("vi-VN")}`,
      });
      setLastSavedDate(new Date());
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
    },
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
      toast.success("Đã xuất file CSV", {
        description: `File ${data.fileName} đã được tải về`,
      });
      setLastSavedDate(new Date());
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xuất file");
    },
  });

  // Update refs for keyboard shortcuts
  useEffect(() => {
    exportRef.current = () => exportMutation.mutate();
    refreshRef.current = () => {
      refetch();
      toast.success("Đã làm mới dữ liệu");
    };
  }, [exportMutation, refetch]);

  const sendEmailMutation = useMutation({
    mutationFn: () => sendPayslipEmails(recordId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["payslips-for-record", recordId],
      });
      setShowSendEmailDialog(false);
      return {};
    },
    onSuccess: (result) => {
      toast.success(`Đã gửi ${result.sent} phiếu lương qua email`, {
        description: result.failed > 0 ? `${result.failed} email thất bại` : undefined,
      });
      setLastSavedDate(new Date());
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
    },
  });

  // Calculate stats
  const details: PayrollRecordDetail[] = record?.details || [];
  const filteredPayslips =
    payslips?.filter((p) => p.payrollRecordId === recordId) || [];

  const totalBHXH = details.reduce(
    (s, d) => s + Number(d.socialInsurance || 0),
    0,
  );
  const totalBHYT = details.reduce(
    (s, d) => s + Number(d.healthInsurance || 0),
    0,
  );
  const totalBHTN = details.reduce(
    (s, d) => s + Number(d.unemploymentInsurance || 0),
    0,
  );

  // Department stats
  const departmentStats = details.reduce((acc, detail) => {
    const deptName = detail.user?.department?.name || "Không xác định";
    if (!acc[deptName]) {
      acc[deptName] = { count: 0, totalNet: 0, totalGross: 0 };
    }
    acc[deptName].count++;
    acc[deptName].totalNet += Number(detail.netSalary);
    acc[deptName].totalGross += Number(detail.grossSalary);
    return acc;
  }, {} as Record<string, { count: number; totalNet: number; totalGross: number }>);

  // Salary distribution for chart
  const salaryRanges = [
    { label: "< 10M", min: 0, max: 10000000, count: 0 },
    { label: "10-15M", min: 10000000, max: 15000000, count: 0 },
    { label: "15-20M", min: 15000000, max: 20000000, count: 0 },
    { label: "20-25M", min: 20000000, max: 25000000, count: 0 },
    { label: "> 25M", min: 25000000, max: Infinity, count: 0 },
  ];
  
  details.forEach((d) => {
    const net = Number(d.netSalary);
    const range = salaryRanges.find((r) => net >= r.min && net < r.max);
    if (range) range.count++;
  });

  const maxCount = Math.max(...salaryRanges.map((r) => r.count), 1);

  const statusCfg = record ? getStatusConfig(record.status) : getStatusConfig("DRAFT");

  // Workflow progress
  const workflowSteps = [
    { status: "DRAFT", label: "Nháp", value: 33 },
    { status: "PROCESSING", label: "Xử lý", value: 66 },
    { status: "COMPLETED", label: "Hoàn thành", value: 100 },
  ];
  const currentStepIndex = record
    ? workflowSteps.findIndex((s) => s.status === record.status)
    : 0;
  const progressValue =
    record?.status === "CANCELLED"
      ? 0
      : workflowSteps[currentStepIndex]?.value || 33;

  // Summary stats
  const summaryStats = [
    {
      label: "Nhân viên",
      value: String(record?.totalEmployees || 0),
      icon: Users,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Tổng Gross",
      value: formatCurrency(record?.totalGross || 0),
      icon: TrendingUp,
      bg: "bg-violet-50",
      color: "text-violet-600",
    },
    {
      label: "Tổng Net",
      value: formatCurrency(record?.totalNet || 0),
      icon: Wallet,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Thuế TNCN",
      value: formatCurrency(record?.totalTax || 0),
      icon: Receipt,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
  ];

  // Commands for palette
  const commands = [
    { name: "Xuất CSV", action: () => exportMutation.mutate(), icon: FileSpreadsheet, shortcut: "⌘S" },
    { name: "Làm mới", action: () => { refetch(); toast.success("Đã làm mới"); }, icon: RefreshCw, shortcut: "⌘R" },
    { name: "Gửi email", action: () => setShowSendEmailDialog(true), icon: Mail, shortcut: "" },
    { name: "Xem tất cả phiếu lương", action: () => setActiveTab("payslips"), icon: Receipt, shortcut: "" },
    { name: "Xem chi tiết", action: () => setActiveTab("details"), icon: List, shortcut: "" },
    { name: "Xem tổng quan", action: () => setActiveTab("overview"), icon: LayoutGrid, shortcut: "" },
  ];

  // Filter commands by search
  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate payslips
  const currentPayslipIndex = selectedPayslip
    ? filteredPayslips.findIndex((p) => p.id === selectedPayslip.id)
    : -1;
  const hasPreviousPayslip = currentPayslipIndex > 0;
  const hasNextPayslip = currentPayslipIndex < filteredPayslips.length - 1;

  const goToPreviousPayslip = () => {
    if (hasPreviousPayslip) {
      setSelectedPayslip(filteredPayslips[currentPayslipIndex - 1]);
    }
  };

  const goToNextPayslip = () => {
    if (hasNextPayslip) {
      setSelectedPayslip(filteredPayslips[currentPayslipIndex + 1]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
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

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-linear-to-r from-primary/5 via-violet-500/5 to-emerald-500/5">
        <div className="px-4 md:px-6 py-4 space-y-4">
          {/* Top row: Back, Title, Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.push("/payroll")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Bảng lương T{record.month}/{record.year}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusCfg.className}`}
                  >
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {record.department?.name || "Toàn công ty"} •{" "}
                  {record.totalEmployees} nhân viên
                  {(lastSavedDate ?? record?.updatedAt) && (
                    <span className="ml-2 text-xs">
                      • Lưu lúc {(lastSavedDate ?? new Date(record.updatedAt)).toLocaleTimeString("vi-VN")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Search */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 text-muted-foreground"
                onClick={() => setShowCommandPalette(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-xs">Tìm kiếm...</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              {/* Keyboard Help */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowKeyboardHelp(true)}
                title="Phím tắt (?)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  refetch();
                  toast.success("Đã làm mới dữ liệu");
                }}
                title="Làm mới (⌘R)"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

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
                    <DropdownMenuItem
                      onClick={() => setShowSendEmailDialog(true)}
                    >
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

              {/* Main action */}
              {record.status === "DRAFT" && (
                <Button onClick={() => setShowApprovalDialog(true)}>
                  <Zap className="mr-2 h-4 w-4" />
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

          {/* Workflow Progress */}
          <div className="bg-background/80 backdrop-blur-sm rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tiến trình phê duyệt</span>
              <span className={`text-sm font-medium ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <div className="relative">
              <Progress value={progressValue} className="h-2" />
              <div className="flex justify-between mt-2">
                {workflowSteps.map((step, index) => {
                  const isCompleted =
                    record.status === "COMPLETED" || index < currentStepIndex;
                  const isCurrent = step.status === record.status;
                  return (
                    <div key={step.status} className="flex items-center gap-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? `${statusCfg.bgDot} text-white`
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : isCurrent ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <span className="text-[10px] font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          isCurrent ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryStats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setActiveTab("overview")}
              >
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {s.label}
                  </p>
                  <p
                    className={`text-sm font-bold truncate ${s.color}`}
                    title={s.value}
                  >
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="payslips">
                Phiếu lương ({filteredPayslips.length})
              </TabsTrigger>
            </TabsList>
            
            {/* View mode toggle for payslips */}
            {activeTab === "payslips" && (
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {summaryStats.map((s) => (
                <Card
                  key={s.label}
                  className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setActiveTab("details")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl ${s.bg} group-hover:scale-110 transition-transform duration-200`}
                      >
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {s.label}
                        </p>
                        <p
                          className={`text-base font-bold ${s.color} truncate`}
                          title={s.value}
                        >
                          {s.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Payroll Info - 1 col */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
                      <p className="text-muted-foreground">Số nhân viên</p>
                      <p className="font-medium">{record.totalEmployees}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trạng thái</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusConfig(record.status).className}`}
                      >
                        {getStatusConfig(record.status).label}
                      </Badge>
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
                          ? new Date(record.processedAt).toLocaleDateString("vi-VN")
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
                              ? new Date(record.approvedAt).toLocaleDateString("vi-VN")
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

              {/* Salary Distribution Chart - 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Phân bố lương Net
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salaryRanges.map((range) => (
                      <div key={range.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {range.label}
                          </span>
                          <span className="font-medium">
                            {range.count} nhân viên
                          </span>
                        </div>
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                            style={{
                              width: `${(range.count / maxCount) * 100}%`,
                            }}
                          >
                            {range.count > 0 && (
                              <span className="text-[10px] font-medium text-primary-foreground">
                                {range.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Tổng hợp chi phí
                  </CardTitle>
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
                        <span className="text-muted-foreground">- BHXH (8%)</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(totalBHXH)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">- BHYT (1.5%)</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(totalBHYT)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">- BHTN (1%)</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(totalBHTN)}
                        </span>
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

              {/* Department Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                    Thống kê theo phòng ban
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {Object.entries(departmentStats)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([dept, stats]) => (
                        <div
                          key={dept}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-sm font-medium">{dept}</span>
                            <Badge variant="secondary" className="text-xs">
                              {stats.count} NV
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(stats.totalNet)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insurance & Tax Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-rose-500" />
                    Chi tiết Bảo hiểm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-rose-800">BHXH (8%)</p>
                      <p className="text-xs text-rose-600">Bảo hiểm xã hội</p>
                    </div>
                    <span className="text-lg font-bold text-rose-600">
                      {formatCurrency(totalBHXH)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-rose-800">BHYT (1.5%)</p>
                      <p className="text-xs text-rose-600">Bảo hiểm y tế</p>
                    </div>
                    <span className="text-lg font-bold text-rose-600">
                      {formatCurrency(totalBHYT)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-rose-800">BHTN (1%)</p>
                      <p className="text-xs text-rose-600">Bảo hiểm thất nghiệp</p>
                    </div>
                    <span className="text-lg font-bold text-rose-600">
                      {formatCurrency(totalBHTN)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tổng bảo hiểm</span>
                    <span className="text-xl font-bold text-rose-600">
                      {formatCurrency(record.totalInsurance)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-amber-500" />
                    Chi tiết Thuế TNCN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-amber-800">Thuế TNCN</p>
                      <p className="text-xs text-amber-600">Thu nhập cá nhân phải nộp</p>
                    </div>
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(record.totalTax)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Số NV có thuế</span>
                    <span className="text-lg font-semibold">
                      {details.filter((d) => Number(d.taxAmount) > 0).length}/
                      {details.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Thuế TB/nhân viên</span>
                    <span className="font-medium">
                      {formatCurrency(
                        details.filter((d) => Number(d.taxAmount) > 0).length > 0
                          ? record.totalTax /
                              details.filter((d) => Number(d.taxAmount) > 0).length
                          : 0,
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chi tiết lương nhân viên</CardTitle>
                    <CardDescription>
                      Danh sách chi tiết lương của {details.length} nhân viên
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportMutation.mutate()}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Xuất CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PayrollDetailTable
                  details={details}
                  departments={departments}
                  onViewPayslip={(userId) => {
                    const payslip = filteredPayslips.find((p) => p.userId === userId);
                    if (payslip) {
                      setSelectedPayslip(payslip);
                      setActiveTab("payslips");
                    } else {
                      toast.info("Chưa có phiếu lương cho nhân viên này");
                    }
                  }}
                  onExportPayslip={() => {
                    toast.info("Tính năng đang phát triển");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Payslips */}
          <TabsContent value="payslips">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Phiếu lương nhân viên</CardTitle>
                    <CardDescription>
                      {filteredPayslips.length} phiếu lương
                      {selectedPayslip && (
                        <span className="ml-2">
                          • Đang xem: {filteredPayslips.findIndex((p) => p.id === selectedPayslip.id) + 1}/
                          {filteredPayslips.length}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {record.status === "COMPLETED" && (
                    <Button variant="outline" onClick={() => setShowSendEmailDialog(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi email
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Grid View */}
                {viewMode === "grid" ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPayslips.map((payslip, index) => (
                      <Card
                        key={payslip.id}
                        className={`cursor-pointer hover:shadow-md transition-all border-muted ${
                          selectedPayslip?.id === payslip.id
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {payslip.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{payslip.employeeName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {payslip.employeeCode || "—"}
                                </p>
                              </div>
                            </div>
                            {payslip.isSecure && (
                              <Shield className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <Separator className="my-3" />
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Lương Net</span>
                              <span className="text-base font-semibold text-green-600">
                                {formatCurrency(payslip.netSalary)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Trạng thái</span>
                              <Badge
                                variant={
                                  payslip.status === "GENERATED"
                                    ? "secondary"
                                    : payslip.status === "VIEWED"
                                      ? "outline"
                                      : "default"
                                }
                                className={
                                  payslip.status === "DOWNLOADED"
                                    ? "bg-green-100 text-green-700"
                                    : ""
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
                          <div className="mt-3 pt-3 border-t flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              #{index + 1}
                            </span>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-1 h-4 w-4" />
                              Xem
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* List View */
                  <div className="space-y-2">
                    {filteredPayslips.map((payslip) => (
                      <div
                        key={payslip.id}
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedPayslip?.id === payslip.id ? "bg-primary/5 border-primary" : ""
                        }`}
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {payslip.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{payslip.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {payslip.employeeCode || "—"} • {payslip.departmentName || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Lương Net</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(payslip.netSalary)}
                            </p>
                          </div>
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredPayslips.length === 0 && (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
        <Dialog
          open={!!selectedPayslip}
          onOpenChange={(open) => !open && setSelectedPayslip(null)}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Phiếu lương</DialogTitle>
            </DialogHeader>
            {selectedPayslip && (
              <PayslipViewer
                payslip={selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
                onPrevious={hasPreviousPayslip ? goToPreviousPayslip : undefined}
                onNext={hasNextPayslip ? goToNextPayslip : undefined}
                hasPrevious={hasPreviousPayslip}
                hasNext={hasNextPayslip}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Command Palette */}
        <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
            <Command>
              <CommandInput
                placeholder="Tìm kiếm hành động..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>Không tìm thấy hành động nào.</CommandEmpty>
                <CommandGroup heading="Hành động">
                  {filteredCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.name}
                      onSelect={() => {
                        cmd.action();
                        setShowCommandPalette(false);
                        setSearchQuery("");
                      }}
                    >
                      <cmd.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{cmd.name}</span>
                      {cmd.shortcut && (
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {/* Keyboard Help Dialog */}
        <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phím tắt</DialogTitle>
              <DialogDescription>
                Các phím tắt để thao tác nhanh với bảng lương
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">⌘ K</kbd>
                  <span className="text-sm">Mở command palette</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">⌘ S</kbd>
                  <span className="text-sm">Xuất CSV</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">⌘ R</kbd>
                  <span className="text-sm">Làm mới dữ liệu</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">?</kbd>
                  <span className="text-sm">Hiển thị phím tắt</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">← →</kbd>
                  <span className="text-sm">Xem phiếu lương trước/sau</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="bg-muted px-2 py-1 rounded text-sm font-mono">Esc</kbd>
                  <span className="text-sm">Đóng dialog</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKeyboardHelp(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xóa bảng lương</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa bảng lương tháng {record.month}/
                {record.year}? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">
                Tất cả dữ liệu chi tiết lương sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
                {record.totalEmployees} nhân viên.
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
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Lưu ý:</p>
                    <p className="text-amber-700">
                      Sau khi duyệt, bảng lương sẽ không thể chỉnh sửa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
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
                  tiết trên hệ thống.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Phiếu lương có mật khẩu bảo vệ</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendEmailDialog(false)}>
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
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  AlertCircle,
  Briefcase,
  Download,
  FileText,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { exportContractDocument } from "@/app/(protected)/contracts/actions";
import type { ContractListItem } from "@/types/contract";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClickOutside, useMergedRef } from "@mantine/hooks";

interface ESSContractsClientProps {
  initialContracts: ContractListItem[];
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

// ─── Contract Type Config ───────────────────────────────────────────────────

const CONTRACT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  VĨN_TÍCH: { bg: "bg-indigo-100", text: "text-indigo-600" },
  CÓ_THỜI_HẠN: { bg: "bg-blue-100", text: "text-blue-600" },
  THỬ_VIỆC: { bg: "bg-amber-100", text: "text-amber-600" },
  HỌC_VIỆC: { bg: "bg-teal-100", text: "text-teal-600" },
};

function getContractTypeColor(typeName: string): { bg: string; text: string } {
  const upper = typeName.toUpperCase();
  if (upper.includes("VINH") || upper.includes("VĨN"))
    return CONTRACT_TYPE_COLORS.VĨN_TÍCH;
  if (upper.includes("THỬ") || upper.includes("THU"))
    return CONTRACT_TYPE_COLORS.THỬ_VIỆC;
  if (upper.includes("HỌC")) return CONTRACT_TYPE_COLORS.HỌC_VIỆC;
  return CONTRACT_TYPE_COLORS.CÓ_THỜI_HẠN;
}

// ─── Filter Options ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hiệu lực" },
  { value: "PENDING", label: "Chờ hiệu lực" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "TERMINATED", label: "Đã chấm dứt" },
];

// ─── Mobile Contract Card ───────────────────────────────────────────────────

function MobileContractCard({
  contract,
  onClick,
}: {
  contract: ContractListItem;
  onClick?: () => void;
}) {
  const colorCfg = getContractTypeColor(contract.contractTypeName);

  return (
    <div
      onClick={onClick}
      className="px-3 py-3 border-b bg-background last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            colorCfg.bg,
            colorCfg.text,
          )}
        >
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">{contract.title}</p>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            Số: {contract.contractNumber}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{contract.contractTypeName}</span>
            <span className="font-medium text-emerald-700">
              {formatCurrency(contract.salary, contract.currency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <span>
              {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
            </span>
          </div>
          {contract.isExpiringIn30Days && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              <AlertCircle className="h-3 w-3" />
              <span>Sắp hết hạn ({contract.expiryInDays} ngày)</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Desktop Contract Card ───────────────────────────────────────────────────

function ContractCard({
  contract,
  onExport,
  isExporting,
}: {
  contract: ContractListItem;
  onExport: (format: "DOCX" | "PDF") => void;
  isExporting: boolean;
}) {
  const colorCfg = getContractTypeColor(contract.contractTypeName);

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer p-2",
        contract.isExpiringIn30Days && "border-amber-300",
      )}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                colorCfg.bg,
                colorCfg.text,
              )}
            >
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight truncate">
                {contract.title}
              </CardTitle>
              <CardDescription className="text-[11px]">
                Số: {contract.contractNumber}
              </CardDescription>
            </div>
          </div>
          <ContractStatusBadge status={contract.status} />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px]">Loại hợp đồng</p>
            <p className="font-medium text-xs leading-tight truncate">
              {contract.contractTypeName}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">
              Lương chính thức
            </p>
            <p className="font-medium text-xs leading-tight text-emerald-700">
              {formatCurrency(contract.salary, contract.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">Ngày hiệu lực</p>
            <p className="font-medium text-xs leading-tight">
              {formatDate(contract.startDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">Ngày hết hạn</p>
            <p className="font-medium text-xs leading-tight">
              {formatDate(contract.endDate)}
            </p>
          </div>
        </div>

        {contract.isExpiringIn30Days && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="text-[11px]">
              Hợp đồng sắp hết hạn trong {contract.expiryInDays} ngày.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onExport("DOCX");
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onExport("PDF");
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Contract Detail Dialog (Desktop) ───────────────────────────────────────

function ContractDetailDialog({
  contract,
  onClose,
  onExport,
  isExporting,
}: {
  contract: ContractListItem | null;
  onClose: () => void;
  onExport: (format: "DOCX" | "PDF") => void;
  isExporting: boolean;
}) {
  if (!contract) return null;

  const colorCfg = getContractTypeColor(contract.contractTypeName);

  const detailRows = [
    { label: "Số hợp đồng", value: contract.contractNumber },
    { label: "Loại hợp đồng", value: contract.contractTypeName },
    {
      label: "Lương chính thức",
      value: formatCurrency(contract.salary, contract.currency),
      highlight: true,
    },
    { label: "Ngày hiệu lực", value: formatDate(contract.startDate) },
    { label: "Ngày hết hạn", value: formatDate(contract.endDate) },
    { label: "Trạng thái", value: contract.status },
  ];

  return (
    <Dialog open={!!contract} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiết hợp đồng
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-3 rounded-xl shrink-0",
                colorCfg.bg,
                colorCfg.text,
              )}
            >
              <Briefcase className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold leading-tight">
                {contract.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Số: {contract.contractNumber}
              </p>
              <div className="mt-2">
                <ContractStatusBadge status={contract.status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {detailRows.map((row) => (
              <div key={row.label}>
                <p className="text-xs text-muted-foreground">{row.label}</p>
                {row.label === "Trạng thái" ? (
                  <ContractStatusBadge status={contract.status} />
                ) : (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      row.highlight && "text-emerald-700",
                    )}
                  >
                    {row.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {contract.isExpiringIn30Days && (
            <>
              <Separator />
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Cảnh báo hết hạn</p>
                  <p className="text-xs mt-0.5">
                    Hợp đồng sắp hết hạn trong {contract.expiryInDays} ngày.
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onExport("DOCX")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              DOCX
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onExport("PDF")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ESSContractsClient({
  initialContracts,
}: ESSContractsClientProps) {
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<ContractListItem | null>(null);
  const [exportingContractId, setExportingContractId] = useState<string | null>(
    null,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      setSearchTerm("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  const exportMutation = useMutation({
    mutationFn: exportContractDocument,
    onSuccess: (result) => {
      const blob = base64ToBlob(result.base64Content, result.mimeType);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setExportingContractId(null);
    },
    onError: () => {
      toast.error("Không thể xuất file hợp đồng");
      setExportingContractId(null);
    },
  });

  const filteredContracts = useMemo(() => {
    return initialContracts.filter((c) => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractTypeName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [initialContracts, statusFilter, searchTerm]);

  const stats = useMemo(
    () => ({
      total: initialContracts.length,
      active: initialContracts.filter((c) => c.status === "ACTIVE").length,
      expired: initialContracts.filter((c) => c.status === "EXPIRED").length,
      expiringSoon: initialContracts.filter((c) => c.isExpiringIn30Days).length,
    }),
    [initialContracts],
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

  const handleExport = useCallback(
    (contractId: string, format: "DOCX" | "PDF") => {
      setExportingContractId(contractId);
      exportMutation.mutate({ contractId, format });
    },
    [exportMutation],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section>
          <header className="px-2 flex items-center sm:px-4 h-10 border-b">
            <h1 className="font-bold text-sm sm:text-base">
              Hợp đồng lao động
            </h1>
          </header>

          {/* Stats row */}
          <div className="px-2 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tổng hợp đồng
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Đang hiệu lực
                  </p>
                  <p className="text-sm font-bold leading-tight text-emerald-700">
                    {stats.active}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background shrink-0 min-w-0">
                <div className="h-3.5 w-3.5 rounded-full bg-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Hết hạn
                  </p>
                  <p className="text-sm font-bold leading-tight text-slate-700">
                    {stats.expired}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 shrink-0 min-w-0">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Sắp hết hạn
                  </p>
                  <p className="text-sm font-bold leading-tight text-amber-700">
                    {stats.expiringSoon}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-2">
            {/* Search */}
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm..."
                className={cn(
                  "h-7 sm:h-8 text-xs transition-all duration-300 ease-in-out pr-7 pl-3 rounded-md border bg-background",
                  searchExpanded
                    ? "w-32 sm:w-48 opacity-100"
                    : "w-0 opacity-0 pl-0 border-0",
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
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Status Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={statusFilter !== "ALL" ? "outline" : "ghost"}
                  size="xs"
                  className={cn(
                    statusFilter !== "ALL" &&
                      "bg-primary/10 border-primary text-primary",
                  )}
                >
                  <FileText className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {STATUS_FILTERS.find((s) => s.value === statusFilter)
                      ?.label ?? "Lọc"}
                  </span>
                  <span className="sm:hidden">Lọc</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
                  Trạng thái
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  {STATUS_FILTERS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={statusFilter === opt.value}
                      onCheckedChange={() => setStatusFilter(opt.value)}
                      className="text-xs"
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick status pills (desktop) */}
            <div className="hidden sm:flex items-center gap-1 flex-wrap">
              {STATUS_FILTERS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setStatusFilter(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        </section>

        {/* Content */}
        <div className="flex-1 relative h-full min-h-0 overflow-hidden">
          <div className="h-full flex flex-col pb-8">
            {isMobile ? (
              /* ── Mobile Card List View ── */
              <div className="overflow-auto h-full">
                {filteredContracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchTerm || statusFilter !== "ALL"
                        ? "Không tìm thấy hợp đồng phù hợp"
                        : "Bạn chưa có hợp đồng nào"}
                    </p>
                    {(searchTerm || statusFilter !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredContracts.map((contract) => (
                      <MobileContractCard
                        key={contract.id}
                        contract={contract}
                        onClick={() => setSelectedContract(contract)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── Desktop Grid View ── */
              <div className="overflow-auto h-full p-3">
                {filteredContracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchTerm || statusFilter !== "ALL"
                        ? "Không tìm thấy hợp đồng phù hợp"
                        : "Bạn chưa có hợp đồng nào"}
                    </p>
                    {(searchTerm || statusFilter !== "ALL") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredContracts.map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onExport={(format) => handleExport(contract.id, format)}
                        isExporting={exportingContractId === contract.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom bar */}
            {filteredContracts.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-background flex items-center justify-between px-3 py-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <strong>{filteredContracts.length}</strong> /{" "}
                  <strong>{initialContracts.length}</strong> hợp đồng
                </p>
                {statusFilter !== "ALL" && (
                  <span className="text-xs text-muted-foreground">
                    Lọc:{" "}
                    {
                      STATUS_FILTERS.find((s) => s.value === statusFilter)
                        ?.label
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <ContractDetailDialog
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onExport={(format) => {
          if (selectedContract) {
            handleExport(selectedContract.id, format);
          }
        }}
        isExporting={!!exportingContractId}
      />
    </div>
  );
}

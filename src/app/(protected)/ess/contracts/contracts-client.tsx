"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Download,
  FileText,
  Loader2,
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
import { cn } from "@/lib/utils";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { exportContractDocument } from "@/app/(protected)/contracts/actions";
import type { ContractListItem } from "@/types/contract";

interface ESSContractsClientProps {
  initialContracts: ContractListItem[];
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) {
    return "-";
  }
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

export function ESSContractsClient({
  initialContracts,
}: ESSContractsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
    },
    onError: () => {
      toast.error("Không thể xuất file hợp đồng");
    },
  });

  const filteredContracts =
    statusFilter === "ALL"
      ? initialContracts
      : initialContracts.filter((c) => c.status === statusFilter);

  const stats = useMemo(
    () => ({
      total: initialContracts.length,
      active: initialContracts.filter((c) => c.status === "ACTIVE").length,
      expired: initialContracts.filter((c) => c.status === "EXPIRED").length,
      expiringSoon: initialContracts.filter((c) => c.isExpiringIn30Days).length,
    }),
    [initialContracts],
  );

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <div className="shrink-0 border-b bg-linear-to-r from-indigo-50/50 to-primary/5">
        <div className="px-4 md:px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            Hợp đồng lao động
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi trạng thái hợp đồng và tải tài liệu DOCX/PDF.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Tổng hợp đồng</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Đang hiệu lực</div>
              <div className="text-2xl font-semibold text-emerald-700">
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Hết hạn</div>
              <div className="text-2xl font-semibold text-slate-700">
                {stats.expired}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Sắp hết hạn</div>
              <div className="text-2xl font-semibold text-amber-700">
                {stats.expiringSoon}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Lọc:</span>
          {["ALL", "ACTIVE", "PENDING", "EXPIRED", "TERMINATED"].map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" && "Tất cả"}
                {status === "ACTIVE" && "Đang hiệu lực"}
                {status === "PENDING" && "Chờ hiệu lực"}
                {status === "EXPIRED" && "Hết hạn"}
                {status === "TERMINATED" && "Đã chấm dứt"}
              </Button>
            ),
          )}
        </div>

        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              Không có hợp đồng phù hợp bộ lọc.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredContracts.map((contract) => (
              <Card
                key={contract.id}
                className={cn(
                  "hover:shadow-md transition-all",
                  contract.isExpiringIn30Days && "border-amber-300",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {contract.title}
                      </CardTitle>
                      <CardDescription>
                        Số: {contract.contractNumber}
                      </CardDescription>
                    </div>
                    <ContractStatusBadge status={contract.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Loại hợp đồng
                      </p>
                      <p className="font-medium">{contract.contractTypeName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Lương chính thức
                      </p>
                      <p className="font-medium text-emerald-700">
                        {formatCurrency(contract.salary, contract.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ngày hiệu lực
                      </p>
                      <p className="font-medium">
                        {formatDate(contract.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ngày hết hạn
                      </p>
                      <p className="font-medium">
                        {formatDate(contract.endDate)}
                      </p>
                    </div>
                  </div>

                  {contract.isExpiringIn30Days && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <p className="text-xs">
                        Hợp đồng sắp hết hạn trong {contract.expiryInDays} ngày.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportMutation.mutate({
                          contractId: contract.id,
                          format: "DOCX",
                        })
                      }
                      disabled={exportMutation.isPending}
                    >
                      {exportMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      DOCX
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportMutation.mutate({
                          contractId: contract.id,
                          format: "PDF",
                        })
                      }
                      disabled={exportMutation.isPending}
                    >
                      {exportMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

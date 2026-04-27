"use client";

import { useEffect, useState, useRef } from "react";

import { FileText, X, Loader2 } from "lucide-react";

import { getContractPreviewHtmlAction } from "@/app/(protected)/contracts/actions";
import { Button } from "@/components/ui/button";
import { ContractPreviewPanelClient } from "@/components/contracts/contract-preview-panel-client";
import { useQuery } from "@tanstack/react-query";


interface ContractPreviewPanelProps {
  contractId: string;
  contractTitle: string;
  contractNumber: string;
  status: string;
  onClose: () => void;
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm text-muted-foreground text-center">
        Da xay ra loi khi tai xem hop dong
      </p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm text-muted-foreground text-center">
        Khong the tai noi dung hop dong
      </p>
    </div>
  );
}

import { A4PaginatedPreview } from "./a4-paginated-preview";

function ContractPreviewContent({ contractId }: { contractId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["contract-preview-html", contractId],
    queryFn: () => getContractPreviewHtmlAction(contractId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Đang tải nội dung hợp đồng...
        </p>
      </div>
    );
  }

  if (isError || !data || !data.success) {
    return <ErrorState />;
  }

  if (!data.html) {
    return <NotFoundState />;
  }

  return <A4PaginatedPreview htmlContent={data.html} />;
}

export function ContractPreviewPanel({
  contractId,
  contractTitle,
  contractNumber,
  status,
  onClose,
}: ContractPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{contractTitle}</p>
            <p className="text-xs text-muted-foreground truncate">
              So: {contractNumber}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 ml-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Export buttons */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/20 shrink-0">
        <ContractPreviewPanelClient contractId={contractId} status={status} />
      </div>

      {/* Preview content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ContractPreviewContent contractId={contractId} />
      </div>
    </div>
  );
}

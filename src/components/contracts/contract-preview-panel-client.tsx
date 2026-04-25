"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ContractPreviewPanelClientProps {
  contractId: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function ContractPreviewPanelClient({
  contractId,
}: ContractPreviewPanelClientProps) {
  const mutation = useMutation({
    mutationFn: async (format: "DOCX" | "PDF") => {
      const res = await fetch("/api/contracts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, format }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      return res.json() as Promise<{
        fileName: string;
        mimeType: string;
        base64Content: string;
      }>;
    },
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
      toast.success("Da tai file thanh cong");
    },
    onError: () => {
      toast.error("Khong the xuat file hop dong");
    },
  });

  const handleExport = useCallback(
    (format: "DOCX" | "PDF") => {
      mutation.mutate(format);
    },
    [mutation],
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => handleExport("DOCX")}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        DOCX
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => handleExport("PDF")}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        PDF
      </Button>
    </>
  );
}

import { FileText, X } from "lucide-react";
import { getContractTemplatePreview } from "@/app/(protected)/contracts/actions";
import { buildContractDocxBuffer } from "@/lib/contracts/document-export";
import mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { ContractPreviewPanelClient } from "@/components/contracts/contract-preview-panel-client";

interface ContractPreviewPanelProps {
  contractId: string;
  contractTitle: string;
  contractNumber: string;
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

async function ContractPreviewContent({
  contractId,
}: {
  contractId: string;
}) {
  const preview = await getContractTemplatePreview({ contractId });

  if (!preview.success) {
    return <NotFoundState />;
  }

  let html: string;
  try {
    const docxBuffer = await buildContractDocxBuffer({
      title:
        preview.mergedContent?.split("\n")[0] ?? "Hop Dong Lao Dong",
      mergedContent: preview.mergedContent ?? "",
    });

    const result = await mammoth.convertToHtml(
      { buffer: Buffer.from(docxBuffer) },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p => p",
        ],
      },
    );
    html = result.value;
  } catch {
    return <ErrorState />;
  }

  return (
    <div
      className="h-full overflow-auto p-6"
      style={{
        background: "white",
        color: "#1a1a1a",
        fontFamily: "Times New Roman, serif",
        fontSize: "13px",
        lineHeight: "1.6",
      }}
    >
      <style>{`
        .docx-preview h1 {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .docx-preview p {
          margin-bottom: 8px;
          text-align: justify;
        }
        .docx-preview strong {
          font-weight: bold;
        }
      `}</style>
      <div
        className="docx-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function ContractPreviewPanel({
  contractId,
  contractTitle,
  contractNumber,
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
        <ContractPreviewPanelClient contractId={contractId} />
      </div>

      {/* Preview content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ContractPreviewContent contractId={contractId} />
      </div>
    </div>
  );
}

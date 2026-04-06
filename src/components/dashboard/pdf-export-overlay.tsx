"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PdfExportOverlayProps {
    isOpen: boolean;
    progress?: string;
    onCancel?: () => void;
}

export function PdfExportOverlay({
    isOpen,
    progress,
    onCancel,
}: PdfExportOverlayProps) {
    const statusText = progress;

    return (
        <Dialog open={isOpen}>
            <DialogContent
                showCloseButton={false}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="flex flex-row items-center gap-4 p4-8 py-4 rounded-full border-0 shadow-lg max-w-[calc(100%-2rem)] w-auto backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                <DialogTitle className="text-sm font-medium whitespace-nowrap min-w-0 truncate max-w-[240px] sm:max-w-none">
                    {statusText}
                </DialogTitle>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="shrink-0 text-sm text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-0"
                    >
                        Cancel
                    </button>
                )}
            </DialogContent>
        </Dialog>
    );
}

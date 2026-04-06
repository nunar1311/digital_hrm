"use client";

import { useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportControlProps {
  canvasRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function ExportControl({ canvasRef, className }: ExportControlProps) {
  const isExportingRef = useRef(false);

  const handleExportPNG = useCallback(async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;

    try {
      // Find the canvas element to export
      const elementToExport =
        canvasRef?.current ??
        document.querySelector<HTMLElement>("[data-org-chart-canvas]") ??
        document.querySelector<HTMLElement>(".relative.flex-1.min-h-125") ??
        document.querySelector<HTMLElement>('[class*="org-chart-canvas"]');

      if (!elementToExport) {
        toast.error("Không tìm thấy sơ đồ để xuất");
        return;
      }

      // Temporarily reset transform for clean export
      const originalTransform = elementToExport.style.transform;
      const originalOverflow = elementToExport.style.overflow;
      const originalWidth = elementToExport.style.width;

      elementToExport.style.transform = "none";
      elementToExport.style.overflow = "visible";
      elementToExport.style.width = "auto";

      // Wait for DOM to settle after style changes
      await new Promise((r) => setTimeout(r, 50));

      const dataUrl = await toPng(elementToExport, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (node) => {
          // Exclude zoom controls, minimap, toolbar overlays
          const excludeClasses = [
            "absolute.bottom-4.right-4",
            "absolute.bottom-4.left-4",
            "absolute.top-4",
            "fixed.bottom-",
          ];
          if (node.className && typeof node.className === "string") {
            for (const cls of excludeClasses) {
              if (node.className.includes(cls)) return false;
            }
          }
          return true;
        },
      });

      // Restore original styles
      elementToExport.style.transform = originalTransform;
      elementToExport.style.overflow = originalOverflow;
      elementToExport.style.width = originalWidth;

      // Trigger download
      const date = new Date()
        .toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
      const link = document.createElement("a");
      link.download = `so-do-to-chuc-${date}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Đã xuất ảnh sơ đồ tổ chức thành công");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Lỗi khi xuất ảnh. Vui lòng thử lại.");
    } finally {
      isExportingRef.current = false;
    }
  }, [canvasRef]);

  return (
    <Button
      variant="ghost"
      size="xs"
      className={className}
      onClick={handleExportPNG}
      tooltip="Xuất sơ đồ dưới dạng ảnh PNG"
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}

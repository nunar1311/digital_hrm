"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface A4PaginatedPreviewProps {
  htmlContent: string;
}

export function A4PaginatedPreview({ htmlContent }: A4PaginatedPreviewProps) {
  const [pages, setPages] = useState(1);
  const [scale, setScale] = useState(1);
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PADDING_X = 76; // ~20mm
  const PADDING_Y = 57; // ~15mm
  const INNER_WIDTH = A4_WIDTH - PADDING_X * 2;
  const INNER_HEIGHT = A4_HEIGHT - PADDING_Y * 2;
  const COLUMN_GAP = PADDING_X * 2; // Gap between columns exactly matches padding to perfectly align next pages

  // Calculate pages
  useEffect(() => {
    if (measureRef.current) {
      // Small delay to allow fonts and styles to apply
      const timer = setTimeout(() => {
        if (measureRef.current) {
          // Force overflow visible to let columns generate horizontally
          const scrollWidth = measureRef.current.scrollWidth;
          // Number of pages is based on the scrollWidth of the columns
          const calculatedPages = Math.max(
            1,
            Math.ceil((scrollWidth + COLUMN_GAP) / (INNER_WIDTH + COLUMN_GAP)),
          );
          setPages(calculatedPages);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [htmlContent, COLUMN_GAP, INNER_WIDTH]);

  // Responsive scaling to prevent scroll-x
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Leave some padding (32px) for the container
        const availableWidth = entry.contentRect.width - 32;
        const newScale =
          availableWidth < A4_WIDTH ? availableWidth / A4_WIDTH : 1;
        setScale(newScale);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [A4_WIDTH]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center py-4 overflow-x-hidden w-full"
    >
      {/* Hidden element for measuring content width when laid out in columns */}
      <div className="h-0 w-0 overflow-hidden opacity-0 pointer-events-none absolute">
        <div
          ref={measureRef}
          className="contract-content"
          style={{
            height: `${INNER_HEIGHT}px`,
            columnWidth: `${INNER_WIDTH}px`,
            columnGap: `${COLUMN_GAP}px`,
            width: `${INNER_WIDTH}px`,
            overflowY: "visible",
            overflowX: "visible",
            padding: 0,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div
        className="flex flex-col items-center"
        style={{
          gap: `${24 * scale}px`,
          transformOrigin: "top center",
          transform: `scale(${scale})`,
          // Ensure container has enough height after scaling so the scrollbar works correctly
          marginBottom: `${(scale - 1) * pages * A4_HEIGHT}px`,
        }}
      >
        {Array.from({ length: pages }).map((_, i) => (
          <div
            key={i}
            className="shadow-lg border shrink-0 relative bg-background"
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
            }}
          >
            <div className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-30 z-10">
              Trang {i + 1} / {pages}
            </div>

            {/* Page content wrapper with strict bounds */}
            <div
              style={{
                position: "absolute",
                top: `${PADDING_Y}px`,
                left: `${PADDING_X}px`,
                width: `${INNER_WIDTH}px`,
                height: `${INNER_HEIGHT}px`,
                overflow: "hidden", // Hide columns that belong to other pages
              }}
            >
              {/* The actual content translated to show the current column/page */}
              <div
                className="contract-content"
                style={{
                  height: `${INNER_HEIGHT}px`,
                  columnWidth: `${INNER_WIDTH}px`,
                  columnGap: `${COLUMN_GAP}px`,
                  width: `${INNER_WIDTH}px`,
                  padding: 0,
                  margin: 0,
                  overflowY: "visible",
                  overflowX: "visible",
                  // Shift left to reveal the i-th column
                  transform: `translateX(-${i * (INNER_WIDTH + COLUMN_GAP)}px)`,
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

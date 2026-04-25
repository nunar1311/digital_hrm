"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CardToolbar from "./card-toolbar";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getAutoAISummary } from "@/app/(protected)/dashboard/ai-actions";
import { ScrollArea } from "@/components/ui/scroll-area";

const AIExecutiveSummaryContent = () => {
  const {
    data,
    isLoading: isQueryLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: ["dashboard-ai-summary"],
    queryFn: () => getAutoAISummary("standard", false),
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  const [displayedSummary, setDisplayedSummary] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const isLoading = isQueryLoading || isFetching;
  const summary = data?.content ?? null;
  const error = queryError?.message || data?.error || null;

  // Typing effect trigger
  useEffect(() => {
    if (summary) {
      setDisplayedSummary("");
      setIsTyping(true);
    }
  }, [summary]);

  // Typing effect
  useEffect(() => {
    if (!isTyping || !summary) return;

    let i = 0;
    const charsPerTick = 3; // Type 3 characters at a time for speed

    // We already set displayedSummary = "" before entering this state hook,
    // so we can just start the interval.

    const intervalId = setInterval(() => {
      i += charsPerTick;
      setDisplayedSummary(summary.slice(0, i));

      // Stop typing if we reached or exceeded the length
      if (i >= summary.length) {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [summary, isTyping]);

  /**
   * Parse markdown-like content into sections for rich rendering.
   * Supports: **bold**, ## headings, bullet points, numbered lists.
   */
  const renderContent = (text: string, showCursor: boolean = false) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (currentListItems.length > 0 && listType) {
        const Tag = listType;
        elements.push(
          <Tag
            key={`list-${elements.length}`}
            className={cn(
              "space-y-1.5 my-2",
              listType === "ul" ? "list-disc pl-5" : "list-decimal pl-5",
            )}
          >
            {currentListItems.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: item
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-foreground font-semibold">$1</strong>',
                    )
                    .replace(
                      /__(.*?)__/g,
                      '<em class="text-foreground">$1</em>',
                    ),
                }}
              />
            ))}
          </Tag>,
        );
        currentListItems = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Empty line
      if (!line) {
        flushList();
        continue;
      }

      // Heading: ## or ###
      if (line.startsWith("## ") || line.startsWith("### ")) {
        flushList();
        const level = line.startsWith("### ") ? 3 : 2;
        const text = line.replace(/^#{2,3}\s+/, "");
        const icon =
          text.includes("CẢNH BÁO") || text.includes("Cảnh báo") ? (
            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
          ) : text.includes("KHUYẾN NGHỊ") || text.includes("Khuyến nghị") ? (
            <TrendingUp className="size-4 text-emerald-500 shrink-0" />
          ) : text.includes("TỔNG QUAN") || text.includes("Tổng quan") ? (
            <Info className="size-4 text-blue-500 shrink-0" />
          ) : null;

        elements.push(
          <div
            key={`heading-${i}`}
            className={cn(
              "flex items-center gap-2 mt-4 mb-1.5",
              level === 2 ? "text-sm font-bold" : "text-sm font-semibold",
            )}
          >
            {icon}
            <span
              dangerouslySetInnerHTML={{
                __html: text.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="font-bold">$1</strong>',
                ),
              }}
            />
          </div>,
        );
        continue;
      }

      // Heading 1 (bold line acting as title): # Title
      if (line.startsWith("# ")) {
        flushList();
        const text = line.replace(/^#\s+/, "");
        elements.push(
          <h3
            key={`h1-${i}`}
            className="text-base font-bold mt-3 mb-2 flex items-center gap-2"
          >
            <Sparkles className="size-4 text-violet-500" />
            {text}
          </h3>,
        );
        continue;
      }

      // Bullet points: - or *
      if (/^[-*]\s+/.test(line)) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        currentListItems.push(line.replace(/^[-*]\s+/, ""));
        continue;
      }

      // Numbered list: 1. 2. etc.
      if (/^\d+[\.\)]\s+/.test(line)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        currentListItems.push(line.replace(/^\d+[\.\)]\s+/, ""));
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={`p-${i}`}
          className="text-sm text-muted-foreground leading-relaxed my-1"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-foreground font-semibold">$1</strong>',
              )
              .replace(/__(.*?)__/g, '<em class="text-foreground">$1</em>'),
          }}
        />,
      );
    }

    flushList();

    if (showCursor) {
      elements.push(
        <div key="cursor" className="inline-block ml-1">
          <span className="inline-block w-1 h-4 bg-primary animate-pulse align-middle" />
        </div>,
      );
    }

    return elements;
  };

  return (
    <ScrollArea className="flex flex-col w-full h-full overflow-auto">
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto pr-1">
        {isLoading && !displayedSummary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="mt-4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-4">
            <div>
              <p className="text-sm font-medium text-destructive">
                Không thể tạo báo cáo
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                {error}
              </p>
            </div>
          </div>
        )}

        {displayedSummary !== null && (
          <div
            className={cn(
              "relative",
              isLoading && "opacity-50 pointer-events-none",
            )}
          >
            {renderContent(displayedSummary, isTyping)}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="size-4 animate-spin" />
                  Đang tạo lại...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

const CardAIExecutiveSummary = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["dashboard-ai-summary"],
    });
  }, [queryClient]);

  return (
    <CardToolbar title="Tóm tắt điều hành AI" onRefresh={handleRefresh}>
      <AIExecutiveSummaryContent />
    </CardToolbar>
  );
};

export default CardAIExecutiveSummary;

/**
 * useIntentClassifier - AI-powered intent classification for HRM AI Chat
 *
 * Analyzes user messages to determine the best processing path:
 * - "data_query": Needs database query + chart visualization
 * - "data_answer": Needs database query + text answer (no chart needed)
 * - "general": General AI agent conversation
 *
 * Uses the existing /api/ai/data-analyst endpoint for lightweight intent detection.
 */
import { useState, useCallback, useRef } from "react";

export type IntentType = "data_query" | "data_answer" | "general" | "unknown";

export interface IntentResult {
  type: IntentType;
  confidence: number;
  reasoning?: string;
  suggestedChartType?: "bar" | "line" | "pie" | "scatter" | "none";
  chartTitle?: string;
  queryContext?: string;
  error?: string;
}

interface UseIntentClassifierReturn {
  classifyIntent: (message: string) => Promise<IntentResult>;
  isClassifying: boolean;
  error: string | null;
}

export function useIntentClassifier(): UseIntentClassifierReturn {
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const classifyIntent = useCallback(async (message: string): Promise<IntentResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setIsClassifying(true);
    setError(null);

    try {
      const controller = new AbortController();

      const response = await fetch("/api/ai/data-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: message,
          language: "vi",
          include_chart: false,
          intent_only: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      const intent = result.intent as string | undefined;
      const confidence = result.confidence as number | undefined;
      const hasChartData = result.chart_data && (result.chart_data as unknown[]).length > 0;
      const hasMetrics = result.metrics && (result.metrics as unknown[]).length > 0;

      let type: IntentType = "general";
      let suggestedChartType: IntentResult["suggestedChartType"] = "none";

      if (result.success === false || !result.answer) {
        type = "general";
      } else if (intent) {
        const lowerIntent = intent.toLowerCase();

        if (
          lowerIntent.includes("comparison") ||
          lowerIntent.includes("distribution") ||
          lowerIntent.includes("ratio") ||
          lowerIntent.includes("proportion") ||
          lowerIntent.includes("cơ cấu") ||
          lowerIntent.includes("tỷ lệ") ||
          lowerIntent.includes("tỉ lệ")
        ) {
          type = "data_query";
          suggestedChartType = "pie";
        } else if (
          lowerIntent.includes("trend") ||
          lowerIntent.includes("timeseries") ||
          lowerIntent.includes("xu hướng") ||
          lowerIntent.includes("theo tháng") ||
          lowerIntent.includes("theo quý") ||
          lowerIntent.includes("theo năm")
        ) {
          type = "data_query";
          suggestedChartType = "line";
        } else if (
          lowerIntent.includes("count") ||
          lowerIntent.includes("đếm") ||
          lowerIntent.includes("bao nhiêu") ||
          lowerIntent.includes("số lượng") ||
          lowerIntent.includes("total") ||
          lowerIntent.includes("sum")
        ) {
          type = "data_answer";
          suggestedChartType = hasChartData || hasMetrics ? "bar" : "none";
        } else if (
          lowerIntent.includes("correlation") ||
          lowerIntent.includes("tương quan")
        ) {
          type = "data_query";
          suggestedChartType = "scatter";
        } else if (
          lowerIntent.includes("general") ||
          lowerIntent.includes("summary") ||
          lowerIntent.includes("tổng hợp")
        ) {
          type = "data_answer";
          suggestedChartType = hasChartData ? "bar" : "none";
        } else if (hasChartData || hasMetrics) {
          type = "data_query";
          suggestedChartType = "bar";
        } else {
          type = "general";
        }
      } else {
        if (hasChartData || hasMetrics) {
          type = "data_query";
          suggestedChartType = "bar";
        } else {
          type = "general";
        }
      }

      return {
        type,
        confidence: confidence ?? 0.5,
        reasoning: result.answer,
        suggestedChartType,
        chartTitle: result.chart_title,
        queryContext: intent,
      };
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { type: "unknown", confidence: 0, error: "Aborted" } as unknown as IntentResult;
      }
      const msg = err instanceof Error ? err.message : "Classification failed";
      setError(msg);
      return { type: "general", confidence: 0, reasoning: msg };
    } finally {
      setIsClassifying(false);
    }
  }, []);

  return { classifyIntent, isClassifying, error };
}

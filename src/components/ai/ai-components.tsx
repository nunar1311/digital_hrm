/**
 * AI UI Components - Reusable AI-powered UI components
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// =====================
// AI Loading States
// =====================

interface AILoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function AILoader({ size = "md", message }: AILoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

// =====================
// AI Insight Card
// =====================

interface AIInsightCardProps {
  title: string;
  description: string;
  severity?: "high" | "medium" | "low";
  confidence?: number;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function AIInsightCard({
  title,
  description,
  severity = "medium",
  confidence,
  onAction,
  actionLabel,
  className,
}: AIInsightCardProps) {
  const severityColors = {
    high: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
    medium: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
    low: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-white p-4 shadow-sm dark:bg-gray-800",
        severityColors[severity],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          {confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Độ tin cậy:</span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-xs font-medium">{confidence}%</span>
            </div>
          )}
        </div>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="ml-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// =====================
// AI Badge
// =====================

interface AIBadgeProps {
  label: string;
  score?: number;
  variant?: "success" | "warning" | "danger" | "info";
  className?: string;
}

export function AIBadge({ label, score, variant = "info", className }: AIBadgeProps) {
  const variantClasses = {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 00-2 0v4.586l-2.707 2.707a1 1 0 101.414 1.414l2.707-2.707H9a1 1 0 000 2z" />
      </svg>
      {label}
      {score !== undefined && <span className="font-bold">{score}</span>}
    </span>
  );
}

// =====================
// AI Error State
// =====================

interface AIErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function AIError({
  message = "Đã xảy ra lỗi khi xử lý AI",
  onRetry,
  className,
}: AIErrorProps) {
  return (
    <div className={cn("rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20", className)}>
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================
// AI Button
// =====================

interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export function AIButton({
  variant = "default",
  size = "md",
  isLoading,
  children,
  className,
  disabled,
  ...props
}: AIButtonProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-primary hover:bg-primary/10",
  };

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 00-2 0v4.586l-2.707 2.707a1 1 0 101.414 1.414l2.707-2.707H9a1 1 0 000 2z" />
      </svg>
      {children}
    </button>
  );
}

// =====================
// AI Score Display
// =====================

interface AIScoreDisplayProps {
  score: number;
  label?: string;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
  className?: string;
}

export function AIScoreDisplay({
  score,
  label,
  maxScore = 100,
  size = "md",
  showBar = true,
  className,
}: AIScoreDisplayProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  const getColor = (pct: number) => {
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {label && <span className="mb-1 text-sm text-muted-foreground">{label}</span>}
      <div className="flex items-baseline gap-2">
        <span className={cn("font-bold", getColor(percentage), sizeClasses[size])}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/ {maxScore}</span>
      </div>
      {showBar && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              percentage >= 80
                ? "bg-green-500"
                : percentage >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =====================
// AI Recommendation List
// =====================

interface AIRecommendation {
  id: string;
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
}

interface AIRecommendationListProps {
  recommendations: AIRecommendation[];
  onItemClick?: (item: AIRecommendation) => void;
  className?: string;
}

export function AIRecommendationList({
  recommendations,
  onItemClick,
  className,
}: AIRecommendationListProps) {
  const priorityColors = {
    high: "text-red-600 dark:text-red-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    low: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {recommendations.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
            onItemClick && "cursor-pointer"
          )}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-lg", priorityColors[item.priority || "medium"])}>•</span>
              <span className="font-medium">{item.title}</span>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
          {item.priority && (
            <span className={cn("text-xs font-medium uppercase", priorityColors[item.priority])}>
              {item.priority}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// =====================
// AI Content Display
// =====================

interface AIContentDisplayProps {
  content: string;
  format?: "text" | "markdown" | "bullet";
  className?: string;
}

export function AIContentDisplay({ content, format = "text", className }: AIContentDisplayProps) {
  if (format === "markdown") {
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  if (format === "bullet") {
    const lines = content.split("\n").filter((line) => line.trim());
    return (
      <ul className={cn("space-y-1", className)}>
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{line.replace(/^[-•*]\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("whitespace-pre-wrap text-sm", className)}>
      {content}
    </div>
  );
}

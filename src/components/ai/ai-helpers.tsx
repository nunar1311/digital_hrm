"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Paperclip,
  ShieldAlert,
  MessageSquare,
  Database,
  Search,
  FileText,
  MoreHorizontal,
  CornerDownRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type ActionProposal,
  type ActionStatus,
  type QuickAction,
  CATEGORY_LABELS,
} from "@/lib/ai/hr-agent";
import { type ThinkingStep } from "@/hooks/use-ai-chat-store";

// =====================
// Code Block Component with syntax highlighting
// =====================
function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Không thể sao chép.");
        }
      }}
      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/10"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// =====================
// Markdown Components (Enhanced)
// =====================
export const MarkdownComponents = {
  p: ({ children }: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold">{children}</strong>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-bold mt-3 mb-1">{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }: any) => (
    <div className="w-full max-w-full overflow-x-auto mb-2">
      <table className="min-w-full border-collapse border border-muted">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-semibold text-sm whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-muted px-3 py-2 text-sm whitespace-nowrap">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  pre: ({ children }: any) => {
    // Extract code content and language from child <code> element
    const codeChild = children?.props;
    const className = codeChild?.className || "";
    const language = className.replace("language-", "") || "text";
    const codeString =
      typeof codeChild?.children === "string"
        ? codeChild.children.replace(/\n$/, "")
        : "";

    return (
      <div className="rounded-lg border border-border/60 bg-zinc-950 dark:bg-zinc-900 my-3 overflow-hidden group/codeblock">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/80 dark:bg-zinc-800/50 border-b border-border/30">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            {language}
          </span>
          <CodeBlockCopyButton code={codeString} />
        </div>
        {/* Code content */}
        <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
          <code className="text-zinc-200 font-mono">{codeString}</code>
        </pre>
      </div>
    );
  },
  code: ({ children, className }: any) => {
    // If it has a language class, it's a fenced code block handled by <pre>
    if (className) return <code className={className}>{children}</code>;
    // Inline code
    return (
      <code className="bg-muted/80 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono break-all border border-border/40">
        {children}
      </code>
    );
  },
};

// =====================
// Copy Button
// =====================
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép nội dung.");
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="xs"
      tooltip="Sao chép"
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check />
          <span>Đã sao chép</span>
        </>
      ) : (
        <>
          <Copy />
          <span>Sao chép</span>
        </>
      )}
    </Button>
  );
}

// =====================
// Retry Button
// =====================
export function RetryButton({
  onRetry,
  userMessage,
  isLoading = false,
}: {
  onRetry: () => void;
  userMessage?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        onClick={onRetry}
        variant="ghost"
        size="xs"
        tooltip="Thử lại với cùng câu hỏi"
        disabled={isLoading}
        className="inline-flex items-center  text-muted-foreground gap-1 text-[11px] px-1.5 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
      >
        <RotateCcw className="h-3 w-3" />
        <span>Thử lại</span>
      </Button>
      {userMessage && (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 max-w-[140px]">
          <MessageSquare className="h-3 w-3 shrink-0" />
          <span className="truncate">{userMessage}</span>
        </span>
      )}
    </div>
  );
}

// =====================
// Severity Badge
// =====================
export function SeverityBadge({ severity }: { severity?: string }) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">Cao</Badge>;
    case "medium":
      return <Badge variant="default">Trung bình</Badge>;
    case "low":
      return <Badge variant="secondary">Thấp</Badge>;
    default:
      return null;
  }
}

// =====================
// Intent Badge
// =====================
export function IntentBadge({
  intent,
  confidence,
}: {
  intent?: string;
  confidence?: number;
}) {
  if (!intent) return null;

  const intentLabels: Record<string, string> = {
    COMPARISON: "So sánh",
    TREND: "Xu hướng",
    DISTRIBUTION: "Cơ cấu",
    CORRELATION: "Tương quan",
    GENERAL: "Tổng hợp",
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">{intentLabels[intent] || intent}</Badge>
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground">
          Độ tin cậy: {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// =====================
// Parse Suggested Questions
// =====================
export function parseSuggestedQuestions(content: string) {
  if (!content) return { main: "", items: [] };
  const regex = /((?:\n|^)[^\n]{0,250}?:\s*\n)((?:[-*]\s+[^\n]+(?:\n|$))+)$/;
  const match = content.match(regex);
  if (match) {
    const main = content.slice(0, match.index!);
    const listString = match[2];
    const items = listString
      .split("\n")
      .filter((s) => s.trim().length > 0)
      .map((s) => s.replace(/^[-*]\s*/, "").trim());

    if (
      items.length > 0 &&
      items.length <= 6 &&
      items.every((item) => item.length > 3 && item.length < 150)
    ) {
      const header = match[1].toLowerCase();
      if (
        header.includes("nếu") ||
        header.includes("gợi ý") ||
        header.includes("bạn có muốn") ||
        header.includes("tôi có") ||
        header.includes("tiếp theo") ||
        header.includes("tham khảo") ||
        header.includes("hỏi") ||
        header.includes("chi tiết") ||
        header.includes("follow up")
      ) {
        return { main: main.trimEnd(), items };
      }
    }
  }
  return { main: content, items: [] };
}

// =====================
// Action Card
// =====================
export function ActionCard({
  action,
  onExecute,
  onDismiss,
}: {
  action: ActionProposal;
  onExecute: (action: ActionProposal) => void;
  onDismiss: (action: ActionProposal) => void;
}) {
  // Dangerous tools (SQL INSERT/UPDATE/DELETE) need explicit warning styling
  const isDangerous =
    action.confirmationRequired &&
    action.tool === "query_database" &&
    !!action.confirmationData?.query &&
    /^\s*(insert|update|delete|drop|truncate|alter|grant|revoke|commit|rollback)\s/i.test(
      String(action.confirmationData.query),
    );

  const isAutoExecuted = action.autoExecuted === true;

  const statusConfig: Record<
    ActionStatus,
    { icon: React.ReactNode; label: string; color: string; bg: string }
  > = {
    pending_confirmation: {
      icon: isDangerous ? (
        <ShieldAlert className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      ),
      label: isDangerous ? "⚠ Cảnh báo - Cần xác nhận" : "Chờ xác nhận",
      color: isDangerous
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400",
      bg: isDangerous
        ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 animate-pulse"
        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    },
    executing: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: isAutoExecuted ? "AI đang xử lý tự động..." : "Đang thực hiện...",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    },
    success: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: isAutoExecuted ? "✓ Hoàn thành tự động" : "Hoàn thành",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    },
    error: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Lỗi",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    },
    requires_info: {
      icon: <Info className="h-3.5 w-3.5" />,
      label: "Cần thêm thông tin",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    },
  };

  const config =
    statusConfig[action.status] || statusConfig.pending_confirmation;

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-300 overflow-hidden min-w-0 ${config.bg}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
        >
          {config.icon}
          <span>{config.label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {action.tool}
        </span>
      </div>

      <div className="text-sm wrap-break-word mb-3 overflow-hidden">
        <ReactMarkdown
          components={MarkdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {action.displayMessage || action.description}
        </ReactMarkdown>
      </div>

      {action.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" /> {action.error}
        </p>
      )}

      {action.status === "pending_confirmation" &&
        action.confirmationRequired &&
        (() => {
          const actionType = action.confirmationData?.action as
            | string
            | undefined;
          const isApproval = actionType === "approve_leave_request";
          const isRejection = actionType === "reject_leave_request";

          return (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant={"ghost"}
                size={"xs"}
                onClick={() => onDismiss(action)}
                className="mr-auto"
              >
                Bỏ qua
              </Button>

              {isApproval && (
                <Button
                  onClick={() => {
                    const rejectAction: ActionProposal = {
                      ...action,
                      confirmationData: {
                        ...action.confirmationData,
                        action: "reject_leave_request",
                        rejector_id: action.confirmationData?.approver_id,
                        reason: "Từ chối bởi manager",
                      } as Record<string, unknown>,
                    };
                    onExecute(rejectAction);
                  }}
                  variant={"outline"}
                  size={"xs"}
                >
                  Từ chối
                </Button>
              )}

              <Button
                onClick={() => onExecute(action)}
                variant={isRejection ? "destructive" : "default"}
                size={"xs"}
              >
                {isApproval
                  ? "Duyệt đơn"
                  : isRejection
                    ? "Từ chối đơn"
                    : "Thực hiện"}
              </Button>
            </div>
          );
        })()}
    </div>
  );
}

// =====================
// Quick Actions Panel
// =====================
export function QuickActionsPanel({
  onSelect,
  isVisible,
  actions,
}: {
  onSelect: (prompt: string) => void;
  isVisible: boolean;
  actions: QuickAction[];
}) {
  if (!isVisible) return null;

  const renderCategories = [
    "general",
    "copilot",
    "search",
    "approval",
    "risk",
    "document",
  ];

  const groupedActions = renderCategories
    .map((key) => {
      return {
        id: key,
        label: CATEGORY_LABELS[key],
        actions: actions.filter((a) => a.category === key),
      };
    })
    .filter((group) => group.actions && group.actions.length > 0);

  return (
    <div className="w-full space-y-4 text-left px-4 flex-1 overflow-y-auto">
      {groupedActions.map((group) => (
        <div key={group.id} className="space-y-1">
          <div className="px-2 text-xs font-medium text-muted-foreground mb-1.5">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={"ghost"}
                  onClick={() => onSelect(action.prompt)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/80 transition-colors text-sm group"
                >
                  <div
                    className={`flex items-center justify-center p-1.5 rounded-md bg-accent/60 ${action.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center text-left">
                    <span className="font-medium text-foreground">
                      {action.label}
                    </span>
                    {action.isNew && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">
                        New
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================
// Suggested Question Button
// =====================
export function SuggestedQuestionButton({
  item,
  onClick,
}: {
  item: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant={"outline"}
      className="justify-start items-start w-fit min-w-0 h-auto py-2 text-left"
    >
      <CornerDownRight className="h-4 w-4 mt-0.5 text-muted-foreground transition-colors shrink-0" />
      <span className="font-medium leading-snug tracking-tight min-w-0 wrap-break-word text-wrap">
        {item}
      </span>
    </Button>
  );
}

// =====================
// Attachment Badge
// =====================
export function AttachmentBadge({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/50 px-1 py-1 rounded-md text-xs border border-primary/10 text-foreground">
      <Paperclip className="h-3 w-3 text-primary/70" />
      <span className="max-w-[140px] truncate">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// =====================
// Thinking Steps Panel — Agentic UX
// =====================
const TOOL_ICONS: Record<string, React.ReactNode> = {
  query_database: <Database className="h-3 w-3" />,
  query_employee_data: <Search className="h-3 w-3" />,
  get_leave_balance: <FileText className="h-3 w-3" />,
  get_attendance_report: <FileText className="h-3 w-3" />,
  get_team_overview: <Search className="h-3 w-3" />,
  create_leave_request: <FileText className="h-3 w-3" />,
  approve_leave_request: <CheckCircle2 className="h-3 w-3" />,
  reject_leave_request: <XCircle className="h-3 w-3" />,
};

export function ThinkingStepsPanel({
  steps,
  isStreaming,
  defaultExpanded = false,
}: {
  steps: ThinkingStep[];
  isStreaming: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!steps || steps.length === 0) return null;

  const allDone = steps.every(
    (s) => s.status === "done" || s.status === "error",
  );
  // Auto-collapse when streaming starts and all steps are done
  const shouldCollapse = isStreaming && allDone;

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1 group"
      >
        {shouldCollapse && !isExpanded ? (
          <ChevronRight className="h-3 w-3 transition-transform" />
        ) : isExpanded ? (
          <ChevronDown className="h-3 w-3 transition-transform" />
        ) : (
          <ChevronRight className="h-3 w-3 transition-transform" />
        )}
        {!allDone ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : steps.some((s) => s.status === "error") ? (
          <XCircle className="h-3 w-3 text-destructive" />
        ) : (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        )}
        <span>
          {allDone
            ? steps.some((s) => s.status === "error")
              ? `Hoàn thành ${steps.length} bước (có lỗi)`
              : `Hoàn thành ${steps.length} bước`
            : `Đang xử lý... (${steps.filter((s) => s.status === "done").length}/${steps.length})`}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-2 pl-3 border-l-2 border-border/60 space-y-1 mt-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-2 text-[12px] py-0.5"
            >
              {step.status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
              ) : step.status === "error" ? (
                <XCircle className="h-3 w-3 text-destructive shrink-0" />
              ) : step.status === "pending" ? (
                <MoreHorizontal className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
              )}

              {step.toolName && TOOL_ICONS[step.toolName] ? (
                <span className="text-muted-foreground shrink-0">
                  {TOOL_ICONS[step.toolName]}
                </span>
              ) : (
                step.toolName && null
              )}

              <span
                className={`truncate ${
                  step.status === "running"
                    ? "text-foreground"
                    : step.status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>

              {step.detail && step.status === "done" && (
                <span className="text-muted-foreground/60 text-[10px] truncate max-w-[120px]">
                  — {step.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Square,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Message } from "@/hooks/use-ai-chat-store";
import { type QuickAction, type ActionProposal } from "@/lib/ai/hr-agent";
import {
  CopyButton,
  RetryButton,
  ActionCard,
  QuickActionsPanel,
  SuggestedQuestionButton,
  AttachmentBadge,
  MarkdownComponents,
  parseSuggestedQuestions,
  SeverityBadge,
  IntentBadge,
  ThinkingStepsPanel,
} from "./ai-helpers";
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  ScatterChartComponent,
  AreaChartComponent,
  ChartTypeIcon,
} from "./ai-charts";
import { useSidebar } from "../ui/sidebar";

const TEMPLATES = [
  "Viết email thông báo sinh nhật cho nhân viên trong tháng",
  "Tóm tắt quy định xin phép nghỉ thai sản ở công ty",
  "Tạo mẫu JD bài đăng tuyển dụng vị trí Lập trình viên",
  "Lên danh sách ý tưởng team building cuối năm",
  "Soạn thảo nội quy về bảo mật thông tin nội bộ",
];

export interface AiAgentModeProps {
  messages: Message[];
  onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  onInputChange: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  onIsLoadingChange: React.Dispatch<React.SetStateAction<boolean>>;
  files: File[];
  onFilesChange: React.Dispatch<React.SetStateAction<File[]>>;
  currentQuickActions: QuickAction[];
  handleSend: (
    text: string,
    retryOptions?: { assistantMessageId: string },
  ) => Promise<void>;
  handleExecuteAction: (
    action: ActionProposal,
    messageId: string,
  ) => Promise<void>;
  handleDismissAction: (action: ActionProposal, messageId: string) => void;
  handleStop: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  isLoadingSession?: boolean;
}

function getUserMessageForRetry(
  messages: Message[],
  assistantMsgId: string,
): string | undefined {
  const assistantIdx = messages.findIndex((m) => m.id === assistantMsgId);
  if (assistantIdx <= 0) return undefined;
  // Loop backwards to find the nearest user message before this assistant message
  for (let i = assistantIdx - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i].content;
    }
  }
  return undefined;
}

const MessageItem = React.memo(
  ({
    message,
    isLast,
    userMessageForRetry,
    isLoading,
    handleSend,
    handleExecuteAction,
    handleDismissAction,
  }: {
    message: Message;
    isLast: boolean;
    userMessageForRetry?: string;
    isLoading: boolean;
    handleSend: (
      text: string,
      retryOptions?: { assistantMessageId: string },
    ) => Promise<void>;
    handleExecuteAction: (
      action: ActionProposal,
      messageId: string,
    ) => Promise<void>;
    handleDismissAction: (action: ActionProposal, messageId: string) => void;
  }) => {
    const shouldParse = message.role === "assistant";
    const { main: rawMain, items } = React.useMemo(() => {
      return shouldParse
        ? parseSuggestedQuestions(message.content)
        : { main: message.content, items: [] };
    }, [shouldParse, message.content]);

    const hasThinkingSteps =
      message.thinkingSteps && message.thinkingSteps.length > 0;
    const isStillThinking =
      hasThinkingSteps &&
      message.thinkingSteps!.some((s) => s.status === "running");

    return (
      <div className="w-full min-w-0 max-w-[800px] mx-auto">
        <div
          className={`flex gap-2 ${
            message.role === "user"
              ? "justify-end max-w-full"
              : "justify-start flex-col w-full min-w-0"
          }`}
        >
          {message.role === "assistant" && (
            <Button size={"sm"} variant={"ghost"} className="w-fit">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>HRM AI</span>
            </Button>
          )}

          {/* Thinking Steps Panel — agentic UX */}
          {message.role === "assistant" &&
            message.thinkingSteps &&
            message.thinkingSteps.length > 0 && (
              <div className="px-4">
                <ThinkingStepsPanel
                  steps={message.thinkingSteps}
                  isStreaming={!!message.content?.trim()}
                  defaultExpanded={true}
                />
              </div>
            )}

          <div
            className={`relative px-4 py-2 text-sm rounded-2xl ${
              message.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm max-w-full wrap-break-word whitespace-pre-wrap"
                : "w-full min-w-0 overflow-hidden wrap-break-word"
            }`}
          >
            <>
              {message.role === "assistant" && message.isTyping ? (
                !rawMain.trim() ? (
                  // No text content yet
                  !hasThinkingSteps ? (
                    // No thinking steps either — show generic spinner
                    <div className="flex items-center gap-2 text-primary animate-pulse py-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[13px] font-medium">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  ) : isStillThinking ? null : ( // Has thinking steps that are still running — don't show duplicate spinner
                    // All thinking done but no text yet — show generating indicator
                    <div className="flex items-center gap-2 text-primary py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[12px] text-muted-foreground">
                        Đang tạo phản hồi...
                      </span>
                    </div>
                  )
                ) : (
                  // Streaming text — show with blinking cursor
                  <div>
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {rawMain}
                    </ReactMarkdown>
                    <span className="inline-block w-[2px] h-[14px] bg-primary animate-pulse ml-0.5 align-middle" />
                  </div>
                )
              ) : (
                rawMain.trim() && (
                  <ReactMarkdown
                    components={MarkdownComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {rawMain}
                  </ReactMarkdown>
                )
              )}
            </>
          </div>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end pr-11 mt-1">
            {message.attachments.map((att, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full"
              >
                <Paperclip className="h-3 w-3" />
                {att.name}
              </span>
            ))}
          </div>
        )}

        {message.role === "assistant" &&
          !message.isTyping &&
          message.dataAnalystResponse && (
            <div className="mt-2 pl-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(() => {
                const da = message.dataAnalystResponse!;

                return (
                  <>
                    <IntentBadge
                      intent={da.intent}
                      confidence={da.confidence}
                    />

                    {da.chartType && da.chartType !== "none" && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <ChartTypeIcon type={da.chartType} />
                          <span className="text-xs font-medium text-muted-foreground">
                            Biểu đồ được đề xuất
                          </span>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto">
                          {da.chartData && da.chartData.length > 0 ? (
                            <>
                              {da.chartType === "bar" && (
                                <BarChartComponent
                                  data={da.chartData}
                                  title={da.chartTitle}
                                  xAxisLabel={da.xAxis}
                                  yAxisLabel={da.yAxis}
                                />
                              )}
                              {da.chartType === "line" && (
                                <LineChartComponent
                                  data={da.chartData}
                                  title={da.chartTitle}
                                  xAxisLabel={da.xAxis}
                                  yAxisLabel={da.yAxis}
                                />
                              )}
                              {da.chartType === "pie" && (
                                <PieChartComponent
                                  data={da.chartData}
                                  title={da.chartTitle}
                                />
                              )}
                              {da.chartType === "scatter" && (
                                <ScatterChartComponent
                                  data={da.chartData}
                                  title={da.chartTitle}
                                  xAxisLabel={da.xAxis}
                                  yAxisLabel={da.yAxis}
                                />
                              )}
                              {da.chartType === "area" && (
                                <AreaChartComponent
                                  data={da.chartData}
                                  title={da.chartTitle}
                                  xAxisLabel={da.xAxis}
                                  yAxisLabel={da.yAxis}
                                />
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                              <AlertCircle className="h-5 w-5" />
                              <p className="text-[13px]">
                                Hệ thống không tìm thấy dữ liệu phù hợp để dóng
                                thành biểu đồ.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {da.metrics && da.metrics.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Các chỉ số liên quan
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {da.metrics.map((metric, index) => (
                            <div
                              key={index}
                              className="bg-muted/50 rounded-md px-3 py-2"
                            >
                              <p className="text-xs text-muted-foreground">
                                {metric.label}
                              </p>
                              <p className="text-sm font-semibold">
                                {typeof metric.value === "number"
                                  ? new Intl.NumberFormat("vi-VN").format(
                                      metric.value,
                                    )
                                  : String(metric.value ?? "")}
                                {metric.unit === "VND" && " đ"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {da.insights && da.insights.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Insights từ dữ liệu
                        </p>
                        <div className="space-y-2">
                          {da.insights.map((insight, index) => (
                            <div
                              key={index}
                              className="bg-muted/50 rounded-md px-3 py-2 flex items-start gap-2"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">
                                    {insight.title}
                                  </span>
                                  <SeverityBadge severity={insight.severity} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {insight.description}
                                </p>
                                {insight.metric && (
                                  <p className="text-xs font-medium mt-1">
                                    {insight.metric}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {da.error && (
                      <div className="flex items-center gap-2 text-destructive mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{da.error}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

        {message.role === "assistant" &&
          !message.isTyping &&
          message.actions &&
          message.actions.length > 0 && (
            <div className="mt-2 space-y-2 pl-1 overflow-hidden min-w-0">
              {message.actions
                .filter((action) => {
                  if (action.status === "requires_info") return false;
                  // Ẩn các ActionCard của tool chỉ đọc khi thành công (tránh spam UI)
                  // Vì ThinkingSteps đã hiển thị quá trình và AI sẽ tự trả lời bằng text
                  const readOnlyTools = [
                    "query_database", 
                    "query_employee_data", 
                    "get_leave_balance",
                    "get_attendance_report", 
                    "get_team_overview", 
                    "get_risk_assessment",
                    "get_copilot_insight", 
                    "analyze_approval_request"
                  ];
                  if (action.status === "success" && readOnlyTools.includes(action.tool)) {
                    return false; // Ẩn ActionCard cho data fetch
                  }
                  return true;
                })
                .map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onExecute={(a) => handleExecuteAction(a, message.id)}
                    onDismiss={(a) => handleDismissAction(a, message.id)}
                  />
                ))}
            </div>
          )}

        {message.role === "assistant" &&
          !message.isTyping &&
          message.content && (
            <div className="flex items-center gap-2 mt-1 pl-1">
              <CopyButton text={message.content} />
              <RetryButton
                userMessage={userMessageForRetry}
                isLoading={isLoading}
                onRetry={() => {
                  handleSend("", {
                    assistantMessageId: message.id,
                  });
                }}
              />
            </div>
          )}

        {isLast && items.length > 0 && !message.isTyping && (
          <div className="mt-5 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 pl-1 w-full min-w-0">
            <div className="text-[12px] text-muted-foreground mb-0.5">
              Theo dõi thêm
            </div>
            {items.map((item, idx) => (
              <SuggestedQuestionButton
                key={idx}
                item={item}
                onClick={() => handleSend(item)}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.isLast === nextProps.isLast &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.userMessageForRetry === nextProps.userMessageForRetry
    );
  },
);
MessageItem.displayName = "MessageItem";

export function AiAgentMode({
  messages,
  input,
  onInputChange,
  isLoading,
  isLoadingSession,
  files,
  onFilesChange,
  currentQuickActions,
  handleSend,
  handleExecuteAction,
  handleDismissAction,
  handleStop,
  inputRef,
  fileInputRef,
  bottomRef,
}: AiAgentModeProps) {
  const [isTemplateDialogOpen, setTemplateDialogOpen] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange((prev) => [
        ...prev,
        ...Array.from(e.target.files as FileList),
      ]);
    }
    if (e.target) e.target.value = "";
  };

  const handleMention = () => {
    onInputChange(
      (prev) => prev + (prev.endsWith(" ") || prev === "" ? "@" : " @"),
    );
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="w-full relative flex-1 min-h-0 mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center pt-4 pb-8 text-center text-muted-foreground  max-w-[800px] mx-auto">
            <div className="bg-linear-to-br from-primary/20 to-primary/5 p-4 rounded-full mb-4 ring-1 ring-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Digital HRM AI Agent
            </h3>
            <p className="text-xs px-4 mb-6">
              Trợ lý AI thông minh — tự động thực hiện tác vụ HR, duyệt đơn,
              phân tích rủi ro, tạo tài liệu.
            </p>
            <QuickActionsPanel
              onSelect={handleSend}
              isVisible={messages.length === 0}
              actions={currentQuickActions}
            />
          </div>
        ) : (
          <div className="space-y-4 overflow-hidden min-w-0 p-4">
            {messages.map((message, idx) => (
              <MessageItem
                key={message.id}
                message={message}
                isLast={idx === messages.length - 1}
                userMessageForRetry={getUserMessageForRetry(
                  messages,
                  message.id,
                )}
                isLoading={isLoading}
                handleSend={handleSend}
                handleExecuteAction={handleExecuteAction}
                handleDismissAction={handleDismissAction}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="pb-2 space-y-2 w-full max-w-[800px] mx-auto px-2 bg-transparent">
        <div className="relative flex flex-col rounded-lg border bg-background shadow-sm focus-within:ring-3 focus-within:ring-primary/20 focus-within:border-primary transition-all p-1 group">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 cursor-default">
              {files.map((f, i) => (
                <AttachmentBadge
                  key={i}
                  name={f.name}
                  onRemove={() =>
                    onFilesChange((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
          )}

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Hỏi AI, tạo, tìm kiếm..."
            className="border-0 focus-visible:ring-0 bg-transparent! px-2 py-1 shadow-none resize-none no-scrollbar field-sizing-content"
            disabled={isLoading}
            autoFocus={true}
            style={{ minHeight: "30px", maxHeight: "150px" }}
          />

          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip /> Đính kèm tệp
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleMention}
                >
                  <AtSign /> Mention
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  <FileText /> Chọn từ mẫu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
              {isLoading ? (
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={handleStop}
                  tooltip="Dừng phản hồi"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  variant={input.trim() ? "default" : "secondary"}
                  onClick={() => handleSend(input)}
                  disabled={!input.trim()}
                  tooltip="Gửi"
                >
                  <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Templates Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95%]">
          <DialogHeader>
            <DialogTitle>Chọn Mẫu Yêu Cầu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {TEMPLATES.map((tmpl, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-start font-normal h-auto py-2.5 px-4 text-left whitespace-normal hover:bg-primary/5 hover:text-primary transition-colors hover:border-primary/30"
                onClick={() => {
                  onInputChange(tmpl);
                  setTemplateDialogOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 150);
                }}
              >
                {tmpl}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

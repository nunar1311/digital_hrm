/**
 * AI Sidebar Panel - Chatbot HR that works on every page
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AIButton, AILoader, AIError } from "./ai-components";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AISidebarProps {
  defaultOpen?: boolean;
  className?: string;
}

// Quick actions based on current page
function getQuickActions(pathname: string) {
  if (pathname.includes("/dashboard")) {
    return [
      { label: "Phân tích Dashboard", prompt: "Phân tích dashboard HR cho tôi" },
      { label: "Xu hướng nhân sự", prompt: "Cho tôi xem xu hướng nhân sự gần đây" },
      { label: "Cảnh báo", prompt: "Có cảnh báo nào cần chú ý không?" },
    ];
  }
  if (pathname.includes("/recruitment")) {
    return [
      { label: "Phân tích ứng viên", prompt: "Phân tích ứng viên mới nhất" },
      { label: "Câu hỏi phỏng vấn", prompt: "Tạo câu hỏi phỏng vấn cho vị trí này" },
      { label: "Đánh giá CV", prompt: "Đánh giá CV của ứng viên" },
    ];
  }
  if (pathname.includes("/employees")) {
    return [
      { label: "Tóm tắt nhân viên", prompt: "Tóm tắt thông tin nhân viên" },
      { label: "Phân tích rủi ro", prompt: "Phân tích nguy cơ nghỉ việc" },
      { label: "Kỹ năng", prompt: "Phân tích khoảng trống kỹ năng" },
    ];
  }
  if (pathname.includes("/attendance")) {
    return [
      { label: "Phát hiện bất thường", prompt: "Phát hiện bất thường chấm công" },
      { label: "Xu hướng", prompt: "Phân tích xu hướng chấm công" },
      { label: "Dự đoán OT", prompt: "Dự đoán nhu cầu tăng ca" },
    ];
  }
  if (pathname.includes("/payroll")) {
    return [
      { label: "Phân tích lương", prompt: "Phân tích bất thường lương" },
      { label: "So sánh thị trường", prompt: "So sánh lương với thị trường" },
      { label: "Tối ưu thuế", prompt: "Gợi ý tối ưu thuế" },
    ];
  }
  // Default ESS actions
  return [
    { label: "Hỏi về phép", prompt: "Tôi còn bao nhiêu ngày phép?" },
    { label: "Chính sách HR", prompt: "Chính sách nghỉ phép như thế nào?" },
    { label: "Thông tin lương", prompt: "Giải thích phiếu lương của tôi" },
  ];
}

export function AISidebar({ defaultOpen = false, className }: AISidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  const quickActions = getQuickActions(pathname);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Xin lỗi, tôi không thể trả lời lúc này.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Mở AI Assistant"
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 00-2 0v4.586l-2.707 2.707a1 1 0 101.414 1.414l2.707-2.707H9a1 1 0 000 2z" />
        </svg>
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          AI
        </span>
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 flex w-96 flex-col rounded-xl bg-white shadow-2xl transition-all dark:bg-gray-900",
          isOpen
            ? "h-[32rem] w-96 translate-y-0 opacity-100"
            : "h-0 w-0 translate-y-4 opacity-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 00-2 0v4.586l-2.707 2.707a1 1 0 101.414 1.414l2.707-2.707H9a1 1 0 000 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">HR AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Trợ lý HR 24/7</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="border-b px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Hành động nhanh</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">Xin chào! Tôi có thể giúp gì?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hỏi về HR, chính sách, hoặc phân tích dữ liệu
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "mb-3 flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="mb-3 flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <AILoader size="sm" message="AI đang suy nghĩ..." />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs font-medium text-red-600 hover:underline"
              >
                Đóng
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <AIButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              isLoading={isLoading}
              size="md"
              className="shrink-0"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </AIButton>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            AI có thể tạo ra thông tin không chính xác. Hãy xác minh trước khi sử dụng.
          </p>
        </div>
      </div>
    </>
  );
}

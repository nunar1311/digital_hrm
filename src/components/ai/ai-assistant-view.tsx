"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  User,
  Globe,
  Search,
  Plus,
  ListTodo,
  Edit3,
  Lightbulb,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Briefcase,
  Users,
  FileBarChart,
  AtSign,
  X,
  History,
  MessageSquarePlus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI } from "@/lib/ai/actions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment {
  name: string;
  size: number;
}

interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  isTyping?: boolean;
  attachments?: Attachment[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai-chat-history";

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

const MarkdownComponents = {
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
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border-collapse border border-muted">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-muted bg-muted/50 px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-muted px-3 py-1.5">{children}</td>
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
  code: ({ children }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono">
      {children}
    </code>
  ),
};

function TypewriterText({
  content,
  speed = 15,
  onComplete,
  onTyping,
}: {
  content: string;
  speed?: number;
  onComplete?: () => void;
  onTyping?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (i < content.length) {
        // Safe closure updates
        const nextChar = content.charAt(i);
        setDisplayed((prev) => prev + nextChar);
        i++;
        onTyping?.();
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [content, speed]);

  return (
    <>
      <ReactMarkdown
        components={MarkdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {displayed}
      </ReactMarkdown>
      {displayed.length < content.length && (
        <span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse align-middle" />
      )}
    </>
  );
}

export function AIAssistantView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sourceId, setSourceId] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  const TEMPLATES = [
    "Viết email thông báo sinh nhật cho nhân viên trong tháng",
    "Tóm tắt quy định xin phép nghỉ thai sản ở công ty",
    "Tạo mẫu JD bài đăng tuyển dụng vị trí Lập trình viên",
    "Lên danh sách ý tưởng team building cuối năm",
    "Soạn thảo nội quy về bảo mật thông tin nội bộ",
  ];

  const SOURCES = [
    {
      id: "all",
      label: "All sources",
      icon: Globe,
      color: "text-muted-foreground",
    },
    {
      id: "hrm",
      label: "Hệ thống HRM",
      icon: Briefcase,
      color: "text-primary",
    },
    {
      id: "employees",
      label: "Hồ sơ nhân sự",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: "payroll",
      label: "Bảng lương & Chấm công",
      icon: FileBarChart,
      color: "text-green-500",
    },
  ];
  const activeSource = SOURCES.find((s) => s.id === sourceId) || SOURCES[0];
  const ActiveSourceIcon = activeSource.icon;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-save current conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0 || !activeSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages, updatedAt: Date.now() }
          : s,
      );
      saveSessions(updated);
      return updated;
    });
  }, [messages, activeSessionId]);

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages.map((m) => ({ ...m, isTyping: false })));
    setActiveSessionId(session.id);
    setShowHistory(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    if (activeSessionId === id) {
      startNewChat();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
    // reset input so same file can be selected again
    if (e.target) e.target.value = "";
  };

  const handleMention = () => {
    setInput((prev) => prev + (prev.endsWith(" ") || prev === "" ? "@" : " @"));
    // Use timeout to wait for React to flush state to real DOM input
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Capture current files before clearing
    const currentFiles = [...files];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      attachments:
        currentFiles.length > 0
          ? currentFiles.map((f) => ({ name: f.name, size: f.size }))
          : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setFiles([]); // Clear files after send
    setIsLoading(true);

    // Create session if this is the first message
    if (!activeSessionId) {
      const newId = Date.now().toString();
      const title = text.length > 40 ? text.slice(0, 40) + "..." : text;
      const newSession: ChatSession = {
        id: newId,
        title,
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setActiveSessionId(newId);
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
    }

    try {
      // Read file contents as text
      let fileContext = "";
      if (currentFiles.length > 0) {
        const fileTexts = await Promise.all(
          currentFiles.map(async (file) => {
            try {
              const content = await file.text();
              return `--- FILE: ${file.name} (${(file.size / 1024).toFixed(1)} KB) ---\n${content}\n--- END FILE ---`;
            } catch {
              return `--- FILE: ${file.name} --- (Không thể đọc nội dung file này) ---`;
            }
          }),
        );
        fileContext =
          "\n\nNgười dùng đã đính kèm các tệp sau, hãy đọc và phân tích nội dung:\n" +
          fileTexts.join("\n\n");
      }

      // Build enriched content for AI (file text included)
      const enrichedContent = text + fileContext;

      // Setup payload for API
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: userMessage.role, content: enrichedContent },
      ];

      const result = await chatWithAI(apiMessages);

      if (result.success && result.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: result.content,
            isTyping: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Không thể kết nối. Vui lòng kiểm tra lại dịch vụ AI.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: Search, label: "Tìm kiếm thông tin", color: "text-blue-500" },
    {
      icon: ListTodo,
      label: "Tóm tắt chính sách HR",
      color: "text-purple-500",
    },
    { icon: Edit3, label: "Soạn thảo thông báo", color: "text-green-500" },
    { icon: Lightbulb, label: "Ý tưởng đãi ngộ", color: "text-yellow-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Top bar with History + New Chat buttons */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-3.5 w-3.5" />
          Lịch sử ({sessions.length})
        </Button>
        <Button variant="ghost" size="sm" onClick={startNewChat}>
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Mới
        </Button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-10 left-0 right-0 bottom-0 z-20 bg-background flex flex-col animate-in slide-in-from-left-2 duration-200">
          <div className="p-3 border-b">
            <h4 className="text-sm font-semibold">Lịch sử cuộc trò chuyện</h4>
          </div>
          <ScrollArea className="flex-1">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Chưa có cuộc trò chuyện nào.
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {sessions
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        session.id === activeSessionId
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-accent border border-transparent"
                      }`}
                      onClick={() => loadSession(session)}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {session.messages.length} tin nhắn ·{" "}
                          {new Date(session.updatedAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      <ScrollArea className="w-full relative p-4 h-full" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center pt-8 pb-12 text-center text-muted-foreground animate-in fade-in zoom-in duration-500">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Digital HRM AI
            </h3>
            <p className="text-sm px-4 mb-8">
              Tôi có thể giúp bạn giải quyết các công việc quản lý nhân sự một
              cách thông minh.
            </p>

            <div className="w-full space-y-2 text-left">
              <p className="text-xs font-semibold px-2 mb-2 text-muted-foreground uppercase tracking-wider">
                Gợi ý tác vụ
              </p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent hover:border-accent transition-colors text-sm"
                >
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="font-medium text-foreground">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex gap-2 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start flex flex-col"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Button size={"sm"} variant={"ghost"} className="w-fit">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>HRM AI</span>
                    </Button>
                  )}

                  <div
                    className={`relative px-4 py-1 text-sm max-w-[85%] rounded-2xl ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : ""
                    }`}
                  >
                    {message.role === "assistant" && message.isTyping ? (
                      <TypewriterText
                        content={message.content}
                        onTyping={scrollToBottom}
                        onComplete={() => {
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id
                                ? { ...m, isTyping: false }
                                : m,
                            ),
                          );
                        }}
                      />
                    ) : (
                      <ReactMarkdown
                        components={MarkdownComponents}
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )} */}
                </div>
                {/* Render attachment badges below user message bubbles */}
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
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start   ">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />

                <p className="text-sm text-muted-foreground animate-pulse">
                  Đang suy nghĩ...
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 space-y-2 border-t">
        {/* Render Attachments */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 animate-in fade-in zoom-in duration-200">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md text-xs border border-primary/10 text-foreground"
              >
                <Paperclip className="h-3 w-3 text-primary/70" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-center rounded-xl border bg-background shadow-sm focus-within:ring-3 focus-within:ring-primary/20 focus-within:border-primary transition-all p-1 group">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
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

          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask AI, create, search..."
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent h-10 px-2 shadow-none"
            disabled={isLoading}
          />

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg p-2"
                >
                  <ActiveSourceIcon
                    className={`h-3.5 w-3.5 ${activeSource.color === "text-muted-foreground" ? "" : activeSource.color}`}
                  />
                  <span>{activeSource.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 text-sm">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                  Nguồn dữ liệu AI
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SOURCES.map((source) => (
                  <DropdownMenuItem
                    key={source.id}
                    className="cursor-pointer"
                    onClick={() => setSourceId(source.id)}
                  >
                    <source.icon className={`h-4 w-4 mr-2 ${source.color}`} />
                    <span>
                      {source.label === "All sources"
                        ? "Tất cả dữ liệu"
                        : source.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              className={`h-8 w-8 shrink-0 rounded-lg transition-all ${
                input.trim()
                  ? "bg-primary text-primary-foreground opacity-100 scale-100"
                  : "bg-muted text-muted-foreground opacity-50 scale-95"
              }`}
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
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
                  setInput(tmpl);
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
    </div>
  );
}

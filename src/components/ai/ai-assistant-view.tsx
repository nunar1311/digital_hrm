"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Sparkles,
  History,
  Plus,
  Settings,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { smartChatWithAI, executeHRAction } from "@/lib/ai/actions";
import {
  type ActionProposal,
  type ActionStatus,
  MANAGER_QUICK_ACTIONS,
  EMPLOYEE_QUICK_ACTIONS,
  parseSmartChatResponse,
} from "@/lib/ai/hr-agent";
import {
  useAiChatStore,
  type Message,
  type ChatSession,
} from "@/hooks/use-ai-chat-store";
import {
  getUserChatSessions,
  getChatSessionMessages,
  createChatSession,
  saveChatMessage,
  deleteChatSession as deleteChatSessionDb,
} from "@/lib/ai/chat-db-actions";
import { useAiWebSocket } from "@/hooks/use-ai-websocket";
import { AiAgentMode, type AiAgentModeProps } from "./ai-agent-mode";
import { getSocket } from "@/lib/socket/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "../ui/sidebar";
import { toast } from "@/utils/toast";

// =====================
// Shared action helpers
// =====================

/** Write actions that mutate data — always auto-execute, skip follow-up AI call */
const WRITE_ACTIONS = new Set([
  "approve_leave_request",
  "reject_leave_request",
  "create_leave_request",
  "send_notification",
  "query_database", // write operations (INSERT/UPDATE/DELETE)
]);

/** Map write action → Socket.IO event for TanStack Query cache invalidation */
const ACTION_SOCKET_EVENT: Record<string, { entity: string; event: string }> = {
  create_leave_request: { entity: "leave-request", event: "data:updated" },
  approve_leave_request: { entity: "leave-request", event: "data:updated" },
  reject_leave_request: { entity: "leave-request", event: "data:updated" },
  send_notification: { entity: "notification", event: "data:updated" },
  query_database: { entity: "database", event: "data:updated" },
};

// =====================
// Main Component
// =====================
interface AIAssistantViewProps {
  context?: "page" | "sidebar";
  initialConversationId?: string | null;
}

export function AIAssistantView({
  context = "sidebar",
  initialConversationId,
}: AIAssistantViewProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const currentQuickActions =
    session?.user?.hrmRole === "EMPLOYEE"
      ? EMPLOYEE_QUICK_ACTIONS
      : MANAGER_QUICK_ACTIONS;

  const sessions = useAiChatStore((state) => state.sessions);
  const pageActiveSessionId = useAiChatStore(
    (state) => state.pageActiveSessionId,
  );
  const sidebarActiveSessionId = useAiChatStore(
    (state) => state.sidebarActiveSessionId,
  );
  const setPageActiveSessionId = useAiChatStore(
    (state) => state.setPageActiveSessionId,
  );
  const setSidebarActiveSessionId = useAiChatStore(
    (state) => state.setSidebarActiveSessionId,
  );

  // Helper: set active session in store (URL is source of truth, no DB needed)
  const setActiveSession = (sessionId: string | null) => {
    if (context === "page") {
      setPageActiveSessionId(sessionId);
    } else {
      setSidebarActiveSessionId(sessionId);
    }
  };
  const addSession = useAiChatStore((state) => state.addSession);
  const updateSession = useAiChatStore((state) => state.updateSession);
  const deleteSessionState = useAiChatStore((state) => state.deleteSession);

  const activeSessionId =
    context === "page" ? pageActiveSessionId : sidebarActiveSessionId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [autoExecute, setAutoExecute] = useState(true);
  const [isInitializingSession, setIsInitializingSession] = useState(false);

  const currentStreamingMessageIdRef = useRef<string | null>(null);
  // Guard: prevent onToken from appending after onDone has fired
  const isDoneFiredRef = useRef(false);

  // Refs to avoid stale closure in WebSocket callbacks
  const activeSessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const { sendMessage, sendStop } = useAiWebSocket({
    onThinking: (step) => {
      const msgId = currentStreamingMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                thinkingSteps: [
                  // Mark previous running steps as done
                  ...(m.thinkingSteps || []).map((s) =>
                    s.status === "running"
                      ? { ...s, status: "done" as const }
                      : s,
                  ),
                  step,
                ],
              }
            : m,
        ),
      );
    },
    onToolStart: (step) => {
      const msgId = currentStreamingMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                thinkingSteps: [
                  ...(m.thinkingSteps || []).map((s) =>
                    s.status === "running" && !s.toolName
                      ? { ...s, status: "done" as const }
                      : s,
                  ),
                  step,
                ],
              }
            : m,
        ),
      );
    },
    onToolResult: (stepId, status, detail) => {
      const msgId = currentStreamingMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                thinkingSteps: (m.thinkingSteps || []).map((s) =>
                  s.id === stepId ? { ...s, status, detail } : s,
                ),
              }
            : m,
        ),
      );
    },
    onToken: (token) => {
      // Ignore tokens that arrive after onDone has fired
      if (isDoneFiredRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentStreamingMessageIdRef.current
            ? {
                ...m,
                content: (m.content || "") + token,
                isTyping: true,
                // Mark all thinking steps as done when tokens start arriving
                thinkingSteps: (m.thinkingSteps || []).map((s) =>
                  s.status === "running"
                    ? { ...s, status: "done" as const }
                    : s,
                ),
              }
            : m,
        ),
      );
    },
    onDone: async (
      actions,
      dataSources,
      needsFollowup,
      dataAnalystResponse,
    ) => {
      const msgId = currentStreamingMessageIdRef.current;
      if (!msgId) return;
      // Mark done so onToken stops appending
      isDoneFiredRef.current = true;
      currentStreamingMessageIdRef.current = null;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                isTyping: false,
                actions: actions,
                dataAnalystResponse: dataAnalystResponse,
                // Always preserve streamed content — action cards render below content
                // Mark all steps as done
                thinkingSteps: (m.thinkingSteps || []).map((s) =>
                  s.status === "running"
                    ? { ...s, status: "done" as const }
                    : s,
                ),
              }
            : m,
        ),
      );

      // Read from ref to avoid stale closure
      const currentSessionId = activeSessionIdRef.current;
      const currentMsgs = messagesRef.current;
      const targetMsg = currentMsgs.find((m) => m.id === msgId);
      if (targetMsg && currentSessionId) {
        await saveChatMessage(
          msgId,
          currentSessionId,
          "assistant",
          targetMsg.content || "",
          {
            actions,
            dataAnalystResponse:
              dataAnalystResponse ?? targetMsg.dataAnalystResponse,
          },
        );
      }

      if (actions && actions.length > 0) {
        // Actions already executed by backend (status: success) — sync UI data
        const successActions = actions.filter((a) => a.status === "success");
        if (successActions.length > 0) {
          for (const a of successActions) {
            const toolConfig = ACTION_SOCKET_EVENT[a.tool];
            if (toolConfig) {
              const socket = getSocket() as ReturnType<typeof getSocket> & {
                emit: (event: string, data: unknown) => void;
              };
              if (socket?.connected) {
                socket.emit(toolConfig.event, {
                  entity: toolConfig.entity,
                  action: a.tool,
                  data: a.data,
                });
              }
            }
          }
          router.refresh();
          queryClient.invalidateQueries();
        }

        // Actions that need user confirmation — auto-execute via HTTP
        if (autoExecute) {
          const pendingActions = actions.filter(
            (a) => a.status === "pending_confirmation",
          );
          if (pendingActions.length > 0) {
            setTimeout(async () => {
              for (const a of pendingActions) {
                await handleExecuteAction(a, msgId);
              }
            }, 400);
          }
        }
      }
      setIsLoading(false);
    },
    onStopped: () => {
      // Server acknowledged the stop — ensure UI is clean
      console.log("[AI] Server confirmed stop");
    },
    onError: (error) => {
      currentStreamingMessageIdRef.current = null;
      const errorMsgId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      setMessages((prev) => [
        ...prev,
        { id: errorMsgId, role: "assistant", content: `Lỗi kết nối: ${error}` },
      ]);
      // Must reset loading here — WebSocket error path bypasses the finally block
      setIsLoading(false);
    },
  });

  // Load sessions on mount (for sidebar listing)
  useEffect(() => {
    getUserChatSessions().then((sessionsRes) => {
      const store = useAiChatStore.getState();
      if (sessionsRes.success && sessionsRes.sessions) {
        const loadedSessions = sessionsRes.sessions.map(
          (s: {
            id: string;
            title: string;
            createdAt: Date;
            updatedAt: Date;
          }) => ({
            id: s.id,
            title: s.title,
            messages: [],
            createdAt: new Date(s.createdAt).getTime(),
            updatedAt: new Date(s.updatedAt).getTime(),
          }),
        );

        store.setSessions(loadedSessions);

        // Chỉ set active session khi có conversationId trong URL
        if (initialConversationId) {
          setActiveSession(initialConversationId);
        } else {
          // Không có conversationId -> new chat, clear active session
          setActiveSession(null);
        }
      } else {
        store.clearStore();
      }
    });

    const savedAutoExecute = localStorage.getItem("ai_auto_execute");
    if (savedAutoExecute === "true") setAutoExecute(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, initialConversationId]);

  // Sync messages when active session changes (driven by conversationId from URL)
  useEffect(() => {
    // Skip entirely while a new session is being created — handleSend manages
    // messages directly and saves them to DB asynchronously. Loading from DB
    // here would return empty (race: message not saved yet) and wipe the UI.
    if (isInitializingSession) return;

    // Skip if we're actively streaming a response — the in-memory messages
    // contain the assistant placeholder and tokens that aren't in DB yet.
    // Reloading from DB here would wipe the streaming message.
    if (currentStreamingMessageIdRef.current) return;

    if (activeSessionId) {
      getChatSessionMessages(activeSessionId).then((res) => {
        // Double-check: streaming may have started while the DB query was in-flight
        if (currentStreamingMessageIdRef.current) return;

        if (res.success && res.messages) {
          const loadedMessages = res.messages.map((m) => ({
            id: m.id,
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
            actions: (m.metadata as { actions?: Message["actions"] })?.actions,
            attachments: (
              m.metadata as { attachments?: Message["attachments"] }
            )?.attachments,
            dataAnalystResponse: (
              m.metadata as {
                dataAnalystResponse?: Message["dataAnalystResponse"];
              }
            )?.dataAnalystResponse,
          }));
          setMessages(loadedMessages);
          updateSession(activeSessionId, loadedMessages);
        }
      });
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, isInitializingSession]);

  const toggleAutoExecute = () => {
    setAutoExecute((prev) => {
      const next = !prev;
      localStorage.setItem("ai_auto_execute", String(next));
      return next;
    });
  };

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  useEffect(() => {
    // Only smooth scroll if not currently typing to avoid animation stutter
    const isTyping = messages.some((m) => m.isTyping);
    scrollToBottom(!isTyping);
  }, [messages, isLoading, scrollToBottom]);

  // Debounced store update ref
  const updateSessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (messages.length === 0 || !activeSessionId) return;

    const isTyping = messages.some((m) => m.isTyping);
    if (isTyping) {
      if (updateSessionTimeoutRef.current)
        clearTimeout(updateSessionTimeoutRef.current);
      updateSessionTimeoutRef.current = setTimeout(() => {
        updateSession(activeSessionId, messages);
      }, 1000); // Debounce store updates while typing
    } else {
      if (updateSessionTimeoutRef.current)
        clearTimeout(updateSessionTimeoutRef.current);
      updateSession(activeSessionId, messages);
    }

    return () => {
      if (updateSessionTimeoutRef.current)
        clearTimeout(updateSessionTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId]);

  const startNewChat = () => {
    setIsInitializingSession(false);
    setMessages([]);
    setActiveSession(null);
    setShowHistory(false);
    if (context === "page") {
      router.replace("/ai");
    }
  };

  const loadSession = (session: ChatSession) => {
    if (context === "page") {
      const params = new URLSearchParams();
      params.set("conversationId", session.id);
      router.replace(`/ai?${params.toString()}`);
    } else {
      setActiveSession(session.id);
    }
    setShowHistory(false);
  };

  const deleteSession = (id: string) => {
    deleteSessionState(id);
    deleteChatSessionDb(id);
    if (activeSessionId === id) startNewChat();
  };

  // =====================
  // Execute action
  // =====================
  const handleExecuteAction = async (
    action: ActionProposal,
    messageId: string,
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              actions: m.actions?.map((a) =>
                a.id === action.id
                  ? { ...a, status: "executing" as ActionStatus }
                  : a,
              ),
            }
          : m,
      ),
    );

    try {
      const execTool =
        (action.confirmationData?.action as string) || action.tool;
      const execParams = (action.confirmationData ||
        action.data ||
        {}) as Record<string, unknown>;
      const result = await executeHRAction(
        action.id,
        execTool,
        execParams,
        true,
      );

      // Use actual backend status to determine flow
      const actualStatus =
        (result.status as string) || (result.success ? "success" : "error");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                actions: m.actions?.map((a) =>
                  a.id === action.id
                    ? {
                        ...a,
                        status: actualStatus as ActionStatus,
                        displayMessage:
                          result.display_message || a.displayMessage,
                        error: result.error || null,
                        // Update confirmation data if backend returned new confirmation data
                        confirmationData:
                          result.status === "pending_confirmation" ||
                          result.status === "requires_info"
                            ? result.data
                            : a.confirmationData,
                        confirmationRequired:
                          result.status === "pending_confirmation" ||
                          result.status === "requires_info"
                            ? true
                            : a.confirmationRequired,
                      }
                    : a,
                ),
              }
            : m,
        ),
      );

      if (result.success && actualStatus === "success") {
        // Emit socket event for cache invalidation (no toast — ActionCard shows status inline)
        const toolConfig = ACTION_SOCKET_EVENT[execTool];
        if (toolConfig) {
          const socket = getSocket() as ReturnType<typeof getSocket> & {
            emit: (event: string, data: unknown) => void;
          };
          if (socket?.connected) {
            socket.emit(toolConfig.event, {
              entity: toolConfig.entity,
              action: execTool,
              data: result.data,
            });
          }

          router.refresh();
          queryClient.invalidateQueries();
        }
      }
      // pending_confirmation / requires_info / error — all handled inline by ActionCard
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                actions: m.actions?.map((a) =>
                  a.id === action.id
                    ? {
                        ...a,
                        status: "error" as ActionStatus,
                        error: "Lỗi kết nối",
                      }
                    : a,
                ),
              }
            : m,
        ),
      );
    }
  };

  const handleDismissAction = (action: ActionProposal, messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, actions: m.actions?.filter((a) => a.id !== action.id) }
          : m,
      ),
    );
  };

  // =====================
  // Send message
  // =====================
  const DATA_ANALYST_KEYWORDS = [
    "thống kê",
    "biểu đồ",
    "phân tích",
    "so sánh",
    "tổng hợp",
    "xu hướng",
    "tỷ lệ",
    "số liệu",
    "đếm",
    "bao nhiêu",
    "theo tháng",
    "theo quý",
    "theo phòng",
    "theo năm",
    "bao nhiêu nhân viên",
    "nhân sự tháng",
    "tình hình nhân sự",
    "tuyển dụng",
    "số lượng",
    "báo cáo nhân sự",
    "insight",
    "metrics",
    "so sánh",
    "trend",
    "distribution",
    "employee count",
    "headcount",
    "turnover",
    "attrition",
    "compensation",
  ];

  const isDataAnalystQuery = (text: string) => {
    const lower = text.toLowerCase();
    return DATA_ANALYST_KEYWORDS.some((kw) => lower.includes(kw));
  };

  const { setOpen } = useSidebar();

  const handleSend = async (
    text: string,
    retryOptions?: { assistantMessageId: string },
  ) => {
    if (context === "page") setOpen(false);

    if ((!text.trim() && !retryOptions) || isLoading) return;

    let queryText = text;
    let userMsgIdxForRetry = -1;

    if (retryOptions) {
      const assistantIdx = messages.findIndex(
        (m) => m.id === retryOptions.assistantMessageId,
      );
      if (assistantIdx !== -1) {
        for (let i = assistantIdx - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            userMsgIdxForRetry = i;
            break;
          }
        }
        if (userMsgIdxForRetry !== -1) {
          queryText = messages[userMsgIdxForRetry].content;
        } else {
          setIsLoading(false);
          return;
        }
      } else {
        setIsLoading(false);
        return;
      }
    }

    if (isDataAnalystQuery(queryText)) {
      setIsLoading(true);
      try {
        if (retryOptions) {
          const targetHistory = messages.slice(0, userMsgIdxForRetry + 1);
          setMessages(targetHistory);
          await handleDataAnalystQuery(queryText, true);
        } else {
          await handleDataAnalystQuery(queryText, false);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let enrichedContent = queryText;
    let chatHistory: { role: string; content: string }[] = [];

    setIsLoading(true);
    let currentActiveSession = activeSessionId;

    if (retryOptions) {
      const targetHistory = messages.slice(0, userMsgIdxForRetry + 1);
      const chatHistoryObjs = messages.slice(0, userMsgIdxForRetry);
      enrichedContent = messages[userMsgIdxForRetry].content;
      setMessages(targetHistory);
      chatHistory = chatHistoryObjs
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
    } else {
      const currentFiles = [...files];
      const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: text,
        attachments:
          currentFiles.length > 0
            ? currentFiles.map((f) => ({ name: f.name, size: f.size }))
            : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setFiles([]);

      if (!currentActiveSession) {
        setIsInitializingSession(true);
        const newId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const title = text.length > 40 ? text.slice(0, 40) + "..." : text;
        const newSession: ChatSession = {
          id: newId,
          title,
          messages: [userMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        currentActiveSession = newId;
        setActiveSession(newId);
        addSession(newSession);
        await createChatSession(newId, title);
        await saveChatMessage(
          userMessage.id,
          newId,
          "user",
          userMessage.content,
          { attachments: userMessage.attachments },
        );
        setIsInitializingSession(false);
        if (context === "page") {
          const params = new URLSearchParams();
          params.set("conversationId", newId);
          router.replace(`/ai?${params.toString()}`);
        }
      } else {
        await saveChatMessage(
          userMessage.id,
          currentActiveSession,
          "user",
          userMessage.content,
          { attachments: userMessage.attachments },
        );
      }

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

      enrichedContent = text + fileContext;
      // chatHistory = full conversation context before this new user message.
      // "messages" here is the React state snapshot at the time handleSend was called,
      // which does NOT include the new userMessage yet (setMessages is async-batched).
      chatHistory = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
    }

    try {
      // CRITICAL: Set ref BEFORE sendMessage so WebSocket can update the right message
      const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      currentStreamingMessageIdRef.current = newMessageId;
      // Reset done guard so onToken can append tokens for this message
      isDoneFiredRef.current = false;

      // Add empty message to state BEFORE sendMessage so it's there when tokens arrive
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId,
          role: "assistant",
          content: "",
          isTyping: true,
          actions: [],
        },
      ]);

      if (
        sendMessage(
          enrichedContent,
          chatHistory,
          currentActiveSession || "ws-default",
          "vi",
        )
      ) {
        // WebSocket path — isLoading will be cleared by onDone/onError/onStopped callbacks
        return;
      }

      // WebSocket not connected - remove the placeholder message, fall back to HTTP
      setMessages((prev) => prev.filter((m) => m.id !== newMessageId));
      currentStreamingMessageIdRef.current = null;

      // HTTP fallback
      const rawResult = await smartChatWithAI(
        enrichedContent,
        chatHistory,
        "vi",
      );

      if (rawResult.success && rawResult.content) {
        const parsed = parseSmartChatResponse(rawResult);
        const httpMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        setMessages((prev) => [
          ...prev,
          {
            id: httpMsgId,
            role: "assistant",
            content: parsed.content || "",
            isTyping: false, // HTTP response is complete immediately — no streaming
            actions: parsed.actions,
          },
        ]);

        await saveChatMessage(
          httpMsgId,
          currentActiveSession!,
          "assistant",
          parsed.content || "",
          { actions: parsed.actions },
        );

        // Refetch credits after successful message
        queryClient.invalidateQueries({ queryKey: ["ai-credits"] });

        if (autoExecute && parsed.actions && parsed.actions.length > 0) {
          // For write actions, execute them immediately instead of sending
          // a follow-up AI call (which would skip action execution entirely).
          const hasWriteActions = parsed.actions.some((a) =>
            WRITE_ACTIONS.has(a.tool),
          );

          if (!parsed.needsFollowup || hasWriteActions) {
            // Clear pre-composed content — action card will show the result
            setMessages((prev) =>
              prev.map((m) =>
                m.id === httpMsgId ? { ...m, content: "", isTyping: false } : m,
              ),
            );
            setTimeout(async () => {
              for (const a of parsed.actions!) {
                await handleExecuteAction(a, httpMsgId);
              }
            }, 400);
          } else {
            // Read-only actions with data: send follow-up AI call
            const toolDataParts = parsed.actions
              .filter((a) => a.status === "success" && a.data)
              .map((a) => `[Kết quả từ ${a.tool}]:\n${JSON.stringify(a.data)}`);

            if (toolDataParts.length > 0) {
              const followupHistory = [
                ...chatHistory,
                { role: "assistant", content: parsed.content || "" },
              ];
              const followupMessage =
                `Hệ thống đã thực thi xong và trả về kết quả thực tế:\n\n${toolDataParts.join("\n\n")}\n\n` +
                `Hãy phân tích dữ liệu trên và trả lời câu hỏi ban đầu của người dùng một cách chi tiết, dễ hiểu bằng tiếng Việt. Dùng danh sách (bullet points) thay vì bảng.`;

              try {
                const followupResult = await smartChatWithAI(
                  followupMessage,
                  followupHistory,
                  "vi",
                );
                if (followupResult.success && followupResult.content) {
                  const followupParsed = parseSmartChatResponse(followupResult);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === httpMsgId
                        ? {
                            ...m,
                            content:
                              (m.content || "") +
                              "\n\n" +
                              (followupParsed.content || ""),
                            isTyping: false, // Follow-up complete
                          }
                        : m,
                    ),
                  );

                  const combinedContent =
                    (parsed.content || "") +
                    "\n\n" +
                    (followupParsed.content || "");
                  await saveChatMessage(
                    httpMsgId,
                    currentActiveSession!,
                    "assistant",
                    combinedContent,
                    { actions: parsed.actions },
                  );
                }
              } catch (followupErr) {
                console.error("Follow-up AI call failed:", followupErr);
                // Ensure message stops typing even on follow-up failure
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === httpMsgId ? { ...m, isTyping: false } : m,
                  ),
                );
              }
            }
          }
        }
      } else {
        // Handle insufficient credits specifically
        if ((rawResult as { code?: string }).code === "INSUFFICIENT_CREDITS") {
          toast(
            "warning",
            "Bạn đã hết credits. Vui lòng liên hệ quản trị viên để nạp thêm.",
          );
          const errMsgId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          setMessages((prev) => [
            ...prev,
            {
              id: errMsgId,
              role: "assistant",
              content:
                "Bạn đã hết credits. Vui lòng liên hệ quản trị viên để nạp thêm.",
            },
          ]);
          await saveChatMessage(
            errMsgId,
            currentActiveSession!,
            "assistant",
            "Bạn đã hết credits. Vui lòng liên hệ quản trị viên để nạp thêm.",
          );
          queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
          return;
        }

        const errorMsgId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        setMessages((prev) => [
          ...prev,
          {
            id: errorMsgId,
            role: "assistant",
            content:
              rawResult.error ||
              "Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.",
          },
        ]);
        await saveChatMessage(
          errorMsgId,
          currentActiveSession!,
          "assistant",
          rawResult.error || "",
        );
      }
    } catch (error) {
      console.error(error);
      const throwMsgId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: throwMsgId,
          role: "assistant",
          content: "Không thể kết nối. Vui lòng kiểm tra lại dịch vụ AI.",
        },
      ]);
      await saveChatMessage(
        throwMsgId,
        currentActiveSession!,
        "assistant",
        "Không thể kết nối. Vui lòng kiểm tra lại dịch vụ AI.",
      ).catch(() => {});
    } finally {
      // Always clear loading for HTTP fallback paths.
      // For WebSocket path, this function returns early before reaching here,
      // and isLoading is cleared by onDone/onError callbacks instead.
      setIsLoading(false);
    }
  };

  // =====================
  // Data Analyst submit — integrated into unified agent flow
  // =====================
  const DATA_ANALYST_STEP_DEFS = [
    {
      id: "parse-intent",
      label: "Phân tích ý định truy vấn",
      toolName: "parse_intent",
    },
    {
      id: "build-query",
      label: "Xây dựng câu truy vấn SQL",
      toolName: "build_query",
    },
    {
      id: "execute-query",
      label: "Truy vấn cơ sở dữ liệu",
      toolName: "database",
    },
    {
      id: "generate-chart",
      label: "Tạo biểu đồ và phân tích",
      toolName: "chart",
    },
    { id: "synthesize", label: "Tổng hợp kết quả", toolName: "synthesis" },
  ];

  const handleDataAnalystQuery = async (
    question: string,
    isRetry: boolean = false,
  ) => {
    const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const loadingMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 5)}`;

    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: question,
    };

    // Initialize ALL steps at once — only first one is running
    const initialSteps = DATA_ANALYST_STEP_DEFS.map((def, idx) => ({
      id: def.id,
      label: def.label,
      status: idx === 0 ? ("running" as const) : ("pending" as const),
      toolName: def.toolName,
      timestamp: Date.now(),
    }));

    const loadingMessage: Message = {
      id: loadingMessageId,
      role: "assistant",
      content: "",
      isTyping: true,
      thinkingSteps: initialSteps,
    };

    if (isRetry) {
      setMessages((prev) => [...prev, loadingMessage]);
    } else {
      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setInput("");
      setFiles([]);
    }

    // Create session if needed
    let currentActive = activeSessionId;
    let isNewSession = false;
    if (!currentActive && !isRetry) {
      isNewSession = true;
      setIsInitializingSession(true);
      const newId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const title =
        question.length > 40 ? question.slice(0, 40) + "..." : question;
      const newSession: ChatSession = {
        id: newId,
        title,
        messages: [userMessage, loadingMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentActive = newId;
      setActiveSession(newId);
      addSession(newSession);
      await createChatSession(newId, title);
      await saveChatMessage(userMessageId, newId, "user", userMessage.content);

      if (context === "page") {
        const params = new URLSearchParams();
        params.set("conversationId", newId);
        router.replace(`/ai?${params.toString()}`);
      }

      // NOTE: do NOT call setIsInitializingSession(false) here — we keep the guard
      // active until the full data-analyst pipeline finishes so the useEffect
      // (activeSessionId / isInitializingSession deps) does not reload from DB and
      // overwrite the in-progress messages with the stale snapshot.
    } else if (!isRetry) {
      await saveChatMessage(
        userMessageId,
        currentActive!,
        "user",
        userMessage.content,
      );
    }

    // Helper: mark current step as done and next step as running
    const advanceStep = async (stepIndex: number) => {
      const nextStep = DATA_ANALYST_STEP_DEFS[stepIndex + 1];
      if (!nextStep) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== loadingMessageId) return m;
          return {
            ...m,
            thinkingSteps: (m.thinkingSteps || []).map((s) => {
              if (s.id === DATA_ANALYST_STEP_DEFS[stepIndex].id) {
                return { ...s, status: "done" as const };
              }
              if (s.id === nextStep.id) {
                return { ...s, status: "running" as const };
              }
              return s;
            }),
          };
        }),
      );

      // Small delay for visual effect
      await new Promise((r) => setTimeout(r, 350));
    };

    try {
      // Step 0: parse-intent (already running, now complete)
      await advanceStep(0);

      // Step 1: build-query — start fetch
      await advanceStep(1);

      const response = await fetch("/api/ai/data-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language: "vi", include_chart: true }),
      });

      // Step 2: execute-query
      await advanceStep(2);

      const result = await response.json();

      // Step 3: generate-chart
      await advanceStep(3);

      // Fallback: if backend doesn't provide chart data but we have metrics or numbers in answer, try to extract them
      let finalChartType = result.chart_type || result.chartType || "none";
      let finalChartData = result.chart_data || result.chartData;
      const baseChartTitle =
        result.chart_title || result.chartTitle || "Biểu đồ tỉ lệ";
      const baseXAxis = result.x_axis || result.xAxis;
      const baseYAxis = result.y_axis || result.yAxis;

      if (
        (finalChartType === "none" || !finalChartData) &&
        result.metrics &&
        result.metrics.length > 0
      ) {
        finalChartType = "pie";
        finalChartData = result.metrics.map(
          (m: { label: string; value: unknown }) => ({
            name: m.label,
            value:
              typeof m.value === "number"
                ? m.value
                : parseFloat(String(m.value)) || 0,
          }),
        );
      } else if (
        (finalChartType === "none" || !finalChartData) &&
        result.answer &&
        result.intent === "ratio_analysis"
      ) {
        const ratioPattern =
          /([^\s:]+)[\s:]+(?:có|tỉ lệ|chiếm|khoảng)?\s*(\d+(?:[.,]\d+)?)\s*%?/gi;
        const matches = [...result.answer.matchAll(ratioPattern)];
        if (matches.length > 1) {
          finalChartType = "pie";
          finalChartData = matches.map((m) => ({
            name: m[1].trim(),
            value: parseFloat(m[2].replace(",", ".")) || 0,
          }));
        }
      }

      // Step 4: synthesize
      await advanceStep(4);

      // Mark last step as done
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessageId
            ? {
                ...m,
                content: result.answer || result.error || "Không có phản hồi",
                isTyping: false,
                thinkingSteps: (m.thinkingSteps || []).map((s) => ({
                  ...s,
                  status: "done" as const,
                })),
                dataAnalystResponse: {
                  chartType: finalChartType,
                  chartData: finalChartData,
                  chartTitle: baseChartTitle,
                  xAxis: baseXAxis,
                  yAxis: baseYAxis,
                  metrics: result.metrics,
                  insights: result.insights,
                  intent: result.intent,
                  confidence: result.confidence,
                  answer: result.answer,
                  error: result.error,
                },
              }
            : m,
        ),
      );

      await saveChatMessage(
        loadingMessageId,
        currentActive!,
        "assistant",
        result.answer || result.error || "",
        {
          dataAnalystResponse: {
            chartType: finalChartType,
            chartData: finalChartData,
            chartTitle: baseChartTitle,
            xAxis: baseXAxis,
            yAxis: baseYAxis,
            metrics: result.metrics,
            insights: result.insights,
            intent: result.intent,
            confidence: result.confidence,
            answer: result.answer,
            error: result.error,
          },
        },
      );

      // Now safe to lift the initialization guard — chart data is in state and DB
      if (isNewSession) setIsInitializingSession(false);
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessageId
            ? {
                ...m,
                content: "Đã xảy ra lỗi khi xử lý yêu cầu.",
                isTyping: false,
                thinkingSteps: (m.thinkingSteps || []).map((s) => ({
                  ...s,
                  status: "error" as const,
                  detail:
                    error instanceof Error
                      ? error.message
                      : "Lỗi không xác định",
                })),
                dataAnalystResponse: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              }
            : m,
        ),
      );
      // Release guard on error path too
      if (isNewSession) setIsInitializingSession(false);
    }
  };

  const agentModeProps: AiAgentModeProps = {
    messages,
    onMessagesChange: setMessages,
    input,
    onInputChange: setInput,
    isLoading,
    onIsLoadingChange: setIsLoading,
    files,
    onFilesChange: setFiles,
    currentQuickActions,
    handleSend,
    handleStop: () => {
      sendStop();
      isDoneFiredRef.current = true; // Prevent any late-arriving tokens
      const msgId = currentStreamingMessageIdRef.current;
      currentStreamingMessageIdRef.current = null;
      if (msgId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  isTyping: false,
                  thinkingSteps: (m.thinkingSteps || []).map((s) =>
                    s.status === "running"
                      ? {
                          ...s,
                          status: "error" as const,
                          detail: "Đã dừng bởi người dùng",
                        }
                      : s,
                  ),
                }
              : m,
          ),
        );
      }
      setIsLoading(false);
    },
    handleExecuteAction,
    handleDismissAction,
    inputRef,
    fileInputRef,
    bottomRef,
  };

  return (
    <div className="flex flex-col size-full min-h-0 min-w-0 bg-background relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0 px-3 py-1.5 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            AI Agent
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {context === "sidebar" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowHistory(!showHistory)}
              tooltip={"Lịch sử"}
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" tooltip={"Cài đặt"}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Cài đặt</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleAutoExecute();
                }}
                className="cursor-pointer"
              >
                {autoExecute ? (
                  <CheckSquare className="text-primary" />
                ) : (
                  <Square />
                )}
                <span className="flex-1">Tự động duyệt</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {context === "sidebar" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={startNewChat}
              tooltip={"Mới"}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-10 left-0 right-0 bottom-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col border-b">
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

      {/* Agent Mode — unified with Data Analyst */}
      <AiAgentMode {...agentModeProps} />
    </div>
  );
}

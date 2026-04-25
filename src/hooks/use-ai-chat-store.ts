import { create } from "zustand";
import { ActionProposal } from "@/lib/ai/hr-agent";

export interface Attachment {
  name: string;
  size: number;
}

export interface MetricItem {
  label: string;
  value: unknown;
  unit?: string;
}

export interface InsightItem {
  title: string;
  description: string;
  severity?: "high" | "medium" | "low";
  metric?: string;
  recommendation?: string;
}

export interface DataAnalystResponse {
  chartType?: "bar" | "line" | "pie" | "scatter" | "area" | "areachart" | "none" | null;
  chartData?: { label?: string; name?: string; value: number; x?: number; y?: number; percent?: number }[];
  chartTitle?: string;
  xAxis?: string;
  yAxis?: string;
  metrics?: MetricItem[];
  insights?: InsightItem[];
  intent?: string;
  confidence?: number;
  answer?: string;
  error?: string;
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  toolName?: string;
  detail?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  isTyping?: boolean;
  attachments?: Attachment[];
  actions?: ActionProposal[];
  dataAnalystResponse?: DataAnalystResponse;
  thinkingSteps?: ThinkingStep[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface AiChatStore {
  sessions: ChatSession[];
  pageActiveSessionId: string | null;
  sidebarActiveSessionId: string | null;
  aiCredits: number | null;
  setSessions: (sessions: ChatSession[]) => void;
  setPageActiveSessionId: (id: string | null) => void;
  setSidebarActiveSessionId: (id: string | null) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, messages: Message[], updateTime?: boolean) => void;
  deleteSession: (id: string) => void;
  clearStore: () => void;
  setAiCredits: (credits: number | null) => void;
}

export const useAiChatStore = create<AiChatStore>()((set) => ({
  sessions: [],
  pageActiveSessionId: null,
  sidebarActiveSessionId: null,
  aiCredits: null,
  setSessions: (sessions) => set({ sessions }),
  setPageActiveSessionId: (id) => set({ pageActiveSessionId: id }),
  setSidebarActiveSessionId: (id) => set({ sidebarActiveSessionId: id }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, messages, updateTime = true) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, messages, ...(updateTime ? { updatedAt: Date.now() } : {}) } : s
      ),
    })),
  deleteSession: (id) =>
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      return {
        sessions: newSessions,
        pageActiveSessionId: state.pageActiveSessionId === id ? null : state.pageActiveSessionId,
        sidebarActiveSessionId: state.sidebarActiveSessionId === id ? null : state.sidebarActiveSessionId,
      };
    }),
  clearStore: () =>
    set({
      sessions: [],
      pageActiveSessionId: null,
      sidebarActiveSessionId: null,
      aiCredits: null,
    }),
  setAiCredits: (credits) => set({ aiCredits: credits }),
}));

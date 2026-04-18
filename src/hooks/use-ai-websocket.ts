import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';

import { type ActionProposal } from '@/lib/ai/hr-agent';
import { type ThinkingStep, type DataAnalystResponse } from '@/hooks/use-ai-chat-store';


export type WebSocketState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface UseAiWebSocketProps {
  onToken?: (token: string) => void;
  onThinking?: (step: ThinkingStep) => void;
  onToolStart?: (step: ThinkingStep) => void;
  onToolResult?: (stepId: string, status: 'done' | 'error', detail?: string) => void;
  onDone?: (
    actions?: ActionProposal[],
    dataSources?: string[],
    needsFollowup?: boolean,
    dataAnalystResponse?: DataAnalystResponse,
  ) => void;
  onStopped?: () => void;
  onError?: (error: string) => void;
}

export function useAiWebSocket({ onToken, onThinking, onToolStart, onToolResult, onDone, onStopped, onError }: UseAiWebSocketProps) {
  const { data: session } = useSession();
  const [connectionState, setConnectionState] = useState<WebSocketState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Use ref for connectionState to avoid stale closures in sendMessage
  const connectionStateRef = useRef<WebSocketState>('disconnected');

  const onTokenRef = useRef(onToken);
  const onThinkingRef = useRef(onThinking);
  const onToolStartRef = useRef(onToolStart);
  const onToolResultRef = useRef(onToolResult);
  const onDoneRef = useRef(onDone);
  const onStoppedRef = useRef(onStopped);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenRef.current = onToken;
    onThinkingRef.current = onThinking;
    onToolStartRef.current = onToolStart;
    onToolResultRef.current = onToolResult;
    onDoneRef.current = onDone;
    onStoppedRef.current = onStopped;
    onErrorRef.current = onError;
  }, [onToken, onThinking, onToolStart, onToolResult, onDone, onStopped, onError]);

  // Keep connectionStateRef in sync
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('connecting');
    // Connect directly to the FastAPI server. 
    // Fallback securely to default process.env variable.
    const wsUrl = process.env.NEXT_PUBLIC_AI_WS_URL || 'ws://127.0.0.1:8000/ws/ai/chat';
    console.log('[WebSocket] Attempting to connect to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connection OPENED');
        // Authenticate immediately upon connection
        if (session?.user) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: session.user.id,
            userRole: session.user.hrmRole || session.user.role
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'ready':
              setConnectionState('connected');
              reconnectAttemptsRef.current = 0;
              break;
            case 'token':
              if (onTokenRef.current && data.content) {
                onTokenRef.current(data.content);
              }
              break;
            case 'thinking':
              if (onThinkingRef.current && data.step) {
                onThinkingRef.current({
                  id: data.step_id || `think_${Date.now()}`,
                  label: data.step,
                  status: 'running',
                  timestamp: Date.now(),
                });
              }
              break;
            case 'tool_start':
              if (onToolStartRef.current) {
                onToolStartRef.current({
                  id: data.step_id || `tool_${Date.now()}`,
                  label: data.description || data.tool,
                  status: 'running',
                  toolName: data.tool,
                  timestamp: Date.now(),
                });
              }
              break;
            case 'tool_result':
              if (onToolResultRef.current) {
                onToolResultRef.current(
                  data.step_id || '',
                  data.status === 'success' ? 'done' : 'error',
                  data.detail
                );
              }
              break;
            case 'done':
              if (onDoneRef.current) {
                let mappedActions: ActionProposal[] | undefined;
                if (data.actions) {
                    mappedActions = data.actions.map((a: any) => ({
                        id: a.id,
                        tool: a.tool,
                        description: a.description,
                        status: a.status,
                        displayMessage: a.display_message || a.displayMessage,
                        data: a.data,
                        confirmationRequired: a.confirmation_required || a.confirmationRequired,
                        confirmationData: a.confirmation_data || a.confirmationData,
                        error: a.error,
                    }));
                }
                onDoneRef.current(
                  mappedActions,
                  data.data_sources,
                  data.needs_followup,
                  data.data_analyst_response,
                );
              }
              break;
            case 'stopped':
              // Backend acknowledged stop — notify caller
              console.log('[WebSocket] Stop acknowledged by server');
              if (onStoppedRef.current) {
                onStoppedRef.current();
              }
              break;
            case 'error':
              if (onErrorRef.current) {
                onErrorRef.current(data.error);
              }
              break;
            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] CLOSED: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
        wsRef.current = null;
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          setConnectionState('reconnecting');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setConnectionState('disconnected');
        }
      };

      ws.onerror = (event) => {
        // ReadyState 3 = CLOSED - server not running or connection refused
        // This is expected behavior when AI service is offline, not a real error
        if (ws.readyState === WebSocket.CLOSED) {
          console.warn('[WebSocket] Server offline or connection refused. Using HTTP fallback.');
          setConnectionState('disconnected');
        } else {
          console.error('[WebSocket] onerror fired. ReadyState:', ws.readyState, event);
          setConnectionState('error');
          if (onErrorRef.current) {
            onErrorRef.current('Kết nối AI Service thất bại');
          }
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      setConnectionState('error');
    }
  }, [session]); // Removed connectionState and callbacks from deps to prevent infinite reconnection loops

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  // Use ref-based check to avoid stale closure with connectionState
  const sendMessage = useCallback((message: string, history: any[] = [], sessionId: string = 'default', language: string = 'vi') => {
    if (wsRef.current?.readyState === WebSocket.OPEN && connectionStateRef.current === 'connected') {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        message,
        history,
        sessionId,
        language
      }));
      return true;
    }
    return false;
  }, []); // No deps needed — uses refs only

  const sendStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (session?.user) {
      connect();
    }
    return () => {
      // Intentionally avoiding auto-disconnect on re-renders, 
      // rely on the component using the hook to control unmount manually or let it live.
      // But we will still disconnect if the session completely changes or unmounts.
      disconnect();
    };
  }, [session, connect, disconnect]);

  return {
    connectionState,
    sendMessage,
    connect,
    disconnect,
    sendStop,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
  };
}

import { useEffect, useRef, useState, useCallback } from "react";
import type { WSMessage } from "@/lib/types";
import { resolveWsUrl } from "@/lib/config";

interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onConnect?: (clientId: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(resolveWsUrl());

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = () => {
      setIsConnected(false);
      setClientId(null);
      onDisconnect?.();

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectRef.current();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        if (message.type === "connected") {
          setClientId(message.client_id);
          onConnect?.(message.client_id);
        }

        onMessage?.(message);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    wsRef.current = ws;
  }, [
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  // Keep ref in sync with latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
    wsRef.current?.close();
  }, [maxReconnectAttempts]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    clientId,
    send,
    connect,
    disconnect,
  };
}

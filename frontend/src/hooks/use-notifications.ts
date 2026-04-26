"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

export type WSEventType =
  | "NEW_REPORT"
  | "STATUS_CHANGED"
  | "SEVERITY_CHANGED"
  | "REPORT_DELETED"
  | "NOTE_ADDED"
  | "EVIDENCE_UPLOADED";

export interface WSMessage {
  event: WSEventType;
  data: Record<string, unknown>;
}

export interface Notification {
  id: string;
  event: WSEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

const MAX_RECONNECT_DELAY = 30_000;

/**
 * Hook that manages a WebSocket connection for real-time admin
 * notifications.  Returns:
 *  - `notifications` — most recent notifications (newest first)
 *  - `connected` — whether the WS is currently open
 *  - `clearNotifications` — clear the notification list
 */
export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!token) return;

    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const ws = new WebSocket(
        `${WS_BASE}/ws/notifications?token=${token}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) {
          ws.close();
          return;
        }
        setConnected(true);
        retryRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const msg: WSMessage = JSON.parse(ev.data);
          const notif: Notification = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            event: msg.event,
            data: msg.data,
            timestamp: Date.now(),
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 50));

          // Dispatch DOM event so other components can react (e.g. auto-refresh)
          window.dispatchEvent(
            new CustomEvent("sawtsafe:ws-event", { detail: notif }),
          );
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setConnected(false);
        // Exponential backoff reconnect
        const delay = Math.min(
          1000 * 2 ** retryRef.current,
          MAX_RECONNECT_DELAY,
        );
        retryRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
      }
      setConnected(false);
    };
  }, [token]);

  return { notifications, connected, clearNotifications };
}

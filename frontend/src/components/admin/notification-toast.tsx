"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ArrowRightLeft,
  AlertTriangle,
  Trash2,
  MessageSquare,
  Paperclip,
  Wifi,
  WifiOff,
  X,
  Bell,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Notification, WSEventType } from "@/hooks/use-notifications";

const EVENT_ICON: Record<WSEventType, typeof FileText> = {
  NEW_REPORT: FileText,
  STATUS_CHANGED: ArrowRightLeft,
  SEVERITY_CHANGED: AlertTriangle,
  REPORT_DELETED: Trash2,
  NOTE_ADDED: MessageSquare,
  EVIDENCE_UPLOADED: Paperclip,
};

const EVENT_COLOR: Record<WSEventType, string> = {
  NEW_REPORT: "border-l-blue-500 bg-blue-50",
  STATUS_CHANGED: "border-l-amber-500 bg-amber-50",
  SEVERITY_CHANGED: "border-l-orange-500 bg-orange-50",
  REPORT_DELETED: "border-l-red-500 bg-red-50",
  NOTE_ADDED: "border-l-emerald-500 bg-emerald-50",
  EVIDENCE_UPLOADED: "border-l-purple-500 bg-purple-50",
};

const TOAST_DURATION = 6000;

interface NotificationToastProps {
  notifications: Notification[];
  connected: boolean;
  onClear: () => void;
}

export function NotificationToast({
  notifications,
  connected,
  onClear,
}: NotificationToastProps) {
  const t = useTranslations("admin");
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const seenRef = useRef(new Set<string>());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /* Show new notifications as toasts */
  useEffect(() => {
    for (const notif of notifications) {
      if (seenRef.current.has(notif.id)) continue;
      seenRef.current.add(notif.id);

      setVisibleToasts((prev) => [notif, ...prev].slice(0, 5));

      const timer = setTimeout(() => {
        setVisibleToasts((prev) => prev.filter((n) => n.id !== notif.id));
        timersRef.current.delete(notif.id);
      }, TOAST_DURATION);

      timersRef.current.set(notif.id, timer);
    }
  }, [notifications]);

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const dismissToast = (id: string) => {
    setVisibleToasts((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  function getEventMessage(notif: Notification): string {
    const data = notif.data;
    const trackingId = (data.tracking_id as string) ?? "";

    switch (notif.event) {
      case "NEW_REPORT":
        return t("notifications.newReport", { id: trackingId });
      case "STATUS_CHANGED":
        return t("notifications.statusChanged", {
          id: trackingId,
          from: String(data.old ?? ""),
          to: String(data.new ?? ""),
        });
      case "SEVERITY_CHANGED":
        return t("notifications.severityChanged", {
          id: trackingId,
          from: String(data.old ?? ""),
          to: String(data.new ?? ""),
        });
      case "REPORT_DELETED":
        return t("notifications.reportDeleted", { id: trackingId });
      case "NOTE_ADDED":
        return t("notifications.noteAdded", { id: trackingId });
      case "EVIDENCE_UPLOADED":
        return t("notifications.evidenceUploaded", { id: trackingId });
      default:
        return notif.event;
    }
  }

  const unreadCount = notifications.length;

  return (
    <>
      {/* ── Connection indicator + Bell button (rendered in header area) ── */}
      <div className="flex items-center gap-2">
        <span
          title={connected ? t("notifications.connected") : t("notifications.disconnected")}
          className="flex items-center gap-1"
        >
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-400" />
          )}
        </span>

        <button
          type="button"
          onClick={() => setShowPanel((v) => !v)}
          className="relative p-1.5 rounded-md hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          title={t("notifications.title")}
        >
          <Bell className="h-4 w-4 text-[#636363]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Notification panel dropdown ── */}
      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute end-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border border-[#EBEBEB] bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#EBEBEB]">
              <span className="text-sm font-medium text-black">
                {t("notifications.title")}
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    seenRef.current.clear();
                    setShowPanel(false);
                  }}
                  className="text-xs text-[#909090] hover:text-red-500 cursor-pointer"
                >
                  {t("notifications.clearAll")}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-[#909090]">
                {t("notifications.empty")}
              </div>
            ) : (
              notifications.slice(0, 30).map((notif) => {
                const Icon = EVENT_ICON[notif.event] ?? Bell;
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-2.5 px-3 py-2.5 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA]"
                  >
                    <Icon className="h-4 w-4 text-[#636363] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-black leading-snug">
                        {getEventMessage(notif)}
                      </p>
                      <p className="text-[11px] text-[#909090] mt-0.5">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── Floating toast stack (bottom-right) ── */}
      <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 pointer-events-none">
        {visibleToasts.map((notif) => {
          const Icon = EVENT_ICON[notif.event] ?? Bell;
          const colorClass = EVENT_COLOR[notif.event] ?? "border-l-gray-500 bg-gray-50";
          return (
            <div
              key={notif.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#EBEBEB] border-l-4 shadow-lg max-w-sm animate-in slide-in-from-right ${colorClass}`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm text-black leading-snug flex-1">
                {getEventMessage(notif)}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(notif.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-[#909090]" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

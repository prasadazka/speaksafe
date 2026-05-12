"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Clock,
  Info,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { trackReport } from "@/lib/api";
import { PublicNav } from "@/components/public-nav";
import { DarkFooter } from "@/components/dark-footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusHistoryEntry {
  status: string;
  at: string;
}

interface TrackResult {
  tracking_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  acknowledgment_due: string | null;
  feedback_due: string | null;
  feedback_given_at: string | null;
  status_history: StatusHistoryEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"] as const;

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  INVESTIGATING: "Investigating",
  CLOSED: "Closed",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-[#91DBF6] text-[#1F2334]",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  INVESTIGATING: "bg-purple-100 text-purple-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
};

const STATUS_ICONS: Record<string, typeof Info> = {
  OPEN: Info,
  UNDER_REVIEW: MessageSquare,
  INVESTIGATING: Search,
  CLOSED: CheckCircle2,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const id = trackingId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await trackReport(id);
      if (res.success && res.data) {
        setResult(res.data as TrackResult);
      } else {
        setError(res.error ?? "Report not found. Please check your tracking ID and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to find that report. Please check the tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  const statusIdx = result
    ? STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number])
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
      <PublicNav />

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-16">

        {/* Magnifier illustration — hidden after result */}
        <AnimatePresence>
          {!result && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Image
                src="/images/Magnifier-icon.png"
                alt=""
                width={184}
                height={184}
                className="pointer-events-none select-none"
                aria-hidden
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heading */}
        <h1 className="text-[42px] font-bold text-black text-center font-[family-name:var(--font-sora)] leading-tight mb-3">
          Track Your Report
        </h1>
        <p className="text-xl text-[#909090] text-center font-[family-name:var(--font-sora)] mb-8">
          Enter your tracking ID to check the current status of your report
        </p>

        {/* Search row */}
        <div className="flex gap-3 w-full max-w-[704px]">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => {
              setTrackingId(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Enter your tracking ID"
            aria-label="Tracking ID"
            className="flex-1 h-[52px] px-5 border border-[#BEBEBE] rounded-xl bg-white text-base text-black placeholder:text-[#BDBDBD] font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !trackingId.trim()}
            className="shrink-0 inline-flex items-center gap-2 h-[52px] px-[35px] bg-[#5B94DE] hover:bg-[#4a83cd] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded text-xl transition-colors font-[family-name:var(--font-figtree)]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Track ID
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 text-red-600 text-sm font-[family-name:var(--font-sora)] w-full max-w-[704px]"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-6 w-full max-w-[704px] space-y-4"
            >
              {/* Card 1 — ID + Status + Dates */}
              <div className="bg-white border border-[#EBEBEB] rounded-xl px-6 py-5">
                {/* Top row: ID + badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#A9A9A9] font-[family-name:var(--font-sora)] mb-1">
                      Your Tracking ID
                    </p>
                    <p className="text-2xl font-extrabold text-[#5B94DE] font-[family-name:var(--font-sora)] leading-tight">
                      {result.tracking_id}
                    </p>
                  </div>
                  <span
                    className={`mt-1 shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize font-[family-name:var(--font-sora)] ${STATUS_BADGE[result.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {STATUS_LABELS[result.status] ?? result.status}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-[#EBEBEB] my-4" />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#A9A9A9] font-[family-name:var(--font-sora)] mb-1">Submitted On</p>
                    <p className="text-[#636363] font-[family-name:var(--font-sora)] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatDate(result.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#A9A9A9] font-[family-name:var(--font-sora)] mb-1">Last Updated On</p>
                    <p className="text-[#636363] font-[family-name:var(--font-sora)] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatDate(result.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 — Status Timeline */}
              <div className="bg-white border border-[#EBEBEB] rounded-xl px-6 py-6">
                <div className="space-y-0">
                  {STATUS_ORDER.map((s, i) => {
                    const Icon = STATUS_ICONS[s];
                    const isActive = s === result.status;
                    const isPast = i <= statusIdx;
                    const historyEntry = (result.status_history ?? []).find((e) => e.status === s);
                    const isLast = i === STATUS_ORDER.length - 1;

                    return (
                      <div key={s} className="flex items-start gap-4">
                        {/* Circle + trail column */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-colors ${
                              isPast || isActive ? "bg-[#5B94DE]" : "bg-[#C6C6C6]"
                            }`}
                          >
                            <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-[46px] bg-[#A1AEBE] mt-0.5" />
                          )}
                        </div>

                        {/* Label + subtitle */}
                        <div className="pt-0.5 pb-1">
                          <p
                            className={`text-sm font-[family-name:var(--font-sora)] ${
                              isActive
                                ? "text-[#5B94DE] font-semibold"
                                : isPast
                                  ? "text-black font-medium"
                                  : "text-[#636363] font-normal"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </p>
                          {isActive && (
                            <p className="text-xs text-[#BDBDBD] mt-0.5 font-[family-name:var(--font-sora)]">
                              Currently Under {STATUS_LABELS[s]}
                              {historyEntry && (
                                <span className="ml-1.5 text-[#909090]">
                                  · {formatDate(historyEntry.at)}
                                </span>
                              )}
                            </p>
                          )}
                          {isPast && !isActive && historyEntry && (
                            <p className="text-xs text-[#BDBDBD] mt-0.5 font-[family-name:var(--font-sora)]">
                              {formatDate(historyEntry.at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Back to Home */}
              <div className="flex justify-center pt-2">
                <Link href="/">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-[52px] px-[35px] bg-[#DBDBDB] hover:bg-[#CFCFCF] text-[#222222] text-xl font-[family-name:var(--font-sora)] rounded transition-colors"
                  >
                    Back to Home
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DarkFooter />
    </div>
  );
}

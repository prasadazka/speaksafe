"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackReport } from "@/lib/api";
import { useTranslations } from "next-intl";

const STATUS_ORDER = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"] as const;

const statusIcons: Record<string, typeof AlertCircle> = {
  OPEN: AlertCircle,
  UNDER_REVIEW: FileSearch,
  INVESTIGATING: Search,
  CLOSED: CheckCircle2,
};

const statusDotColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  UNDER_REVIEW: "bg-amber-500",
  INVESTIGATING: "bg-purple-500",
  CLOSED: "bg-[#00653E]",
};

interface TrackResult {
  tracking_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function TrackPage() {
  const t = useTranslations("track");
  const tc = useTranslations("common");

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
        setError(res.error ?? t("notFound"));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("unableToFind"),
      );
    } finally {
      setLoading(false);
    }
  };

  const statusKey = result?.status ?? "";
  const StatusIcon = statusIcons[statusKey] ?? AlertCircle;
  const statusIdx = result
    ? STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number])
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#00653E]" />
              <span className="text-xl font-bold tracking-tight text-[#00653E]">
                {tc("brand")}
              </span>
            </Link>
            <div className="hidden sm:block w-px h-6 bg-[#D9D9D9] ms-3" />
            <span className="hidden sm:block text-[#636363] text-lg font-semibold">
              {t("title")}
            </span>
          </div>
          <Link href="/report">
            <Button className="bg-[#00653E] hover:bg-[#005232] text-white font-semibold rounded-[4px] cursor-pointer">
              {tc("nav.newReport")}
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex items-start justify-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
          {/* Left — Form Section */}
          <div className="flex-1 w-full max-w-lg mx-auto lg:mx-0">
            {/* Heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#00653E]/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-[#00653E]" />
                </div>
              </div>
              <h1 className="text-[32px] lg:text-[38px] font-bold text-black leading-tight">
                {t("title")}
              </h1>
              <p className="mt-2 text-lg text-[#909090]">
                {t("description")}
              </p>
            </div>

            {/* Search Input */}
            <div className="flex gap-3 mb-6">
              <Input
                value={trackingId}
                onChange={(e) => {
                  setTrackingId(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder={t("placeholder")}
                className="flex-1 font-mono text-center text-lg h-[56px] rounded-[10px] border-[#BEBEBE] bg-white text-black placeholder:text-[#BEBEBE] focus:border-[#00653E] focus:ring-[#00653E]/20"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
              />
              <Button
                onClick={handleSearch}
                className="shrink-0 px-8 h-[56px] bg-[#00653E] hover:bg-[#005232] text-white text-base font-semibold rounded-[4px] cursor-pointer"
                disabled={loading || !trackingId.trim()}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 me-2" />
                    {t("trackButton")}
                  </>
                )}
              </Button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 p-4 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                >
                  <div className="bg-white rounded-[10px] border border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)] p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-[#909090] uppercase tracking-wide">
                          {t("trackingId")}
                        </p>
                        <p className="text-xl font-mono font-bold text-black">
                          {result.tracking_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EBEBEB] bg-[#F9FDFB]">
                        <StatusIcon className="h-4 w-4 text-[#00653E]" />
                        <span className="text-sm font-medium text-[#00653E]">
                          {tc(`status.${statusKey}`)}
                        </span>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="space-y-0">
                      {STATUS_ORDER.map((s, i) => {
                        const Icon = statusIcons[s];
                        const isActive = s === result.status;
                        const isPast = i <= statusIdx;
                        const dotColor = statusDotColors[s] ?? "bg-gray-300";

                        return (
                          <div key={s} className="flex items-start gap-4">
                            {/* Timeline bar */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                  isActive
                                    ? `${dotColor} border-current text-white`
                                    : isPast
                                      ? "border-[#00653E]/30 bg-[#00653E]/10 text-[#00653E]"
                                      : "border-[#EBEBEB] bg-white text-[#BEBEBE]"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              {i < 3 && (
                                <div
                                  className={`w-0.5 h-8 ${isPast ? "bg-[#00653E]/25" : "bg-[#EBEBEB]"}`}
                                />
                              )}
                            </div>
                            {/* Label */}
                            <div className="pt-1.5">
                              <p
                                className={`text-sm font-semibold ${
                                  isActive
                                    ? "text-black"
                                    : isPast
                                      ? "text-[#636363]"
                                      : "text-[#BEBEBE]"
                                }`}
                              >
                                {tc(`status.${s}`)}
                              </p>
                              {isActive && (
                                <p className="text-xs text-[#909090] mt-0.5">
                                  {t("currentStatus")}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dates */}
                    <div className="mt-6 pt-5 border-t border-[#EBEBEB] grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#909090]">{t("submitted")}</p>
                        <p className="font-medium text-black flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5 text-[#00653E]" />
                          {formatDate(result.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#909090]">{t("lastUpdated")}</p>
                        <p className="font-medium text-black flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5 text-[#00653E]" />
                          {formatDate(result.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Illustration (desktop only) */}
          <div className="hidden lg:flex items-start justify-center flex-shrink-0 pt-8">
            <div className="relative">
              <Image
                src="/images/track-illustration.svg"
                alt="Track report illustration"
                width={420}
                height={440}
                className="opacity-90 pointer-events-none select-none"
                priority
              />
              {/* Magnifier accent */}
              <Image
                src="/images/magnifier.png"
                alt=""
                width={90}
                height={90}
                className="absolute -top-4 -start-6 opacity-70 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#EBEBEB] bg-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
          <p className="text-sm text-[#909090]">
            {tc("brand")} &mdash; {tc("footer.tagline")}
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Search,
  Clock,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackReport, eraseReport } from "@/lib/api";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

const STATUS_ORDER = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"] as const;

const statusIcons: Record<string, typeof AlertCircle> = {
  OPEN: AlertCircle,
  UNDER_REVIEW: FileSearch,
  INVESTIGATING: Search,
  CLOSED: CheckCircle2,
};

const statusBadgeColors: Record<string, string> = {
  OPEN: "bg-[#91DBF6] text-[#1F2334]",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  INVESTIGATING: "bg-purple-100 text-purple-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
};

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
  const [showErasureConfirm, setShowErasureConfirm] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [erased, setErased] = useState(false);

  const handleSearch = async () => {
    const id = trackingId.trim();
    if (!id) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setErased(false);

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

  const handleErasure = async () => {
    if (!result) return;
    setErasing(true);
    try {
      await eraseReport(result.tracking_id);
      setErased(true);
      setResult(null);
      setShowErasureConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("erasure.failed"));
      setShowErasureConfirm(false);
    } finally {
      setErasing(false);
    }
  };

  const statusKey = result?.status ?? "";
  const statusIdx = result
    ? STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number])
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ══════════════════════════════════════════
          Header — Dark (matches home page)
         ══════════════════════════════════════════ */}
      <header className="bg-[#01151C] sticky top-0 z-50">
        <div className="max-w-[1660px] mx-auto px-6 lg:px-[150px] h-[80px] md:h-[106px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="22" height="25" viewBox="0 0 22 25" fill="none">
              <path d="M10.8 0L0 4.4V11C0 17.1 4.6 22.8 10.8 24.4C17 22.8 21.6 17.1 21.6 11V4.4L10.8 0Z" fill="white"/>
              <rect x="8" y="8" width="5.6" height="5.6" rx="1" fill="#01151C"/>
            </svg>
            <Link href="/" className="text-white text-2xl font-bold tracking-tight">
              {tc("brand")}
            </Link>
          </div>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-10 text-white text-xl font-[family-name:var(--font-dm)]">
              <Link href="/#how-it-works" className="hover:text-white/80 transition-colors">{tc("nav.about")}</Link>
              <Link href="/#features" className="hover:text-white/80 transition-colors">{tc("nav.features")}</Link>
              <Link href="/#compliance" className="hover:text-white/80 transition-colors">{tc("nav.compliance")}</Link>
              <Link href="/#faq" className="hover:text-white/80 transition-colors">{tc("nav.faq")}</Link>
            </div>
            <LanguageSwitcher />
          </nav>

          {/* Right */}
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/admin/login" className="hidden md:block text-white text-xl font-[family-name:var(--font-dm)] hover:text-white/80 transition-colors">
              {tc("nav.admin")}
            </Link>
            <Link href="/report">
              <Button title="Raise a Concern" className="h-[46px] px-6 md:px-9 bg-[#00653E] hover:bg-[#005232] text-white font-semibold rounded-[4px] shadow-[0_10px_20px_#0D200E] cursor-pointer text-base">
                {tc("nav.raiseConcern")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          Main Content
         ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 lg:py-16">
        {/* Magnifier Illustration — only before result */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Image
              src="/images/magnifier.png"
              alt=""
              width={140}
              height={140}
              className="pointer-events-none select-none"
              aria-hidden="true"
              priority
            />
          </motion.div>
        )}

        {/* Title & Subtitle */}
        <h1 className="text-[32px] md:text-[42px] font-bold text-black text-center leading-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg md:text-xl text-[#909090] text-center max-w-[571px]">
          {t("description")}
        </p>

        {/* Search Input */}
        <div className="flex gap-3 mt-10 w-full max-w-[704px]">
          <Input
            value={trackingId}
            onChange={(e) => {
              setTrackingId(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder={t("placeholder")}
            className="flex-1 font-mono text-center text-lg h-[52px] rounded-[10px] border-[#BEBEBE] bg-white text-black placeholder:text-[#BDBDBD] focus:border-[#00653E] focus:ring-[#00653E]/20"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            title="Track report"
            className="shrink-0 px-8 h-[52px] bg-[#00653E] hover:bg-[#005232] text-white text-xl font-semibold rounded-[4px] cursor-pointer gap-2"
            disabled={loading || !trackingId.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-5 w-5" />
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
              className="mt-6 p-4 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-sm text-center w-full max-w-[704px]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erasure success */}
        <AnimatePresence>
          {erased && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 p-4 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center w-full max-w-[704px]"
            >
              <CheckCircle2 className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
              {t("erasure.success")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result — only after submission */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              className="mt-6 w-full max-w-[704px] space-y-4"
            >
              {/* ── Tracking ID + Status + Dates Card ── */}
              <div className="bg-white rounded-[10px] border border-[#EBEBEB] p-6">
                {/* Top row: ID + Status badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#A9A9A9] uppercase tracking-wide">
                      {t("trackingId")}
                    </p>
                    <p className="text-2xl font-extrabold text-[#00653E] mt-1">
                      {result.tracking_id}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeColors[statusKey] ?? "bg-gray-100 text-gray-700"}`}>
                    {tc(`status.${statusKey}`)}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-[#EBEBEB] mt-5 pt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#A9A9A9]">{t("submitted")}</p>
                    <p className="font-medium text-[#636363] flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-[#636363]" />
                      {formatDate(result.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A9A9A9]">{t("lastUpdated")}</p>
                    <p className="font-medium text-[#636363] flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-[#636363]" />
                      {formatDate(result.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Compliance Deadlines Card ── */}
              {(result.acknowledgment_due || result.feedback_due) && (
                <div className="bg-white rounded-[10px] border border-[#EBEBEB] p-6">
                  <p className="text-xs text-[#A9A9A9] uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("compliance.title")}
                  </p>

                  <div className="space-y-3">
                    {/* 7-day Acknowledgment */}
                    {result.acknowledgment_due && (() => {
                      const now = new Date();
                      const due = new Date(result.acknowledgment_due);
                      const acknowledged = now <= due;
                      return (
                        <div className={`flex items-start gap-3 p-3 rounded-lg ${acknowledged ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${acknowledged ? "text-emerald-600" : "text-amber-600"}`} />
                          <div>
                            <p className={`text-sm font-medium ${acknowledged ? "text-emerald-800" : "text-amber-800"}`}>
                              {t("compliance.acknowledgment")}
                            </p>
                            <p className={`text-xs mt-0.5 ${acknowledged ? "text-emerald-600" : "text-amber-600"}`}>
                              {acknowledged
                                ? t("compliance.acknowledged")
                                : t("compliance.acknowledgmentOverdue")}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 90-day Feedback Deadline */}
                    {result.feedback_due && (() => {
                      const now = new Date();
                      const due = new Date(result.feedback_due);
                      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const feedbackGiven = !!result.feedback_given_at;
                      const overdue = daysLeft < 0 && !feedbackGiven;
                      const warning = daysLeft >= 0 && daysLeft <= 14 && !feedbackGiven;

                      let bgClass = "bg-blue-50 border border-blue-200";
                      let textClass = "text-blue-800";
                      let subClass = "text-blue-600";

                      if (feedbackGiven) {
                        bgClass = "bg-emerald-50 border border-emerald-200";
                        textClass = "text-emerald-800";
                        subClass = "text-emerald-600";
                      } else if (overdue) {
                        bgClass = "bg-red-50 border border-red-200";
                        textClass = "text-red-800";
                        subClass = "text-red-600";
                      } else if (warning) {
                        bgClass = "bg-amber-50 border border-amber-200";
                        textClass = "text-amber-800";
                        subClass = "text-amber-600";
                      }

                      return (
                        <div className={`flex items-start gap-3 p-3 rounded-lg ${bgClass}`}>
                          <CalendarClock className={`h-4 w-4 mt-0.5 shrink-0 ${subClass}`} />
                          <div>
                            <p className={`text-sm font-medium ${textClass}`}>
                              {t("compliance.feedbackDeadline")}
                            </p>
                            <p className={`text-xs mt-0.5 ${subClass}`}>
                              {feedbackGiven
                                ? t("compliance.feedbackProvided")
                                : overdue
                                  ? t("compliance.feedbackOverdue")
                                  : t("compliance.feedbackDue", { date: formatDate(result.feedback_due) })}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ── Status Timeline Card ── */}
              <div className="bg-white rounded-[10px] border border-[#EBEBEB] p-6">
                <div className="space-y-0">
                  {STATUS_ORDER.map((s, i) => {
                    const Icon = statusIcons[s];
                    const isActive = s === result.status;
                    const isPast = i <= statusIdx;
                    const historyEntry = (result.status_history ?? []).find(
                      (e) => e.status === s,
                    );

                    return (
                      <div key={s} className="flex items-start gap-4">
                        {/* Timeline column */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-[26px] w-[26px] rounded-full flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-[#00653E]"
                                : isPast
                                  ? "bg-[#00653E]/60"
                                  : "bg-[#C6C6C6]"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isActive || isPast ? "text-white" : "text-[#636363]"}`} />
                          </div>
                          {i < 3 && (
                            <div className={`w-0.5 h-[38px] ${isPast && i < statusIdx ? "bg-[#00653E]/40" : "bg-[#A1AEBE]"}`} />
                          )}
                        </div>
                        {/* Label + Timestamp */}
                        <div className="pt-0.5">
                          <p
                            className={`text-sm ${
                              isActive
                                ? "text-[#00653E] font-semibold"
                                : isPast
                                  ? "text-[#1F2334] font-medium"
                                  : "text-[#636363]"
                            }`}
                          >
                            {tc(`status.${s}`)}
                          </p>
                          {isActive && (
                            <p className="text-xs text-[#BDBDBD] mt-0.5">
                              {t("currentStatus")}
                              {historyEntry && (
                                <span className="ml-1.5 text-[#909090]">
                                  &middot; {formatDate(historyEntry.at)}
                                </span>
                              )}
                            </p>
                          )}
                          {isPast && !isActive && historyEntry && (
                            <p className="text-xs text-[#BDBDBD] mt-0.5">
                              {formatDate(historyEntry.at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── GDPR Erasure Card ── */}
              <div className="bg-white rounded-[10px] border border-[#EBEBEB] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#A9A9A9] uppercase tracking-wide flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      {t("erasure.title")}
                    </p>
                    <p className="text-xs text-[#909090] mt-1">
                      {t("erasure.gdprNote")}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowErasureConfirm(true)}
                    className="shrink-0 px-4 h-9 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium rounded-[4px] cursor-pointer gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("erasure.button")}
                  </Button>
                </div>

                {/* Confirmation dialog — inline */}
                <AnimatePresence>
                  {showErasureConfirm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          {t("erasure.warning")}
                        </p>
                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={handleErasure}
                            disabled={erasing}
                            className="px-5 h-9 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-[4px] cursor-pointer gap-1.5"
                          >
                            {erasing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {erasing ? t("erasure.erasing") : t("erasure.confirm")}
                          </Button>
                          <Button
                            onClick={() => setShowErasureConfirm(false)}
                            disabled={erasing}
                            className="px-5 h-9 bg-white hover:bg-gray-50 text-[#636363] border border-[#EBEBEB] text-sm font-medium rounded-[4px] cursor-pointer"
                          >
                            {t("erasure.cancel")}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Back to Home */}
              <div className="flex justify-center pt-4">
                <Link href="/">
                  <Button title="Back to Home" className="h-[52px] px-10 bg-[#DBDBDB] hover:bg-[#CFCFCF] text-[#222222] text-xl font-semibold rounded-[4px] cursor-pointer">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════
          Footer — Dark (matches home page)
         ══════════════════════════════════════════ */}
      <footer className="bg-[#01151C]">
        <div className="max-w-[1660px] mx-auto px-6 lg:px-[150px] py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="20" viewBox="0 0 22 25" fill="none">
                  <path d="M10.8 0L0 4.4V11C0 17.1 4.6 22.8 10.8 24.4C17 22.8 21.6 17.1 21.6 11V4.4L10.8 0Z" fill="white"/>
                  <rect x="8" y="8" width="5.6" height="5.6" rx="1" fill="#01151C"/>
                </svg>
                <span className="text-white font-bold text-lg">{tc("brand")}</span>
              </div>
              <p className="text-base text-white/60 leading-relaxed max-w-[340px]">
                {tc("brandTagline")}
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.platform")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><Link href="/report" className="hover:text-white transition-colors">{tc("footer.raiseAConcern")}</Link></li>
                <li><Link href="/track" className="hover:text-white transition-colors">{tc("footer.checkStatus")}</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">{tc("footer.howItWorks")}</Link></li>
                <li><Link href="/#faq" className="hover:text-white transition-colors">{tc("footer.faqs")}</Link></li>
              </ul>
            </div>

            {/* Security */}
            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.security")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><Link href="/#features" className="hover:text-white transition-colors">{tc("footer.encryption")}</Link></li>
                <li><Link href="/#compliance" className="hover:text-white transition-colors">{tc("footer.compliance")}</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors">{tc("footer.architecture")}</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors">{tc("footer.auditTrail")}</Link></li>
              </ul>
            </div>

            {/* Organization */}
            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.organization")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><Link href="/admin/login" className="hover:text-white transition-colors">{tc("footer.adminPortal")}</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.documentation")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.contact")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.privacyPolicy")}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
              <p>&copy; {new Date().getFullYear()} {tc("footer.copyright")}</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">{tc("footer.privacy")}</a>
                <a href="#" className="hover:text-white transition-colors">{tc("footer.terms")}</a>
                <a href="#" className="hover:text-white transition-colors">{tc("footer.securityLink")}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

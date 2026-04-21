"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trackReport } from "@/lib/api";

const STATUS_ORDER = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"] as const;

const statusConfig: Record<
  string,
  { label: string; icon: typeof AlertCircle; color: string }
> = {
  OPEN: {
    label: "Open",
    icon: AlertCircle,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    icon: FileSearch,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  INVESTIGATING: {
    label: "Investigating",
    icon: Search,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  CLOSED: {
    label: "Closed",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
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
        setError(res.error ?? "Report not found.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to find that report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const status = result ? statusConfig[result.status] : null;
  const statusIdx = result
    ? STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number])
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
          </Link>
          <Link href="/report">
            <Button size="sm">New Report</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-16">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Track Your Report</h1>
          <p className="text-muted-foreground">
            Enter your tracking ID to check the current status of your report.
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 group">
            <div className="absolute -inset-px rounded-xl bg-linear-to-r from-primary/40 via-primary/20 to-primary/40 opacity-60 group-focus-within:opacity-100 blur-[2px] transition-opacity" />
            <Input
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="SS-2026-XXXX"
              className="relative font-mono text-center text-lg h-14 rounded-xl border-primary/30 bg-background focus:border-primary focus:ring-primary/20"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSearch}
            className="shrink-0 px-8 h-14 rounded-xl text-base font-semibold shadow-[0_0_15px_rgba(120,200,140,0.25)] hover:shadow-[0_0_25px_rgba(120,200,140,0.4)] transition-shadow"
            disabled={loading || !trackingId.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Track
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
              className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && status && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            >
              <Card className="border-primary/20 shadow-[0_0_20px_rgba(120,200,140,0.1)]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Tracking ID
                      </p>
                      <p className="text-lg font-mono font-bold">
                        {result.tracking_id}
                      </p>
                    </div>
                    <Badge className={status.color + " border"}>
                      <status.icon className="h-3.5 w-3.5 mr-1.5" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-4">
                    {STATUS_ORDER.map((s, i) => {
                      const cfg = statusConfig[s];
                      const isActive = s === result.status;
                      const isPast = i <= statusIdx;

                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isPast
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <cfg.icon className="h-4 w-4" />
                            </div>
                            {i < 3 && (
                              <div
                                className={`w-0.5 h-6 mt-1 ${isPast ? "bg-primary/30" : "bg-muted"}`}
                              />
                            )}
                          </div>
                          <div className="pt-1">
                            <p
                              className={`text-sm font-medium ${
                                isActive
                                  ? "text-foreground"
                                  : isPast
                                    ? "text-foreground/70"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {cfg.label}
                            </p>
                            {isActive && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Current status
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(result.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(result.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

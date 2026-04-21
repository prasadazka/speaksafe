"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Search, Clock, CheckCircle2, AlertCircle, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  OPEN: { label: "Open", icon: AlertCircle, color: "bg-blue-100 text-blue-700 border-blue-200" },
  UNDER_REVIEW: { label: "Under Review", icon: FileSearch, color: "bg-amber-100 text-amber-700 border-amber-200" },
  INVESTIGATING: { label: "Investigating", icon: Search, color: "bg-purple-100 text-purple-700 border-purple-200" },
  CLOSED: { label: "Closed", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [searched, setSearched] = useState(false);

  // Sample result
  const result = {
    trackingId: "SS-2026-4821",
    status: "INVESTIGATING" as const,
    createdAt: "2026-04-18T09:15:00Z",
    updatedAt: "2026-04-21T14:30:00Z",
  };

  const status = statusConfig[result.status];

  const handleSearch = () => {
    if (trackingId.trim().length > 0) {
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
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

        <div className="flex gap-2 mb-8">
          <Input
            value={trackingId}
            onChange={(e) => { setTrackingId(e.target.value); setSearched(false); }}
            placeholder="SS-2026-XXXX"
            className="font-mono text-center text-lg h-12"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} size="lg" className="shrink-0 px-6">
            Track
          </Button>
        </div>

        {searched && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tracking ID</p>
                  <p className="text-lg font-mono font-bold">{result.trackingId}</p>
                </div>
                <Badge className={status.color + " border"}>
                  <status.icon className="h-3.5 w-3.5 mr-1.5" />
                  {status.label}
                </Badge>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                {(["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"] as const).map((s, i) => {
                  const cfg = statusConfig[s];
                  const isActive = s === result.status;
                  const isPast = ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"].indexOf(s) <=
                    ["OPEN", "UNDER_REVIEW", "INVESTIGATING", "CLOSED"].indexOf(result.status);

                  return (
                    <div key={s} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          isActive ? "bg-primary text-primary-foreground" :
                          isPast ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          <cfg.icon className="h-4 w-4" />
                        </div>
                        {i < 3 && (
                          <div className={`w-0.5 h-6 mt-1 ${isPast ? "bg-primary/30" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isActive ? "text-foreground" : isPast ? "text-foreground/70" : "text-muted-foreground"}`}>
                          {cfg.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">Current status</p>
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
                    {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(result.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

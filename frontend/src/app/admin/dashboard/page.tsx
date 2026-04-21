"use client";

import Link from "next/link";
import {
  Shield, FileText, AlertTriangle, Clock, CheckCircle2, Search,
  BarChart3, TrendingUp, Users, LogOut, Bell, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sampleReports, sampleStats, sampleAuditLogs } from "@/lib/sample-data";

const severityColor: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
};

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  INVESTIGATING: "bg-purple-100 text-purple-700 border-purple-200",
  CLOSED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  INVESTIGATING: "Investigating",
  CLOSED: "Closed",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const s = sampleStats;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">SpeakSafe</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-foreground font-medium">Dashboard</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">Cases</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">Audit Log</Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">3</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">AU</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">Admin User</span>
            </div>
            <Button variant="ghost" size="sm"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Reports", value: s.totalReports, icon: FileText, trend: `+${s.thisMonthNew} this month` },
            { label: "Open Cases", value: s.openCases, icon: AlertTriangle, trend: `${s.criticalCount} critical` },
            { label: "Under Investigation", value: s.investigating, icon: Search, trend: `${s.underReview} in review` },
            { label: "Avg Resolution", value: `${s.avgResolutionDays}d`, icon: Clock, trend: "Target: 21 days" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {stat.trend}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reports Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Recent Reports
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search..." className="pl-9 h-8 w-40 text-sm" />
                    </div>
                    <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5 mr-1.5" /> Filter</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">ID</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Category</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Severity</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleReports.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/admin/cases/${r.id}`} className="font-mono font-medium text-primary hover:underline">
                              {r.trackingId}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{r.category.replace("_", " ")}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={severityColor[r.severity] + " border text-xs"}>
                              {r.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={statusColor[r.status] + " border text-xs"}>
                              {statusLabel[r.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              {r.evidenceCount > 0 && <span title="Evidence">📎 {r.evidenceCount}</span>}
                              {r.notesCount > 0 && <span title="Notes">💬 {r.notesCount}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Open", count: s.openCases, total: s.totalReports, color: "bg-blue-500" },
                  { label: "Under Review", count: s.underReview, total: s.totalReports, color: "bg-amber-500" },
                  { label: "Investigating", count: s.investigating, total: s.totalReports, color: "bg-purple-500" },
                  { label: "Closed", count: s.closed, total: s.totalReports, color: "bg-emerald-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${(item.count / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{log.actorEmail || "Anonymous"}</span>
                        {" "}
                        <span className="text-muted-foreground">{log.action.replace(/_/g, " ").toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

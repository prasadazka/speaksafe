"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  getReports,
  getAuditLogs,
  type ReportListItem,
  type AuditLogItem,
  type ReportStatus,
  type PaginationMeta,
} from "@/lib/admin-api";
import { useTranslations } from "next-intl";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLIANCE_OFFICER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  VIEWER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function DashboardPage() {
  const { user, token, isLoading, logout, hasRole } = useAuth();
  const router = useRouter();
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);

  /* Auth guard */
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isLoading, router]);

  /* Fetch reports */
  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const filters: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (statusFilter) filters.status = statusFilter;
      const res = await getReports(token, filters);
      if (res.success && res.data) {
        setReports(res.data as ReportListItem[]);
        setMeta((res.meta as unknown as PaginationMeta) ?? null);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoadingReports(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* Fetch audit logs (ADMIN + COMPLIANCE_OFFICER only) */
  useEffect(() => {
    if (!token || !hasRole("ADMIN", "COMPLIANCE_OFFICER")) {
      setLoadingAudit(false);
      return;
    }
    setLoadingAudit(true);
    getAuditLogs(token, { limit: 10 })
      .then((res) => {
        if (res.success && res.data) {
          setAuditLogs(res.data as AuditLogItem[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAudit(false));
  }, [token, hasRole]);

  /* Compute stats from fetched data */
  const total = meta?.total ?? reports.length;
  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const criticalCount = reports.filter((r) => r.severity === "CRITICAL").length;
  const investigatingCount = reports.filter(
    (r) => r.status === "INVESTIGATING",
  ).length;
  const underReviewCount = reports.filter(
    (r) => r.status === "UNDER_REVIEW",
  ).length;
  const closedCount = reports.filter((r) => r.status === "CLOSED").length;

  /* Client-side search filter */
  const filteredReports = searchQuery
    ? reports.filter((r) =>
        r.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : reports;

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">{tc("brand")}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground font-medium"
              >
                {t("dashboard.title")}
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`${roleBadgeColor[user.role]} border text-xs`}
            >
              {tc(`roles.${user.role}`)}
            </Badge>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {user.full_name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: t("dashboard.stats.totalReports"),
              value: total,
              icon: FileText,
              trend: t("dashboard.stats.active", {
                count: openCount + investigatingCount + underReviewCount,
              }),
            },
            {
              label: t("dashboard.stats.openCases"),
              value: openCount,
              icon: AlertTriangle,
              trend: t("dashboard.stats.critical", { count: criticalCount }),
            },
            {
              label: t("dashboard.stats.underInvestigation"),
              value: investigatingCount,
              icon: Search,
              trend: t("dashboard.stats.inReview", { count: underReviewCount }),
            },
            {
              label: t("dashboard.stats.closed"),
              value: closedCount,
              icon: CheckCircle2,
              trend: t("dashboard.stats.ofTotal", { total }),
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {t("dashboard.reports")}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t("dashboard.searchId")}
                        className="pl-9 h-8 w-36 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter by status"
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(
                          e.target.value as ReportStatus | "",
                        );
                        setPage(1);
                      }}
                    >
                      <option value="">{t("dashboard.allStatus")}</option>
                      <option value="OPEN">{tc("status.OPEN")}</option>
                      <option value="UNDER_REVIEW">{tc("status.UNDER_REVIEW")}</option>
                      <option value="INVESTIGATING">{tc("status.INVESTIGATING")}</option>
                      <option value="CLOSED">{tc("status.CLOSED")}</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {t("dashboard.noReportsFound")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                            ID
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                            Category
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                            Severity
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                            Status
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                            Date
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-10">
                            <span className="sr-only">Attachments</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((r) => (
                          <tr
                            key={r.id}
                            className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(`/admin/cases/${r.id}`)
                            }
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono font-medium text-primary">
                                {r.tracking_id}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {r.category.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={
                                  severityColor[r.severity] +
                                  " border text-xs"
                                }
                              >
                                {tc(`severity.${r.severity}`)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={
                                  statusColor[r.status] +
                                  " border text-xs"
                                }
                              >
                                {tc(`status.${r.status}`)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(r.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                {r.evidence_count > 0 && (
                                  <span title="Evidence">
                                    <FileText className="h-3 w-3 inline mr-0.5" />
                                    {r.evidence_count}
                                  </span>
                                )}
                                {r.notes_count > 0 && (
                                  <span title="Notes">
                                    <MessageSquare className="h-3 w-3 inline mr-0.5" />
                                    {r.notes_count}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {meta && totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.page", {
                        page,
                        totalPages,
                        total: meta.total,
                      })}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> {t("dashboard.statusBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: tc("status.OPEN"),
                    count: openCount,
                    total: reports.length || 1,
                    color: "bg-blue-500",
                  },
                  {
                    label: tc("status.UNDER_REVIEW"),
                    count: underReviewCount,
                    total: reports.length || 1,
                    color: "bg-amber-500",
                  },
                  {
                    label: tc("status.INVESTIGATING"),
                    count: investigatingCount,
                    total: reports.length || 1,
                    color: "bg-purple-500",
                  },
                  {
                    label: tc("status.CLOSED"),
                    count: closedCount,
                    total: reports.length || 1,
                    color: "bg-emerald-500",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${(item.count / item.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity — only for ADMIN & COMPLIANCE_OFFICER */}
            {hasRole("ADMIN", "COMPLIANCE_OFFICER") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {t("dashboard.recentActivity")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingAudit ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("dashboard.noActivity")}
                    </p>
                  ) : (
                    auditLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">
                              {log.actor_email || "System"}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {log.action.replace(/_/g, " ").toLowerCase()}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

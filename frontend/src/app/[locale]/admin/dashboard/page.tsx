"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
  Download,
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
import { AdminHeader } from "@/components/admin/admin-header";
import { useAuth } from "@/contexts/auth-context";
import {
  getReports,
  getAuditLogs,
  getComplianceStats,
  exportReportsCSV,
  exportReportsPDF,
  type ReportListItem,
  type AuditLogItem,
  type ReportStatus,
  type PaginationMeta,
  type ComplianceStats,
} from "@/lib/admin-api";
import { useTranslations } from "next-intl";

const severityColor: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
};

const sentimentColor: Record<string, string> = {
  FEAR_THREAT: "bg-red-100 text-red-700 border-red-200",
  DISTRESS: "bg-rose-100 text-rose-700 border-rose-200",
  ANGER: "bg-orange-100 text-orange-700 border-orange-200",
  DESPERATION: "bg-amber-100 text-amber-700 border-amber-200",
  CONCERN: "bg-sky-100 text-sky-700 border-sky-200",
  NEUTRAL: "bg-gray-100 text-gray-600 border-gray-200",
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



/* ── Stat card illustration mapping ── */
const STAT_CARDS = [
  { illustration: "/images/admin/card-report.png", icon: FileText },
  { illustration: "/images/admin/card-case.png", icon: AlertTriangle },
  { illustration: "/images/admin/card-investigate.png", icon: Search },
  { illustration: "/images/admin/card-closed.png", icon: CheckCircle2 },
];

export default function DashboardPage() {
  const { user, token, isLoading, hasRole } = useAuth();
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
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  /* Export handler — uses current filters */
  const handleExport = async (format: "csv" | "pdf") => {
    if (!token) return;
    setExporting(format);
    setShowExportMenu(false);
    try {
      const filters = {
        ...(statusFilter ? { status: statusFilter as ReportStatus } : {}),
      };
      if (format === "csv") {
        await exportReportsCSV(token, filters);
      } else {
        await exportReportsPDF(token, filters);
      }
    } catch {
      /* export error handled silently */
    } finally {
      setExporting(null);
    }
  };

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

  /* Fetch compliance deadline stats */
  useEffect(() => {
    if (!token) return;
    getComplianceStats(token)
      .then((res) => {
        if (res.success && res.data) {
          setComplianceStats(res.data as ComplianceStats);
        }
      })
      .catch(() => {});
  }, [token]);

  /* Auto-refresh reports when a WS notification arrives */
  useEffect(() => {
    const handler = () => fetchReports();
    window.addEventListener("sawtsafe:ws-event", handler);
    return () => window.removeEventListener("sawtsafe:ws-event", handler);
  }, [fetchReports]);

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

  /* Stats data */
  const stats = [
    {
      label: t("dashboard.stats.totalReports"),
      value: total,
      trend: t("dashboard.stats.active", {
        count: openCount + investigatingCount + underReviewCount,
      }),
    },
    {
      label: t("dashboard.stats.openCases"),
      value: openCount,
      trend: t("dashboard.stats.critical", { count: criticalCount }),
    },
    {
      label: t("dashboard.stats.underInvestigation"),
      value: investigatingCount,
      trend: t("dashboard.stats.inReview", { count: underReviewCount }),
    },
    {
      label: t("dashboard.stats.closed"),
      value: closedCount,
      trend: t("dashboard.stats.ofTotal", { total }),
    },
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FDFB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9B9B9B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
      {/* ── Top Navbar ── */}
      <AdminHeader title={t("dashboard.title")} />

      <main className="flex-1 mx-auto w-full px-4 lg:px-12 py-6 max-w-[1920px]">
        {/* ── Stats Row — Figma: 4 cards, 440px each, 199px tall ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-8">
          {stats.map((stat, i) => {
            const cardMeta = STAT_CARDS[i];
            return (
              <div
                key={stat.label}
                className="relative overflow-hidden bg-white border border-[#EBEBEB] rounded-[10px] shadow-[0_4px_15px_rgba(110,110,110,0.1)] p-5 lg:p-6 min-h-[160px] lg:min-h-[199px]"
              >
                {/* Text content */}
                <p className="text-sm lg:text-lg text-[#9B9B9B]">
                  {stat.label}
                </p>
                <p className="text-4xl lg:text-[56px] font-bold text-black mt-1 lg:mt-2 leading-tight">
                  {stat.value}
                </p>
                <p className="text-xs lg:text-base font-semibold text-[#27693F] mt-2 lg:mt-3 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                  {stat.trend}
                </p>

                {/* 3D illustration — positioned right, overlapping card edge */}
                <Image
                  src={cardMeta.illustration}
                  alt=""
                  width={120}
                  height={160}
                  className="absolute -bottom-2 end-0 w-[80px] lg:w-[120px] h-auto opacity-90 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>

        {/* ── Compliance Deadline Alerts ── */}
        {complianceStats && (complianceStats.acknowledgment_overdue > 0 || complianceStats.feedback_overdue > 0 || complianceStats.feedback_warning > 0) && (
          <div className="mb-6 space-y-2">
            {complianceStats.acknowledgment_overdue > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">{complianceStats.acknowledgment_overdue}</span>{" "}
                  {t("dashboard.compliance.ackOverdue")}
                </p>
              </div>
            )}
            {complianceStats.feedback_overdue > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">{complianceStats.feedback_overdue}</span>{" "}
                  {t("dashboard.compliance.fbOverdue")}
                </p>
              </div>
            )}
            {complianceStats.feedback_warning > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{complianceStats.feedback_warning}</span>{" "}
                  {t("dashboard.compliance.fbWarning")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Reports + Sidebar — Same design as before per Figma note ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reports Table */}
          <div className="lg:col-span-2">
            <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
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
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm cursor-pointer"
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
                    {/* Export dropdown */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 cursor-pointer"
                        disabled={exporting !== null}
                        onClick={() => setShowExportMenu((v) => !v)}
                      >
                        {exporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {t("dashboard.export.label")}
                      </Button>
                      {showExportMenu && (
                        <div className="absolute end-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border bg-background shadow-md py-1">
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-sm text-start hover:bg-accent cursor-pointer"
                            onClick={() => handleExport("csv")}
                          >
                            {t("dashboard.export.csv")}
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-sm text-start hover:bg-accent cursor-pointer"
                            onClick={() => handleExport("pdf")}
                          >
                            {t("dashboard.export.pdf")}
                          </button>
                        </div>
                      )}
                    </div>
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
                            Sentiment
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
                              {r.sentiment ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    (sentimentColor[r.sentiment.tone] ?? "bg-gray-100 text-gray-600 border-gray-200") +
                                    " border text-xs"
                                  }
                                  title={r.sentiment.summary}
                                >
                                  {tc(`sentiment.${r.sentiment.tone}`)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={
                                    statusColor[r.status] +
                                    " border text-xs"
                                  }
                                >
                                  {tc(`status.${r.status || "OPEN"}`)}
                                </Badge>
                                {r.resolution_type && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      "border text-[10px] " + (
                                        r.resolution_type === "SUBSTANTIATED" ? "bg-red-50 text-red-600 border-red-200" :
                                        r.resolution_type === "UNSUBSTANTIATED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                        r.resolution_type === "INCONCLUSIVE" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                        "bg-blue-50 text-blue-600 border-blue-200"
                                      )
                                    }
                                  >
                                    {tc(`resolution.${r.resolution_type}`)}
                                  </Badge>
                                )}
                              </div>
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
                        title="Previous page"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Next page"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="cursor-pointer"
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
            <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
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
              <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
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

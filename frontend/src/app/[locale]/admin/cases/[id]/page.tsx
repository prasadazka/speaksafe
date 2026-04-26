"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Paperclip,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  Trash2,
  History,
  Globe,
  ArrowRight,
  Plus,
  ShieldAlert,
  Trash,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusChangeDialog } from "@/components/admin/status-change-dialog";
import { useAuth } from "@/contexts/auth-context";
import {
  getReport,
  getNotes,
  addNote,
  updateReportStatus,
  updateReportSeverity,
  deleteReport,
  getCaseTimeline,
  getAccessLog,
  type ReportDetail,
  type NoteItem,
  type ReportStatus,
  type Severity,
  type ResolutionType,
  type AuditLogItem,
  type AuditAction,
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Timeline event icon + color mapping */
const timelineConfig: Record<
  string,
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  REPORT_CREATED: { icon: Plus, color: "text-blue-600", bgColor: "bg-blue-100" },
  REPORT_STATUS_UPDATED: { icon: ArrowRight, color: "text-amber-600", bgColor: "bg-amber-100" },
  REPORT_SEVERITY_UPDATED: { icon: ShieldAlert, color: "text-orange-600", bgColor: "bg-orange-100" },
  REPORT_DELETED: { icon: Trash, color: "text-red-600", bgColor: "bg-red-100" },
  NOTE_ADDED: { icon: MessageSquare, color: "text-[#00653E]", bgColor: "bg-emerald-100" },
  EVIDENCE_UPLOADED: { icon: Paperclip, color: "text-purple-600", bgColor: "bg-purple-100" },
  EVIDENCE_DELETED: { icon: Trash, color: "text-red-600", bgColor: "bg-red-100" },
  REPORT_VIEWED: { icon: Eye, color: "text-cyan-600", bgColor: "bg-cyan-100" },
};

export default function CaseDetailPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const { user, token, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [timeline, setTimeline] = useState<AuditLogItem[]>([]);
  const [accessLog, setAccessLog] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingSeverity, setUpdatingSeverity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Confirmation dialog state */
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    type: "status" | "severity";
    current: string;
    next: string;
  }>({ open: false, type: "status", current: "", next: "" });

  /* Auth guard */
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isLoading, router]);

  /* Fetch report detail (initial load only) */
  useEffect(() => {
    if (!token || !reportId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getReport(token, reportId);
        if (cancelled) return;
        if (res.success && res.data) {
          setReport(res.data as ReportDetail);
        } else {
          setError(t("caseDetail.reportNotFound"));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("caseDetail.failedToLoad"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, reportId, t]);

  /* Silent refresh — updates report data without showing the full-page spinner */
  const refreshReport = useCallback(async () => {
    if (!token || !reportId) return;
    try {
      const res = await getReport(token, reportId);
      if (res.success && res.data) {
        setReport(res.data as ReportDetail);
      }
    } catch {
      /* silent */
    }
  }, [token, reportId]);

  /* Fetch notes */
  const fetchNotes = useCallback(async () => {
    if (!token || !reportId) return;
    try {
      const res = await getNotes(token, reportId);
      if (res.success && res.data) {
        setNotes(res.data as NoteItem[]);
      }
    } catch {
      /* ignore */
    }
  }, [token, reportId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /* Fetch timeline */
  const fetchTimeline = useCallback(async () => {
    if (!token || !reportId) return;
    setTimelineLoading(true);
    try {
      const res = await getCaseTimeline(token, reportId);
      if (res.success && res.data) {
        setTimeline(res.data as AuditLogItem[]);
      }
    } catch {
      /* ignore */
    } finally {
      setTimelineLoading(false);
    }
  }, [token, reportId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  /* Fetch access log (ADMIN + COMPLIANCE_OFFICER only) */
  const fetchAccessLog = useCallback(async () => {
    if (!token || !reportId || !hasRole("ADMIN", "COMPLIANCE_OFFICER")) return;
    try {
      const res = await getAccessLog(token, reportId);
      if (res.success && res.data) {
        setAccessLog(res.data as AuditLogItem[]);
      }
    } catch {
      /* ignore */
    }
  }, [token, reportId, hasRole]);

  useEffect(() => {
    fetchAccessLog();
  }, [fetchAccessLog]);

  /* Actions with confirmation */
  const openStatusConfirm = (newStatus: ReportStatus) => {
    if (!report || report.status === newStatus) return;
    setStatusDialog({ open: true, type: "status", current: report.status, next: newStatus });
  };

  const openSeverityConfirm = (newSeverity: Severity) => {
    if (!report || report.severity === newSeverity) return;
    setStatusDialog({ open: true, type: "severity", current: report.severity, next: newSeverity });
  };

  const handleConfirmedChange = async (resolutionType?: ResolutionType) => {
    if (!token || !reportId) return;
    if (statusDialog.type === "status") {
      setUpdatingStatus(true);
      try {
        const res = await updateReportStatus(
          token, reportId, statusDialog.next as ReportStatus, resolutionType,
        );
        if (res.success && res.data) {
          setReport(res.data as ReportDetail);
          await fetchTimeline();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("caseDetail.failedToUpdate"));
      } finally {
        setUpdatingStatus(false);
      }
    } else {
      setUpdatingSeverity(true);
      try {
        const res = await updateReportSeverity(token, reportId, statusDialog.next as Severity);
        if (res.success && res.data) {
          setReport(res.data as ReportDetail);
          await fetchTimeline();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("caseDetail.failedToUpdateSeverity"));
      } finally {
        setUpdatingSeverity(false);
      }
    }
  };

  const handleAddNote = async () => {
    if (!token || !reportId || !noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await addNote(token, reportId, noteContent.trim());
      if (res.success) {
        setNoteContent("");
        await fetchNotes();
        await refreshReport();
        await fetchTimeline();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("caseDetail.failedToAddNote"));
    } finally {
      setAddingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !reportId) return;
    setDeleting(true);
    try {
      await deleteReport(token, reportId);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("caseDetail.failedToDelete"));
      setDeleting(false);
    }
  };

  /* Timeline event description */
  function getTimelineDescription(entry: AuditLogItem): string {
    const meta = entry.metadata_ ?? {};
    const action = entry.action as AuditAction;
    switch (action) {
      case "REPORT_CREATED":
        return t("timeline.reportCreated");
      case "REPORT_STATUS_UPDATED":
        return t("timeline.statusChanged", {
          from: tc(`status.${meta.old ?? "OPEN"}`),
          to: tc(`status.${meta.new ?? "OPEN"}`),
        });
      case "REPORT_SEVERITY_UPDATED":
        return t("timeline.severityChanged", {
          from: tc(`severity.${meta.old ?? "LOW"}`),
          to: tc(`severity.${meta.new ?? "LOW"}`),
        });
      case "REPORT_DELETED":
        return t("timeline.reportDeleted");
      case "NOTE_ADDED":
        return t("timeline.noteAdded");
      case "EVIDENCE_UPLOADED":
        return t("timeline.evidenceUploaded");
      case "EVIDENCE_DELETED":
        return t("timeline.evidenceDeleted");
      case "REPORT_VIEWED":
        return t("timeline.reportViewed", {
          name: entry.actor_email ?? "",
        });
      default:
        return action.replace(/_/g, " ");
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FDFB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9B9B9B]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
        <AdminHeader title={t("caseDetail.caseDetails")} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[#9B9B9B]" />
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
        <AdminHeader title={t("caseDetail.caseDetails")} />
        <div className="text-center py-24">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            variant="outline"
            title={t("caseDetail.backToDashboard")}
            onClick={() => router.push("/admin/dashboard")}
            className="border-[#EBEBEB] text-[#636363] cursor-pointer"
          >
            {t("caseDetail.backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
      <AdminHeader title={report.tracking_id} />

      <main className="flex-1 mx-auto w-full px-4 lg:px-12 py-6 max-w-[1920px]">
        {/* Back to dashboard */}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#636363] hover:text-[#00653E] transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("caseDetail.backToDashboard")}
        </Link>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
            <button
              className="ms-2 underline cursor-pointer"
              title={t("caseDetail.dismiss")}
              onClick={() => setError(null)}
            >
              {t("caseDetail.dismiss")}
            </button>
          </div>
        )}

        {/* Case Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-black">
                {report.tracking_id}
              </h1>
              <Badge
                variant="outline"
                className={severityColor[report.severity] + " border"}
              >
                {tc(`severity.${report.severity}`)}
              </Badge>
              <Badge
                variant="outline"
                className={statusColor[report.status] + " border"}
              >
                {tc(`status.${report.status}`)}
              </Badge>
              {report.resolution_type && (
                <Badge
                  variant="outline"
                  className={
                    report.resolution_type === "SUBSTANTIATED" ? "bg-red-50 text-red-700 border-red-200" :
                    report.resolution_type === "UNSUBSTANTIATED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    report.resolution_type === "INCONCLUSIVE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }
                >
                  {tc(`resolution.${report.resolution_type}`)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-[#909090] flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {report.category.replace(/_/g, " ")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDateTime(report.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                {t("caseDetail.files", { count: report.evidence_count })}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("caseDetail.notesCount", { count: report.notes_count })}
              </span>
            </div>
          </div>

          {/* Status & Severity dropdowns with confirmation */}
          {!hasRole("VIEWER") && (
            <div className="flex gap-2">
              <div className="relative">
                <label className="block text-[10px] font-medium text-[#909090] mb-1 uppercase tracking-wider">
                  {t("caseDetail.statusLabel")}
                </label>
                <select
                  aria-label={t("caseDetail.changeStatus")}
                  className="h-9 rounded-lg border border-[#EBEBEB] bg-white px-3 pe-8 text-sm text-[#636363] cursor-pointer focus:ring-2 focus:ring-[#00653E]/20 focus:border-[#00653E] outline-none transition-colors"
                  value={report.status}
                  disabled={updatingStatus}
                  onChange={(e) => openStatusConfirm(e.target.value as ReportStatus)}
                >
                  <option value="OPEN">{tc("status.OPEN")}</option>
                  <option value="UNDER_REVIEW">{tc("status.UNDER_REVIEW")}</option>
                  <option value="INVESTIGATING">{tc("status.INVESTIGATING")}</option>
                  <option value="CLOSED">{tc("status.CLOSED")}</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-[10px] font-medium text-[#909090] mb-1 uppercase tracking-wider">
                  {t("caseDetail.severityLabel")}
                </label>
                <select
                  aria-label={t("caseDetail.changeSeverity")}
                  className="h-9 rounded-lg border border-[#EBEBEB] bg-white px-3 pe-8 text-sm text-[#636363] cursor-pointer focus:ring-2 focus:ring-[#00653E]/20 focus:border-[#00653E] outline-none transition-colors"
                  value={report.severity}
                  disabled={updatingSeverity}
                  onChange={(e) => openSeverityConfirm(e.target.value as Severity)}
                >
                  <option value="LOW">{tc("severity.LOW")}</option>
                  <option value="MEDIUM">{tc("severity.MEDIUM")}</option>
                  <option value="HIGH">{tc("severity.HIGH")}</option>
                  <option value="CRITICAL">{tc("severity.CRITICAL")}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-black">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  {t("caseDetail.reportDescription")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#636363]">
                  {report.description}
                </p>
                {report.location && (
                  <p className="text-xs text-[#909090] mt-3">
                    {t("caseDetail.location", { location: report.location })}
                  </p>
                )}
                {report.occurred_at && (
                  <p className="text-xs text-[#909090] mt-1">
                    {t("caseDetail.occurred", {
                      date: new Date(report.occurred_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                    })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Notes, Evidence, Timeline */}
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">
                  {t("caseDetail.notes", { count: notes.length })}
                </TabsTrigger>
                <TabsTrigger value="evidence">
                  {t("caseDetail.evidence", { count: report.evidence_count })}
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <History className="h-3.5 w-3.5 me-1.5" />
                  {t("timeline.title")}
                </TabsTrigger>
                {hasRole("ADMIN", "COMPLIANCE_OFFICER") && (
                  <TabsTrigger value="access-log">
                    <Eye className="h-3.5 w-3.5 me-1.5" />
                    {t("accessLog.title")}
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Notes tab */}
              <TabsContent value="notes" className="mt-4 space-y-4">
                {!hasRole("VIEWER") && (
                  <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#00653E] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-normal text-white">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <Textarea
                            placeholder={t("caseDetail.addNotePlaceholder")}
                            rows={2}
                            className="resize-none mb-2 border-[#EBEBEB] text-[#636363] placeholder:text-[#BEBEBE]"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            disabled={addingNote}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              title={t("caseDetail.addNote")}
                              onClick={handleAddNote}
                              disabled={addingNote || !noteContent.trim()}
                              className="bg-[#00653E] hover:bg-[#005232] text-white cursor-pointer"
                            >
                              {addingNote ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                              ) : (
                                <Send className="h-3.5 w-3.5 me-1.5" />
                              )}
                              {t("caseDetail.addNote")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {notes.length === 0 ? (
                  <p className="text-sm text-[#909090] text-center py-6">
                    {t("caseDetail.noNotes")}
                  </p>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id} className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-[#636363]">
                              {getInitials(note.author_name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-black">
                                {note.author_name}
                              </span>
                              <span className="text-xs text-[#909090]">
                                {formatDateTime(note.created_at)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-[#636363]">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Evidence tab */}
              <TabsContent value="evidence" className="mt-4">
                <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                  <CardContent className="py-8 text-center text-sm text-[#909090]">
                    {report.evidence_count > 0 ? (
                      <p>
                        {t("caseDetail.evidenceAttached", { count: report.evidence_count })}
                      </p>
                    ) : (
                      <p>{t("caseDetail.noEvidence")}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline tab */}
              <TabsContent value="timeline" className="mt-4">
                <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-black">
                      <History className="h-4 w-4 text-[#00653E]" />
                      {t("timeline.activityLog")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timelineLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-[#9B9B9B]" />
                      </div>
                    ) : timeline.length === 0 ? (
                      <p className="text-sm text-[#909090] text-center py-6">
                        {t("timeline.noActivity")}
                      </p>
                    ) : (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute start-[18px] top-0 bottom-0 w-px bg-[#EBEBEB]" />

                        <div className="space-y-0">
                          {timeline.map((entry, idx) => {
                            const config = timelineConfig[entry.action] ?? {
                              icon: History,
                              color: "text-[#636363]",
                              bgColor: "bg-[#F5F5F5]",
                            };
                            const Icon = config.icon;
                            const isLast = idx === timeline.length - 1;

                            return (
                              <div
                                key={entry.id}
                                className={`relative flex gap-4 ${isLast ? "" : "pb-6"}`}
                              >
                                {/* Icon dot */}
                                <div
                                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                                >
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                  <p className="text-sm font-medium text-black">
                                    {getTimelineDescription(entry)}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    {entry.actor_email && (
                                      <span className="text-xs text-[#636363]">
                                        {entry.actor_email}
                                      </span>
                                    )}
                                    <span className="text-xs text-[#909090]">
                                      {formatFullDateTime(entry.created_at)}
                                    </span>
                                    {entry.ip_address && (
                                      <span className="inline-flex items-center gap-1 text-xs text-[#909090]">
                                        <Globe className="h-3 w-3" />
                                        {entry.ip_address}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status/severity change badges */}
                                  {(entry.action === "REPORT_STATUS_UPDATED" ||
                                    entry.action === "REPORT_SEVERITY_UPDATED") &&
                                    entry.metadata_ && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                            entry.action === "REPORT_STATUS_UPDATED"
                                              ? statusColor[String(entry.metadata_.old)] ?? ""
                                              : severityColor[String(entry.metadata_.old)] ?? ""
                                          }`}
                                        >
                                          {entry.action === "REPORT_STATUS_UPDATED"
                                            ? tc(`status.${entry.metadata_.old}`)
                                            : tc(`severity.${entry.metadata_.old}`)}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-[#909090]" />
                                        <span
                                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                            entry.action === "REPORT_STATUS_UPDATED"
                                              ? statusColor[String(entry.metadata_.new)] ?? ""
                                              : severityColor[String(entry.metadata_.new)] ?? ""
                                          }`}
                                        >
                                          {entry.action === "REPORT_STATUS_UPDATED"
                                            ? tc(`status.${entry.metadata_.new}`)
                                            : tc(`severity.${entry.metadata_.new}`)}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Access Log tab — ADMIN + COMPLIANCE_OFFICER only */}
              {hasRole("ADMIN", "COMPLIANCE_OFFICER") && (
                <TabsContent value="access-log" className="mt-4">
                  <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-black">
                        <Eye className="h-4 w-4 text-cyan-600" />
                        {t("accessLog.subtitle")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {accessLog.length === 0 ? (
                        <p className="text-sm text-[#909090] text-center py-6">
                          {t("accessLog.noAccess")}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {accessLog.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start gap-3 pb-3 border-b border-[#F5F5F5] last:border-0 last:pb-0"
                            >
                              <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                                <Eye className="h-3.5 w-3.5 text-cyan-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-black">
                                  <span className="font-medium">
                                    {entry.actor_email ?? t("accessLog.system")}
                                  </span>
                                  {" "}
                                  <span className="text-[#909090]">
                                    {t("accessLog.viewedReport")}
                                  </span>
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  <span className="text-xs text-[#909090]">
                                    {formatFullDateTime(entry.created_at)}
                                  </span>
                                  {entry.ip_address && (
                                    <span className="inline-flex items-center gap-1 text-xs text-[#909090]">
                                      <Globe className="h-3 w-3" />
                                      {entry.ip_address}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-black">{t("caseDetail.caseDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: t("caseDetail.trackingId"), value: report.tracking_id },
                  {
                    label: t("caseDetail.category"),
                    value: report.category.replace(/_/g, " "),
                  },
                  { label: t("caseDetail.severityLabel"), value: tc(`severity.${report.severity}`) },
                  {
                    label: t("caseDetail.statusLabel"),
                    value: tc(`status.${report.status}`),
                  },
                  ...(report.resolution_type ? [{
                    label: t("caseDetail.resolutionType"),
                    value: tc(`resolution.${report.resolution_type}`),
                  }] : []),
                  {
                    label: t("caseDetail.submittedDate"),
                    value: formatDateTime(report.created_at),
                  },
                  {
                    label: t("caseDetail.lastUpdatedDate"),
                    value: formatDateTime(report.updated_at),
                  },
                  {
                    label: t("caseDetail.evidenceFiles"),
                    value: String(report.evidence_count),
                  },
                  {
                    label: t("caseDetail.caseNotes"),
                    value: String(report.notes_count),
                  },
                  {
                    label: t("caseDetail.assignedTo"),
                    value: report.assigned_to ?? t("caseDetail.unassigned"),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-[#909090]">
                      {item.label}
                    </span>
                    <span className="font-medium text-black text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions — role-dependent */}
            {!hasRole("VIEWER") && (
              <Card className="border-[#EBEBEB] shadow-[0_4px_15px_rgba(110,110,110,0.1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-black">{t("caseDetail.quickActions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.status !== "UNDER_REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title={t("caseDetail.markUnderReview")}
                      className="w-full justify-start border-[#EBEBEB] text-[#636363] cursor-pointer"
                      disabled={updatingStatus}
                      onClick={() => openStatusConfirm("UNDER_REVIEW")}
                    >
                      {t("caseDetail.markUnderReview")}
                    </Button>
                  )}
                  {report.status !== "INVESTIGATING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title={t("caseDetail.startInvestigation")}
                      className="w-full justify-start border-[#EBEBEB] text-[#636363] cursor-pointer"
                      disabled={updatingStatus}
                      onClick={() => openStatusConfirm("INVESTIGATING")}
                    >
                      {t("caseDetail.startInvestigation")}
                    </Button>
                  )}
                  {report.severity !== "CRITICAL" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title={t("caseDetail.escalateCritical")}
                      className="w-full justify-start border-[#EBEBEB] text-[#636363] cursor-pointer"
                      disabled={updatingSeverity}
                      onClick={() => openSeverityConfirm("CRITICAL")}
                    >
                      {t("caseDetail.escalateCritical")}
                    </Button>
                  )}
                  {report.status !== "CLOSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title={t("caseDetail.closeCase")}
                      className="w-full justify-start border-[#EBEBEB] text-[#636363] cursor-pointer"
                      disabled={updatingStatus}
                      onClick={() => openStatusConfirm("CLOSED")}
                    >
                      {t("caseDetail.closeCase")}
                    </Button>
                  )}

                  {/* Delete — ADMIN only */}
                  {hasRole("ADMIN") && (
                    <>
                      <Separator className="bg-[#EBEBEB]" />
                      {confirmDelete ? (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600">
                            {t("caseDetail.confirmDeleteWarning")}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              title={t("caseDetail.confirmDelete")}
                              className="flex-1 cursor-pointer"
                              disabled={deleting}
                              onClick={handleDelete}
                            >
                              {deleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                t("caseDetail.confirmDelete")
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title={t("caseDetail.cancel")}
                              className="flex-1 border-[#EBEBEB] text-[#636363] cursor-pointer"
                              onClick={() => setConfirmDelete(false)}
                            >
                              {t("caseDetail.cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          title={t("caseDetail.deleteReport")}
                          className="w-full justify-start border-[#EBEBEB] text-red-600 hover:text-red-600 cursor-pointer"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5 me-1.5" />
                          {t("caseDetail.deleteReport")}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Status/Severity change confirmation dialog */}
      <StatusChangeDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog((prev) => ({ ...prev, open }))}
        type={statusDialog.type}
        currentValue={statusDialog.current}
        newValue={statusDialog.next}
        onConfirm={handleConfirmedChange}
      />
    </div>
  );
}

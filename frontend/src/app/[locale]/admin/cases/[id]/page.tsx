"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  FileText,
  MessageSquare,
  Paperclip,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  Trash2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import {
  getReport,
  getNotes,
  addNote,
  updateReportStatus,
  updateReportSeverity,
  deleteReport,
  type ReportDetail,
  type NoteItem,
  type ReportStatus,
  type Severity,
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CaseDetailPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const { user, token, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingSeverity, setUpdatingSeverity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Auth guard */
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isLoading, router]);

  /* Fetch report detail */
  const fetchReport = useCallback(async () => {
    if (!token || !reportId) return;
    setLoading(true);
    try {
      const res = await getReport(token, reportId);
      if (res.success && res.data) {
        setReport(res.data as ReportDetail);
      } else {
        setError(t("caseDetail.reportNotFound"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("caseDetail.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [token, reportId, t]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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

  /* Actions */
  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (!token || !reportId) return;
    setUpdatingStatus(true);
    try {
      const res = await updateReportStatus(token, reportId, newStatus);
      if (res.success && res.data) {
        setReport(res.data as ReportDetail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("caseDetail.failedToUpdate"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSeverityChange = async (newSeverity: Severity) => {
    if (!token || !reportId) return;
    setUpdatingSeverity(true);
    try {
      const res = await updateReportSeverity(token, reportId, newSeverity);
      if (res.success && res.data) {
        setReport(res.data as ReportDetail);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("caseDetail.failedToUpdateSeverity"),
      );
    } finally {
      setUpdatingSeverity(false);
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
        await fetchReport();
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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">{tc("brand")}</span>
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">{tc("brand")}</span>
            </Link>
          </div>
        </header>
        <div className="text-center py-24">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            {t("caseDetail.backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">{tc("brand")}</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <Link
              href="/admin/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("caseDetail.backToDashboard")}
            </Link>
          </div>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
            <button
              className="ml-2 underline"
              onClick={() => setError(null)}
            >
              {t("caseDetail.dismiss")}
            </button>
          </div>
        )}

        {/* Case Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-mono">
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
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />{" "}
                {report.category.replace(/_/g, " ")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{" "}
                {formatDateTime(report.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />{" "}
                {t("caseDetail.files", { count: report.evidence_count })}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />{" "}
                {t("caseDetail.notesCount", { count: report.notes_count })}
              </span>
            </div>
          </div>
          {!hasRole("VIEWER") && (
            <div className="flex gap-2">
              <select
                aria-label={t("caseDetail.changeStatus")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={report.status}
                disabled={updatingStatus}
                onChange={(e) =>
                  handleStatusChange(e.target.value as ReportStatus)
                }
              >
                <option value="OPEN">{tc("status.OPEN")}</option>
                <option value="UNDER_REVIEW">{tc("status.UNDER_REVIEW")}</option>
                <option value="INVESTIGATING">{tc("status.INVESTIGATING")}</option>
                <option value="CLOSED">{tc("status.CLOSED")}</option>
              </select>
              <select
                aria-label={t("caseDetail.changeSeverity")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={report.severity}
                disabled={updatingSeverity}
                onChange={(e) =>
                  handleSeverityChange(e.target.value as Severity)
                }
              >
                <option value="LOW">{tc("severity.LOW")}</option>
                <option value="MEDIUM">{tc("severity.MEDIUM")}</option>
                <option value="HIGH">{tc("severity.HIGH")}</option>
                <option value="CRITICAL">{tc("severity.CRITICAL")}</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />{" "}
                  {t("caseDetail.reportDescription")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
                {report.location && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("caseDetail.location", { location: report.location })}
                  </p>
                )}
                {report.occurred_at && (
                  <p className="text-xs text-muted-foreground mt-1">
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

            {/* Tabs: Notes */}
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">
                  {t("caseDetail.notes", { count: notes.length })}
                </TabsTrigger>
                <TabsTrigger value="evidence">
                  {t("caseDetail.evidence", { count: report.evidence_count })}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4 space-y-4">
                {/* Add note — not for VIEWER */}
                {!hasRole("VIEWER") && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder={t("caseDetail.addNotePlaceholder")}
                            rows={2}
                            className="resize-none mb-2"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            disabled={addingNote}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={handleAddNote}
                              disabled={
                                addingNote || !noteContent.trim()
                              }
                            >
                              {addingNote ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              {t("caseDetail.addNote")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes list */}
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {t("caseDetail.noNotes")}
                  </p>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(note.author_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {note.author_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(note.created_at)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="evidence" className="mt-4">
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
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
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("caseDetail.caseDetails")}</CardTitle>
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
                    <span className="text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="font-medium text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions — role-dependent */}
            {!hasRole("VIEWER") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("caseDetail.quickActions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.status !== "UNDER_REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("UNDER_REVIEW")}
                    >
                      {t("caseDetail.markUnderReview")}
                    </Button>
                  )}
                  {report.status !== "INVESTIGATING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("INVESTIGATING")}
                    >
                      {t("caseDetail.startInvestigation")}
                    </Button>
                  )}
                  {report.severity !== "CRITICAL" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={updatingSeverity}
                      onClick={() => handleSeverityChange("CRITICAL")}
                    >
                      {t("caseDetail.escalateCritical")}
                    </Button>
                  )}
                  {report.status !== "CLOSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("CLOSED")}
                    >
                      {t("caseDetail.closeCase")}
                    </Button>
                  )}

                  {/* Delete — ADMIN only */}
                  {hasRole("ADMIN") && (
                    <>
                      <Separator />
                      {confirmDelete ? (
                        <div className="space-y-2">
                          <p className="text-xs text-destructive">
                            {t("caseDetail.confirmDeleteWarning")}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
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
                              className="flex-1"
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
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
    </div>
  );
}

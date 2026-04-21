"use client";

import Link from "next/link";
import {
  Shield, ArrowLeft, FileText, MessageSquare, Paperclip,
  Clock, AlertTriangle, User, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const report = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  trackingId: "SS-2026-4821",
  category: "FRAUD",
  severity: "CRITICAL",
  status: "INVESTIGATING",
  description:
    "Financial irregularities discovered in Q1 procurement contracts. Multiple vendors appear to be shell companies linked to senior management. Invoices totaling approximately $2.3M have been flagged with duplicate payment patterns. The procurement system shows approval overrides bypassing standard dual-authorization controls.",
  evidenceCount: 5,
  notesCount: 12,
  createdAt: "2026-04-18T09:15:00Z",
  updatedAt: "2026-04-21T14:30:00Z",
};

const notes = [
  { id: "1", author: "Admin User", content: "Initial review completed. Flagging for senior compliance review.", createdAt: "2026-04-18T10:00:00Z" },
  { id: "2", author: "Audit Officer", content: "Contacted finance department for procurement records Q1 2026. Awaiting response.", createdAt: "2026-04-18T14:30:00Z" },
  { id: "3", author: "Admin User", content: "Vendor cross-reference reveals 3 of 7 flagged vendors share the same registered address. Escalating severity to CRITICAL.", createdAt: "2026-04-19T09:15:00Z" },
  { id: "4", author: "Audit Officer", content: "External forensic accounting firm engaged. NDA signed. Expected preliminary report within 5 business days.", createdAt: "2026-04-20T11:00:00Z" },
  { id: "5", author: "Admin User", content: "Board audit committee briefed. Investigation scope expanded to include Q4 2025 contracts.", createdAt: "2026-04-21T14:30:00Z" },
];

const evidence = [
  { id: "1", fileName: "procurement-invoices-Q1.pdf", mimeType: "application/pdf", sizeBytes: 2456789, createdAt: "2026-04-18T09:15:00Z" },
  { id: "2", fileName: "vendor-registration-docs.pdf", mimeType: "application/pdf", sizeBytes: 1234567, createdAt: "2026-04-18T09:16:00Z" },
  { id: "3", fileName: "approval-override-screenshot.png", mimeType: "image/png", sizeBytes: 456789, createdAt: "2026-04-18T09:17:00Z" },
  { id: "4", fileName: "email-thread-redacted.pdf", mimeType: "application/pdf", sizeBytes: 789012, createdAt: "2026-04-19T08:00:00Z" },
  { id: "5", fileName: "bank-transfer-records.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 345678, createdAt: "2026-04-20T10:30:00Z" },
];

const timeline = [
  { action: "Report submitted", actor: "Anonymous", time: "2026-04-18T09:15:00Z" },
  { action: "Status changed to UNDER_REVIEW", actor: "Admin User", time: "2026-04-18T09:45:00Z" },
  { action: "Evidence uploaded: 3 files", actor: "Anonymous", time: "2026-04-18T09:17:00Z" },
  { action: "Severity escalated to CRITICAL", actor: "Admin User", time: "2026-04-19T09:15:00Z" },
  { action: "Status changed to INVESTIGATING", actor: "Admin User", time: "2026-04-19T09:20:00Z" },
  { action: "Evidence uploaded: 2 files", actor: "Audit Officer", time: "2026-04-20T10:30:00Z" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function CaseDetailPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">SpeakSafe</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">AU</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Case Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-mono">{report.trackingId}</h1>
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 border">
                {report.severity}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 border">
                {report.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {report.category}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDateTime(report.createdAt)}</span>
              <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {report.evidenceCount} files</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {report.notesCount} notes</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Change Status</Button>
            <Button variant="outline" size="sm">Assign</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Report Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.description}</p>
              </CardContent>
            </Card>

            {/* Tabs: Notes, Evidence, Timeline */}
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4 space-y-4">
                {/* Add note */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">AU</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea placeholder="Add a note..." rows={2} className="resize-none mb-2" />
                        <div className="flex justify-end">
                          <Button size="sm"><Send className="h-3.5 w-3.5 mr-1.5" /> Add Note</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes list */}
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs">{note.author.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{note.author}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">{note.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="evidence" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {evidence.map((e) => (
                        <div key={e.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Paperclip className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{e.fileName}</p>
                              <p className="text-xs text-muted-foreground">{formatSize(e.sizeBytes)} &middot; {formatDateTime(e.createdAt)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {timeline.map((event, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {i < timeline.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium">{event.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {event.actor} &middot; {formatDateTime(event.time)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Tracking ID", value: report.trackingId },
                  { label: "Category", value: report.category },
                  { label: "Severity", value: report.severity },
                  { label: "Status", value: report.status.replace("_", " ") },
                  { label: "Submitted", value: formatDateTime(report.createdAt) },
                  { label: "Last Updated", value: formatDateTime(report.updatedAt) },
                  { label: "Evidence Files", value: String(report.evidenceCount) },
                  { label: "Case Notes", value: String(report.notesCount) },
                  { label: "Assigned To", value: "Unassigned" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Mark as Under Review
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Escalate Severity
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Assign to Officer
                </Button>
                <Separator />
                <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                  Close Case
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

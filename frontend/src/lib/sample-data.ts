export interface Report {
  id: string;
  trackingId: string;
  category: "FRAUD" | "HARASSMENT" | "DATA_MISUSE" | "POLICY_VIOLATION" | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "UNDER_REVIEW" | "INVESTIGATING" | "CLOSED";
  description: string;
  evidenceCount: number;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  openCases: number;
  underReview: number;
  investigating: number;
  closed: number;
  criticalCount: number;
  avgResolutionDays: number;
  thisMonthNew: number;
}

export const sampleStats: DashboardStats = {
  totalReports: 247,
  openCases: 18,
  underReview: 12,
  investigating: 8,
  closed: 209,
  criticalCount: 3,
  avgResolutionDays: 14,
  thisMonthNew: 23,
};

export const sampleReports: Report[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    trackingId: "SS-2026-4821",
    category: "FRAUD",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    description: "Financial irregularities discovered in Q1 procurement contracts. Multiple vendors appear to be shell companies linked to senior management.",
    evidenceCount: 5,
    notesCount: 12,
    createdAt: "2026-04-18T09:15:00Z",
    updatedAt: "2026-04-21T14:30:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    trackingId: "SS-2026-3192",
    category: "HARASSMENT",
    severity: "HIGH",
    status: "UNDER_REVIEW",
    description: "Persistent workplace harassment by department head. Multiple incidents reported by team members over the past 3 months.",
    evidenceCount: 3,
    notesCount: 7,
    createdAt: "2026-04-15T14:22:00Z",
    updatedAt: "2026-04-20T11:45:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    trackingId: "SS-2026-7756",
    category: "DATA_MISUSE",
    severity: "HIGH",
    status: "OPEN",
    description: "Customer PII data being exported to unauthorized third-party analytics platform without consent.",
    evidenceCount: 2,
    notesCount: 0,
    createdAt: "2026-04-20T08:00:00Z",
    updatedAt: "2026-04-20T08:00:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    trackingId: "SS-2026-1138",
    category: "POLICY_VIOLATION",
    severity: "MEDIUM",
    status: "CLOSED",
    description: "Remote work policy violated by team of 5 employees. Working from unapproved locations outside country jurisdiction.",
    evidenceCount: 1,
    notesCount: 4,
    createdAt: "2026-03-28T16:30:00Z",
    updatedAt: "2026-04-10T09:00:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    trackingId: "SS-2026-9044",
    category: "FRAUD",
    severity: "MEDIUM",
    status: "UNDER_REVIEW",
    description: "Expense report manipulation detected in marketing department. Duplicate receipts submitted across multiple quarters.",
    evidenceCount: 8,
    notesCount: 3,
    createdAt: "2026-04-12T11:10:00Z",
    updatedAt: "2026-04-19T16:20:00Z",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    trackingId: "SS-2026-6217",
    category: "OTHER",
    severity: "LOW",
    status: "OPEN",
    description: "Concerns about environmental compliance at manufacturing facility. Waste disposal procedures not following updated regulations.",
    evidenceCount: 0,
    notesCount: 1,
    createdAt: "2026-04-21T07:45:00Z",
    updatedAt: "2026-04-21T07:45:00Z",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
    trackingId: "SS-2026-2890",
    category: "HARASSMENT",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    description: "Systematic discrimination in promotion process. Evidence of bias against specific demographic groups in annual reviews.",
    evidenceCount: 4,
    notesCount: 9,
    createdAt: "2026-04-05T13:20:00Z",
    updatedAt: "2026-04-21T10:15:00Z",
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
    trackingId: "SS-2026-5503",
    category: "DATA_MISUSE",
    severity: "LOW",
    status: "CLOSED",
    description: "Employee sharing internal documents on personal cloud storage for convenience. No malicious intent detected after investigation.",
    evidenceCount: 1,
    notesCount: 2,
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-03-25T14:30:00Z",
  },
];

export const sampleAuditLogs: AuditEntry[] = [
  { id: "1", actorEmail: "admin@speaksafe.io", action: "REPORT_STATUS_UPDATED", resourceType: "report", resourceId: "SS-2026-4821", createdAt: "2026-04-21T14:30:00Z" },
  { id: "2", actorEmail: "auditor@speaksafe.io", action: "NOTE_ADDED", resourceType: "case_note", resourceId: "SS-2026-4821", createdAt: "2026-04-21T14:15:00Z" },
  { id: "3", actorEmail: null, action: "EVIDENCE_UPLOADED", resourceType: "evidence", resourceId: "SS-2026-7756", createdAt: "2026-04-21T12:00:00Z" },
  { id: "4", actorEmail: null, action: "REPORT_CREATED", resourceType: "report", resourceId: "SS-2026-6217", createdAt: "2026-04-21T07:45:00Z" },
  { id: "5", actorEmail: "admin@speaksafe.io", action: "REPORT_SEVERITY_UPDATED", resourceType: "report", resourceId: "SS-2026-2890", createdAt: "2026-04-20T16:00:00Z" },
  { id: "6", actorEmail: "admin@speaksafe.io", action: "ADMIN_LOGIN", resourceType: "admin_user", resourceId: "admin@speaksafe.io", createdAt: "2026-04-20T09:00:00Z" },
];

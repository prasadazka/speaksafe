const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Types matching backend schemas ── */

export type AdminRole = "ADMIN" | "COMPLIANCE_OFFICER" | "VIEWER";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type ReportCategory =
  | "FRAUD"
  | "HARASSMENT"
  | "DISCRIMINATION"
  | "DATA_MISUSE"
  | "POLICY_VIOLATION"
  | "SAFETY_CONCERN"
  | "CORRUPTION"
  | "ENVIRONMENTAL"
  | "RETALIATION"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReportStatus = "OPEN" | "UNDER_REVIEW" | "INVESTIGATING" | "CLOSED";

export interface ReportListItem {
  id: string;
  tracking_id: string;
  category: ReportCategory;
  severity: Severity;
  status: ReportStatus;
  occurred_at: string | null;
  location: string | null;
  evidence_count: number;
  notes_count: number;
  created_at: string;
}

export interface ReportDetail extends ReportListItem {
  description: string;
  resolution: string | null;
  assigned_to: string | null;
  updated_at: string;
}

export interface NoteItem {
  id: string;
  report_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export type AuditAction =
  | "REPORT_CREATED"
  | "REPORT_STATUS_UPDATED"
  | "REPORT_SEVERITY_UPDATED"
  | "REPORT_DELETED"
  | "EVIDENCE_UPLOADED"
  | "EVIDENCE_DELETED"
  | "NOTE_ADDED"
  | "ADMIN_REGISTERED"
  | "ADMIN_LOGIN";

export interface AuditLogItem {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  metadata_: Record<string, unknown> | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

/* ── Helpers ── */

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      err?.detail ?? err?.error ?? `Request failed (${res.status})`,
    );
  }
  return res.json();
}

/* ── Auth ── */

export async function adminLogin(
  email: string,
  password: string,
): Promise<ApiResponse<TokenResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function getMe(
  token: string,
): Promise<ApiResponse<AdminProfile>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: authHeaders(token),
  });
  return handleResponse<AdminProfile>(res);
}

/* ── Reports ── */

export interface ReportFilters {
  status?: ReportStatus;
  category?: ReportCategory;
  severity?: Severity;
  page?: number;
  limit?: number;
}

export async function getReports(
  token: string,
  filters: ReportFilters = {},
): Promise<ApiResponse<ReportListItem[]>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const res = await fetch(
    `${API_BASE}/api/v1/reports${qs ? `?${qs}` : ""}`,
    { headers: authHeaders(token) },
  );
  return handleResponse(res);
}

export async function getReport(
  token: string,
  reportId: string,
): Promise<ApiResponse<ReportDetail>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
    headers: authHeaders(token),
  });
  return handleResponse<ReportDetail>(res);
}

export async function updateReportStatus(
  token: string,
  reportId: string,
  status: ReportStatus,
): Promise<ApiResponse<ReportDetail>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return handleResponse<ReportDetail>(res);
}

export async function updateReportSeverity(
  token: string,
  reportId: string,
  severity: Severity,
): Promise<ApiResponse<ReportDetail>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/severity`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ severity }),
  });
  return handleResponse<ReportDetail>(res);
}

export async function deleteReport(
  token: string,
  reportId: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

/* ── Notes ── */

export async function getNotes(
  token: string,
  reportId: string,
): Promise<ApiResponse<NoteItem[]>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/notes`, {
    headers: authHeaders(token),
  });
  return handleResponse<NoteItem[]>(res);
}

export async function addNote(
  token: string,
  reportId: string,
  content: string,
): Promise<ApiResponse<NoteItem>> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/notes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });
  return handleResponse<NoteItem>(res);
}

/* ── Audit Logs ── */

export interface AuditFilters {
  action?: string;
  resource_type?: string;
  resource_id?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(
  token: string,
  filters: AuditFilters = {},
): Promise<ApiResponse<AuditLogItem[]>> {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.resource_type) params.set("resource_type", filters.resource_type);
  if (filters.resource_id) params.set("resource_id", filters.resource_id);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const res = await fetch(
    `${API_BASE}/api/v1/audit${qs ? `?${qs}` : ""}`,
    { headers: authHeaders(token) },
  );
  return handleResponse(res);
}

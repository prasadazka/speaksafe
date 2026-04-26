const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Types matching backend schemas ── */

export type AdminRole = "ADMIN" | "COMPLIANCE_OFFICER" | "VIEWER";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  mfa_enabled: boolean;
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
export type ResolutionType = "SUBSTANTIATED" | "UNSUBSTANTIATED" | "INCONCLUSIVE" | "REFERRED";

export interface ReportListItem {
  id: string;
  tracking_id: string;
  category: ReportCategory;
  severity: Severity;
  status: ReportStatus;
  resolution_type: ResolutionType | null;
  occurred_at: string | null;
  location: string | null;
  evidence_count: number;
  notes_count: number;
  acknowledgment_due: string | null;
  feedback_due: string | null;
  feedback_given_at: string | null;
  created_at: string;
}

export interface ComplianceStats {
  acknowledgment_overdue: number;
  feedback_overdue: number;
  feedback_warning: number;
}

export interface ReportDetail extends ReportListItem {
  description: string;
  resolution: string | null;
  resolution_type: ResolutionType | null;
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
  | "ADMIN_LOGIN"
  | "ADMIN_ROLE_CHANGED"
  | "ADMIN_DEACTIVATED"
  | "ADMIN_ACTIVATED"
  | "ADMIN_DELETED"
  | "ADMIN_PASSWORD_RESET"
  | "ADMIN_PASSWORD_CHANGED"
  | "REPORT_EXPORTED"
  | "REPORT_VIEWED";

export interface MFASetupResponse {
  secret: string;
  otpauth_url: string;
}

export interface AuditLogItem {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata_: Record<string, unknown> | null;
  record_hash: string | null;
  prev_hash: string | null;
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
    // Session expired — broadcast event so auth-context can auto-logout
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sawtsafe:session-expired"));
      }
    }
    throw new Error(
      err?.detail ?? err?.error ?? `Request failed (${res.status})`,
    );
  }
  return res.json();
}

/* ── Auth ── */

export interface MFARequiredResponse {
  mfa_required: true;
}

export async function adminLogin(
  email: string,
  password: string,
  totp_code?: string,
): Promise<ApiResponse<TokenResponse | MFARequiredResponse>> {
  const body: Record<string, string> = { email, password };
  if (totp_code) body.totp_code = totp_code;
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<TokenResponse | MFARequiredResponse>(res);
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
  resolutionType?: ResolutionType,
): Promise<ApiResponse<ReportDetail>> {
  const body: Record<string, string> = { status };
  if (resolutionType) body.resolution_type = resolutionType;
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
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

/* ── Case Timeline ── */

export async function getCaseTimeline(
  token: string,
  reportId: string,
): Promise<ApiResponse<AuditLogItem[]>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reports/${reportId}/timeline`,
    { headers: authHeaders(token) },
  );
  return handleResponse<AuditLogItem[]>(res);
}

/* ── Access Log — who viewed a report ── */

export async function getAccessLog(
  token: string,
  reportId: string,
): Promise<ApiResponse<AuditLogItem[]>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reports/${reportId}/access-log`,
    { headers: authHeaders(token) },
  );
  return handleResponse<AuditLogItem[]>(res);
}

/* ── Change Own Password ── */

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me/password`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  return handleResponse(res);
}

/* ── MFA Management ── */

export async function mfaSetup(
  token: string,
): Promise<ApiResponse<MFASetupResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/mfa/setup`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse<MFASetupResponse>(res);
}

export async function mfaVerify(
  token: string,
  code: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/mfa/verify`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  return handleResponse(res);
}

export async function mfaDisable(
  token: string,
  code: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/mfa/disable`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  return handleResponse(res);
}

/* ── User Management (ADMIN only) ── */

export async function listUsers(
  token: string,
  page: number = 1,
  limit: number = 20,
): Promise<ApiResponse<AdminProfile[]>> {
  const res = await fetch(
    `${API_BASE}/api/v1/auth/users?page=${page}&limit=${limit}`,
    { headers: authHeaders(token) },
  );
  return handleResponse(res);
}

export async function registerUser(
  token: string,
  data: { email: string; password: string; full_name: string; role: AdminRole },
): Promise<ApiResponse<TokenResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUserRole(
  token: string,
  userId: string,
  role: AdminRole,
): Promise<ApiResponse<AdminProfile>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

export async function updateUserActive(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<ApiResponse<AdminProfile>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/users/${userId}/active`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleResponse(res);
}

export async function deleteUser(
  token: string,
  userId: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function resetUserPassword(
  token: string,
  userId: string,
  newPassword: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/users/${userId}/password`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ new_password: newPassword }),
  });
  return handleResponse(res);
}

/* ── Compliance Stats ── */

export async function getComplianceStats(
  token: string,
): Promise<ApiResponse<ComplianceStats>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reports/compliance/stats`,
    { headers: authHeaders(token) },
  );
  return handleResponse<ComplianceStats>(res);
}

/* ── Bulk Export ── */

export interface ExportFilters {
  status?: ReportStatus;
  category?: ReportCategory;
  severity?: Severity;
  page?: number;
  limit?: number;
}

function buildExportParams(filters: ExportFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString();
}

export async function exportReportsCSV(
  token: string,
  filters: ExportFilters = {},
): Promise<void> {
  const qs = buildExportParams(filters);
  const res = await fetch(
    `${API_BASE}/api/v1/reports/export/csv${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sawtsafe:session-expired"));
    }
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.headers.get("content-disposition")
    ?.split("filename=")[1]?.replace(/"/g, "")
    ?? "sawtsafe-reports.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportReportsPDF(
  token: string,
  filters: ExportFilters = {},
): Promise<void> {
  const qs = buildExportParams(filters);
  const res = await fetch(
    `${API_BASE}/api/v1/reports/export/pdf${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sawtsafe:session-expired"));
    }
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.headers.get("content-disposition")
    ?.split("filename=")[1]?.replace(/"/g, "")
    ?? "sawtsafe-reports.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

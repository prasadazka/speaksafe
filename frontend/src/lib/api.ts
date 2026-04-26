const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Envelope matching backend ApiResponse ── */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
}

/* ── Report types ── */
export interface ReportSubmitted {
  id: string;
  tracking_id: string;
  message: string;
}

export interface SentimentResult {
  tone: string;
  urgency: string;
  summary: string;
}

export interface ReportPayload {
  category: string;
  description: string;
  severity?: string;
  sentiment?: SentimentResult | null;
  occurred_at?: string | null;
  location?: string | null;
}

/* ── Evidence types ── */
export interface EvidenceItem {
  id: string;
  report_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  encrypted: boolean;
}

/* ── API helpers ── */

export async function submitReport(
  payload: ReportPayload,
): Promise<ApiResponse<ReportSubmitted>> {
  const body: Record<string, unknown> = {
    category: payload.category,
    description: payload.description,
  };
  if (payload.severity) body.severity = payload.severity;
  if (payload.sentiment) body.sentiment = payload.sentiment;
  if (payload.occurred_at) body.occurred_at = payload.occurred_at;
  if (payload.location) body.location = payload.location;

  const res = await fetch(`${API_BASE}/api/v1/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail ?? `Submission failed (${res.status})`);
  }

  return res.json();
}

/* ── AI helpers ── */

export async function scoreSeverity(
  description: string,
  category: string,
): Promise<string> {
  try {
    const res = await fetch("/api/ai/severity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, category }),
    });
    const data = await res.json();
    return data.severity ?? "MEDIUM";
  } catch {
    return "MEDIUM"; // Fallback — never block submission
  }
}

export async function analyzeSentiment(
  description: string,
): Promise<SentimentResult | null> {
  try {
    const res = await fetch("/api/ai/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    return data.sentiment ?? null;
  } catch {
    return null; // Fallback — never block submission
  }
}

export async function formatDescription(
  description: string,
  category: string,
): Promise<string> {
  const res = await fetch("/api/ai/format", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, category }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? `Formatting failed (${res.status})`);
  }

  const data = await res.json();
  return data.formatted;
}

/* ── Track report ── */

export interface StatusHistoryEntry {
  status: string;
  at: string;
}

export interface ReportStatus {
  tracking_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  acknowledgment_due: string | null;
  feedback_due: string | null;
  feedback_given_at: string | null;
  status_history: StatusHistoryEntry[];
}

export async function trackReport(
  trackingId: string,
): Promise<ApiResponse<ReportStatus>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reports/track/${encodeURIComponent(trackingId)}`,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail ?? `Report not found (${res.status})`);
  }

  return res.json();
}

/* ── GDPR Art. 17 — Erasure ── */

export async function eraseReport(
  trackingId: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(
    `${API_BASE}/api/v1/reports/track/${encodeURIComponent(trackingId)}/erasure`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail ?? `Erasure failed (${res.status})`);
  }

  return res.json();
}

/* ── Evidence ── */

export async function uploadEvidence(
  reportId: string,
  file: File,
): Promise<ApiResponse<EvidenceItem>> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(
    `${API_BASE}/api/v1/reports/${reportId}/evidence`,
    { method: "POST", body: form },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail ?? `Upload failed (${res.status})`);
  }

  return res.json();
}

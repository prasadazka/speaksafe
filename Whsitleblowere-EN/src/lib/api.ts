const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
}

export interface ReportSubmitted {
  id: string;
  tracking_id: string;
  message: string;
}

export interface ReportPayload {
  category: string;
  description: string;
  severity?: string;
  occurred_at?: string | null;
  location?: string | null;
}

export interface ReportStatus {
  tracking_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  acknowledgment_due: string | null;
  feedback_due: string | null;
  feedback_given_at: string | null;
  status_history: { status: string; at: string }[];
}

export async function submitReport(
  payload: ReportPayload,
): Promise<ApiResponse<ReportSubmitted>> {
  const body: Record<string, unknown> = {
    category: payload.category,
    description: payload.description,
    severity: payload.severity ?? "MEDIUM",
  };
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

export async function uploadEvidence(
  reportId: string,
  file: File,
): Promise<ApiResponse<unknown>> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/evidence`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail ?? `Upload failed (${res.status})`);
  }

  return res.json();
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

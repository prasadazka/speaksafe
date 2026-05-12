const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
}

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

export async function adminLogin(
  email: string,
  password: string,
  totpCode?: string,
): Promise<ApiResponse<unknown>> {
  const body: Record<string, unknown> = { email, password };
  if (totpCode) body.totp_code = totpCode;

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: json?.detail ?? `Login failed (${res.status})`,
      meta: null,
    };
  }

  return { success: true, data: json, error: null, meta: null };
}

export async function getMe(token: string): Promise<ApiResponse<AdminProfile>> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: json?.detail ?? `Failed to fetch profile (${res.status})`,
      meta: null,
    };
  }

  return { success: true, data: json as AdminProfile, error: null, meta: null };
}

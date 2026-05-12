"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ChevronDown, Copy, Check, KeyRound, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// ─── Test Credentials ────────────────────────────────────────────────────────

const TEST_ACCOUNTS = [
  { email: "admin@sawtsafe.io", password: "Admin@2026", role: "Admin", color: "text-red-500" },
  { email: "officer@sawtsafe.io", password: "Officer@2026", role: "Compliance Officer", color: "text-amber-500" },
  { email: "viewer@sawtsafe.io", password: "Viewer@2026", role: "Viewer", color: "text-blue-500" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const { login, user, isLoading, mfaState, clearMfa } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/admin/dashboard";
    }
  }, [user, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaState) return;
    setLoading(true);
    setError(null);
    try {
      await login(mfaState.email, mfaState.password, totpCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9F3FF]">
        <div className="animate-pulse text-[#909090] font-[family-name:var(--font-sora)]">Loading…</div>
      </div>
    );
  }

  /* ── MFA Screen ── */
  if (mfaState?.required) {
    return (
      <PageShell>
        <div className="w-full max-w-[480px]">
          {/* Brand */}
          <BrandLogo />

          <div className="mt-8 text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5B94DE]/10">
              <KeyRound className="h-7 w-7 text-[#5B94DE]" />
            </div>
            <h1 className="text-[38px] font-bold text-black font-[family-name:var(--font-sora)] leading-tight">
              Two-Factor Auth
            </h1>
            <p className="mt-2 text-lg text-black/70 font-[family-name:var(--font-sora)]">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleMfaVerify} className="space-y-5">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="000000"
              aria-label="One-time code"
              className="w-full h-[59px] px-5 text-center text-2xl tracking-[0.5em] font-mono bg-white border border-[#636363] rounded-[10px] text-black placeholder:text-[#BDBDBD] focus:outline-none focus:border-[#5B94DE] transition-colors"
              autoFocus
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-[family-name:var(--font-sora)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.length < 6}
              className="w-full h-[52px] bg-[#5B94DE] hover:bg-[#4a83cd] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-semibold rounded font-[family-name:var(--font-figtree)] transition-colors"
            >
              {loading ? <span className="animate-pulse">Verifying…</span> : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => { clearMfa(); setTotpCode(""); setError(null); }}
              className="w-full flex items-center justify-center gap-2 text-[#909090] hover:text-black transition-colors text-sm font-[family-name:var(--font-sora)] py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </form>

          <ProtectedFooter />
        </div>
      </PageShell>
    );
  }

  /* ── Main Login Screen ── */
  return (
    <PageShell>
      <div className="w-full max-w-[645px]">
        {/* Brand */}
        <BrandLogo />

        {/* Heading */}
        <div className="mt-8 text-center mb-8">
          <h1 className="text-[42px] font-bold text-black font-[family-name:var(--font-sora)] leading-tight">
            Welcome back, Admin
          </h1>
          <p className="mt-2 text-xl text-black font-[family-name:var(--font-sora)]">
            Sign in to manage reports
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xl font-normal text-black mb-2 font-[family-name:var(--font-sora)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@sawtsafe.io"
              required
              className="w-full h-[59px] px-5 bg-white border border-[#636363] rounded-[10px] text-black text-base placeholder:text-[#838383] font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xl font-normal text-black mb-2 font-[family-name:var(--font-sora)]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter Password"
                required
                className="w-full h-[59px] px-5 pr-12 bg-white border border-[#636363] rounded-[10px] text-black text-base placeholder:text-[#838383] font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909090] hover:text-black transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-[family-name:var(--font-sora)]">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2.5 w-[295px] h-[52px] bg-[#5B94DE] hover:bg-[#4a83cd] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-semibold rounded font-[family-name:var(--font-figtree)] transition-colors"
            >
              {loading ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>
                  Sign In
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Test Credentials */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="w-full flex items-center justify-center gap-2 text-[#909090] hover:text-black transition-colors py-2 font-[family-name:var(--font-sora)] text-xl"
          >
            <span>Test Credentials</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showTestAccounts ? "rotate-180" : ""}`}
            />
          </button>

          {showTestAccounts && (
            <div className="mt-2 border border-dashed border-white/40 rounded-xl bg-white/20 p-4 space-y-3">
              {TEST_ACCOUNTS.map((acct) => (
                <div key={acct.email} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${acct.color} font-[family-name:var(--font-sora)]`}>
                      {acct.role}
                    </p>
                    <p className="text-xs font-mono text-black/60 truncate">{acct.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      title="Copy credentials"
                      onClick={() => copyToClipboard(`${acct.email}\n${acct.password}`, acct.email)}
                      className="p-1.5 rounded hover:bg-white/30 text-black/50 hover:text-black transition-colors"
                    >
                      {copied === acct.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Use these credentials"
                      onClick={() => {
                        setEmail(acct.email);
                        setPassword(acct.password);
                        setError(null);
                        setShowTestAccounts(false);
                      }}
                      className="px-3 h-7 text-xs bg-white/40 hover:bg-white/60 text-black rounded border border-white/40 transition-colors font-[family-name:var(--font-sora)]"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ProtectedFooter />
      </div>
    </PageShell>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#E9F3FF] overflow-hidden px-4 py-16">
      {/* Background illustration */}
      <Image
        src="/images/Admin login-background.jpg"
        alt=""
        fill
        className="object-cover object-center"
        priority
        aria-hidden
      />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-[724px] bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl px-[40px] py-[56px] shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function BrandLogo() {
  return (
    <Link href="/" className="flex items-center justify-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="6" fill="#5B94DE" />
        <path d="M14 5L5 9V15C5 20.5 9.1 25.6 14 27C18.9 25.6 23 20.5 23 15V9L14 5Z" fill="white" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#5B94DE" />
      </svg>
      <span className="text-[32px] font-bold text-[#01151C] font-[family-name:var(--font-sora)] leading-none">
        SpeakSafe
      </span>
    </Link>
  );
}

function ProtectedFooter() {
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Shield className="w-5 h-5 text-[#5B94DE] shrink-0" />
      <p className="text-xl text-[#909090] font-[family-name:var(--font-sora)]">
        Protected by enterprise-grade encryption
      </p>
    </div>
  );
}

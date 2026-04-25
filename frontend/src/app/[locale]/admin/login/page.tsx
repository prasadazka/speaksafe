"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  LogIn,
  ChevronDown,
  Copy,
  Check,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const TEST_ACCOUNTS = [
    {
      email: "admin@sawtsafe.io",
      password: "Admin@2026",
      role: tc("roles.ADMIN"),
      color: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    {
      email: "officer@sawtsafe.io",
      password: "Officer@2026",
      role: tc("roles.COMPLIANCE_OFFICER"),
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      email: "viewer@sawtsafe.io",
      password: "Viewer@2026",
      role: tc("roles.VIEWER"),
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
  ];

  const { login, user, isLoading, mfaState, clearMfa } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/admin/dashboard";
    }
  }, [user, isLoading]);

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError(t("login.emailRequired"));
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t("login.emailInvalid"));
      valid = false;
    }

    if (!password) {
      setPasswordError(t("login.passwordRequired"));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t("login.passwordMinLength"));
      valid = false;
    }

    return valid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.loginFailed"));
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
      setError(err instanceof Error ? err.message : t("login.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearMfa();
    setTotpCode("");
    setError(null);
  };

  const fillCredentials = (acct: (typeof TEST_ACCOUNTS)[number]) => {
    setEmail(acct.email);
    setPassword(acct.password);
    setError(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-[#909090]">{tc("loading")}</div>
      </div>
    );
  }

  /* ── MFA Code Entry Screen ── */
  if (mfaState?.required) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel — Hero Image */}
        <LeftPanel />

        {/* Right Panel — MFA Form */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
          <BrandHeader tc={tc} />

          <div className="w-full max-w-[420px] mt-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00653E]/10">
                <KeyRound className="h-7 w-7 text-[#00653E]" />
              </div>
              <h1 className="text-[32px] font-bold text-black leading-tight">
                {t("login.mfaTitle")}
              </h1>
              <p className="mt-2 text-lg text-[#909090]">
                {t("login.mfaSubtitle")}
              </p>
            </div>

            <form onSubmit={handleMfaVerify} className="space-y-5">
              <div>
                <label className="text-lg font-medium text-black mb-2 block">
                  {t("login.mfaCodeLabel")}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setTotpCode(val);
                    setError(null);
                  }}
                  placeholder="000000"
                  className="h-[59px] text-center text-2xl tracking-[0.5em] font-mono border-[#BEBEBE] rounded-[10px] bg-white text-black placeholder:text-[#BEBEBE]"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[52px] bg-[#00653E] hover:bg-[#005232] text-white text-lg font-semibold rounded-[4px] cursor-pointer"
                disabled={loading || totpCode.length < 6}
              >
                {loading ? (
                  <span className="animate-pulse">{t("login.verifying")}</span>
                ) : (
                  t("login.verify")
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-[#909090] hover:text-black"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 me-2" />
                {t("login.backToLogin")}
              </Button>
            </form>
          </div>

          <ProtectedFooter t={t} />
        </div>
      </div>
    );
  }

  /* ── Normal Login Screen ── */
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Hero Image */}
      <LeftPanel />

      {/* Right Panel — Login Form */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Decorative abstract layers — top-right corner */}
        <Image
          src="/images/admin/abstract-layers.png"
          alt=""
          width={160}
          height={170}
          className="absolute top-8 end-8 opacity-30 pointer-events-none hidden lg:block"
          aria-hidden="true"
        />

        <BrandHeader tc={tc} />

        <div className="w-full max-w-[420px] mt-8">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-[36px] lg:text-[42px] font-bold text-black leading-tight">
              {t("login.welcomeTitle")}
            </h1>
            <p className="mt-2 text-lg text-[#909090]">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-lg font-medium text-black mb-2 block">
                {t("login.emailLabel")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setEmailError(null);
                }}
                placeholder={t("login.emailPlaceholder")}
                className={`h-[59px] text-lg rounded-[10px] bg-white text-black placeholder:text-[#BEBEBE] ${emailError ? "border-red-400" : "border-[#BEBEBE]"}`}
                required
              />
              {emailError && (
                <p className="mt-1.5 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            <div>
              <label className="text-lg font-medium text-black mb-2 block">
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                    setPasswordError(null);
                  }}
                  placeholder={t("login.passwordPlaceholder")}
                  className={`h-[59px] text-lg rounded-[10px] bg-white text-black placeholder:text-[#BEBEBE] pe-12 ${passwordError ? "border-red-400" : "border-[#BEBEBE]"}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-[#909090] hover:text-black transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-sm text-red-500">{passwordError}</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-[52px] bg-[#00653E] hover:bg-[#005232] text-white text-lg font-semibold rounded-[4px] gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">{t("login.signingIn")}</span>
              ) : (
                <>
                  {t("login.signIn")}
                  <LogIn className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6">
            <button
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#909090] hover:text-black transition-colors py-2"
            >
              <span>{t("login.testCredentials")}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showTestAccounts ? "rotate-180" : ""}`}
              />
            </button>

            {showTestAccounts && (
              <div className="mt-2 border border-dashed border-[#BEBEBE] rounded-[10px] p-4 space-y-3">
                {TEST_ACCOUNTS.map((acct) => (
                  <div
                    key={acct.email}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className={`${acct.color} border text-[10px] px-1.5 py-0 mb-0.5`}
                      >
                        {acct.role}
                      </Badge>
                      <p className="text-xs font-mono text-[#909090] truncate">
                        {acct.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#909090]"
                        onClick={() => {
                          copyToClipboard(
                            `${acct.email}\n${acct.password}`,
                            acct.email,
                          );
                        }}
                      >
                        {copied === acct.email ? (
                          <Check className="h-3 w-3 text-[#00653E]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs border-[#BEBEBE] text-black"
                        onClick={() => fillCredentials(acct)}
                      >
                        {t("login.use")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ProtectedFooter t={t} />
      </div>
    </div>
  );
}

/* ── Shared Sub-components ── */

function LeftPanel() {
  return (
    <div className="hidden lg:block relative w-[45%] min-h-screen">
      {/* Hero image */}
      <Image
        src="/images/admin/hero-security.jpg"
        alt="Security illustration"
        fill
        className="object-cover"
        priority
      />
      {/* Gradient fade into white on the right edge */}
      <div className="absolute inset-y-0 end-0 w-48 bg-gradient-to-l from-white to-transparent" />
      {/* Intersect dotted pattern */}
      <Image
        src="/images/admin/intersect.png"
        alt=""
        width={179}
        height={179}
        className="absolute -top-8 end-0 opacity-60 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

function BrandHeader({ tc }: { tc: (key: string) => string }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 mb-2"
    >
      <Shield className="h-7 w-7 text-[#00653E]" />
      <span className="text-[28px] font-bold tracking-tight text-[#00653E]">
        {tc("brand")}
      </span>
    </Link>
  );
}

function ProtectedFooter({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <div className="absolute bottom-8 flex items-center gap-2">
      <Image
        src="/images/admin/security-badge.png"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
      <p className="text-sm text-[#909090]">{t("login.protectedBy")}</p>
    </div>
  );
}

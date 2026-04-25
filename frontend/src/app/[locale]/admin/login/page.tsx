"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, LogIn, ChevronDown, Copy, Check, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* Redirect if already authenticated */
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/admin/dashboard";
    }
  }, [user, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{tc("loading")}</div>
      </div>
    );
  }

  /* ── MFA Code Entry Screen ── */
  if (mfaState?.required) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">{tc("brand")}</span>
        </Link>

        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("login.mfaTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("login.mfaSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
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
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
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
                className="w-full"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 me-2" />
                {t("login.backToLogin")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          {t("login.protectedBy")}
        </p>
      </div>
    );
  }

  /* ── Normal Login Screen ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">{tc("brand")}</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("login.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("login.emailLabel")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t("login.emailPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t("login.passwordLabel")}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder={t("login.passwordPlaceholder")}
                required
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">{t("login.signingIn")}</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" /> {t("login.signIn")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <div className="w-full max-w-sm mt-4">
        <button
          onClick={() => setShowTestAccounts(!showTestAccounts)}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <span>{t("login.testCredentials")}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showTestAccounts ? "rotate-180" : ""}`}
          />
        </button>

        {showTestAccounts && (
          <Card className="border-dashed">
            <CardContent className="pt-4 space-y-3">
              {TEST_ACCOUNTS.map((acct) => (
                <div
                  key={acct.email}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`${acct.color} border text-[10px] px-1.5 py-0`}
                      >
                        {acct.role}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {acct.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        copyToClipboard(
                          `${acct.email}\n${acct.password}`,
                          acct.email,
                        );
                      }}
                    >
                      {copied === acct.email ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => fillCredentials(acct)}
                    >
                      {t("login.use")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t("login.protectedBy")}
      </p>
    </div>
  );
}

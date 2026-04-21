"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, LogIn, ChevronDown, Copy, Check } from "lucide-react";
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

const TEST_ACCOUNTS = [
  {
    email: "admin@speaksafe.io",
    password: "Admin@2026",
    role: "Admin",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  {
    email: "officer@speaksafe.io",
    password: "Officer@2026",
    role: "Compliance Officer",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    email: "viewer@speaksafe.io",
    password: "Viewer@2026",
    role: "Viewer",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
];

export default function AdminLoginPage() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">SpeakSafe</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Admin Portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to manage reports
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="admin@speaksafe.io"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
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
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" /> Sign In
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
          <span>Test Credentials</span>
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
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Protected by enterprise-grade encryption
      </p>
    </div>
  );
}

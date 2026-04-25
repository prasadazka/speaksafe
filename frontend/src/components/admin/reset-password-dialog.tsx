"use client";

import { useState, useCallback, useEffect } from "react";
import { KeyRound, Loader2, RefreshCw, Eye, EyeOff, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { resetUserPassword, type AdminProfile } from "@/lib/admin-api";
import { generateSecurePassword } from "@/lib/password-utils";
import { useTranslations } from "next-intl";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: AdminProfile | null;
  onSuccess: () => void;
}

export function ResetPasswordDialog({ open, onOpenChange, targetUser, onSuccess }: ResetPasswordDialogProps) {
  const t = useTranslations("admin");
  const { token } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate password when dialog opens
  useEffect(() => {
    if (open) {
      setPassword(generateSecurePassword());
      setShowPassword(true);
      setCopied(false);
      setError(null);
    }
  }, [open]);

  const handleGenerate = useCallback(() => {
    setPassword(generateSecurePassword());
    setShowPassword(true);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [password]);

  const handleReset = async () => {
    if (!token || !targetUser) return;
    setLoading(true);
    setError(null);
    try {
      await resetUserPassword(token, targetUser.id, password);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white p-0 gap-0 border-[#EBEBEB]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <KeyRound className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {t("users.resetPassword")}
          </DialogTitle>
          <DialogDescription className="text-center text-[#909090]">
            {t("users.resetPasswordDescription", { name: targetUser?.full_name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* User info */}
          <div className="bg-[#F5F5F5] border border-[#EBEBEB] rounded-lg p-3">
            <p className="text-sm font-medium text-black">{targetUser?.full_name}</p>
            <p className="text-xs text-[#909090]">{targetUser?.email}</p>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-black">
                {t("users.newPassword")}
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                title={t("users.regenerate")}
                className="flex items-center gap-1 text-xs text-[#00653E] hover:text-[#005232] font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                {t("users.regenerate")}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setCopied(false); }}
                placeholder={t("users.passwordPlaceholder")}
                className="h-11 pe-20 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE] font-mono"
                required
                minLength={8}
              />
              <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {password && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    title={t("users.copyPassword")}
                    className="p-1.5 text-[#909090] hover:text-[#00653E] transition-colors cursor-pointer rounded"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#00653E]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? t("users.hidePassword") : t("users.showPassword")}
                  className="p-1.5 text-[#909090] hover:text-black transition-colors cursor-pointer rounded"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-[#909090]">
              {t("users.resetPasswordHint")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              title={t("users.cancel")}
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 border-[#EBEBEB] text-[#636363] rounded-lg cursor-pointer"
            >
              {t("users.cancel")}
            </Button>
            <Button
              onClick={handleReset}
              title={t("users.confirmReset")}
              disabled={loading || password.length < 8}
              className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <KeyRound className="h-4 w-4 me-2" />
              )}
              {t("users.confirmReset")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

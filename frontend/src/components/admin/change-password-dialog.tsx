"use client";

import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, Check } from "lucide-react";
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
import { changePassword } from "@/lib/admin-api";
import { useTranslations } from "next-intl";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const t = useTranslations("admin");
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const passwordsMatch = newPassword === confirmPassword;
  const isValid = currentPassword.length >= 1 && newPassword.length >= 8 && passwordsMatch;

  const handleSubmit = async () => {
    if (!token || !isValid) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(token, currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("changePassword.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white p-0 gap-0 border-[#EBEBEB]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00653E]/10">
            <Lock className="h-6 w-6 text-[#00653E]" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {t("changePassword.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-[#909090]">
            {t("changePassword.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-700">
                {t("changePassword.success")}
              </p>
            </div>
          ) : (
            <>
              {/* Current password */}
              <div>
                <label className="text-sm font-medium text-black mb-1.5 block">
                  {t("changePassword.currentPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
                    placeholder={t("changePassword.currentPasswordPlaceholder")}
                    className="h-11 pe-12 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    title={showCurrent ? t("users.hidePassword") : t("users.showPassword")}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#909090] hover:text-black transition-colors cursor-pointer rounded"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-sm font-medium text-black mb-1.5 block">
                  {t("changePassword.newPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                    placeholder={t("changePassword.newPasswordPlaceholder")}
                    className="h-11 pe-12 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    title={showNew ? t("users.hidePassword") : t("users.showPassword")}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#909090] hover:text-black transition-colors cursor-pointer rounded"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    {t("changePassword.minLength")}
                  </p>
                )}
              </div>

              {/* Confirm new password */}
              <div>
                <label className="text-sm font-medium text-black mb-1.5 block">
                  {t("changePassword.confirmPassword")}
                </label>
                <Input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder={t("changePassword.confirmPasswordPlaceholder")}
                  className="h-11 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
                  minLength={8}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {t("changePassword.mismatch")}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  title={t("caseDetail.cancel")}
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 h-11 border-[#EBEBEB] text-[#636363] rounded-lg cursor-pointer"
                >
                  {t("caseDetail.cancel")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  title={t("changePassword.submit")}
                  disabled={loading || !isValid}
                  className="flex-1 h-11 bg-[#00653E] hover:bg-[#005232] text-white rounded-lg cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Lock className="h-4 w-4 me-2" />
                  )}
                  {t("changePassword.submit")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

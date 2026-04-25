"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { KeyRound, ShieldCheck, ShieldOff, Copy, Check, Loader2 } from "lucide-react";
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
import { mfaSetup, mfaVerify, mfaDisable } from "@/lib/admin-api";
import { useTranslations } from "next-intl";

interface MFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MFASetupDialog({ open, onOpenChange }: MFASetupDialogProps) {
  const t = useTranslations("admin");
  const { user, token, refreshUser } = useAuth();

  const [step, setStep] = useState<"idle" | "qr" | "verify" | "disable">("idle");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mfaEnabled = user?.mfa_enabled ?? false;

  const reset = () => {
    setStep("idle");
    setSecret("");
    setOtpauthUrl("");
    setCode("");
    setError(null);
    setCopied(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSetup = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await mfaSetup(token);
      if (res.success && res.data) {
        const data = res.data as { secret: string; otpauth_url: string };
        setSecret(data.secret);
        setOtpauthUrl(data.otpauth_url);
        setStep("qr");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("mfa.setupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await mfaVerify(token, code);
      await refreshUser();
      setStep("idle");
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("mfa.verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await mfaDisable(token, code);
      await refreshUser();
      setStep("idle");
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("mfa.disableFailed"));
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white p-0 gap-0 border-[#EBEBEB]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00653E]/10">
            <KeyRound className="h-6 w-6 text-[#00653E]" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {t("mfa.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-[#909090]">
            {mfaEnabled ? t("mfa.enabledDescription") : t("mfa.disabledDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Idle state — show enable or disable button */}
          {step === "idle" && (
            <div className="space-y-4">
              {/* Current status */}
              <div className={`flex items-center gap-3 rounded-xl p-4 ${
                mfaEnabled
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200"
              }`}>
                {mfaEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${mfaEnabled ? "text-emerald-800" : "text-amber-800"}`}>
                    {mfaEnabled ? t("mfa.statusEnabled") : t("mfa.statusDisabled")}
                  </p>
                  <p className={`text-xs ${mfaEnabled ? "text-emerald-600" : "text-amber-600"}`}>
                    {mfaEnabled ? t("mfa.statusEnabledHint") : t("mfa.statusDisabledHint")}
                  </p>
                </div>
              </div>

              {mfaEnabled ? (
                <Button
                  onClick={() => setStep("disable")}
                  title={t("mfa.disableButton")}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  <ShieldOff className="h-4 w-4 me-2" />
                  {t("mfa.disableButton")}
                </Button>
              ) : (
                <Button
                  onClick={handleSetup}
                  title={t("mfa.enableButton")}
                  disabled={loading}
                  className="w-full h-11 bg-[#00653E] hover:bg-[#005232] text-white rounded-lg cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 me-2" />
                  )}
                  {t("mfa.enableButton")}
                </Button>
              )}
            </div>
          )}

          {/* QR code step */}
          {step === "qr" && (
            <div className="space-y-5">
              <p className="text-sm text-[#636363] text-center">
                {t("mfa.scanQRCode")}
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl border border-[#EBEBEB] shadow-sm">
                  <QRCodeSVG value={otpauthUrl} size={200} level="M" />
                </div>
              </div>

              {/* Secret key */}
              <div>
                <p className="text-xs text-[#909090] mb-1.5 text-center">
                  {t("mfa.manualEntry")}
                </p>
                <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2.5">
                  <code className="flex-1 text-xs font-mono text-[#636363] break-all text-center">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    title={t("mfa.copySecret")}
                    className="shrink-0 text-[#909090] hover:text-[#00653E] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#00653E]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verify input */}
              <div>
                <label className="text-sm font-medium text-black mb-1.5 block">
                  {t("mfa.enterCode")}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  placeholder="000000"
                  className="h-12 text-center text-xl tracking-[0.5em] font-mono border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                onClick={handleVerify}
                title={t("mfa.verifyAndEnable")}
                disabled={loading || code.length < 6}
                className="w-full h-11 bg-[#00653E] hover:bg-[#005232] text-white rounded-lg cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 me-2" />
                )}
                {t("mfa.verifyAndEnable")}
              </Button>
            </div>
          )}

          {/* Disable step */}
          {step === "disable" && (
            <div className="space-y-5">
              <p className="text-sm text-[#636363] text-center">
                {t("mfa.disableWarning")}
              </p>

              <div>
                <label className="text-sm font-medium text-black mb-1.5 block">
                  {t("mfa.enterCode")}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  placeholder="000000"
                  className="h-12 text-center text-xl tracking-[0.5em] font-mono border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => { setStep("idle"); setCode(""); setError(null); }}
                  title={t("mfa.cancel")}
                  variant="outline"
                  className="flex-1 h-11 border-[#EBEBEB] text-[#636363] rounded-lg cursor-pointer"
                >
                  {t("mfa.cancel")}
                </Button>
                <Button
                  onClick={handleDisable}
                  title={t("mfa.confirmDisable")}
                  disabled={loading || code.length < 6}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : null}
                  {t("mfa.confirmDisable")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

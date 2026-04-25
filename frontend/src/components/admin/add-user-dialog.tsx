"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { registerUser, type AdminRole } from "@/lib/admin-api";
import { useTranslations } from "next-intl";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ROLES: { value: AdminRole; labelKey: string }[] = [
  { value: "VIEWER", labelKey: "VIEWER" },
  { value: "COMPLIANCE_OFFICER", labelKey: "COMPLIANCE_OFFICER" },
  { value: "ADMIN", labelKey: "ADMIN" },
];

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { token } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("VIEWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("VIEWER");
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await registerUser(token, { email, password, full_name: fullName, role });
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white p-0 gap-0 border-[#EBEBEB]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00653E]/10">
            <UserPlus className="h-6 w-6 text-[#00653E]" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {t("users.addUser")}
          </DialogTitle>
          <DialogDescription className="text-center text-[#909090]">
            {t("users.addUserDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-black mb-1.5 block">
              {t("users.fullName")}
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("users.fullNamePlaceholder")}
              className="h-11 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-1.5 block">
              {t("users.email")}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("users.emailPlaceholder")}
              className="h-11 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-1.5 block">
              {t("users.password")}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("users.passwordPlaceholder")}
              className="h-11 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-1.5 block">
              {t("users.role")}
            </label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger className="h-11 border-[#EBEBEB] rounded-lg bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#EBEBEB]">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="cursor-pointer">
                    {tc(`roles.${r.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              title={t("users.cancel")}
              onClick={() => handleOpenChange(false)}
              className="flex-1 h-11 border-[#EBEBEB] text-[#636363] rounded-lg cursor-pointer"
            >
              {t("users.cancel")}
            </Button>
            <Button
              type="submit"
              title={t("users.createUser")}
              disabled={loading}
              className="flex-1 h-11 bg-[#00653E] hover:bg-[#005232] text-white rounded-lg cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <UserPlus className="h-4 w-4 me-2" />
              )}
              {t("users.createUser")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

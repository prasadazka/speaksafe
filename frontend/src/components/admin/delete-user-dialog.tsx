"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { deleteUser, type AdminProfile } from "@/lib/admin-api";
import { useTranslations } from "next-intl";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: AdminProfile | null;
  onSuccess: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, targetUser, onSuccess }: DeleteUserDialogProps) {
  const t = useTranslations("admin");
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!token || !targetUser) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(token, targetUser.id);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white p-0 gap-0 border-[#EBEBEB]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {t("users.deleteUser")}
          </DialogTitle>
          <DialogDescription className="text-center text-[#909090]">
            {t("users.deleteWarning", { name: targetUser?.full_name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* User details */}
          <div className="bg-red-50/50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-black">{targetUser?.full_name}</p>
            <p className="text-xs text-[#909090]">{targetUser?.email}</p>
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
              onClick={handleDelete}
              title={t("users.confirmDelete")}
              disabled={loading}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Trash2 className="h-4 w-4 me-2" />
              )}
              {t("users.confirmDelete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

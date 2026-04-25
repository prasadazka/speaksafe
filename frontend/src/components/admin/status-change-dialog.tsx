"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "status" | "severity";
  currentValue: string;
  newValue: string;
  onConfirm: () => Promise<void>;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  INVESTIGATING: "bg-purple-100 text-purple-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
};

const severityColors: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export function StatusChangeDialog({
  open,
  onOpenChange,
  type,
  currentValue,
  newValue,
  onConfirm,
}: StatusChangeDialogProps) {
  const t = useTranslations("admin.statusChange");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const colors = type === "status" ? statusColors : severityColors;
  const translationKey = type === "status" ? "status" : "severity";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            {type === "status" ? t("confirmStatusTitle") : t("confirmSeverityTitle")}
          </DialogTitle>
          <DialogDescription className="text-[#909090]">
            {type === "status" ? t("confirmStatusDesc") : t("confirmSeverityDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colors[currentValue] ?? ""}`}
          >
            {tc(`${translationKey}.${currentValue}`)}
          </span>
          <svg
            className="h-5 w-5 text-[#909090]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colors[newValue] ?? ""}`}
          >
            {tc(`${translationKey}.${newValue}`)}
          </span>
        </div>

        <DialogFooter className="bg-[#F9FDFB] border-[#EBEBEB]">
          <Button
            variant="outline"
            title={t("cancel")}
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-[#EBEBEB] text-[#636363] cursor-pointer"
          >
            {t("cancel")}
          </Button>
          <Button
            title={t("confirm")}
            onClick={handleConfirm}
            disabled={loading}
            className="bg-[#00653E] hover:bg-[#005232] text-white cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

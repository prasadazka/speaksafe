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
import type { ResolutionType } from "@/lib/admin-api";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "status" | "severity";
  currentValue: string;
  newValue: string;
  onConfirm: (resolutionType?: ResolutionType) => Promise<void>;
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

const resolutionTypeColors: Record<string, string> = {
  SUBSTANTIATED: "border-red-300 bg-red-50 text-red-700",
  UNSUBSTANTIATED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  INCONCLUSIVE: "border-amber-300 bg-amber-50 text-amber-700",
  REFERRED: "border-blue-300 bg-blue-50 text-blue-700",
};

const RESOLUTION_TYPES: ResolutionType[] = [
  "SUBSTANTIATED",
  "UNSUBSTANTIATED",
  "INCONCLUSIVE",
  "REFERRED",
];

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
  const [resolutionType, setResolutionType] = useState<ResolutionType | undefined>(undefined);

  const colors = type === "status" ? statusColors : severityColors;
  const translationKey = type === "status" ? "status" : "severity";

  const isClosing = type === "status" && newValue === "CLOSED";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(isClosing ? resolutionType : undefined);
      onOpenChange(false);
      setResolutionType(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) setResolutionType(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        {/* Resolution type selector — only when closing */}
        {isClosing && (
          <div className="space-y-2 pb-2">
            <p className="text-sm font-medium text-black">
              {t("resolutionTypeLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTION_TYPES.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setResolutionType(rt)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    resolutionType === rt
                      ? resolutionTypeColors[rt]
                      : "border-[#EBEBEB] bg-white text-[#636363] hover:bg-gray-50"
                  }`}
                >
                  {tc(`resolution.${rt}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="bg-[#F9FDFB] border-[#EBEBEB]">
          <Button
            variant="outline"
            title={t("cancel")}
            onClick={() => handleClose(false)}
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

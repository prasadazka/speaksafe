"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const tc = useTranslations("common");

  const toggle = () => {
    const next = locale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: next });
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 bg-white/20 rounded-xl px-4 py-1.5 cursor-pointer hover:bg-white/30 transition-colors ${className ?? ""}`}
    >
      <Globe className="h-5 w-5 text-white" />
      <span className="text-white text-base font-medium">
        {tc(`language.${locale}`)}
      </span>
      <ChevronDown className="h-4 w-4 text-white" />
    </button>
  );
}

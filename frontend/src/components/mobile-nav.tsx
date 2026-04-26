"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, FileText, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  adminLabel: string;
  ctaLabel: string;
  brandLabel: string;
}

export function MobileNav({ links, adminLabel, ctaLabel, brandLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="text-white p-2 -mr-2 cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="bg-[#01151C] border-white/10 w-[280px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              {brandLabel}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4 mt-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg px-3 py-3 text-base font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}

            <div className="border-t border-white/10 my-3" />

            <Link
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg px-3 py-3 text-base font-medium transition-colors"
            >
              {adminLabel}
            </Link>

            <div className="border-t border-white/10 my-3" />

            <div className="px-3">
              <LanguageSwitcher />
            </div>
          </nav>

          <div className="mt-6 px-4">
            <Link href="/report" onClick={() => setOpen(false)}>
              <button className="w-full cursor-pointer flex items-center justify-center gap-2 bg-[#00653E] text-white px-6 py-3 rounded font-semibold text-base shadow-[0_0_20px_rgba(0,101,62,0.5)] border border-white/15 hover:bg-[#007A4A] transition-all duration-200">
                <FileText className="h-5 w-5" />
                {ctaLabel}
              </button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

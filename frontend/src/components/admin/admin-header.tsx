"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, LogOut, KeyRound, Lock, Users, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { MFASetupDialog } from "./mfa-setup-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { useTranslations } from "next-intl";

interface AdminHeaderProps {
  title: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { user, logout, hasRole } = useAuth();
  const [mfaOpen, setMfaOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 h-[60px] sm:h-[70px] lg:h-[89px] flex items-center justify-between">
          {/* Left: Brand + Divider + Page title */}
          <div className="flex items-center gap-0">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 pe-4 sm:pe-6"
            >
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[#00653E]" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#00653E] font-sans">
                {tc("brand")}
              </span>
            </Link>
            <div className="hidden md:block w-px h-9 bg-[#D9D9D9] mx-2" />
            <span className="hidden md:block text-lg lg:text-xl font-semibold text-[#636363] ps-4">
              {title}
            </span>
          </div>

          {/* Right: User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              title={t("header.userMenu")}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F5F5F5] transition-colors cursor-pointer outline-none"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#00653E] flex items-center justify-center">
                <span className="text-[11px] sm:text-[12px] font-normal text-white">
                  {getInitials(user.full_name)}
                </span>
              </div>
              <span className="hidden sm:block text-sm text-[#636363] max-w-[120px] truncate">
                {user.full_name}
              </span>
              <ChevronDown className="h-4 w-4 text-[#909090] hidden sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 bg-white border-[#EBEBEB]">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-[#EBEBEB]">
                <p className="text-sm font-medium text-black truncate">{user.full_name}</p>
                <p className="text-xs text-[#909090] truncate">{user.email}</p>
              </div>

              <DropdownMenuItem
                onClick={() => setMfaOpen(true)}
                className="gap-2.5 px-3 py-2.5 text-[#636363] cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                {t("header.securitySettings")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setChangePwOpen(true)}
                className="gap-2.5 px-3 py-2.5 text-[#636363] cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                {t("header.changePassword")}
              </DropdownMenuItem>

              {hasRole("ADMIN") && (
                <DropdownMenuItem
                  onClick={() => window.location.href = "/admin/users"}
                  className="gap-2.5 px-3 py-2.5 text-[#636363] cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  {t("header.manageUsers")}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-[#EBEBEB]" />

              <DropdownMenuItem
                onClick={logout}
                className="gap-2.5 px-3 py-2.5 text-red-600 cursor-pointer focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                {t("header.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MFASetupDialog open={mfaOpen} onOpenChange={setMfaOpen} />
      <ChangePasswordDialog open={changePwOpen} onOpenChange={setChangePwOpen} />
    </>
  );
}

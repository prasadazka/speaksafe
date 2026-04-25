"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  ShieldCheck,
  ShieldOff,
  MoreHorizontal,
  UserCog,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminHeader } from "@/components/admin/admin-header";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { ChangeRoleDialog } from "@/components/admin/change-role-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { useAuth } from "@/contexts/auth-context";
import {
  listUsers,
  updateUserActive,
  type AdminProfile,
  type AdminRole,
} from "@/lib/admin-api";
import { useTranslations } from "next-intl";

const ROLE_STYLES: Record<AdminRole, string> = {
  ADMIN: "bg-red-500/10 text-red-600 border-red-500/20",
  COMPLIANCE_OFFICER: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  VIEWER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user, token, isLoading, hasRole } = useAuth();

  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);

  // ADMIN-only guard
  useEffect(() => {
    if (!isLoading && (!user || !hasRole("ADMIN"))) {
      router.push("/admin/dashboard");
    }
  }, [user, isLoading, hasRole, router]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listUsers(token, page, limit);
      if (res.success && res.data) {
        setUsers(res.data as AdminProfile[]);
        const meta = res.meta as { total?: number } | null;
        setTotal(meta?.total ?? 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    if (token && hasRole("ADMIN")) fetchUsers();
  }, [token, hasRole, fetchUsers]);

  const handleToggleActive = async (target: AdminProfile) => {
    if (!token) return;
    try {
      await updateUserActive(token, target.id, !target.is_active);
      fetchUsers();
    } catch {
      // silently handle
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Client-side search filter
  const filtered = search
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FDFB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9B9B9B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FDFB]">
      <AdminHeader title={t("users.title")} />

      <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-12 py-6 max-w-[1200px]">
        {/* Top bar: title + add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black">
              {t("users.title")}
            </h1>
            <p className="text-sm text-[#909090] mt-0.5">
              {t("users.subtitle", { count: total })}
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            title={t("users.addUser")}
            className="h-10 sm:h-11 bg-[#00653E] hover:bg-[#005232] text-white rounded-lg px-5 cursor-pointer"
          >
            <UserPlus className="h-4 w-4 me-2" />
            {t("users.addUser")}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#909090]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="h-11 ps-10 border-[#EBEBEB] rounded-lg bg-white text-black placeholder:text-[#BEBEBE]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#9B9B9B]" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-[#EBEBEB] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                    <th className="text-start text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colUser")}
                    </th>
                    <th className="text-start text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colRole")}
                    </th>
                    <th className="text-start text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colStatus")}
                    </th>
                    <th className="text-start text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colMFA")}
                    </th>
                    <th className="text-start text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colLastLogin")}
                    </th>
                    <th className="text-end text-xs font-medium text-[#909090] uppercase tracking-wider px-5 py-3">
                      {t("users.colActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#EBEBEB] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#00653E] flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-medium text-white">
                              {getInitials(u.full_name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-black truncate">{u.full_name}</p>
                            <p className="text-xs text-[#909090] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 font-medium border ${ROLE_STYLES[u.role]}`}
                        >
                          {tc(`roles.${u.role}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 font-medium border ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {u.is_active ? t("users.active") : t("users.inactive")}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {u.mfa_enabled ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-[#BEBEBE]" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#909090]">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString()
                          : t("users.never")}
                      </td>
                      <td className="px-5 py-4 text-end">
                        {u.id !== user?.id && (
                          <UserActionsDropdown
                            target={u}
                            t={t}
                            onChangeRole={() => setRoleTarget(u)}
                            onToggleActive={() => handleToggleActive(u)}
                            onDelete={() => setDeleteTarget(u)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[#909090]">
                        {t("users.noUsers")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-[#EBEBEB] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[#00653E] flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-medium text-white">
                          {getInitials(u.full_name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-black truncate">{u.full_name}</p>
                        <p className="text-xs text-[#909090] truncate">{u.email}</p>
                      </div>
                    </div>
                    {u.id !== user?.id && (
                      <UserActionsDropdown
                        target={u}
                        t={t}
                        onChangeRole={() => setRoleTarget(u)}
                        onToggleActive={() => handleToggleActive(u)}
                        onDelete={() => setDeleteTarget(u)}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-medium border ${ROLE_STYLES[u.role]}`}
                    >
                      {tc(`roles.${u.role}`)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-medium border ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </Badge>
                    {u.mfa_enabled ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <ShieldCheck className="h-3 w-3" /> MFA
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-[#BEBEBE]">
                        <ShieldOff className="h-3 w-3" /> MFA
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#909090] mt-2">
                    {t("users.lastLoginLabel")}:{" "}
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString()
                      : t("users.never")}
                  </p>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-12 text-[#909090]">
                  {t("users.noUsers")}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  title={t("users.previousPage")}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-9 px-3 border-[#EBEBEB] text-[#636363] cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#636363]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  title={t("users.nextPage")}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-9 px-3 border-[#EBEBEB] text-[#636363] cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Dialogs */}
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={fetchUsers}
      />
      <ChangeRoleDialog
        open={!!roleTarget}
        onOpenChange={(v) => { if (!v) setRoleTarget(null); }}
        targetUser={roleTarget}
        onSuccess={fetchUsers}
      />
      <DeleteUserDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        targetUser={deleteTarget}
        onSuccess={fetchUsers}
      />
    </div>
  );
}

/* ── Actions Dropdown ── */

function UserActionsDropdown({
  target,
  t,
  onChangeRole,
  onToggleActive,
  onDelete,
}: {
  target: AdminProfile;
  t: (key: string) => string;
  onChangeRole: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={t("users.actions")}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#909090] hover:text-black hover:bg-accent cursor-pointer outline-none"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white border-[#EBEBEB]">
        <DropdownMenuItem onClick={onChangeRole} className="gap-2 cursor-pointer">
          <UserCog className="h-4 w-4" />
          {t("users.changeRole")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleActive} className="gap-2 cursor-pointer">
          <Power className="h-4 w-4" />
          {target.is_active ? t("users.deactivate") : t("users.activate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EBEBEB]" />
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          {t("users.deleteUser")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

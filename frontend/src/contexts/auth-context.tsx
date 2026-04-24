"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  adminLogin,
  getMe,
  type AdminProfile,
  type AdminRole,
} from "@/lib/admin-api";

const TOKEN_KEY = "sawtsafe_admin_token";

interface AuthContextValue {
  user: AdminProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /* Restore session on mount */
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    getMe(stored)
      .then((res) => {
        if (res.success && res.data) {
          setToken(stored);
          setUser(res.data as AdminProfile);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await adminLogin(email, password);
      if (!res.success || !res.data) {
        throw new Error(res.error ?? "Login failed");
      }
      const t = (res.data as { access_token: string }).access_token;
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);

      const profile = await getMe(t);
      if (profile.success && profile.data) {
        setUser(profile.data as AdminProfile);
      }
      router.push("/admin/dashboard");
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  const hasRole = useCallback(
    (...roles: AdminRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, hasRole }),
    [user, token, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

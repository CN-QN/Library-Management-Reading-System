"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import type { UserProfile } from "@/lib/types";
import { hasAllPermissions, hasAnyPermission } from "@/lib/permissions";

interface AuthContextValue {
  /** null = not logged in. undefined-ish "loading" is tracked separately. */
  user: UserProfile | null;
  /** True while the initial session check (GET /api/auth/profile) is running. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  can: (...permissions: string[]) => boolean;
  canAny: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await apiClient.get<UserProfile>("/api/auth/profile");
      setUser(profile);
    } catch {
      // No valid session (401 even after refresh attempt) — stay logged out.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      await loadProfile();
      if (!cancelled) setIsLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await apiClient.post<UserProfile>("/api/auth/login", {
      email,
      password,
    });
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/auth/logout", {});
    } catch (err) {
      // Even if the server call fails, clear local state so the UI
      // doesn't strand the user on a broken session.
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setUser(null);
    }
  }, []);

  const can = useCallback(
    (...permissions: string[]) => hasAllPermissions(user?.permissions, permissions),
    [user]
  );

  const canAny = useCallback(
    (...permissions: string[]) => hasAnyPermission(user?.permissions, permissions),
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshProfile: loadProfile, can, canAny }),
    [user, isLoading, login, logout, loadProfile, can, canAny]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

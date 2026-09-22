"use client";

import { adminLoginUser, getCurrentUser, loginUser, logoutUser, type User } from "@/lib/api/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const writeAuthMarker = useCallback(() => {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `edu_auth=1; path=/; SameSite=Lax; max-age=86400${secure}`;
  }, []);

  const clearAuthMarker = useCallback(() => {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `edu_auth=; path=/; SameSite=Lax; max-age=0${secure}`;
  }, []);

  const applySession = useCallback((me: User) => {
    setUser(me);
    writeAuthMarker();
  }, [writeAuthMarker]);

  const refresh = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      applySession(me);
    } catch {
      setUser(null);
      clearAuthMarker();
    } finally {
      setIsLoading(false);
    }
  }, [applySession, clearAuthMarker]);

  useEffect(() => {
    refresh();

    const handleLogout = () => {
      setUser(null);
      clearAuthMarker();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearAuthMarker, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await loginUser(email, password);
    applySession(me);
    return me;
  }, [applySession]);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const me = await adminLoginUser(email, password);
    applySession(me);
    return me;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      clearAuthMarker();
      window.location.href = "/login";
    }
  }, [clearAuthMarker]);

  const value = useMemo(
    () => ({ user, isLoading, login, adminLogin, logout, refresh }),
    [user, isLoading, login, adminLogin, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

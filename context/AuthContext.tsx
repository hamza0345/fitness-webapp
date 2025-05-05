"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getUserEmail, logout as apiLogout } from "@/lib/api";

export interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  /* read stored token once on mount */
  useEffect(() => {
    const email = getUserEmail();
    if (email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  /* ---------- helpers ---------- */
  const login = useCallback((token: string) => {
    localStorage.setItem("access", token);
    setUserEmail(getUserEmail());
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setIsLoggedIn(false);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteCookie, getCookie } from "cookies-next";
import type { Employee } from "@/services/arnService";

type AuthContextType = {
  user: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  isPartner: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readEmployee(): Employee | null {
  const rawEmployee = getCookie("employeeData");

  if (!rawEmployee) return null;

  try {
    const parsed = JSON.parse(rawEmployee as string);

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuth = () => {
    const token = getCookie("authToken");
    const employee = token ? readEmployee() : null;

    setUser(employee);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAuth();

    const handleAuthChange = () => {
      loadAuth();
    };

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  const logout = () => {
    deleteCookie("authToken", { path: "/" });
    deleteCookie("employeeData", { path: "/" });
    setUser(null);
    setIsLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      logout,
      isPartner: Boolean(user?.isPartner),
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

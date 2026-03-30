import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = "taxmate-auth-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (error) {
      console.warn("Failed to read auth state", error);
    } finally {
      setReady(true);
    }
  }, []);

  function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6 || !normalizedEmail.includes("@")) {
      return false;
    }

    const nextUser = { email: normalizedEmail };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (ready && !user) {
      setLocation("/login");
    }
  }, [ready, user, setLocation]);

  if (!ready || !user) {
    return null;
  }

  return <>{children}</>;
}

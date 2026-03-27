import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { api } from "../../lib/api";
import type { AuthSession, AuthenticatedUser } from "../../lib/types";

type AuthContextValue = {
  user: AuthenticatedUser | null;
  authenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applySessionPayload(payload: AuthSession, setUser: (value: AuthenticatedUser | null) => void, setAuthenticated: (value: boolean) => void) {
  setUser(payload.user);
  setAuthenticated(payload.authenticated);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    setLoading(true);
    try {
      const payload = await api.fetchSession();
      applySessionPayload(payload, setUser, setAuthenticated);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const payload = await api.login(username, password);
    applySessionPayload(payload, setUser, setAuthenticated);
  };

  const logout = async () => {
    const payload = await api.logout();
    applySessionPayload(payload, setUser, setAuthenticated);
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authenticated,
      loading,
      login,
      logout,
      refreshSession,
    }),
    [authenticated, loading, user],
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

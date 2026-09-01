import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  api,
  AUTH_STORAGE_KEY,
  clearStoredAuth,
  LEGACY_AUTH_STORAGE_KEY,
  readStoredAuth,
  UNAUTHORIZED_EVENT,
} from './api';
import { type AuthSession } from './core';

interface AuthValue {
  session: AuthSession | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(readStoredAuth);

  const logout = () => {
    clearStoredAuth();
    setSession(null);
  };

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      logout,
      Math.max(0, session.expiredAt - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      async login(username, password) {
        const next = await api<AuthSession>('/login', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ username, password }),
        });
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
        window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
        setSession(next);
      },
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}

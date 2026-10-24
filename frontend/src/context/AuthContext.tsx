import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { setAuthToken, setUnauthorizedHandler } from "../api/client";
import type { SessionUser } from "../types";

// "Remember me" saves the session in localStorage, which survives closing the browser.
// Otherwise it goes in sessionStorage, which the browser clears when the tab closes.

const KEY = "ces-session";

interface Session {
  token: string;
  user: SessionUser;
}

export const LOGGED_OUT_MESSAGE = "You've been logged out. See you next time!";
const SESSION_ENDED_MESSAGE = "Your session has ended. Please log in again.";

interface AuthValue {
  user: SessionUser | null;
  // Why the session just ended. Every redirect to /login at that moment reads it, so they show the same message.
  logoutNotice: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<SessionUser>;
  logout: (message?: string) => Promise<void>;
  updateUser: (changes: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

// Storage can throw (private windows, blocked cookies), so every access is wrapped.
function readSession(): Session | null {
  try {
    const saved = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null, remember = false) {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (session) (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: logged in until the page reloads.
  }
}

const isRemembered = () => {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = readSession();
    setAuthToken(saved?.token ?? null);
    return saved;
  });
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  function endSession(message: string) {
    setLogoutNotice(message);
    setAuthToken(null);
    writeSession(null);
    setSession(null);
  }

  // The backend rejected the token (expired, or ended by a password change).
  useEffect(() => {
    setUnauthorizedHandler(() => endSession(SESSION_ENDED_MESSAGE));
  }, []);

  async function login(email: string, password: string, remember: boolean) {
    const next = await authApi.login(email, password);
    setAuthToken(next.token);
    writeSession(next, remember);
    setSession(next);
    setLogoutNotice(null);
    return next.user;
  }

  async function logout(message = LOGGED_OUT_MESSAGE) {
    // Set first: if the server answers 401 (session already gone), the redirect still shows this message.
    setLogoutNotice(message);
    try {
      await authApi.logout();
    } catch {
      // Log out locally even if the server can't be reached.
    }
    endSession(message);
  }

  function updateUser(changes: Partial<SessionUser>) {
    if (!session) return;
    const next = { ...session, user: { ...session.user, ...changes } };
    writeSession(next, isRemembered());
    setSession(next);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, logoutNotice, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

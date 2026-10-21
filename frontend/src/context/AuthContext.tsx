import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { setAuthToken, setUnauthorizedHandler } from "../api/client";
import type { SessionUser } from "../types";

// Remembers who is logged in and shares it with every page through useAuth().
// "Remember me" saves the session in localStorage, which survives closing the browser.
// Otherwise it goes in sessionStorage, which the browser clears when the tab closes.

const KEY = "ces-session";

interface Session {
  token: string;
  user: SessionUser;
}

// Where to send someone right after they log out. The navbar and RequireAuth both redirect
// during a logout, so they share this to make sure they agree.
export const LOGGED_OUT = { to: "/login", state: { message: "You've been logged out. See you next time!" } };

interface AuthValue {
  user: SessionUser | null;
  justLoggedOut: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<SessionUser>;
  logout: () => Promise<void>;
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
    // Still logged in for this page view, just not saved.
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
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  function endSession() {
    setAuthToken(null);
    writeSession(null);
    setSession(null);
  }

  // If the backend says the token is no longer valid, log out on this side too.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
  }, []);

  async function login(email: string, password: string, remember: boolean) {
    const next = await authApi.login(email, password);
    setAuthToken(next.token);
    writeSession(next, remember);
    setSession(next);
    setJustLoggedOut(false);
    return next.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Even if the server can't be reached, the user is still logged out here.
    }
    setJustLoggedOut(true);
    endSession();
  }

  // Keeps the navbar name in sync after the user edits their profile.
  function updateUser(changes: Partial<SessionUser>) {
    if (!session) return;
    const next = { ...session, user: { ...session.user, ...changes } };
    writeSession(next, isRemembered());
    setSession(next);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, justLoggedOut, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

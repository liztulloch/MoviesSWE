import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addFavorite, getFavoriteIds, removeFavorite } from "../api/profile";
import { messageOf } from "../api/client";
import { useAuth } from "./AuthContext";

// Keeps the logged-in customer's favorite movie ids, so every heart on the screen stays in sync.
// Also shows a short message at the bottom of the screen, like "Added Oppenheimer to your favorites."

interface FavoritesValue {
  ids: Set<number>;
  loading: boolean;
  isFavorite: (movieId: number) => boolean;
  toggle: (movieId: number, title: string) => Promise<void>;
}

interface Toast {
  text: string;
  error: boolean;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const customerId = user?.role === "customer" ? user.id : null;

  // Load favorites whenever a different customer logs in. Logged out or admin means none.
  useEffect(() => {
    setIds(new Set());
    if (customerId === null) return;
    let cancelled = false;
    setLoading(true);
    getFavoriteIds()
      .then((list) => { if (!cancelled) setIds(new Set(list)); })
      .catch(() => { if (!cancelled) setToast({ text: "We couldn't load your favorites.", error: true }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);

  // Hide the message after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function setFavorite(movieId: number, on: boolean) {
    setIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(movieId);
      else next.delete(movieId);
      return next;
    });
  }

  // The heart changes right away, then changes back if saving fails.
  async function toggle(movieId: number, title: string) {
    const adding = !ids.has(movieId);
    setFavorite(movieId, adding);
    try {
      await (adding ? addFavorite(movieId) : removeFavorite(movieId));
      setToast({ text: adding ? `Added “${title}” to your favorites.` : `Removed “${title}” from your favorites.`, error: false });
    } catch (e) {
      setFavorite(movieId, !adding);
      setToast({ text: messageOf(e), error: true });
    }
  }

  return (
    <FavoritesContext.Provider value={{ ids, loading, isFavorite: (id) => ids.has(id), toggle }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toast && <div className={`toast${toast.error ? " toast-error" : ""}`}>{toast.text}</div>}
      </div>
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside <FavoritesProvider>.");
  return value;
}

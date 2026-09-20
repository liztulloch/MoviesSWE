import type { Movie } from "../types";
import { mockMovies } from "../data/mockMovies";

// Set these in .env.local (see .env.example). Set VITE_USE_MOCK=false once the backend is running.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface MovieQuery {
  title?: string;
  genre?: string;
}

export async function getMovies(query: MovieQuery = {}): Promise<Movie[]> {
  if (USE_MOCK) {
    const t = query.title?.trim().toLowerCase();
    return mockMovies.filter(
      (m) =>
        (!t || m.title.toLowerCase().includes(t)) &&
        (!query.genre || m.genre === query.genre)
    );
  }
  const params = new URLSearchParams();
  if (query.title?.trim()) params.set("title", query.title.trim());
  if (query.genre) params.set("genre", query.genre);
  const res = await fetch(`${API_URL}/api/movies?${params.toString()}`);
  if (!res.ok) throw new Error(`Could not load movies (error ${res.status}).`);
  return res.json();
}

export async function getMovie(id: number): Promise<Movie | null> {
  if (USE_MOCK) return mockMovies.find((m) => m.id === id) ?? null;
  const res = await fetch(`${API_URL}/api/movies/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load this movie (error ${res.status}).`);
  return res.json();
}

import type { Movie } from "../types";
import { mockMovies } from "../data/mockMovies";

// Set these in .env.local. Set VITE_USE_MOCK=false once the backend is running.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface MovieQuery {
  title?: string;
  genre?: string;
}

// A movie can have several genres in one string, e.g. "Sci-Fi, Drama"
const hasGenre = (m: Movie, g: string) =>
  m.genre.split(",").map((s) => s.trim()).includes(g);

const toList = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim());
  return undefined;
};

// Convert what the backend sends (DB column names) into the shape the UI expects
function toMovie(raw: any): Movie {
  const status = String(raw.status ?? "").toLowerCase();
  return {
    id: raw.movie_id ?? raw.id ?? raw.movieId,
    title: raw.title,
    genre: raw.genre ?? "",
    rating: String(raw.mpaa_rating ?? raw.mpaaRating ?? ""),
    description: raw.synopsis ?? raw.description ?? "",
    posterUrl: raw.poster ?? raw.posterUrl ?? "",
    trailerUrl: raw.trailer ?? raw.trailerUrl ?? "",
    status:
      status.includes("soon") || status.includes("upcoming")
        ? "COMING_SOON"
        : "CURRENTLY_RUNNING",
    // The API nests these one level deep: {movie_id, cast: [...]} and {movie_id, producers: [...]}
    cast: toList(raw.cast?.cast ?? raw.cast),
    producers: toList(raw.producer?.producers ?? raw.producers),
    // Not exposed by the API yet. Reads both a bare string and the nested
    // {movie_id, director} shape the other role fields use.
    director: raw.director?.director ?? raw.director ?? undefined,
    reviews: raw.reviews ?? undefined,
    trailerImage: raw.trailer_image ?? raw.trailerImage ?? undefined,
    showtimes: Array.isArray(raw.showtimes) ? raw.showtimes.map(String) : undefined,
  };
}

async function get(path: string): Promise<any[]> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Could not load movies (error ${res.status}).`);
  return res.json();
}

export async function getMovies(query: MovieQuery = {}): Promise<Movie[]> {
  const title = query.title?.trim();

  if (USE_MOCK) {
    const t = title?.toLowerCase();
    return mockMovies.filter(
      (m) =>
        (!t || m.title.toLowerCase().includes(t)) &&
        (!query.genre || hasGenre(m, query.genre))
    );
  }

  const params = new URLSearchParams();
  if (query.genre) params.set("genre", query.genre);

  // /search spans both statuses but requires a name, so it can't serve an empty query.
  if (title) {
    params.set("name", title);
    return (await get(`/movies/search?${params}`)).map(toMovie);
  }

  // There is no "list all" endpoint, so both status endpoints are fetched together.
  const suffix = params.toString() ? `?${params}` : "";
  const [running, soon] = await Promise.all([
    get(`/movies/currently-running${suffix}`),
    get(`/movies/coming-soon${suffix}`),
  ]);
  return [...running, ...soon].map(toMovie);
}

export async function getMovie(id: number): Promise<Movie | null> {
  if (USE_MOCK) return mockMovies.find((m) => m.id === id) ?? null;
  const res = await fetch(`${API_URL}/movies/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load this movie (error ${res.status}).`);
  return toMovie(await res.json());
}

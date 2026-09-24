export type MovieStatus = "CURRENTLY_RUNNING" | "COMING_SOON";

// Mirrors MovieSchema in backend/src/schemas/Movie_schema.py, normalized by toMovie().
export interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: string; // MPAA rating, e.g. "PG-13"
  description: string;
  posterUrl: string;
  trailerUrl: string;
  status: MovieStatus;
  cast?: string[];
  producers?: string[];
  director?: string;
  reviews?: string; // external reviews URL, e.g. Rotten Tomatoes
  trailerImage?: string;
  // Raw "YYYY-MM-DD H:MM PM" strings from the Showtime table, grouped by showtimes.ts
  showtimes?: string[];
}

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

// Hardcoded for Sprint 1
export const SHOWTIMES = ["2:00 PM", "5:00 PM", "8:00 PM"] as const;

export const TICKET_PRICES = { adult: 12, child: 8, senior: 9 } as const;
export type TicketType = keyof typeof TICKET_PRICES;

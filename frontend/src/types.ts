export type MovieStatus = "CURRENTLY_RUNNING" | "COMING_SOON";

// Agree on this shape with the backend. Field names must match the JSON they return.
export interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: string; // MPAA rating, e.g. "PG-13"
  description: string;
  posterUrl: string;
  trailerUrl: string; // YouTube watch URL, embed URL, or bare video ID
  status: MovieStatus;
}

export const GENRES = [
  "Action",
  "Animation",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

// Hardcoded for Sprint 1 (per the assignment)
export const SHOWTIMES = ["2:00 PM", "5:00 PM", "8:00 PM"] as const;

export const TICKET_PRICES = { adult: 12, child: 8, senior: 9 } as const;
export type TicketType = keyof typeof TICKET_PRICES;

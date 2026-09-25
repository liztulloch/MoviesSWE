// Shared types and fixed values used across the frontend.
export type MovieStatus = "CURRENTLY_RUNNING" | "COMING_SOON";

// What a movie looks like in the UI.
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
  showtimes?: string[];
}

// Genre dropdown options on the home page.
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

// Hardcoded for Sprint 1. Used when a movie has no showtimes in the database.
export const SHOWTIMES = ["2:00 PM", "5:00 PM", "8:00 PM"] as const;

// Price of one ticket for each age group.
export const TICKET_PRICES = { adult: 12, child: 8, senior: 9 } as const;
export type TicketType = keyof typeof TICKET_PRICES;

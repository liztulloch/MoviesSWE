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

// Accounts (Sprint 2)
export type Role = "customer" | "admin";

// Who is logged in. Kept in AuthContext and shown in the navbar.
export interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface Address {
  street: string;
  city: string;
  state: string; // 2-letter code, e.g. "GA"
  zip: string;
}

export const EMPTY_ADDRESS: Address = { street: "", city: "", state: "", zip: "" };

// A card as the user types it in. The full number only ever travels to the backend.
export interface CardInput {
  cardholderName: string;
  number: string;
  expiry: string; // MM/YY
  billingAddress: Address;
}

export const emptyCard = (): CardInput => ({
  cardholderName: "",
  number: "",
  expiry: "",
  billingAddress: { ...EMPTY_ADDRESS },
});

// A card after it's saved. Only the last 4 digits come back, never the full number.
export interface SavedCard {
  id: number;
  brand: string;
  last4: string;
  expiry: string;
  billingAddress: Address;
}

// A customer can save at most this many cards.
export const MAX_CARDS = 3;

export interface Profile {
  firstName: string;
  lastName: string;
  email: string; // shown but can't be changed
  phone: string;
  receivePromotions: boolean;
  address: Address | null; // at most one
  cards: SavedCard[];
}
